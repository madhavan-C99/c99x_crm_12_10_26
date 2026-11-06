import datetime
import calendar
from django.utils import timezone
from django.db.models import Q, Sum, Count
from django.contrib.auth import get_user_model
from rest_framework.exceptions import APIException

from adm.models import Team, TeamTarget, IndividualTarget
from telecalling.models import Lead, PaymentInfo, Notification

User = get_user_model()

# Standard Won Stage filter consistent with performance and admission metrics
WON_STAGE_FILTER = (
    Q(pipeline_stage__stage_type='closed_won') |
    (Q(pipeline_stage__name__icontains="won") & ~Q(pipeline_stage__name__icontains="loss") & ~Q(pipeline_stage__name__icontains="lost")) |
    (Q(pipeline_stage__name__icontains="converted") & ~Q(pipeline_stage__name__icontains="loss") & ~Q(pipeline_stage__name__icontains="lost"))
)


def parse_target_dates(month_str=None, from_date_str=None, to_date_str=None):
    """
    Parses date range or month string into (target_month, start_date, end_date)
    """
    today = timezone.now().date()
    
    if from_date_str and to_date_str:
        try:
            s_date = datetime.datetime.strptime(str(from_date_str).strip()[:10], "%Y-%m-%d").date()
            e_date = datetime.datetime.strptime(str(to_date_str).strip()[:10], "%Y-%m-%d").date()
            t_month = s_date.replace(day=1)
            return t_month, s_date, e_date
        except Exception:
            pass

    if month_str:
        try:
            clean_m = str(month_str).strip()
            if len(clean_m) >= 7:
                t_month = datetime.datetime.strptime(clean_m[:7], "%Y-%m").date().replace(day=1)
                _, last_day = calendar.monthrange(t_month.year, t_month.month)
                s_date = t_month
                e_date = datetime.date(t_month.year, t_month.month, last_day)
                return t_month, s_date, e_date
        except Exception:
            pass

    # Default to current month
    t_month = today.replace(day=1)
    _, last_day = calendar.monthrange(t_month.year, t_month.month)
    return t_month, t_month, datetime.date(t_month.year, t_month.month, last_day)


def get_user_role_info(user):
    """
    Determines user's role: executive, team_lead, or admin.
    Also returns display name and formatted role label.
    """
    if not user or not getattr(user, 'is_authenticated', False):
        return "executive", "Telecaller", "User"

    fname = (getattr(user, 'first_name', '') or '').strip()
    lname = (getattr(user, 'last_name', '') or '').strip()
    display_name = f"{fname} {lname}".strip() or getattr(user, 'username', 'Telecaller')

    if getattr(user, 'is_superuser', False):
        return "admin", "Superadmin", display_name

    role_names = []
    if hasattr(user, 'user_roles'):
        role_names = [str(r.role.name).lower() for r in user.user_roles.select_related('role').all() if r.role]
    if hasattr(user, 'role') and user.role:
        role_names.append(str(user.role).lower())
    if hasattr(user, 'user_type') and user.user_type:
        role_names.append(str(user.user_type).lower())

    # Check for Admin / Manager
    if any(k in r for r in role_names for k in ['admin', 'manager', 'org admin', 'superadmin']):
        return "admin", "Admin", display_name

    # Check for Team Lead
    is_tl = any(k in r for r in role_names for k in ['team_lead', 'teamlead', 'tl', 'lead'])
    if is_tl or (hasattr(user, 'led_teams') and user.led_teams.filter(is_active=True).exists()):
        return "team_lead", "Team Lead", display_name

    return "executive", "Executive", display_name


def calculate_user_achieved_metrics(user_id, start_date, end_date, pipeline_id=0):
    """
    Calculates actual achieved won leads and achieved revenue amount for a telecaller.
    """
    qs = Lead.objects.filter(
        assigned_to_id=user_id,
        updated_at__date__range=[start_date, end_date]
    ).filter(WON_STAGE_FILTER)

    if pipeline_id and int(pipeline_id) > 0:
        if hasattr(Lead, 'pipeline_category_id'):
            qs = qs.filter(pipeline_category_id=pipeline_id)
        elif hasattr(Lead, 'pipeline_stage') and hasattr(Lead.pipeline_stage.field.related_model, 'pipeline_id'):
            qs = qs.filter(pipeline_stage__pipeline_id=pipeline_id)

    achieved_leads = qs.count()

    total_amount = 0.0
    leads_list = list(qs.select_related('course', 'course_plan'))

    for lead in leads_list:
        # Check PaymentInfo records first
        pay_obj = PaymentInfo.objects.filter(lead=lead).order_by('-id').first()
        if pay_obj:
            val = float(pay_obj.amount_paid or 0.0) + float(pay_obj.pending_amount or 0.0)
            if val > 0:
                total_amount += val
                continue
            elif pay_obj.amount_paid and float(pay_obj.amount_paid) > 0:
                total_amount += float(pay_obj.amount_paid)
                continue

        # Check configured plan or course fees
        fee = 0.0
        if getattr(lead, 'course_plan', None) and getattr(lead.course_plan, 'fee_amount', None):
            fee = float(lead.course_plan.fee_amount or 0.0)
        elif getattr(lead, 'course', None) and getattr(lead.course, 'course_fees', None):
            fee = float(lead.course.course_fees or 0.0)

        if fee > 0:
            total_amount += fee

    return achieved_leads, round(total_amount, 2)


