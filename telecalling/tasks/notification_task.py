import logging
import zoneinfo
from collections import defaultdict
from datetime import timedelta
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from huey import crontab
from huey.contrib.djhuey import task, periodic_task

# UserSettings model enga irukko adhukku import path maathikonga
from ..models import Notification, FollowUp, PaymentFollowUp, Lead, UserSettings,PaymentHistory

User = get_user_model()

logger = logging.getLogger(__name__)

IST = zoneinfo.ZoneInfo('Asia/Kolkata')

# Daily count yaarukku pogum: telecaller role mattum. Unga DB la role name epdi irukko adhe podunga.
# None vechaa ellaa active non-staff users ku pogum.
TELECALLER_ROLE_NAME = "Executive" or None # example: "Telecaller"

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
    title = (title or "")[:100]          # <- add
    message = (message or "")[:255]
    lead_id = lead_id or data.get('lead_id')

        # User oda organization (illa na None, 0 podaadheenga)

    org_id = (User.objects.filter(id=user_id)
              .values_list('organization_id', flat=True).first())

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
        organization_id= org_id
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
                    **data,
                    'id': notification.id,
                    'created_at': timezone.localtime(notification.created_at).strftime('%Y-%m-%d %H:%M:%S'),
                    'follow_up_id': follow_up_id,
                    'payment_id': payment_id,
                    'lead_id': lead_id,
                    # 'scheduled_remainder':str(scheduled_remainder) if scheduled_remainder else None,
                    "scheduled_remainder": timezone.localtime(scheduled_remainder).strftime("%Y-%m-%d %H:%M:%S") if scheduled_remainder else None,
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
def send_lead_reassigned_notification(lead_ids, new_assignee_id, old_assignee_id=None,
                                      notify_new=True, notify_old=True):
    leads = _lead_summary(lead_ids)

    if not leads:
        logger.warning("No leads found for reassignment notification: %s", lead_ids)

        return None

    count = len(leads)
    data = _lead_data(leads)
    data['reassigned_at'] = str(leads[0].updated_at)
    single_lead_id = leads[0].id if count == 1 else None
    # Puthu telecaller peyar (old telecaller message ku)
    new_user = User.objects.filter(id=new_assignee_id).first() if new_assignee_id else None
    new_name = _user_name(new_user) if new_user else "another telecaller"
    notification_id = None
    # ---------- New assignee ----------

    if notify_new and new_assignee_id and _notify_enabled(new_assignee_id, 'notify_reassigned_leads'):
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

    if (notify_old and old_assignee_id and old_assignee_id != new_assignee_id
            and _notify_enabled(old_assignee_id, 'notify_reassigned_leads')):
        if count == 1:
            title = "Lead Reassigned"
            message = f"Lead {leads[0].full_name} has been reassigned to {new_name}"

        else:
            title = "Leads Reassigned"
            message = f"{count} of your leads have been reassigned to {new_name}: {_names_text(leads)}"

        send_notification_to_user.call_local(
            old_assignee_id, 'lead_notification', title, message,
            lead_id=single_lead_id,
            data={**data, 'status': 'removed',
                  'new_assignee_id': new_assignee_id,
                  'new_assignee_name': new_name},
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

# ==========================================
# ADMIN HELPERS
# ==========================================

ADMIN_ROLE_NAME = "admin"

def get_target_notification_recipients(user_id=None, organization_id=None):
    """

    Target Notification Recipients:
    1. Main Admin (Primary Admin of the organization - exactly 1 person, NOT 10 admins!).
    2. The direct manager/team leader the user reports to (reporting_to or team.leader).
    Returns list of distinct user IDs.
    """
    recipient_ids = set()
    # 1. Main Admin of the organization (1 person only)
    if organization_id:
        main_admin = User.objects.filter(
            organization_id=organization_id,
            is_active=True
        ).filter(
            Q(is_superuser=True) |
            Q(user_roles__role__code__in=['ADM', 'ORG_ADMIN']) |
            Q(user_roles__role__name__iexact='admin')
        ).order_by('id').first()

        if main_admin:
            recipient_ids.add(main_admin.id)

    # 2. Reporting Person (Manager or Team Lead the telecaller reports to)
    if user_id:
        sender_user = User.objects.select_related('reporting_to', 'team', 'team__leader').filter(id=user_id).first()

        if sender_user:
            if sender_user.reporting_to and sender_user.reporting_to.is_active:
                recipient_ids.add(sender_user.reporting_to.id)

            elif sender_user.team and sender_user.team.leader and sender_user.team.leader.is_active:
                if sender_user.team.leader.id != sender_user.id:
                    recipient_ids.add(sender_user.team.leader.id)

    # Never send notification to self
    if user_id in recipient_ids:
        recipient_ids.remove(user_id)

    return list(recipient_ids)

def _get_admin_ids(organization_id, user_id=None):
    """Legacy compatibility wrapper; targets Main Admin + Reporting Manager"""

    return get_target_notification_recipients(user_id=user_id, organization_id=organization_id)

def _notify_admins(organization_id, notification_type, title, message,
                   lead_id=None, follow_up_id=None, data=None, user_id=None, payment_id=None):
    last_id = None
    target_ids = get_target_notification_recipients(user_id=user_id, organization_id=organization_id)

    for admin_id in target_ids:
        last_id = send_notification_to_user.call_local(
            admin_id, notification_type, title, message,
            lead_id=lead_id, follow_up_id=follow_up_id, payment_id=payment_id, data=data,
        )

    return last_id

def _user_name(user):
    return (user.get_full_name() or user.username) if user else "Telecaller"

# ==========================================
# 1. LOSS REQUEST  (telecaller -> admin)
# Call: send_loss_request_notification(lead.id, request.user.id, reason, loss_request.id)
# ==========================================

@task(retries=3, retry_delay=30)
def send_loss_request_notification(lead_id, requested_by_id, reason=None, loss_request_id=None):
    lead = Lead.objects.filter(id=lead_id).select_related('lead_source').first()

    if not lead:
        logger.warning("Lead not found for loss request: %s", lead_id)

        return None

    by = User.objects.filter(id=requested_by_id).first()
    by_name = (by.get_full_name() or by.username) if by else "Telecaller"
    message = f"{by_name} requested to mark {lead.full_name} as Lost"

    if reason:
        message += f". Reason: {reason}"

    data = {
        'loss_request_id': loss_request_id,
        'lead_id': lead.id,
        'lead_name': lead.full_name,
        'lead_mobile': lead.mobile_no,
        'requested_by': by_name,
        'requested_by_id': requested_by_id,
        'reason': reason,
        'requires_action': True,
    }

    return _notify_admins(lead.organization_id, 'loss_request',
                          "Loss Request", message, lead_id=lead.id, data=data, user_id=requested_by_id)

# Admin approve / reject pannina telecaller ku result
# Call: send_loss_request_result_notification(lead.id, telecaller_id, True/False, admin.id, remark)
@task(retries=3, retry_delay=30)
def send_loss_request_result_notification(lead_id, telecaller_id, approved,
                                          decided_by_id=None, remark=None,
                                          reassigned_to_id=None):
    lead = Lead.objects.filter(id=lead_id).only('id', 'full_name', 'mobile_no').first()

    if not lead or not telecaller_id:
        return None

    # ---------- Reassign: lead vera telecaller ku poiduchu ----------

    if reassigned_to_id:
        if telecaller_id == reassigned_to_id:
            return None

        new_user = User.objects.filter(id=reassigned_to_id).first()
        new_name = _user_name(new_user) if new_user else "another telecaller"

        return send_notification_to_user.call_local(
            telecaller_id, 'loss_request_result',
            "Lead Reassigned",
            f"Lead {lead.full_name} has been reassigned to {new_name}",
            lead_id=lead.id,
            data={'approved': False, 'reassigned': True,
                  'reassigned_to_id': reassigned_to_id,
                  'reassigned_to_name': new_name,
                  'decided_by_id': decided_by_id},
        )

    # ---------- Approve / Reject ----------
    status = "approved" if approved else "rejected"
    message = f"Your loss request for {lead.full_name} was {status}"

    if approved:
        message = f"Your loss request for {lead.full_name} was approved. Lead moved to Loss."

    else:
        message = f"Your loss request for {lead.full_name} was rejected. Lead is back in your follow-up list."

    if remark:
        message += f" Remark: {remark}"

    return send_notification_to_user.call_local(
        telecaller_id, 'loss_request_result',
        f"Loss Request {status.title()}", message,
        lead_id=lead.id,
        data={'approved': bool(approved), 'decided_by_id': decided_by_id, 'remark': remark},
    )

# ==========================================
# 3. 5:30 PM ADMIN MISSED FOLLOWUP ESCALATION
#    Runs daily at 5:30 PM IST (crontab: minute 30, hour 17).
#    Checks follow-ups with 3 missed alerts that were NOT attended before 5:30 PM.
#    - Exactly 1 missed: Option A (Direct lead details)
#    - More than 1 missed: Option B (Grouped by telecaller)
# ==========================================

MAX_MISSED = 3

@periodic_task(crontab(minute='30', hour='17'))   # daily 5:30 PM IST
# @periodic_task(crontab(minute='*'))  
def send_admin_missed_followups():
    now_ist = timezone.now().astimezone(IST)
    today_ist = now_ist.date()
    kinds = [
        {
            'model': FollowUp,
            'field': 'follow_up_id',
            'missed': 'missed_followup',
            'pending': {'is_attended': False},
            'related': ['lead', 'lead__assigned_to', 'organization'],
            'lead': lambda o: o.lead,
            'when': lambda o: o.scheduled_at,
            'label': 'follow-up',
        },
        {
            'model': PaymentFollowUp,
            'field': 'payment_id',
            'missed': 'missed_payment_followup',
            'pending': {'is_attended': False, 'followup_status': 'Pending'},
            'related': ['payment_info__lead', 'payment_info__lead__assigned_to', 'organization'],
            'lead': lambda o: o.payment_info.lead,
            'when': lambda o: o.followup_date,
            'label': 'payment follow-up',
        },
    ]
    # Group by (organization_id, telecaller_id)
    org_telecaller_missed = defaultdict(list)
    for k in kinds:
        field = k['field']
        # Find today's followups that had missed alerts today
        missed_notifs = Notification.objects.filter(
            notification_type=k['missed'],
            created_at__date=today_ist,
        ).values_list(field, flat=True)
        ids = list(set([i for i in missed_notifs if i]))

        if not ids:
            continue

        objs = (
            k['model'].objects
            .filter(id__in=ids, **k['pending'])
            .select_related(*k['related'])
        )

        for obj in objs:
            # Check how many missed alerts were sent for this specific follow-up today
            count = Notification.objects.filter(
                **{field: obj.id},
                notification_type=k['missed'],
                created_at__date=today_ist,
            ).count()

            if count < MAX_MISSED:
                # Telecaller hasn't reached 3 missed alerts yet
                continue

            # Prevent duplicate 5:30 PM alerts if already sent today for this follow-up
            already_alerted = Notification.objects.filter(
                **{field: obj.id},
                notification_type='admin_missed_alert',
                created_at__date=today_ist,
            ).exists()

            if already_alerted:
                continue

            lead = k['lead'](obj)

            if not lead:
                continue

            tc = lead.assigned_to
            uid = lead.assigned_to_id
            org_id = lead.organization_id or (tc.organization_id if tc else None)

            if not org_id or not uid:
                continue

            at_text = k['when'](obj).astimezone(IST).strftime('%I:%M %p')
            org_telecaller_missed[(org_id, uid)].append({
                'obj_id': obj.id,
                'field': field,
                'lead': lead,
                'telecaller': tc,
                'label': k['label'],
                'scheduled_time': at_text,
                'is_payment': (field == 'payment_id'),
            })

    total_alerts_sent = 0
    for (org_id, uid), items in org_telecaller_missed.items():
        if not items:
            continue

        tc = items[0]['telecaller']
        tc_name = (tc.get_full_name() or tc.username) if tc else "Telecaller"
        # If exactly 1 missed follow-up -> Option A (Direct Lead Notification)
        if len(items) == 1:
            item = items[0]
            lead = item['lead']
            label = item['label']
            when_time = item['scheduled_time']
            message = (
                f"{tc_name} has NOT attended the {label} for {lead.full_name} "
                f"({lead.mobile_no}) scheduled at {when_time}, despite 3 warnings. "
                f"Please reassign or take action."
            )
            title = "🚨 Missed Follow-up (Unattended till 5:30 PM)"
            data = {
                'telecaller_id': uid,
                'telecaller_name': tc_name,
                'is_payment': item['is_payment'],
                'lead_name': lead.full_name,
                'lead_mobile': lead.mobile_no,
                'scheduled_time': when_time,
                'requires_action': True,
                'escalated_at_530': True,
            }
            extra_kwargs = {item['field']: item['obj_id']} if item['field'] == 'payment_id' else {'follow_up_id': item['obj_id']}
            _notify_admins(
                org_id, 'admin_missed_alert', title, message,
                lead_id=lead.id, data=data, user_id=uid,
                **extra_kwargs
            )
            total_alerts_sent += 1

        # If multiple missed follow-ups (> 1) -> Option B (Grouped by Telecaller)
        else:
            lead_names_preview = ", ".join(item['lead'].full_name for item in items[:3])

            if len(items) > 3:
                lead_names_preview += f" and {len(items) - 3} more"

            message = (
                f"{tc_name} has {len(items)} follow-up(s) still unattended today till 5:30 PM: {lead_names_preview}. "
                f"Please review & reassign."
            )
            title = "⚠️ Unattended Follow-ups Summary (5:30 PM)"
            data = {
                'telecaller_id': uid,
                'telecaller_name': tc_name,
                'missed_count': len(items),
                'lead_ids': [it['lead'].id for it in items],
                'requires_action': True,
                'escalated_at_530': True,
            }
            # Also associate follow_up_id / payment_id of the first item for UI navigation
            first_item = items[0]
            extra_kwargs = {first_item['field']: first_item['obj_id']} if first_item['field'] == 'payment_id' else {'follow_up_id': first_item['obj_id']}
            _notify_admins(
                org_id, 'admin_missed_alert', title, message,
                lead_id=first_item['lead'].id, data=data, user_id=uid,
                **extra_kwargs
            )
            total_alerts_sent += 1

    logger.info("Sent %s admin 5:30 PM missed follow-up escalation alerts", total_alerts_sent)

    return total_alerts_sent


# @periodic_task(crontab(minute='*'))
@periodic_task(crontab(minute='30', hour='10'))
def send_admin_payment_overdue_summary():
    today = timezone.now().astimezone(IST).date()
    installments = (
        PaymentHistory.objects
        .filter(paid_amount=0, pending_amount__gt=0,
                due_date__lt=today,
                payment_info__is_full_payment=False,
                # payment_info__pending_amount__gt=0,
                payment_info__lead__assigned_to__isnull=False)
        .select_related('payment_info__lead', 'payment_info__lead__assigned_to')
        .order_by('due_date')
    )
    by_org = defaultdict(dict)

    for inst in installments:
        info = inst.payment_info
        lead = info.lead

        if info.id in by_org[lead.organization_id]:
            continue

        by_org[lead.organization_id][info.id] = {
            'lead_id': lead.id,
            'lead_name': lead.full_name,
            'lead_mobile': lead.mobile_no,
            'telecaller_id': lead.assigned_to_id,
            'telecaller_name': _user_name(lead.assigned_to),
            'amount': inst.pending_amount or 0,
            'oldest_due': inst.due_date,
        }

    sent = 0

    for org_id, rows_by_info in by_org.items():
        rows = sorted(rows_by_info.values(), key=lambda r: r['oldest_due'])
        count = len(rows)
        total_amount = sum(r['amount'] for r in rows)
        oldest_days = (today - rows[0]['oldest_due']).days
        # telecaller wise breakdown
        per_tc = {}

        for r in rows:
            t = per_tc.setdefault(r['telecaller_id'], {
                'telecaller_id': r['telecaller_id'],
                'telecaller_name': r['telecaller_name'],
                'count': 0, 'amount': 0,
            })
            t['count'] += 1
            t['amount'] += r['amount']

        breakdown = sorted(per_tc.values(), key=lambda t: -t['count'])
        message = (f"{count} payments overdue - Rs.{total_amount:,.0f} pending. "
                   f"Oldest: {oldest_days} days")

        data = {
            'overdue_count': count,
            'total_amount': total_amount,
            'oldest_days': oldest_days,
            'breakdown': breakdown[:10],
            'lead_details': [
                {
                    'lead_id': r['lead_id'],
                    'name': r['lead_name'],
                    'mobile': r['lead_mobile'],
                    'telecaller': r['telecaller_name'],
                    'amount': r['amount'],
                    'due_date': str(r['oldest_due']),
                    'days_overdue': (today - r['oldest_due']).days,
                }
                for r in rows[:10]
            ],
            'has_more': count > 10,
            'is_payment': True,
            'requires_action': True,
        }
        admin_ids = _get_admin_ids(org_id)

        for admin_id in admin_ids:
            Notification.objects.filter(
                user_id=admin_id, notification_type='admin_payment_overdue', is_read=False
            ).update(is_read=True)
            send_notification_to_user(
                admin_id, 'admin_payment_overdue', "Payments Overdue", message, data=data,
            )
            sent += 1

    return sent