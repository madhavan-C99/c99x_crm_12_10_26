from django.apps import apps
from huey.contrib.djhuey import task, periodic_task
from huey import crontab
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.core.cache import cache
from django.conf import settings
from ..models import Notification, FollowUp, PaymentFollowUp, UserSettings, MissedFollowUpHistory
from datetime import datetime, timedelta
import zoneinfo
from django.utils import timezone
import logging
import zoneinfo
from collections import defaultdict
from huey import crontab
from huey.contrib.djhuey import periodic_task
logger = logging.getLogger(__name__)
IST = zoneinfo.ZoneInfo('Asia/Kolkata')

MISSED_GAP = timedelta(minutes=5)   # missed alerts idaiyila gap
MAX_MISSED = 3                      # max missed alerts
MAX_REMINDER_MIN = 60               # user reminder time max (minutes)


# ==========================================
# ONE FUNCTION - all alerts (reminder + missed, normal + payment)
# ==========================================
@task()
def send_reminder_to_user(user_id, notification_type, title, message,
                          follow_up_id=None, payment_id=None, lead_id=None,
                          scheduled_remainder=None, data=None):
    data = data or {}

    # DB save fail aana exception ezhumbum (huey log-la theriyum)
    notification = Notification.objects.create(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        follow_up_id=follow_up_id,
        payment_id=payment_id,
        lead_id=lead_id,
        scheduled_remainder=scheduled_remainder,
        is_read=False,
        retry_count=data.get('attempt', 0),
    )

    # WebSocket: user offline na fail aagum, DB-la irukku so ignore
    try:
        async_to_sync(get_channel_layer().group_send)(
            f"reminder_user_{user_id}",
            {
                'type': 'reminder_notification',
                'notification_type': notification_type,
                'title': title,
                'message': message,
                'data': {
                    'id': notification.id,
                    'created_at': str(notification.created_at),
                    'follow_up_id': follow_up_id,
                    'payment_id': payment_id,
                    'lead_id': lead_id,
                    'scheduled_remainder': str(scheduled_remainder) if scheduled_remainder else None,
                    **data,
                },
            },
        )
    except Exception:
        logger.exception("WebSocket send failed for user %s", user_id)

    return notification.id


# ==========================================
# 1. REMINDER - every minute
#    alert time = schedule time - user reminder minutes
# ==========================================
CATCHUP_MINUTES = 5   # worker short-ah down aana miss aana alert catch-up


def _to_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