def build_single_target_dict(user_obj, target_month, start_date, end_date, pipeline_id=0, rank=1):
    """
    Builds the 2-target metrics dictionary for a single telecaller.
    Strictly uses DB target allocations with no hardcoded fallback values.
    """
    fname = (getattr(user_obj, 'first_name', '') or '').strip()
    lname = (getattr(user_obj, 'last_name', '') or '').strip()
    full_name = f"{fname} {lname}".strip() or getattr(user_obj, 'username', f'Telecaller {user_obj.id}')

    # Retrieve set target from adm_individual_target
    target_obj = IndividualTarget.objects.filter(
        telecaller=user_obj,
        target_month=target_month
    ).order_by('-id').first()

    has_lead_target = bool(target_obj and target_obj.target_admissions and int(target_obj.target_admissions) > 0)
    has_amount_target = bool(target_obj and target_obj.target_amount and float(target_obj.target_amount) > 0)

    target_leads = int(target_obj.target_admissions) if has_lead_target else 0
    target_amount = float(target_obj.target_amount) if has_amount_target else 0.0

    achieved_leads, achieved_amount = calculate_user_achieved_metrics(
        user_obj.id, start_date, end_date, pipeline_id
    )

    balance_leads = max(0, target_leads - achieved_leads) if has_lead_target else 0
    balance_amount = max(0.0, round(target_amount - achieved_amount, 2)) if has_amount_target else 0.0

    lead_rate = round((achieved_leads / target_leads) * 100) if target_leads > 0 else 0
    amount_rate = round((achieved_amount / target_amount) * 100) if (has_amount_target and target_amount > 0) else 0
    overall_rate = round((lead_rate + amount_rate) / 2) if has_amount_target else lead_rate

    if not has_lead_target and not has_amount_target:
        status = "No Target Set"
    elif has_amount_target:
        status = "Achieved" if (lead_rate >= 100 and amount_rate >= 100) else ("On Track" if (lead_rate >= 70 or amount_rate >= 70) else "Needs Push")
    else:
        status = "Achieved" if lead_rate >= 100 else ("On Track" if lead_rate >= 70 else "Needs Push")

    team_name = ""
    if getattr(user_obj, 'team', None):
        team_name = user_obj.team.name
    elif hasattr(user_obj, 'led_teams') and user_obj.led_teams.filter(is_active=True).exists():
        team_name = user_obj.led_teams.filter(is_active=True).first().name

    return {
        "id": user_obj.id,
        "name": full_name,
        "role": team_name or "Executive",
        "rank": rank,
        "has_lead_target": has_lead_target,
        "has_amount_target": has_amount_target,
        # Target 1: Target Lead Count
        "target_leads": target_leads,
        "achieved_leads": achieved_leads,
        "balance_leads": balance_leads,
        "lead_rate": lead_rate,
        # Target 2: Amount Target
        "target_amount": target_amount,
        "achieved_amount": achieved_amount,
        "balance_amount": balance_amount,
        "amount_rate": amount_rate,
        # Overall
        "overall_rate": overall_rate,
        "status": status,
    }


