import logging
import zoneinfo
from collections import defaultdict
from datetime import timedelta

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
from django.utils import timezone
from huey import crontab
from huey.contrib.djhuey import task, periodic_task

# UserSettings model enga irukko adhukku import path maathikonga
from ..models import Notification, FollowUp, PaymentFollowUp, Lead, UserSettings

User = get_user_model()
logger = logging.getLogger(__name__)

IST = zoneinfo.ZoneInfo('Asia/Kolkata')

# Daily count yaarukku pogum: telecaller role mattum. Unga DB la role name epdi irukko adhe podunga.
# None vechaa ellaa active non-staff users ku pogum.
TELECALLER_ROLE_NAME = None   # example: "Telecaller"










# ==========================================
# HELPERS
# ==========================================
def _get_settings(user_id):
    """User settings dict. Row illa na empty dict (default ON)."""
    return UserSettings.objects.filter(user_id=user_id).values(
        'notify_new_lead',
        'notify_reassigned_leads',
        'follow_up_reminders',
        'sound_alerts',
    ).first() or {}


def _notify_enabled(user_id, field):
    value = _get_settings(user_id).get(field)
    return True if value is None else bool(value)


# ==========================================
# ONE FUNCTION FOR ALL NOTIFICATIONS
# (DB save + websocket push)
# ==========================================
@task(retries=3, retry_delay=60)
def send_notification_to_user(user_id, notification_type, title, message,
                              follow_up_id=None, payment_id=None, lead_id=None,
                              scheduled_remainder=None, data=None):
    data = dict(data or {})
    lead_id = lead_id or data.get('lead_id')
    print(f"📌 send_notification_to_user called with user_id={user_id}, notification_type={notification_type}, title='{title}', message='{message}', lead_id={lead_id}, data={data}")

    # Lead id irundha name / mobile auto-ah serthukum
    if lead_id and 'lead_name' not in data:
        lead = Lead.objects.filter(id=lead_id).only('id', 'full_name', 'mobile_no').first()
        if lead:
            data['lead_name'] = lead.full_name
            data['lead_mobile'] = lead.mobile_no

    # Frontend sound play panna user setting anuppurom
    sound_alerts = _get_settings(user_id).get('sound_alerts')
    data['sound_alerts'] = True if sound_alerts is None else bool(sound_alerts)
    print(f"📌 User {user_id} sound_alerts={data['sound_alerts']}")
    # DB save: fail aana exception ezhumbum, Huey retry pannum
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
        retry_count=0,
    )
    print(f"📌 Notification saved in DB with id={notification.id} for user {user_id}")
    # WebSocket: user offline na fail aagum, DB la already save aagirukku, so retry vendaam
    try:
        async_to_sync(get_channel_layer().group_send)(
            f"notif_user_{user_id}",
            {
                'type': 'notification',
                'notification_type': notification_type,
                'title': title,
                'message': message,
                'lead_id': lead_id,
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
# LEAD IDS HELPERS (single id or list rendum accept)
# ==========================================
def _as_id_list(lead_ids):
    """5 / [5] / [5, 6, 7] -> [5] / [5] / [5, 6, 7] (duplicate remove, order same)."""
    if lead_ids is None:
        return []
    if isinstance(lead_ids, (int, str)):
        return [int(lead_ids)]
    return list(dict.fromkeys(int(i) for i in lead_ids))


def _lead_summary(lead_ids):
    """Leads fetch panni (count, first leads, names text) return pannum."""
    ids = _as_id_list(lead_ids)
    leads = list(Lead.objects.filter(id__in=ids).select_related('lead_source').order_by('id'))
    return leads


def _names_text(leads, limit=3):
    names = [l.full_name for l in leads[:limit]]
    extra = len(leads) - limit
    return f"{', '.join(names)} and {extra} more" if extra > 0 else ', '.join(names)


def _lead_data(leads):
    count = len(leads)
    first = leads[0]
    data = {
        'lead_count': count,                 # ethana lead nu count (single na 1)
        'is_bulk': count > 1,
        'lead_ids': [l.id for l in leads[:50]],
        'lead_details': [
            {'id': l.id, 'name': l.full_name, 'mobile': l.mobile_no}
            for l in leads[:10]
        ],
        'has_more': count > 10,
    }
    if count == 1:
        # single lead na direct open panna lead info kudukkurom
        data.update({
            'lead_id': first.id,
            'lead_name': first.full_name,
            'lead_mobile': first.mobile_no,
            'lead_source': first.lead_source.name if first.lead_source else None,
            'created_at': str(first.created_at),
        })
    return data


# ==========================================
# 1. NEW LEAD(S) ASSIGNED  (single + bulk)
# Call:
#   single : send_lead_assigned_notification(lead.id, lead.assigned_to_id)
#   bulk   : send_lead_assigned_notification([id1, id2, ...], telecaller_id)
# (id anuppunga, User object illa)
# ==========================================
@task(retries=3, retry_delay=30)
def send_lead_assigned_notification(lead_ids, assigned_to_id, assigned_by_id=None):
    print(f"📌 send_lead_assigned_notification called with lead_ids={lead_ids}, assigned_to_id={assigned_to_id}, assigned_by_id={assigned_by_id}")
    if not assigned_to_id:
        return None

    # user "New lead assigned" off pannirundha anuppaadhu
    if not _notify_enabled(assigned_to_id, 'notify_new_lead'):
        return None

    leads = _lead_summary(lead_ids)
    if not leads:
        logger.warning("No leads found for assignment notification: %s", lead_ids)
        return None

    count = len(leads)
    data = _lead_data(leads)

    by_name = None
    if assigned_by_id:
        by = User.objects.filter(id=assigned_by_id).first()
        if by:
            by_name = by.get_full_name() or by.username
            data['assigned_by'] = by_name

    if count == 1:
        lead = leads[0]
        title = "New Lead Assigned"
        message = (f"Lead {lead.full_name} assigned to you by {by_name}" if by_name
                   else f"New lead assigned: {lead.full_name} (Mobile: {lead.mobile_no})")
    else:
        title = "New Leads Assigned"
        message = f"{count} new leads assigned to you: {_names_text(leads)}"
        if by_name:
            message += f" (by {by_name})"

    # call_local: same worker la udane run aagum, exception propagate aagum (retry work aagum)
    print(f"📌 Sending notification to user {assigned_to_id}: title='{title}', message='{message}', data={data}")
    return send_notification_to_user.call_local(
        assigned_to_id, 'lead_notification', title, message,
        lead_id=leads[0].id if count == 1 else None,
        data=data,
    )


# ==========================================
# 2. LEAD(S) REASSIGNED  (single + bulk)
# Call:
#   single : send_lead_reassigned_notification(lead.id, new_id, old_id)
#   bulk   : send_lead_reassigned_notification([ids...], new_id, old_id)
# Bulk la leads vera vera old assignee ku irundha, old assignee wise group panni call pannunga.
# ==========================================
@task(retries=3, retry_delay=30)
def send_lead_reassigned_notification(lead_ids, new_assignee_id, old_assignee_id=None):
    leads = _lead_summary(lead_ids)
    if not leads:
        logger.warning("No leads found for reassignment notification: %s", lead_ids)
        return None

    count = len(leads)
    data = _lead_data(leads)
    data['reassigned_at'] = str(leads[0].updated_at)
    single_lead_id = leads[0].id if count == 1 else None

    notification_id = None

    # ---------- New assignee ----------
    if new_assignee_id and _notify_enabled(new_assignee_id, 'notify_reassigned_leads'):
        if count == 1:
            title = "Lead Reassigned"
            message = f"Lead {leads[0].full_name} reassigned to you"
        else:
            title = "Leads Reassigned"
            message = f"{count} leads reassigned to you: {_names_text(leads)}"

        notification_id = send_notification_to_user.call_local(
            new_assignee_id, 'lead_notification', title, message,
            lead_id=single_lead_id, data=data,
        )

    # ---------- Old assignee ----------
    if (old_assignee_id and old_assignee_id != new_assignee_id
            and _notify_enabled(old_assignee_id, 'notify_reassigned_leads')):
        if count == 1:
            title = "Lead Reassigned"
            message = f"Lead {leads[0].full_name} has been reassigned to someone else"
        else:
            title = "Leads Reassigned"
            message = f"{count} of your leads have been reassigned to someone else: {_names_text(leads)}"

        send_notification_to_user.call_local(
            old_assignee_id, 'lead_notification', title, message,
            lead_id=single_lead_id, data={**data, 'status': 'removed'},
        )

    return notification_id


# ==========================================
# 3. DAILY 10 AM IST: FOLLOW UP COUNT + LIST
# ==========================================
# Huey UTC la irundha: 10:00 AM IST = 04:30 UTC => crontab(minute='30', hour='4')
# HUEY settings la 'utc': False and TIME_ZONE = Asia/Kolkata na hour='10', minute='0' sari.
@periodic_task(crontab(minute='0', hour='10'))
def send_daily_followup_count():
    now_ist = timezone.now().astimezone(IST)
    day_start = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)

    users_qs = User.objects.filter(is_active=True, is_staff=False)
    if TELECALLER_ROLE_NAME:
        users_qs = users_qs.filter(user_roles__role__name=TELECALLER_ROLE_NAME).distinct()
    users = list(users_qs)
    user_ids = [u.id for u in users]

    # Follow-up reminders off pannavangala skip
    disabled_users = set(
        UserSettings.objects.filter(user_id__in=user_ids, follow_up_reminders=False)
        .values_list('user_id', flat=True)
    )

    items_by_user = defaultdict(list)

    # 1 query: normal follow ups
    for f in (FollowUp.objects
              .filter(lead__assigned_to_id__in=user_ids,
                      scheduled_at__gte=day_start, scheduled_at__lt=day_end,
                      is_attended=False)
              .select_related('lead')):
        items_by_user[f.lead.assigned_to_id].append({
            'id': f.lead.id,
            'name': f.lead.full_name,
            'mobile': f.lead.mobile_no,
            'type': 'followup',
            'when': f.scheduled_at,
        })

    # 1 query: payment follow ups
    for p in (PaymentFollowUp.objects
              .filter(payment_info__lead__assigned_to_id__in=user_ids,
                      followup_date__gte=day_start, followup_date__lt=day_end,
                      is_attended=False)
              .select_related('payment_info__lead')):
        lead = p.payment_info.lead
        items_by_user[lead.assigned_to_id].append({
            'id': lead.id,
            'name': lead.full_name,
            'mobile': lead.mobile_no,
            'type': 'payment',
            'when': p.followup_date,
        })

    sent = 0
    for user in users:
        if user.id in disabled_users:
            continue

        items = sorted(items_by_user.get(user.id, []), key=lambda x: x['when'])
        count = len(items)

        if count == 0:
            title = "No Follow-ups Today"
            message = "You have no follow-ups scheduled for today. Enjoy your day!"
        else:
            names = [i['name'] for i in items[:5]]
            title = "Today's Follow-ups"
            if count == 1:
                message = f"You have 1 follow-up today: {names[0]}"
            elif count <= 5:
                message = f"You have {count} follow-ups today: {', '.join(names)}"
            else:
                message = f"You have {count} follow-ups today: {', '.join(names)} and {count - 5} more"

        lead_details = [
            {
                'id': i['id'],
                'name': i['name'],
                'mobile': i['mobile'],
                'type': i['type'],
                'time': i['when'].astimezone(IST).strftime('%I:%M %p'),
            }
            for i in items[:10]
        ]

        # task ah queue la podurom: oru user fail aanaalum matha users ku pogum
        send_notification_to_user(
            user.id,
            'daily_followup_count',
            title,
            message,
            data={
                'followup_count': count,
                'total_count': count,
                'lead_details': lead_details,
                'has_more': count > 10,
            },
        )
        sent += 1

    logger.info("Daily follow-up count queued for %s users (%s)", sent, day_start.date())
    return sent



# from django.apps import apps
# from huey.contrib.djhuey import task,periodic_task
# from huey import crontab
# from channels.layers import get_channel_layer
# from asgiref.sync import async_to_sync
# from django.core.cache import cache
# from django.conf import settings
# from ..models import Notification, FollowUp, PaymentFollowUp, Lead
# from adm.services.query_services import exec_raw_sql, delete_exec_raw_sql
# from rest_framework.exceptions import APIException, NotFound
# from datetime import datetime, timedelta
# import zoneinfo
# from django.utils import timezone
#     # Get all active users (telecallers)
# from django.contrib.auth import get_user_model
# User = get_user_model()






# import logging
# import zoneinfo
# from collections import defaultdict

# logger = logging.getLogger(__name__)


# # ==========================================
# # ONE FUNCTION FOR ALL NOTIFICATIONS
# # (lead assigned / reassigned / admin message / daily follow up)
# # ==========================================
# @task(retries=3, retry_delay=60)
# def send_notification_to_user(user_id, notification_type, title, message,
#                               follow_up_id=None, payment_id=None, lead_id=None,
#                               scheduled_remainder=None, data=None):
#     data = dict(data or {})
#     lead_id = lead_id or data.get('lead_id')

#     # Lead id irundha, name / mobile auto-ah serthukum
#     if lead_id and 'lead_name' not in data:
#         lead = Lead.objects.filter(id=lead_id).only('id', 'full_name', 'mobile_no').first()
#         if lead:
#             data['lead_name'] = lead.full_name
#             data['lead_mobile'] = lead.mobile_no

#     # DB save: fail aana exception ezhumbum, so Huey retry pannum
#     notification = Notification.objects.create(
#         user_id=user_id,
#         notification_type=notification_type,
#         title=title,
#         message=message,
#         follow_up_id=follow_up_id,
#         payment_id=payment_id,
#         lead_id=lead_id,
#         scheduled_remainder=scheduled_remainder,
#         is_read=False,
#         retry_count=0,
#     )

#     # WebSocket: user offline na fail aagum, DB-la already save aagirukku, so retry vendaam
#     try:
#         async_to_sync(get_channel_layer().group_send)(
#             f"notif_user_{user_id}",
#             {
#                 'type': 'notification',
#                 'notification_type': notification_type,
#                 'title': title,
#                 'message': message,
#                 'lead_id': lead_id,
#                 'data': {
#                     'id': notification.id,
#                     'created_at': str(notification.created_at),
#                     'follow_up_id': follow_up_id,
#                     'payment_id': payment_id,
#                     'lead_id': lead_id,
#                     'scheduled_remainder': str(scheduled_remainder) if scheduled_remainder else None,
#                     **data,
#                 },
#             },
#         )
#     except Exception:
#         logger.exception("WebSocket send failed for user %s", user_id)

#     return notification.id


# # ==========================================
# # DAILY 10 AM IST: FOLLOW UP COUNT + LIST
# # ==========================================
# # Huey default UTC: 10:00 AM IST = 04:30 UTC
# # (HUEY settings la 'utc': False irundha hour='10', minute='0' use pannunga)
# @periodic_task(crontab(minute='0', hour='10'))
# def send_daily_followup_count():
#     ist = zoneinfo.ZoneInfo('Asia/Kolkata')
#     now_ist = timezone.now().astimezone(ist)
#     day_start = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
#     day_end = day_start + timedelta(days=1)

#     users = list(User.objects.filter(is_active=True, is_staff=False))
#     user_ids = [u.id for u in users]

#     items_by_user = defaultdict(list)

#     # 1 query: normal follow ups
#     for f in (FollowUp.objects
#               .filter(lead__assigned_to_id__in=user_ids,
#                       scheduled_at__gte=day_start, scheduled_at__lt=day_end,
#                       is_attended=False)
#               .select_related('lead')):
#         items_by_user[f.lead.assigned_to_id].append({
#             'id': f.lead.id,
#             'name': f.lead.full_name,
#             'mobile': f.lead.mobile_no,
#             'type': 'followup',
#             'when': f.scheduled_at,
#         })

#     # 1 query: payment follow ups
#     for p in (PaymentFollowUp.objects
#               .filter(payment_info__lead__assigned_to_id__in=user_ids,
#                       followup_date__gte=day_start, followup_date__lt=day_end,
#                       is_attended=False)
#               .select_related('payment_info__lead')):
#         lead = p.payment_info.lead
#         items_by_user[lead.assigned_to_id].append({
#             'id': lead.id,
#             'name': lead.full_name,
#             'mobile': lead.mobile_no,
#             'type': 'payment',
#             'when': p.followup_date,
#         })

#     for user in users:
#         items = sorted(items_by_user.get(user.id, []), key=lambda x: x['when'])
#         count = len(items)

#         if count == 0:
#             title = "No Follow-ups Today"
#             message = "You have no follow-ups scheduled for today. Enjoy your day!"
#         else:
#             names = [i['name'] for i in items[:5]]
#             title = "Today's Follow-ups"
#             if count == 1:
#                 message = f"You have 1 follow-up today: {names[0]}"
#             elif count <= 5:
#                 message = f"You have {count} follow-ups today: {', '.join(names)}"
#             else:
#                 message = f"You have {count} follow-ups today: {', '.join(names)} and {count - 5} more"

#         lead_details = [
#             {
#                 'id': i['id'],
#                 'name': i['name'],
#                 'mobile': i['mobile'],
#                 'type': i['type'],
#                 'time': i['when'].astimezone(ist).strftime('%I:%M %p'),
#             }
#             for i in items[:10]
#         ]

#         send_notification_to_user(
#             user.id,
#             'daily_followup_count',
#             title,
#             message,
#             data={
#                 'followup_count': count,
#                 'total_count': count,
#                 'lead_details': lead_details,
#                 'has_more': count > 10,
#             },
#         )

#     logger.info("Daily follow-up count queued for %s users (%s)", len(users), day_start.date())
#     return len(users)






    
    
# @task()
# def send_lead_assigned_notification(lead_id, assigned_to_id, assigned_by_id=None):
#     """
#     Send notification when a lead is assigned
#     """
#     try:
#         lead = Lead.objects.select_related('assigned_to', 'lead_source', 'course_name').get(id=lead_id)
        
#         title = "New Lead Assigned"
#         message = f"New lead assigned: {lead.full_name} (Mobile: {lead.mobile_no})"
        
#         data = {
#             'lead_id': lead.id,
#             'lead_name': lead.full_name,
#             'lead_mobile': lead.mobile_no,
#             'lead_source': lead.lead_source.name if lead.lead_source else None,
#             'created_at': str(lead.created_at)
#         }
        
#         if assigned_by_id:
#             assigned_by = User.objects.get(id=assigned_by_id)
#             message = f"Lead {lead.full_name} assigned to you by {assigned_by.get_full_name() or assigned_by.username}"
#             data['assigned_by'] = assigned_by.get_full_name() or assigned_by.username
        
#         return send_notification_to_user(
#             assigned_to_id,
#             'lead_notification',
#             title,
#             message,
#             lead_id=lead.id,
#             data=data
#         )
        
#     except Lead.DoesNotExist:
#         print(f"[ERROR] Lead {lead_id} not found")
#         return None
#     except Exception as e:
#         print(f"[ERROR] Error in lead assignment notification: {e}")
#         return None





# @task()
# def send_lead_reassigned_notification(lead_id, new_assignee_id, old_assignee_id=None):
#     """
#     Send notification when a lead is reassigned
#     """
#     try:
#         lead = Lead.objects.select_related('assigned_to').get(id=lead_id)
        
#         data = {
#             'lead_id': lead.id,
#             'lead_name': lead.full_name,
#             'lead_mobile': lead.mobile_no,
#             'reassigned_at': str(lead.updated_at)
#         }
        
#         # Notify new assignee
#         notification_id = send_notification_to_user(
#             new_assignee_id,
#             'lead_notification',
#             'Lead Reassigned',
#             f"Lead {lead.full_name} reassigned to you",
#             data=data
#         )
        
#         # Optional: Notify old assignee
#         if old_assignee_id and old_assignee_id != new_assignee_id:
#             send_notification_to_user(
#                 old_assignee_id,
#                 'lead_notification',
#                 'Lead Reassigned',
#                 f"Lead {lead.full_name} has been reassigned to someone else",
#                 data={**data, 'status': 'removed'}
#             )
        
#         return notification_id
        
#     except Lead.DoesNotExist:
#         print(f"❌ Lead {lead_id} not found")
#         return None
#     except Exception as e:
#         print(f"❌ Error in lead reassignment notification: {e}")
#         return None
    
    






# # ==========================================
# # 1. SEND DAILY FOLLOW-UP COUNT NOTIFICATION
# # ==========================================
# @periodic_task(crontab(minute='00', hour='10'))  # Every day at 9 AM
# def send_daily_followup_count():
#     """
#     Send daily follow-up count notification to all telecallers at 9 AM
#     """
#     ist = zoneinfo.ZoneInfo('Asia/Kolkata')
#     today = timezone.now().astimezone(ist).date()
#     tomorrow = today + timedelta(days=1)
    

    
#     users = User.objects.filter(is_active=True, is_staff=False)
    
#     count = 0
#     for user in users:
#         # ✅ Get today's follow-ups for this user
#         today_followups = FollowUp.objects.filter(
#             lead__assigned_to_id=user.id,
#             scheduled_at__date=today,
#             is_attended=False
#         ).select_related('lead')
        
#         followup_count = today_followups.count()
        
#         # ✅ Prepare data with lead details
#         lead_names = [f.lead.full_name for f in today_followups[:5]]
#         lead_details = [
#             {
#                 'id': f.lead.id,
#                 'name': f.lead.full_name,
#                 'mobile': f.lead.mobile_no,
#                 'time': f.scheduled_at.strftime('%I:%M %p') if f.scheduled_at else None
#             }
#             for f in today_followups[:10]
#         ]
        
#         more_count = followup_count - 5 if followup_count > 5 else 0
        
#         if followup_count > 0:
#             title = "Today's Follow-ups"
            
#             if followup_count == 1:
#                 message = f"You have 1 follow-up today: {lead_names[0]}"
#             elif followup_count <= 5:
#                 message = f"You have {followup_count} follow-ups today: {', '.join(lead_names)}"
#             else:
#                 message = f"You have {followup_count} follow-ups today: {', '.join(lead_names)} and {more_count} more"
            
#             # ✅ Send notification via WebSocket
#             send_daily_followup_notification(
#                 user.id,
#                 title,
#                 message,
#                 followup_count,
#                 lead_details,
#                 followup_count > 5
#             )
#             count += 1
#         else:
#             # ✅ Optional: Send "No follow-ups today" notification
#             send_daily_followup_notification(
#                 user.id,
#                 "No Follow-ups Today",
#                 "You have no follow-ups scheduled for today. Enjoy your day!",
#                 0,
#                 [],
#                 False
#             )
#             count += 1
    
#     print(f"✅ Daily follow-up count sent to {count} users at {today}")
#     return count


# # ==========================================
# # 2. TASK - Send Daily Follow-up Notification
# # ==========================================
# @task(retries=3, retry_delay=60)
# def send_daily_followup_notification(user_id, title, message, followup_count, lead_details, has_more):
#     """
#     Send daily follow-up count notification to a specific user
#     """
#     try:
        
#         ist = zoneinfo.ZoneInfo('Asia/Kolkata')
#         today = timezone.now().astimezone(ist).date()
        
#         # ✅ Save notification to database
#         notification = Notification.objects.create(
#             user_id=user_id,
#             notification_type='daily_followup_count',
#             title=title,
#             message=message,
#             is_read=False,
#             retry_count=0
#         )
        
#         # ✅ Send via WebSocket
#         channel_layer = get_channel_layer()
#         group_name = f"notif_user_{user_id}"
        
#         async_to_sync(channel_layer.group_send)(
#             group_name,
#             {
#                 'type': 'notification',
#                 'notification_type': 'daily_followup_count',
#                 'title': title,
#                 'message': message,
#                 'data': {
#                     'id': notification.id,
#                     'created_at': str(notification.created_at),
#                     'followup_count': followup_count,
#                     'lead_details': lead_details,
#                     'has_more': has_more,
#                     'total_count': followup_count,
#                 }
#             }
#         )
        
#         print(f"✅ Daily follow-up count sent to user {user_id}: {followup_count} follow-ups")
#         return notification.id
        
#     except Exception as e:
#         print(f"❌ Failed to send daily follow-up notification to user {user_id}: {e}")
#         return None