@periodic_task(crontab(minute='*'))
def send_followup_reminders():
    now = timezone.now()
    now_minute = now.replace(second=0, microsecond=0)

    # ---------- user settings: reminder time (DB) ----------
    reminder_map = {
        uid: _to_int(rt)
        for uid, rt in UserSettings.objects.values_list('user_id', 'reminder_time')
    }
    max_reminder = max(reminder_map.values(), default=0)

    window_start = now - timedelta(minutes=CATCHUP_MINUTES)
    window_end = now + timedelta(minutes=max_reminder)

    # ---------- already reminder anuppiyadhu (read / unread rendum) ----------
    done_followups = set(Notification.objects.filter(
        notification_type='followup_reminder', follow_up_id__isnull=False
    ).values_list('follow_up_id', flat=True))

    done_payments = set(Notification.objects.filter(
        notification_type='payment_followup_reminder', payment_id__isnull=False
    ).values_list('payment_id', flat=True))

    followups = list(
        FollowUp.objects
        .filter(is_attended=False,
                scheduled_at__gte=window_start, scheduled_at__lte=window_end)
        .exclude(id__in=done_followups)
        .select_related('lead')
    )

    payment_followups = list(
        PaymentFollowUp.objects
        .filter(is_attended=False, followup_status='Pending',
                followup_date__gte=window_start, followup_date__lte=window_end)
        .exclude(id__in=done_payments)
        .select_related('payment_info__lead')
    )

    count = 0

    # ---------- normal follow ups ----------
    for f in followups:
        lead = f.lead
        uid = lead.assigned_to_id
        if not uid:
            continue

        # user setting-la irundhu; setting illa na 0 (schedule time-la)
        remind_min = reminder_map.get(uid, 0)

        alert_time = (f.scheduled_at - timedelta(minutes=remind_min)).replace(second=0, microsecond=0)
        if alert_time > now_minute:
            continue   # innum alert time varala

        at = f.scheduled_at.astimezone(IST).strftime('%I:%M %p')
        message = (f"Follow-up with {lead.full_name} in {remind_min} minutes ({at})"
                   if remind_min else f"Follow-up with {lead.full_name} now ({at})")

        send_reminder_to_user(
            uid, 'followup_reminder', "Follow-up Reminder", message,
            follow_up_id=f.id, lead_id=lead.id, scheduled_remainder=f.scheduled_at,
            data={
                'lead_id': lead.id,
                'lead_name': lead.full_name,
                'lead_mobile': lead.mobile_no,
                'follow_up_id': f.id,
                'scheduled_at': str(f.scheduled_at.astimezone(IST)),
                'reminder_minutes': remind_min,
                'notes': f.notes,
            },
        )
        count += 1

    # ---------- payment follow ups ----------
    for p in payment_followups:
        info = p.payment_info
        lead = info.lead
        uid = lead.assigned_to_id
        if not uid:
            continue

        remind_min = reminder_map.get(uid, 0)

        alert_time = (p.followup_date - timedelta(minutes=remind_min)).replace(second=0, microsecond=0)
        if alert_time > now_minute:
            continue

        at = p.followup_date.astimezone(IST).strftime('%I:%M %p')
        message = (f"Payment follow-up with {lead.full_name} in {remind_min} minutes ({at})"
                   if remind_min else f"Payment follow-up with {lead.full_name} now ({at})")

        send_reminder_to_user(
            uid, 'payment_followup_reminder', "Payment Follow-up Reminder", message,
            payment_id=p.id, lead_id=lead.id, scheduled_remainder=p.followup_date,
            data={
                'lead_id': lead.id,
                'lead_name': lead.full_name,
                'lead_mobile': lead.mobile_no,
                'payment_followup_id': p.id,
                'pending_amount': info.pending_amount,
                'scheduled_at': str(p.followup_date.astimezone(IST)),
                'reminder_minutes': remind_min,
                'is_payment': True,
            },
        )
        count += 1

    logger.info("Sent %s follow-up reminders", count)
    return count


