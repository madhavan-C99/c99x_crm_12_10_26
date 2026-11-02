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
from .notification_task import send_admin_missed_alert,_get_admin_ids, _user_name
from ..models import (Notification, FollowUp, PaymentFollowUp, UserSettings,
                      MissedFollowUpHistory, Lead, LossLeadDetail,
                       CallDetails)   # CallDetails = telecalling_call_details model
from adm.models import AdminApprovedLossLead,User
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

        # User oda organization (illa na None, 0 podaadheenga)
    org_id = (User.objects.filter(id=user_id)
              .values_list('organization_id', flat=True).first())
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
        organization_id= org_id
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
                    **data,
                    'id': notification.id,
                    'created_at': timezone.localtime(notification.created_at).strftime('%Y-%m-%d %H:%M:%S'),
                    'follow_up_id': follow_up_id,
                    'payment_id': payment_id,
                    'lead_id': lead_id,
                    # 'scheduled_remainder': str(scheduled_remainder) if scheduled_remainder else None,
                    "scheduled_remainder": timezone.localtime(scheduled_remainder).strftime("%Y-%m-%d %H:%M:%S") if scheduled_remainder else None,
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
        uid: min(MAX_REMINDER_MIN, max(0, _to_int(rt)))
        for uid, rt in UserSettings.objects.values_list(
            "user_id", "reminder_time"
        )
    }
    max_reminder = max(reminder_map.values(), default=0)

    window_start = now - timedelta(minutes=CATCHUP_MINUTES)
    window_end = now + timedelta(minutes=max_reminder)

    # ---------- already reminder anuppiyadhu (read / unread rendum) ----------

    # ---------- reminder already sent for this exact schedule ----------
    done_followups = set(
        Notification.objects.filter(
            notification_type="followup_reminder",
            follow_up_id__isnull=False,
            scheduled_remainder__isnull=False,
        ).values_list("follow_up_id", "scheduled_remainder")
    )

    done_payments = set(
        Notification.objects.filter(
            notification_type="payment_followup_reminder",
            payment_id__isnull=False,
            scheduled_remainder__isnull=False,
        ).values_list("payment_id", "scheduled_remainder")
    )

    followups = list(
        FollowUp.objects
        .filter(
            is_attended=False,
            scheduled_at__gte=window_start,
            scheduled_at__lte=window_end,
        )
        .select_related("lead")
    )

    payment_followups = list(
        PaymentFollowUp.objects
        .filter(
            is_attended=False,
            followup_status="Pending",
            followup_date__gte=window_start,
            followup_date__lte=window_end,
        )
        .select_related("payment_info__lead")
    )


    count = 0

    # ---------- normal follow ups ----------
    for f in followups:

        # Skip if reminder already sent for this exact schedule
        reminder_key = (f.id, f.scheduled_at)

        if reminder_key in done_followups:
            continue

        lead = f.lead
        uid = lead.assigned_to_id

        if not uid:
            continue

        remind_min = reminder_map.get(uid, 0)

        alert_time = (
            f.scheduled_at - timedelta(minutes=remind_min)
        ).replace(second=0, microsecond=0)

        if alert_time > now_minute:
            continue

        at = f.scheduled_at.astimezone(IST).strftime('%I:%M %p')

        message = (
            f"Follow-up with {lead.full_name} in {remind_min} minutes ({at})"
            if remind_min
            else f"Follow-up with {lead.full_name} now ({at})"
        )

        send_reminder_to_user(
            uid,
            'followup_reminder',
            "Follow-up Reminder",
            message,
            follow_up_id=f.id,
            lead_id=lead.id,
            scheduled_remainder=f.scheduled_at,
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

        # Prevent duplicate sends during this task execution
        done_followups.add(reminder_key)
        count += 1

    # ---------- payment follow ups ----------
    for p in payment_followups:

        reminder_key = (p.id, p.followup_date)

        if reminder_key in done_payments:
            continue

        info = p.payment_info
        lead = info.lead
        uid = lead.assigned_to_id

        if not uid:
            continue

        remind_min = reminder_map.get(uid, 0)

        alert_time = (
            p.followup_date - timedelta(minutes=remind_min)
        ).replace(second=0, microsecond=0)

        if alert_time > now_minute:
            continue

        at = p.followup_date.astimezone(IST).strftime('%I:%M %p')

        message = (
            f"Payment follow-up with {lead.full_name} in {remind_min} minutes ({at})"
            if remind_min
            else f"Payment follow-up with {lead.full_name} now ({at})"
        )

        send_reminder_to_user(
            uid,
            'payment_followup_reminder',
            "Payment Follow-up Reminder",
            message,
            payment_id=p.id,
            lead_id=lead.id,
            scheduled_remainder=p.followup_date,
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

        done_payments.add(reminder_key)
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

            notification_id = send_reminder_to_user.call_local(
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
            if is_final:
                send_admin_missed_alert(
                    lead.id, uid, k['label'], at,
                    is_payment=(field == 'payment_id'),
                )
            total += 1

    logger.info("Sent %s missed alerts", total)
    return total




# ==========================================
# ADMIN REMINDERS (reminder bell)
# ==========================================
LOSS_PENDING_AFTER = timedelta(hours=24)     # request panni evlo neram kazhichu
LOSS_LOOKBACK = timedelta(days=30)
UNASSIGNED_AFTER = timedelta(minutes=15)
UNASSIGNED_LOOKBACK = timedelta(days=7)
STALE_DAYS = 2                               # assign aagi call/follow-up illaama N naal
STALE_LOOKBACK_DAYS = 30


def _send_admin_summary_reminder(org_id, rtype, title, message, data, replace=True):
    """Org la ella admins ku oru summary reminder. Same message unread irundha thirumba anuppaadhu."""
    sent = 0
    for admin_id in _get_admin_ids(org_id):
        unread = Notification.objects.filter(
            user_id=admin_id, notification_type=rtype, is_read=False
        )
        if unread.filter(message=message).exists():
            continue
        if replace:
            unread.update(is_read=True)   # pazhaya summary bell la pile aagaadhu
        send_reminder_to_user.call_local(
            admin_id, rtype, title, message, data=data,
        )
        sent += 1
    return sent


# ------------------------------------------
# 1. LOSS REQUEST PENDING (24 hrs) -> ADMIN
# ------------------------------------------
@periodic_task(crontab(minute='*'))   # ovvoru manikkum
def send_admin_loss_pending_reminders():
    now = timezone.now()

    pending = (
        LossLeadDetail.objects
        .filter(lead__current_status="Loss",
                updated_at__lte=now - LOSS_PENDING_AFTER,
                updated_at__gte=now - LOSS_LOOKBACK)
        .exclude(lead_id__in=AdminApprovedLossLead.objects.values('lead_id'))
        .select_related('lead', 'lead__assigned_to')
    )

    sent = 0
    for req in pending:
        lead = req.lead
        # indha request ku already reminder pona skip (reject -> thirumba request na puthu reminder)
        if Notification.objects.filter(
            notification_type='admin_loss_pending_reminder',
            lead_id=lead.id, created_at__gte=req.updated_at,
        ).exists():
            continue

        hours = int((now - req.updated_at).total_seconds() // 3600)
        tc_name = _user_name(lead.assigned_to)
        message = f"{tc_name}'s loss request for {lead.full_name} is pending for {hours} hrs"

        for admin_id in _get_admin_ids(lead.organization_id, user_id=lead.assigned_to_id):
            send_reminder_to_user.call_local(
                admin_id, 'admin_loss_pending_reminder', "Loss Request Pending", message,
                lead_id=lead.id,
                data={'lead_id': lead.id, 'lead_name': lead.full_name,
                      'telecaller_name': tc_name, 'pending_hours': hours},
            )
            sent += 1

    logger.info("Admin loss pending reminders: %s", sent)
    return sent


# ------------------------------------------
# 4. UNASSIGNED LEADS (15 min) -> ADMIN
# ------------------------------------------
@periodic_task(crontab(minute='*/15'))
def send_admin_unassigned_lead_reminders():
    now = timezone.now()

    leads = (Lead.objects
             .filter(assigned_to__isnull=True,
                     created_at__lte=now - UNASSIGNED_AFTER,
                     created_at__gte=now - UNASSIGNED_LOOKBACK)
             .exclude(current_status="Loss")
             .order_by('created_at'))

    by_org = defaultdict(list)
    for l in leads:
        by_org[l.organization_id].append(l)

    sent = 0
    for org_id, rows in by_org.items():
        count = len(rows)
        message = f"{count} lead{'s' if count > 1 else ''} unassigned for over 15 minutes"
        data = {
            'unassigned_count': count,
            'lead_details': [{'id': l.id, 'name': l.full_name, 'mobile': l.mobile_no}
                             for l in rows[:10]],
            'has_more': count > 10,
        }
        sent += _send_admin_summary_reminder(
            org_id, 'admin_unassigned_lead_reminder', "Unassigned Leads", message, data)

    logger.info("Admin unassigned lead reminders: %s", sent)
    return sent


# ------------------------------------------
# 5. STALE LEADS (assign aagi call/follow-up illa) -> ADMIN
# ------------------------------------------
@periodic_task(crontab(minute='0', hour='11'))   # daily 11 AM (HUEY timezone padi)
# @periodic_task(crontab(minute="*"))
def send_admin_stale_lead_reminders():
    now = timezone.now()

    leads = (Lead.objects
             .filter(assigned_to__isnull=False,
                     created_at__lte=now - timedelta(days=STALE_DAYS),
                     created_at__gte=now - timedelta(days=STALE_LOOKBACK_DAYS))
             .exclude(current_status="Loss")
             .exclude(id__in=CallDetails.objects.values('lead_id'))
             .exclude(id__in=FollowUp.objects.values('lead_id'))
             .select_related('assigned_to')
             .order_by('created_at'))

    by_org = defaultdict(list)
    for l in leads:
        by_org[l.organization_id].append(l)

    sent = 0
    for org_id, rows in by_org.items():
        count = len(rows)

        per_tc = {}
        for l in rows:
            t = per_tc.setdefault(l.assigned_to_id, {
                'telecaller_id': l.assigned_to_id,
                'telecaller_name': _user_name(l.assigned_to), 'count': 0})
            t['count'] += 1
        breakdown = sorted(per_tc.values(), key=lambda t: -t['count'])

        message = (f"{count} lead{'s' if count > 1 else ''} assigned but no call or "
                   f"follow-up for {STALE_DAYS}+ days")
        data = {
            'stale_count': count,
            'breakdown': breakdown[:10],
            'lead_details': [{'id': l.id, 'name': l.full_name, 'mobile': l.mobile_no,
                              'telecaller': _user_name(l.assigned_to)} for l in rows[:10]],
            'has_more': count > 10,
        }
        sent += _send_admin_summary_reminder(
            org_id, 'admin_stale_lead_reminder', "Stale Leads", message, data)

    logger.info("Admin stale lead reminders: %s", sent)
    return sent