def fetch_dashboard_targets_service(data, user):
    """
    Main service to return targets for Telecalling dashboard.
    Role-based logic:
    - Executive: Returns ONLY their personal 2 targets (no team tabs).
    - Team Lead: Returns Team Target, Members Breakdown, and TL's individual target.
    - Admin: Returns All Teams / Team Targets, Members Breakdown, and Target summaries.
    """
    month_str = data.get('month')
    from_date_str = data.get('from_date')
    to_date_str = data.get('to_date')
    pipeline_id = int(data.get('pipeline_id') or 0)

    target_month, start_date, end_date = parse_target_dates(month_str, from_date_str, to_date_str)
    role_type, role_label, display_name = get_user_role_info(user)

    is_executive = (role_type == "executive")

    # 1. Executive Personal Target
    my_target = build_single_target_dict(user, target_month, start_date, end_date, pipeline_id, rank=1)

    # 2. Team Target and Members Logic
    # Find active team for User (Executive, TL, or Admin)
    team = None
    if hasattr(user, 'led_teams') and user.led_teams.filter(is_active=True).exists():
        team = user.led_teams.filter(is_active=True).first()
    elif getattr(user, 'team', None):
        team = user.team
    else:
        # Fallback to first active team in organization
        team_qs = Team.objects.filter(is_active=True)
        if getattr(user, 'organization', None):
            team_qs = team_qs.filter(organization=user.organization)
        team = team_qs.first()

    # Team members query
    members_qs = User.objects.filter(is_active=True)
    if team and User.objects.filter(is_active=True, team=team).exists():
        members_qs = members_qs.filter(team=team)
    elif getattr(user, 'organization', None) and User.objects.filter(is_active=True, organization=user.organization).exists():
        members_qs = members_qs.filter(organization=user.organization)

    # Filter telecallers if specific telecaller users exist, otherwise exclude superusers
    if hasattr(User, 'user_type') and User.objects.filter(user_type__icontains='telecaller').exists():
        tele_filter_qs = members_qs.filter(
            Q(user_type__icontains='telecaller') |
            Q(user_roles__role__name__icontains='telecaller')
        ).distinct()
        if tele_filter_qs.exists():
            members_qs = tele_filter_qs
    else:
        non_super = members_qs.filter(is_superuser=False)
        if non_super.exists():
            members_qs = non_super

    # Exclude admin from member list if desired, keep telecallers
    members_list_data = []
    for idx, member_user in enumerate(members_qs.order_by('first_name', 'id')):
        m_dict = build_single_target_dict(member_user, target_month, start_date, end_date, pipeline_id, rank=idx + 1)
        members_list_data.append(m_dict)

    # Sort members by rank / lead rate descending
    members_list_data.sort(key=lambda x: (x["lead_rate"], x["achieved_leads"]), reverse=True)
    for idx, item in enumerate(members_list_data):
        item["rank"] = idx + 1

    # Team Target Aggregates from adm_team_target or sum of members
    team_target_obj = None
    if team:
        team_target_obj = TeamTarget.objects.filter(
            team=team,
            target_month=target_month
        ).order_by('-id').first()

    member_sum_leads = sum(m["target_leads"] for m in members_list_data)

    has_amount_target = bool(
        team_target_obj and team_target_obj.target_amount and float(team_target_obj.target_amount) > 0
    )
    has_lead_target = bool(
        team_target_obj and team_target_obj.target_admissions and int(team_target_obj.target_admissions) > 0
    )

    team_target_leads = (
        int(team_target_obj.target_admissions)
        if has_lead_target
        else (member_sum_leads if member_sum_leads > 0 else 0)
    )

    team_target_amount = (
        float(team_target_obj.target_amount)
        if has_amount_target
        else 0.0
    )

    team_achieved_leads = sum(m["achieved_leads"] for m in members_list_data)
    team_achieved_amount = round(sum(m["achieved_amount"] for m in members_list_data), 2)

    team_balance_leads = max(0, team_target_leads - team_achieved_leads)
    team_balance_amount = max(0.0, round(team_target_amount - team_achieved_amount, 2)) if has_amount_target else 0.0

    team_lead_rate = round((team_achieved_leads / team_target_leads) * 100) if team_target_leads > 0 else 0
    team_amount_rate = round((team_achieved_amount / team_target_amount) * 100) if (has_amount_target and team_target_amount > 0) else 0
    team_overall_rate = round((team_lead_rate + team_amount_rate) / 2) if has_amount_target else team_lead_rate

    team_target_data = {
        "team_id": team.id if team else 0,
        "team_name": team.name if team else "All Telecallers",
        "has_amount_target": has_amount_target,
        "has_lead_target": has_lead_target,
        "target_leads": team_target_leads,
        "achieved_leads": team_achieved_leads,
        "balance_leads": team_balance_leads,
        "lead_rate": team_lead_rate,
        "target_amount": team_target_amount,
        "achieved_amount": team_achieved_amount,
        "balance_amount": team_balance_amount,
        "amount_rate": team_amount_rate,
        "overall_rate": team_overall_rate,
        "total_members": len(members_list_data),
        "on_track_count": len([m for m in members_list_data if m["lead_rate"] >= 70]),
        "needs_push_count": len([m for m in members_list_data if m["lead_rate"] < 70]),
    }

    return {
        "role": role_type,
        "is_executive": is_executive,
        "target_month": target_month.strftime("%Y-%m"),
        "date_range": {
            "start_date": str(start_date),
            "end_date": str(end_date),
        },
        "team_target": team_target_data,
        "members": members_list_data,
        "my_target": my_target,
    }



def nudge_telecaller_target_service(data, sender_user=None):
    """
    Action service for Team Leads or Admins to nudge a telecaller on target progress.
    Creates an alert notification for the telecaller.
    """
    telecaller_id = data.get('telecaller_id')
    custom_msg = data.get('message')

    telecaller = User.objects.filter(id=telecaller_id).first()
    if not telecaller:
        return {'success': False, 'message': 'Telecaller not found'}

    sender_name = getattr(sender_user, 'first_name', '') or getattr(sender_user, 'username', 'Team Lead')
    msg_body = custom_msg or f"{sender_name} sent you a target reminder. Keep pushing towards your target!"

    Notification.objects.create(
        user=telecaller,
        organization=getattr(sender_user, 'organization', None) or getattr(telecaller, 'organization', None),
        title="Target Progress Nudge",
        message=msg_body,
        notification_type="target_nudge",
        created_by=getattr(sender_user, 'username', 'System'),
        updated_by=getattr(sender_user, 'username', 'System'),
        is_read=False
    )

    return {
        'success': True,
        'message': f"Target nudge successfully sent to {telecaller.first_name or telecaller.username}."
    }