# ==========================================
# 2. MISSED CHECK - every minute
#    last alert sent time + 5 min -> read pannala na missed alert
#    repeat every 5 min, max 3
# ==========================================
@periodic_task(crontab(minute='*'))
def check_missed_followups_scheduled():
    now = timezone.now()

    kinds = [
        {
            'model': FollowUp,
            'field': 'follow_up_id',
            'reminder': 'followup_reminder',
            'missed': 'missed_followup',
            'pending': {'is_attended': False},
            'related': ['lead'],
            'lead': lambda o: o.lead,
            'when': lambda o: o.scheduled_at,
            'label': 'follow-up',
        },
        {
            'model': PaymentFollowUp,
            'field': 'payment_id',
            'reminder': 'payment_followup_reminder',
            'missed': 'missed_payment_followup',
            'pending': {'is_attended': False, 'followup_status': 'Pending'},
            'related': ['payment_info__lead'],
            'lead': lambda o: o.payment_info.lead,
            'when': lambda o: o.followup_date,
            'label': 'payment follow-up',
        },
    ]

    total = 0

    for k in kinds:
        field = k['field']

        # reminder anuppi max chain time (5 + 3*5 min) kulla irukkura follow ups
        recent = Notification.objects.filter(
            notification_type=k['reminder'],
            created_at__gte=now - (MISSED_GAP * (MAX_MISSED + 2)),
        ).values_list(field, flat=True)
        ids = [i for i in recent if i]
        if not ids:
            continue

        # ovvoru follow up-ku reminder + missed alerts (sent time order)
        chain = defaultdict(list)
        for n in (Notification.objects
                  .filter(**{f"{field}__in": ids},
                          notification_type__in=[k['reminder'], k['missed']])
                  .order_by('created_at')):
            chain[getattr(n, field)].append(n)

        objs = (k['model'].objects
                .filter(id__in=ids, **k['pending'])
                .select_related(*k['related']))

        for obj in objs:
            notifs = chain.get(obj.id, [])
            if not notifs:
                continue

            # user edhaavadhu alert read pannitta -> stop
            if any(n.is_read for n in notifs):
                continue

            missed_count = sum(1 for n in notifs if n.notification_type == k['missed'])
            if missed_count >= MAX_MISSED:
                continue

            # last alert sent time + 5 min aaganum
            if now < notifs[-1].created_at + MISSED_GAP:
                continue

            lead = k['lead'](obj)
            uid = lead.assigned_to_id
            if not uid:
                continue

            attempt = missed_count + 1
            at = k['when'](obj).astimezone(IST).strftime('%I:%M %p')
            is_final = attempt == MAX_MISSED

            message = f"{lead.full_name} - missed {k['label']} at {at} (Attempt {attempt}/{MAX_MISSED})"
            if is_final:
                message += ". Please take action."

            data = {
                'lead_id': lead.id,
                'lead_name': lead.full_name,
                'lead_mobile': lead.mobile_no,
                'attempt': attempt,
                'is_missed': True,
                'is_final': is_final,
                'scheduled_at': str(k['when'](obj).astimezone(IST)),
            }
            if field == 'payment_id':
                data['is_payment'] = True
                data['payment_followup_id'] = obj.id

            notification_id = send_reminder_to_user(
                uid, k['missed'], "Missed Follow-up", message,
                **{field: obj.id},
                lead_id=lead.id,
                scheduled_remainder=k['when'](obj),
                data=data,
            )

            # normal follow up-ku audit history (existing model)
            if field == 'follow_up_id':
                MissedFollowUpHistory.objects.create(
                    notification_id=notification_id,
                    follow_up=obj,
                    lead=lead,
                    user=lead.assigned_to,
                    retry_count=attempt,
                    message=message,
                )

            total += 1

    logger.info("Sent %s missed alerts", total)
    return total

















# def send_reminder_to_user(user_id, notification_type, title, message,
#                            follow_up_id=None, payment_id=None, scheduled_remainder=None, data=None,
#                            force_create=False):
#     try:
#         notification = Notification.objects.create(
#             user_id=user_id,
#             notification_type=notification_type,
#             title=title,
#             message=message,
#             follow_up_id=follow_up_id,
#             payment_id=payment_id,
#             scheduled_remainder=scheduled_remainder,
#             is_read=False,
#             retry_count=data.get('attempt', 0) if data else 0
#         )
#         notification_id = notification.id
#         print(f"✅ New notification created {notification_id}")

#         # ✅ group name matches ReminderNotificationConsumer's
#         # self.group_name = f"reminder_user_{self.user_id}"
#         channel_layer = get_channel_layer()
#         group_name = f"reminder_user_{user_id}"

#         notification_data = {
#             'id': notification.id,
#             'created_at': str(notification.created_at),
#             'follow_up_id': follow_up_id,
#             'payment_id': payment_id,
#             'scheduled_remainder': str(scheduled_remainder) if scheduled_remainder else None,
#             'is_retry': not force_create and notification_type == 'missed_followup',
#             'attempt': data.get('attempt', 1) if data else 1,
#             **(data or {})
#         }

#         async_to_sync(channel_layer.group_send)(
#             group_name,
#             {
#                 'type': 'reminder_notification',
#                 'notification_type': notification_type,
#                 'title': title,
#                 'message': message,
#                 'data': notification_data
#             }
#         )

#         print(f"✅ Notification sent to user {user_id}: {title} (Attempt: {notification_data.get('attempt', 1)})")
#         return notification_id

#     except Exception as e:
#         print(f"❌ Failed to send notification: {e}")
#         return None

# @periodic_task(crontab(minute='*/1'))  # Every 1 minute
# def send_followup_reminders():
#     """
#     Send reminders for follow-ups scheduled at the current minute
#     """
#     ist = zoneinfo.ZoneInfo('Asia/Kolkata')
#     now = timezone.now().astimezone(ist)
#     current_minute = now.replace(second=0, microsecond=0)
#     next_minute = now.replace(second=59, microsecond=59)

#     # ✅ Current minute la irukka follow-ups mattum
#     followups = FollowUp.objects.filter(
#         scheduled_at__gte=current_minute,
#         scheduled_at__lt=next_minute,
#         is_attended=False
#     ).exclude(
#         id__in=Notification.objects.filter(
#             notification_type='followup_reminder',
#             is_read=False
#         ).values_list('follow_up_id', flat=True)
#     ).select_related('lead', 'lead__assigned_to')

#     count = 0
#     for followup in followups:
#         send_followup_reminder(followup.id, followup.lead.assigned_to_id)
#         count += 1

#     print(f"✅ Sent {count} follow-up reminders for {current_minute.strftime('%H:%M')}")
#     return count


# # ==========================================
# # 2. TASK - Send Follow-up Reminder
# # ==========================================
# @task(retries=3, retry_delay=60)
# def send_followup_reminder(follow_up_id, user_id):
#     """
#     Send follow-up reminder notification - Only once per follow-up
#     """
#     try:
#         follow_up = FollowUp.objects.select_related('lead', 'lead__assigned_to').get(id=follow_up_id)
#         lead = follow_up.lead

#         # Check if notification already exists
#         existing_notification = Notification.objects.filter(
#             follow_up_id=follow_up.id,
#             notification_type='followup_reminder',
#             is_read=False
#         ).exists()

#         if existing_notification:
#             print(f"⏭️ Notification already sent for follow-up {follow_up_id} - Skipping")
#             return None
#         ist = zoneinfo.ZoneInfo('Asia/Kolkata')
#         scheduled_at_ist = follow_up.scheduled_at.astimezone(ist)
#         title = "Follow-up Reminder"
#         message = f"Follow-up reminder for {lead.full_name} at {scheduled_at_ist.strftime('%I:%M %p')}"

#         data = {
#             'lead_id': lead.id,
#             'lead_name': lead.full_name,
#             'lead_mobile': lead.mobile_no,
#             'follow_up_id': follow_up.id,
#             'scheduled_at': str(scheduled_at_ist),
#             'notes': follow_up.notes
#         }

#         notification_id = send_reminder_to_user(
#             user_id or lead.assigned_to_id,
#             'followup_reminder',
#             title,
#             message,
#             follow_up_id=follow_up.id,
#             scheduled_remainder=scheduled_at_ist,
#             data=data
#         )

#         if notification_id:
#             print(f"✅ Follow-up reminder sent for {lead.full_name}")
#             print(f"⏰ Missed follow-up check scheduled for {lead.full_name} in 5 minutes")

#         return notification_id

#     except FollowUp.DoesNotExist:
#         print(f"❌ FollowUp {follow_up_id} not found")
#         return None
#     except Exception as e:
#         print(f"❌ Error in followup reminder: {e}")
#         raise


# # # ==========================================
# # # 1. PERIODIC TASK - detects missed follow-ups every minute.
# # # Does NOT require any pre-existing Notification - send_missed_followup_
# # # notification() below creates/updates the Notification itself.
# # # ==========================================
# # @periodic_task(crontab(minute='*/1'))
# # def check_missed_followups_scheduled():
# #     """
# #     Check for missed follow-ups every 1 minute
# #     """
# #     print("check missed run")
# #     ist = zoneinfo.ZoneInfo('Asia/Kolkata')
# #     now = timezone.now().astimezone(ist)

# #     five_min_ago = now - timedelta(minutes=5)
# #     six_min_ago = now - timedelta(minutes=6)

# #     print(five_min_ago)
# #     print(six_min_ago)

# #     missed_followups = FollowUp.objects.filter(
# #         scheduled_at__gte=six_min_ago,
# #         scheduled_at__lt=five_min_ago,
# #         is_attended=False
# #     ).select_related('lead', 'lead__assigned_to')
# #     print(missed_followups)
# #     count = 0
# #     for followup in missed_followups:
# #         existing_history = MissedFollowUpHistory.objects.filter(
# #             follow_up=followup
# #         ).exists()

# #         if not existing_history:
# #             # ✅ FIX: don't require a pre-existing 'followup_reminder'
# #             # notification. Call directly with the lead's assigned user -
# #             # this can never silently no-op just because a prior
# #             # notification wasn't found/was already read.
# #             send_missed_followup_notification(
# #                 followup.id,
# #                 retry_count=1,
# #                 is_first=True
# #             )
# #             count += 1

# #     if count > 0:
# #         print(f"📢 Processed {count} missed follow-ups")
# #     print(f"✅ Sent {count} missed follow-up reminders for {now.strftime('%H:%M')}")
# #     return count


# # # ==========================================
# # # 2. SINGLE TASK - Send Missed Follow-up Notification
# # # ==========================================
# # @task(retries=3, retry_delay=60)
# # def send_missed_followup_notification(follow_up_id, retry_count, is_first=False):
# #     """
# #     Send missed follow-up notification - Single function for all attempts.
# #     DB: a new MissedFollowUpHistory row per retry (audit trail).
# #     Notification: single row per follow_up, created on first call and
# #     updated with the latest message on every retry (handled inside
# #     send_reminder_to_user - no pre-existing notification required).
# #     WebSocket: sent on every retry.
# #     """
# #     try:
# #         follow_up = FollowUp.objects.select_related('lead', 'lead__assigned_to').get(id=follow_up_id)
# #         lead = follow_up.lead

# #         if follow_up.is_attended:
# #             print(f"✅ Follow-up for {lead.full_name} has been attended - No action needed")
# #             return True

# #         existing_history = MissedFollowUpHistory.objects.filter(
# #             follow_up=follow_up,
# #             retry_count=retry_count,
            
# #         ).exists()

# #         if existing_history:
# #             print(f"⏭️ Missed follow-up retry {retry_count} already logged for {lead.full_name} - Skipping")
# #             return None

# #         ist = zoneinfo.ZoneInfo('Asia/Kolkata')
# #         scheduled_at_ist = follow_up.scheduled_at.astimezone(ist)

# #         if retry_count > 3:
# #             final_message = f"🚫 {lead.full_name} missed follow-up {retry_count - 1} times. Please take action."

# #             send_reminder_to_user(
# #                 lead.assigned_to_id,
# #                 'missed_followup',
# #                 'Max Retry Reached',
# #                 final_message,
# #                 follow_up_id=follow_up.id,
# #                 scheduled_remainder=follow_up.scheduled_at,
# #                 data={
# #                     'lead_id': lead.id,
# #                     'lead_name': lead.full_name,
# #                     'total_attempts': retry_count - 1,
# #                     'is_final': True
# #                 },
# #                 force_create=True
# #             )
# #             print(f"🚫 Max retries reached for {lead.full_name} - Final notification sent")
# #             return True

# #         if is_first:
# #             missed_title = "Missed Follow-up"
# #             missed_message = f"{lead.full_name} missed their follow-up at {scheduled_at_ist.strftime('%I:%M %p')} - Attempt {retry_count}"
# #         else:
# #             missed_title = "Missed Follow-up"
# #             missed_message = f"{lead.full_name} missed their follow-up again at {scheduled_at_ist.strftime('%I:%M %p')} - Attempt {retry_count} "

# #         missed_data = {
# #             'lead_id': lead.id,
# #             'lead_name': lead.full_name,
# #             'follow_up_id': follow_up.id,
# #             'attempt': retry_count,
# #             'scheduled_at': str(scheduled_at_ist),
# #             'is_missed': True
# #         }

# #         notification_id = send_reminder_to_user(
# #             lead.assigned_to_id,
# #             'missed_followup',
# #             missed_title,
# #             missed_message,
# #             follow_up_id=follow_up.id,
# #             scheduled_remainder=follow_up.scheduled_at,
# #             data=missed_data,
# #             force_create=False
# #         )

# #         missed_history = MissedFollowUpHistory.objects.create(
# #             notification_id=notification_id,
# #             follow_up=follow_up,
# #             lead=lead,
# #             user=lead.assigned_to,
# #             retry_count=retry_count,
# #             message=missed_message
# #         )

# #         print(f"📢 Missed follow-up notification sent for {lead.full_name} - Attempt {retry_count} "
# #               f"(new history row {missed_history.id} created)")

# #         if retry_count < 3:
# #             send_missed_followup_notification.schedule(
# #                 args=(follow_up.id, retry_count + 1, False),
# #                 delay=300  # 5 minutes later
# #             )
# #             print(f"🔄 Next retry {retry_count + 1} scheduled for {lead.full_name} in 5 minutes")

# #         return missed_history.id

# #     except FollowUp.DoesNotExist:
# #         print(f"❌ FollowUp {follow_up_id} not found")
# #         return None
# #     except Exception as e:
# #         print(f"❌ Error in missed followup: {e}")
# #         raise



# # ==========================================
# # 1. PERIODIC TASK - detects missed follow-ups every minute.
# # Does NOT require any pre-existing Notification - send_missed_followup_
# # notification() below creates/updates the Notification itself.
# # ==========================================
# @periodic_task(crontab(minute='*/1'))
# def check_missed_followups_scheduled():
#     """
#     Check for missed follow-ups every 1 minute
#     """
#     print("check missed run")
#     ist = zoneinfo.ZoneInfo('Asia/Kolkata')
#     now = timezone.now().astimezone(ist)

#     five_min_ago = now - timedelta(minutes=5)
#     six_min_ago = now - timedelta(minutes=6)

#     print(five_min_ago)
#     print(six_min_ago)

#     missed_followups = FollowUp.objects.filter(
#         scheduled_at__gte=six_min_ago,
#         scheduled_at__lt=five_min_ago,
#         is_attended=False
#     ).select_related('lead', 'lead__assigned_to')
#     print(missed_followups)
#     count = 0
#     for followup in missed_followups:
#         existing_history = MissedFollowUpHistory.objects.filter(
#             follow_up=followup
#         ).exists()

#         if existing_history:
#             continue

#         # ✅ NEW CHECK — if the follow-up reminder OR any missed-followup
#         # notification for this follow-up was already READ by the user,
#         # don't even start the missed-followup chain. Reading it means
#         # they've seen it, so we shouldn't nag them further.
#         notification_already_read = Notification.objects.filter(
#             follow_up_id=followup.id,
#             notification_type__in=['followup_reminder', 'missed_followup'],
#             is_read=True
#         ).exists()

#         if notification_already_read:
#             print(f"👁️ Notification already read for {followup.lead.full_name} - skipping missed followup")
#             continue

#         # ✅ FIX: don't require a pre-existing 'followup_reminder'
#         # notification. Call directly with the lead's assigned user -
#         # this can never silently no-op just because a prior
#         # notification wasn't found/was already read.
#         send_missed_followup_notification(
#             followup.id,
#             retry_count=1,
#             is_first=True
#         )
#         count += 1

#     if count > 0:
#         print(f"📢 Processed {count} missed follow-ups")
#     print(f"✅ Sent {count} missed follow-up reminders for {now.strftime('%H:%M')}")
#     return count


# # ==========================================
# # 2. SINGLE TASK - Send Missed Follow-up Notification
# # ==========================================
# @task(retries=3, retry_delay=60)
# def send_missed_followup_notification(follow_up_id, retry_count, is_first=False):
#     """
#     Send missed follow-up notification - Single function for all attempts.
#     DB: a new MissedFollowUpHistory row per retry (audit trail).
#     Notification: single row per follow_up, created on first call and
#     updated with the latest message on every retry (handled inside
#     send_reminder_to_user - no pre-existing notification required).
#     WebSocket: sent on every retry.
#     """
#     try:
#         follow_up = FollowUp.objects.select_related('lead', 'lead__assigned_to').get(id=follow_up_id)
#         lead = follow_up.lead

#         if follow_up.is_attended:
#             print(f"✅ Follow-up for {lead.full_name} has been attended - No action needed")
#             return True

#         # ✅ NEW CHECK — re-verify on every retry too. User might read the
#         # notification in between retries (e.g. after attempt 1, before
#         # attempt 2's scheduled 5-min delay fires). If so, stop retrying.
#         notification_already_read = Notification.objects.filter(
#             follow_up_id=follow_up.id,
#             notification_type__in=['followup_reminder', 'missed_followup'],
#             is_read=True
#         ).exists()

#         if notification_already_read:
#             print(f"👁️ Notification already read for {lead.full_name} - stopping missed followup retries")
#             return None

#         existing_history = MissedFollowUpHistory.objects.filter(
#             follow_up=follow_up,
#             retry_count=retry_count,
#         ).exists()

#         if existing_history:
#             print(f"⏭️ Missed follow-up retry {retry_count} already logged for {lead.full_name} - Skipping")
#             return None

#         ist = zoneinfo.ZoneInfo('Asia/Kolkata')
#         scheduled_at_ist = follow_up.scheduled_at.astimezone(ist)

#         if retry_count > 3:
#             final_message = f"🚫 {lead.full_name} missed follow-up {retry_count - 1} times. Please take action."

#             send_reminder_to_user(
#                 lead.assigned_to_id,
#                 'missed_followup',
#                 'Max Retry Reached',
#                 final_message,
#                 follow_up_id=follow_up.id,
#                 scheduled_remainder=follow_up.scheduled_at,
#                 data={
#                     'lead_id': lead.id,
#                     'lead_name': lead.full_name,
#                     'total_attempts': retry_count - 1,
#                     'is_final': True
#                 },
#                 force_create=True
#             )
#             print(f"🚫 Max retries reached for {lead.full_name} - Final notification sent")
#             return True

#         if is_first:
#             missed_title = "Missed Follow-up"
#             missed_message = f"{lead.full_name} missed their follow-up at {scheduled_at_ist.strftime('%I:%M %p')} - Attempt {retry_count}"
#         else:
#             missed_title = "Missed Follow-up"
#             missed_message = f"{lead.full_name} missed their follow-up again at {scheduled_at_ist.strftime('%I:%M %p')} - Attempt {retry_count} "

#         missed_data = {
#             'lead_id': lead.id,
#             'lead_name': lead.full_name,
#             'follow_up_id': follow_up.id,
#             'attempt': retry_count,
#             'scheduled_at': str(scheduled_at_ist),
#             'is_missed': True
#         }

#         notification_id = send_reminder_to_user(
#             lead.assigned_to_id,
#             'missed_followup',
#             missed_title,
#             missed_message,
#             follow_up_id=follow_up.id,
#             scheduled_remainder=follow_up.scheduled_at,
#             data=missed_data,
#             force_create=False
#         )

#         missed_history = MissedFollowUpHistory.objects.create(
#             notification_id=notification_id,
#             follow_up=follow_up,
#             lead=lead,
#             user=lead.assigned_to,
#             retry_count=retry_count,
#             message=missed_message
#         )

#         print(f"📢 Missed follow-up notification sent for {lead.full_name} - Attempt {retry_count} "
#               f"(new history row {missed_history.id} created)")

#         if retry_count < 3:
#             send_missed_followup_notification.schedule(
#                 args=(follow_up.id, retry_count + 1, False),
#                 delay=300  # 5 minutes later
#             )
#             print(f"🔄 Next retry {retry_count + 1} scheduled for {lead.full_name} in 5 minutes")

#         return missed_history.id

#     except FollowUp.DoesNotExist:
#         print(f"❌ FollowUp {follow_up_id} not found")
#         return None
#     except Exception as e:
#         print(f"❌ Error in missed followup: {e}")
#         raise



