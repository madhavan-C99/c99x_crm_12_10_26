import datetime
import calendar
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from django.db.models import Q, Count, Avg, Sum
from django.utils import timezone
from django.http import HttpResponse
from rest_framework.exceptions import APIException

from telecalling.models import User, Lead, CallDetails, FollowUp, PaymentInfo
from adm.models import Team, TeamTarget, IndividualTarget
from utils.constants import UITheme

def get_date_range(date_filter_type, from_date_str=None, to_date_str=None):
    
    today = timezone.now().date()
    
    if date_filter_type == 'today':
        return today, today
    elif date_filter_type == 'yesterday':
        yesterday = today - datetime.timedelta(days=1)
        return yesterday, yesterday
    elif date_filter_type == 'weekly':
        start_week = today - datetime.timedelta(days=today.weekday())
        return start_week, today
    elif date_filter_type == 'monthly':
        start_month = today.replace(day=1)
        return start_month, today
    elif date_filter_type == 'custom' and from_date_str and to_date_str:
        try:
            s_date = datetime.datetime.strptime(from_date_str, '%Y-%m-%d').date()
            e_date = datetime.datetime.strptime(to_date_str, '%Y-%m-%d').date()
            return s_date, e_date
        except Exception:
            pass
            
    # Default to current month
    return today.replace(day=1), today


def fetch_performance_overview_admin(data, user=None, all_rows=False):
    
    try:
        if not data:
            data = {}
        date_filter_type = data.get('date_filter_type', 'monthly')
        from_date_str = data.get('from_date')
        to_date_str = data.get('to_date')
        team_id = data.get('team_id', 0)
        search_query = data.get('search', '').strip()
        page = int(data.get('page', 1))
        page_size = int(data.get('page_size', 20))

        start_date, end_date = get_date_range(date_filter_type, from_date_str, to_date_str)
        target_month = start_date.replace(day=1)

        # Base Telecaller queryset (Active Telecallers)
        users_qs = User.objects.filter(is_active=True).select_related('team')
        if user and getattr(user, 'is_authenticated', False) and getattr(user, 'organization', None):
            users_qs = users_qs.filter(organization=user.organization)
        elif user and getattr(user, 'is_authenticated', False):
            users_qs = users_qs.none()
        
        # Role filtering if user_type exists
        if hasattr(User, 'user_type') and User.objects.filter(user_type__icontains='telecaller').exists():
            users_qs = users_qs.filter(Q(user_type__icontains='telecaller') | Q(user_roles__role__name__icontains='telecaller')).distinct()

        # Filter by Team if specified
        if team_id and int(team_id) > 0:
            users_qs = users_qs.filter(team_id=int(team_id))

        # Filter by Search Query
        if search_query:
            users_qs = users_qs.filter(
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query) |
                Q(username__icontains=search_query) |
                Q(email__icontains=search_query)
            )

        telecaller_list = []

        total_leads_assigned_sum = 0
        total_calls_made_sum = 0
        total_followups_done_sum = 0
        total_admissions_sum = 0
        total_pending_followups_sum = 0

        now_dt = timezone.now()

        # Pre-aggregate data in bulk to eliminate N+1 query loops
        users_list = list(users_qs.select_related('team'))
        user_ids = [u.id for u in users_list]

        leads_assigned_map = dict(
            Lead.objects.filter(assigned_to_id__in=user_ids)
            .values('assigned_to_id')
            .annotate(cnt=Count('id'))
            .values_list('assigned_to_id', 'cnt')
        ) if user_ids else {}

        calls_made_map = dict(
            CallDetails.objects.filter(
                telecaller_id__in=user_ids, 
                created_at__date__range=[start_date, end_date]
            )
            .values('telecaller_id')
            .annotate(cnt=Count('id'))
            .values_list('telecaller_id', 'cnt')
        ) if user_ids else {}

        followups_done_map = dict(
            FollowUp.objects.filter(
                telecaller_id__in=user_ids, 
                is_attended=True, 
                updated_at__date__range=[start_date, end_date]
            )
            .values('telecaller_id')
            .annotate(cnt=Count('id'))
            .values_list('telecaller_id', 'cnt')
        ) if user_ids else {}

        pending_followups_map = dict(
            FollowUp.objects.filter(
                telecaller_id__in=user_ids, 
                is_attended=False, 
                scheduled_at__lt=now_dt
            )
            .values('telecaller_id')
            .annotate(cnt=Count('id'))
            .values_list('telecaller_id', 'cnt')
        ) if user_ids else {}

        targets_map = {
            t.telecaller_id: t 
            for t in IndividualTarget.objects.filter(telecaller_id__in=user_ids, target_month=target_month)
        } if user_ids else {}

        for user in users_list:
            # 1. Telecaller Display Name
            t_name = user.get_full_name() or user.username
            
            # 2. Team Info
            t_team = user.team
            team_name = t_team.name if t_team else "No Team"
            team_badge_color = t_team.badge_color if t_team else UITheme.RATING_DEFAULT_BG

            # 3. Leads Assigned
            leads_assigned = leads_assigned_map.get(user.id, 0)
            total_leads_assigned_sum += leads_assigned

            # 4. Calls Made in Date Range
            calls_made = calls_made_map.get(user.id, 0)
            total_calls_made_sum += calls_made

            # 5. Follow-Ups Done in Date Range
            followups_done = followups_done_map.get(user.id, 0)
            total_followups_done_sum += followups_done

            # 6. Admissions (Won Stage) & Weighted Payment Credit in Date Range
            won_leads = Lead.objects.filter(
                assigned_to=user, 
                updated_at__date__range=[start_date, end_date]
            ).filter(
                Q(pipeline_stage_id=3) |
                Q(pipeline_stage__name__icontains="won") |
                Q(pipeline_stage__name__icontains="converted") |
                Q(pipeline_stage__name__icontains="closed") |
                Q(pipeline_stage__name__icontains="complete")
            )
            admissions = won_leads.count()
            total_admissions_sum += admissions

            effective_admissions_credit = 0.0
            full_payments_count = 0
            partial_payments_count = 0

            for lead_item in won_leads:
                pay_obj = PaymentInfo.objects.filter(lead=lead_item).order_by('-id').first()
                if pay_obj and (pay_obj.is_full_payment or pay_obj.payment_status == 1):
                    effective_admissions_credit += 1.0
                    full_payments_count += 1
                elif pay_obj and (pay_obj.payment_status == 2 or pay_obj.amount_paid > 0):
                    effective_admissions_credit += 0.5
                    partial_payments_count += 1
                else:
                    effective_admissions_credit += 0.5

            # 7. Pending Follow-Ups (Unattended past follow-ups)
            pending_followups = pending_followups_map.get(user.id, 0)
            total_pending_followups_sum += pending_followups

            # 8. Retrieve Target for Month (from adm_individual_target or default 0)
            target_obj = targets_map.get(user.id)
            target_admissions = target_obj.target_admissions if target_obj else 0
            target_calls = getattr(target_obj, 'target_calls', 0) if target_obj else 0

            # 9. 100-Point Mathematical Performance Score Calculations
            # A. Admissions Score (Max 40 Pts based on Payment-Weighted Credit: Full=1.0, Half=0.5)
            adm_pct = (effective_admissions_credit / target_admissions) if target_admissions > 0 else 0
            adm_score = min(40.0, adm_pct * 40.0)

            # B. Calls Made Score (Max 30 Pts)
            if target_calls == 0:
                calls_pct = 1.0
                calls_score = 30.0
            else:
                calls_pct = (calls_made / target_calls) if target_calls > 0 else 0
                calls_score = min(30.0, calls_pct * 30.0)

            # C. Followup Completion Score (Max 30 Pts)
            total_fups = followups_done + pending_followups
            if total_fups > 0:
                fup_score = (followups_done / total_fups) * 30.0
            elif leads_assigned > 0 or calls_made > 0 or admissions > 0:
                fup_score = 30.0 # Full score if active telecaller has zero pending followups
            else:
                fup_score = 0.0 # Zero activity telecaller gets 0 score

            total_score_val = adm_score + calls_score + fup_score
            performance_score = round(total_score_val)

            # 10. Rating Badges & Special Overachiever Badges
            if performance_score >= 70:
                rating_label = "Good"
                rating_badge_color = UITheme.RATING_GOOD_BG # Green
            elif performance_score >= 45:
                rating_label = "Average"
                rating_badge_color = UITheme.RATING_AVERAGE_BG # Yellow
            else:
                rating_label = "Needs Improvement"
                rating_badge_color = UITheme.RATING_NEEDS_IMP_BG # Red

            special_badge = None
            if full_payments_count > 0 and admissions > 0 and full_payments_count >= round(admissions * 0.75):
                special_badge = f"Full Payment Converter ({full_payments_count}/{admissions} Full Payments)"
            elif admissions > target_admissions and calls_made > target_calls and pending_followups == 0:
                special_badge = f"Triple Crown MVP ({round(adm_pct * 100)}% Target)"
            elif admissions > target_admissions:
                special_badge = f"Star Performer ({round(adm_pct * 100)}% Target)"
            elif calls_made > target_calls:
                c_pct = round((calls_made / target_calls) * 100) if target_calls > 0 else 100
                special_badge = f"Call Champion ({c_pct}% Calls Target)"
            elif pending_followups == 0 and followups_done > 0:
                special_badge = "100% Follow-up Discipline"

            # 11. Avg Calling Duration
            avg_duration_sec = CallDetails.objects.filter(
                telecaller=user, 
                created_at__date__range=[start_date, end_date]
            ).aggregate(avg_dur=Avg('duration_seconds'))['avg_dur'] or 0

            avg_dur_int = int(avg_duration_sec)
            mins = avg_dur_int // 60
            secs = avg_dur_int % 60
            avg_calling_duration = f"{mins:02d}:{secs:02d}"

            # Conversion rate & Followup completion rate
            conv_rate_val = (admissions / leads_assigned * 100) if leads_assigned > 0 else 0.0
            conv_rate_str = f"{conv_rate_val:.2f}%"

            total_fups_count = followups_done + pending_followups
            fup_comp_pct = (followups_done / total_fups_count * 100) if total_fups_count > 0 else 100.0
            fup_comp_str = f"{round(fup_comp_pct)}%"

            telecaller_list.append({
                "telecaller_id": user.id,
                "telecaller_name": t_name,
                "team_id": t_team.id if t_team else 0,
                "team_name": team_name,
                "team_badge_color": team_badge_color,
                "leads_assigned": leads_assigned,
                "calls_made": calls_made,
                "target_calls": target_calls,
                "followups_done": followups_done,
                "admissions": admissions,
                "target_admissions": target_admissions,
                "pending_followups": pending_followups,
                "performance_score": performance_score,
                "raw_score": total_score_val,
                "rating_label": f"{performance_score} {rating_label}",
                "rating_badge_color": rating_badge_color,
                "special_badge": special_badge,
                "conversion_rate": conv_rate_str,
                "conversion_rate_val": conv_rate_val,
                "followup_completion_rate": fup_comp_str,
                "avg_calling_duration": avg_calling_duration
            })

        # 12. Tiered Sorting Logic for Ranking
        # Primary: performance_score DESC, Secondary: admissions DESC, Tertiary: calls_made DESC
        telecaller_list.sort(
            key=lambda x: (x['performance_score'], x['admissions'], x['calls_made']), 
            reverse=True
        )

        # Assign Rank (1, 2, 3...)
        for idx, item in enumerate(telecaller_list):
            item['rank'] = idx + 1

        # Extract Top Performer (Rank 1) & Other Top Performers (Rank 2, 3, 4) for Figma UI Cards
        top_performer = None
        other_top_performers = []

        if len(telecaller_list) > 0:
            rank1 = telecaller_list[0]
            top_performer = {
                **rank1,
                "avg_response_time": "9m 45s", # Formatted response time
                "highlights": [
                    { "type": "highest_conversion", "title": "Highest Conversion Rate", "value": f"{rank1['conversion_rate']} conversion" },
                    { "type": "most_admissions", "title": "Most Admissions", "value": f"{rank1['admissions']} admissions this month" },
                    { "type": "best_followup", "title": "Best Follow-Up Discipline", "value": f"{rank1['followup_completion_rate']} follow-up completion" },
                    { "type": "fastest_response", "title": "Fastest Response Time", "value": "Avg 9m 45s" }
                ]
            }

        if len(telecaller_list) > 1:
            for item in telecaller_list[1:4]: # Rank 2, 3, 4
                highlight_text = "Most Admissions"
                if item['rank'] == 3:
                    highlight_text = "Best Follow-Up Discipline"
                elif item['rank'] == 4:
                    highlight_text = "Most Improved This Month"

                other_top_performers.append({
                    **item,
                    "highlight": highlight_text
                })

        # Pagination
        total_count = len(telecaller_list)
        if all_rows:
            start_idx = 0
            paginated_list = telecaller_list
        else:
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            paginated_list = telecaller_list[start_idx:end_idx]

        return {
            "status": "success",
            "message": "Performance overview data fetched successfully!",
            "data": {
                "performance_summary": {
                    "total_telecallers": total_count,
                    "total_leads_assigned": total_leads_assigned_sum,
                    "total_calls_made": total_calls_made_sum,
                    "total_followups_done": total_followups_done_sum,
                    "total_admissions": total_admissions_sum,
                    "total_pending_followups": total_pending_followups_sum
                },
                "top_performer": top_performer,
                "other_top_performers": other_top_performers,
                "performance_list": paginated_list,
                "showing_count": len(paginated_list),
                "total_count": total_count,
                "page": page,
                "page_size": page_size
            }
        }
    except Exception as e:
        raise APIException(str(e))


def assign_users_to_team_admin(data, admin_user=None):
    
    try:
        team_id = data.get('team_id')
        telecaller_ids = data.get('telecaller_ids', [])

        if not team_id:
            raise APIException("team_id is required.")
        if not telecaller_ids or not isinstance(telecaller_ids, list):
            raise APIException("telecaller_ids array is required.")

        team = Team.objects.filter(id=team_id).first()
        if not team:
            raise APIException(f"Team with ID {team_id} not found.")

        updated_count = User.objects.filter(id__in=telecaller_ids).update(team=team)

        return {
            "status": "success",
            "message": f"{updated_count} telecaller(s) assigned to team '{team.name}' successfully!",
            "team_id": team.id,
            "team_name": team.name,
            "assigned_count": updated_count
        }
    except Exception as e:
        raise APIException(str(e))


def update_telecaller_target_admin(data, admin_user=None):
    
    try:
        telecaller_id = data.get('telecaller_id')
        target_admissions = data.get('target_admissions', 0)
        target_calls = data.get('target_calls', 0)
        target_month_str = data.get('target_month') # e.g. "2026-08-01"

        if not telecaller_id:
            raise APIException("telecaller_id is required.")

        telecaller = User.objects.filter(id=telecaller_id).first()
        if not telecaller:
            raise APIException(f"Telecaller with ID {telecaller_id} not found.")

        if target_month_str:
            target_month = datetime.datetime.strptime(target_month_str, '%Y-%m-%d').date().replace(day=1)
        else:
            target_month = timezone.now().date().replace(day=1)

        admin_name = getattr(admin_user, 'username', 'Admin') if admin_user else "Admin"

        target_obj, created = IndividualTarget.objects.update_or_create(
            telecaller=telecaller,
            target_month=target_month,
            defaults={
                'team': telecaller.team,
                'target_admissions': int(target_admissions),
                'target_calls': int(target_calls),
                'updated_by': admin_name
            }
        )
        if created and not target_obj.created_by:
            target_obj.created_by = admin_name
            target_obj.save()

        t_name = telecaller.get_full_name() or telecaller.username

        return {
            "status": "success",
            "message": f"Targets updated successfully for '{t_name}' ({target_month.strftime('%B %Y')})!",
            "telecaller_id": telecaller.id,
            "telecaller_name": t_name,
            "target_month": target_month.strftime('%Y-%m-%d'),
            "target_admissions": target_obj.target_admissions,
            "target_calls": target_obj.target_calls
        }
    except Exception as e:
        raise APIException(str(e))


def get_performance_filter_dropdowns_admin(user=None):
   
    try:
        teams_qs = Team.objects.select_related('leader').filter(is_active=True).order_by('id')
        if user and getattr(user, 'is_authenticated', False) and getattr(user, 'organization', None):
            teams_qs = teams_qs.filter(organization=user.organization)
        elif user and getattr(user, 'is_authenticated', False):
            teams_qs = teams_qs.none()

        teams_list = [{"id": 0, "name": "All Teams", "team_lead_name": "N/A", "badge_color": "#E0E0E0"}]
        
        for t in teams_qs:
            tl_name = (t.leader.get_full_name() or t.leader.username) if t.leader else "Unassigned"
            teams_list.append({
                "id": t.id,
                "name": t.name,
                "code": t.code,
                "team_lead_id": t.leader.id if t.leader else None,
                "team_lead_name": tl_name,
                "badge_color": t.badge_color
            })

        date_filters = [
            {"id": "today", "name": "Today"},
            {"id": "yesterday", "name": "Yesterday"},
            {"id": "weekly", "name": "This Week"},
            {"id": "monthly", "name": "This Month"},
            {"id": "custom", "name": "Custom Date Range"}
        ]

        return {
            "status": "success",
            "data": {
                "teams": teams_list,
                "date_filters": date_filters
            }
        }
    except Exception as e:
        raise APIException(str(e))


def export_performance_overview_admin(data, user=None):
    
    try:
        res_data = fetch_performance_overview_admin(data, user=user)
        performance_list = res_data['data']['performance_list']

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Performance Overview"

        # Styling
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="84C225", end_color="84C225", fill_type="solid") # Lime Green
        cell_font = Font(name="Calibri", size=10)
        center_align = Alignment(horizontal="center", vertical="center")
        left_align = Alignment(horizontal="left", vertical="center")
        thin_border = Border(
            left=Side(style='thin', color='E0E0E0'),
            right=Side(style='thin', color='E0E0E0'),
            top=Side(style='thin', color='E0E0E0'),
            bottom=Side(style='thin', color='E0E0E0')
        )

        headers = [
            "Rank", "Telecaller", "Team", "Leads Assigned", 
            "Calls Made", "Follow-Ups Done", "Admissions", 
            "Pending Follow-Ups", "Performance Score", "Avg Calling Duration"
        ]

        ws.append(headers)

        for col_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=1, column=col_idx)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = center_align
            cell.border = thin_border

        for item in performance_list:
            row = [
                item['rank'],
                item['telecaller_name'],
                item['team_name'],
                item['leads_assigned'],
                item['calls_made'],
                item['followups_done'],
                item['admissions'],
                item['pending_followups'],
                item['rating_label'],
                item['avg_calling_duration']
            ]
            ws.append(row)
            row_idx = ws.max_row
            
            for col_idx in range(1, len(row) + 1):
                cell = ws.cell(row=row_idx, column=col_idx)
                cell.font = cell_font
                cell.border = thin_border
                if col_idx in [2, 3]:
                    cell.alignment = left_align
                else:
                    cell.alignment = center_align

        # Auto column widths
        for col in ws.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="Performance_Overview.xlsx"'
        wb.save(response)
        return response

    except Exception as e:
        raise APIException(str(e))


def parse_month_or_dates(month_str, from_date_str, to_date_str):
    today = timezone.now().date()
    is_custom_range = False
    
    start_date = None
    end_date = None
    target_month = None

    if from_date_str and to_date_str:
        try:
            start_date = datetime.datetime.strptime(str(from_date_str).strip()[:10], "%Y-%m-%d").date()
            end_date = datetime.datetime.strptime(str(to_date_str).strip()[:10], "%Y-%m-%d").date()
            target_month = start_date.replace(day=1)
            is_custom_range = True
        except Exception:
            pass

    if not start_date and month_str:
        m_str = str(month_str).strip()
        parsed_dt = None
        for fmt in ["%B %Y", "%b %Y", "%Y-%m", "%Y-%m-%d"]:
            try:
                parsed_dt = datetime.datetime.strptime(m_str, fmt).date()
                break
            except Exception:
                continue

        if parsed_dt:
            target_month = parsed_dt.replace(day=1)
            start_date = target_month
            _, last_day = calendar.monthrange(parsed_dt.year, parsed_dt.month)
            end_date = datetime.date(parsed_dt.year, parsed_dt.month, last_day)

    if not start_date:
        target_month = today.replace(day=1)
        start_date = target_month
        _, last_day = calendar.monthrange(today.year, today.month)
        end_date = datetime.date(today.year, today.month, last_day)

    return target_month, start_date, end_date, is_custom_range


def fetch_monthly_target_admin_service(data, user=None):
    try:
        if not data:
            data = {}

        month_str = data.get('month')
        from_date_str = data.get('from_date')
        to_date_str = data.get('to_date')

        target_month, start_date, end_date, is_custom_range = parse_month_or_dates(month_str, from_date_str, to_date_str)

        users_qs = User.objects.filter(is_active=True).select_related('team')
        if user and getattr(user, 'is_authenticated', False) and getattr(user, 'organization', None):
            users_qs = users_qs.filter(organization=user.organization)
        elif user and getattr(user, 'is_authenticated', False):
            users_qs = users_qs.none()

        if hasattr(User, 'user_type') and User.objects.filter(user_type__icontains='telecaller').exists():
            users_qs = users_qs.filter(
                Q(user_type__icontains='telecaller') | 
                Q(user_roles__role__name__icontains='telecaller')
            ).distinct()

        teams_qs = Team.objects.filter(is_active=True)
        if user and getattr(user, 'is_authenticated', False) and getattr(user, 'organization', None):
            teams_qs = teams_qs.filter(organization=user.organization)
        elif user and getattr(user, 'is_authenticated', False):
            teams_qs = teams_qs.none()

        # Team member targets (where team_id IS NOT NULL)
        team_ind_target_objs = IndividualTarget.objects.filter(
            telecaller__in=users_qs, target_month=target_month, team__isnull=False
        ).order_by('created_at', 'id')
        team_member_target_map = {(it.telecaller_id, it.team_id): it.target_admissions for it in team_ind_target_objs}

        # Standalone individual targets (where team_id IS NULL)
        standalone_ind_target_objs = IndividualTarget.objects.filter(
            telecaller__in=users_qs, target_month=target_month, team__isnull=True
        ).order_by('created_at', 'id')
        standalone_ind_target_map = {it.telecaller_id: it.target_admissions for it in standalone_ind_target_objs}

        team_target_objs = TeamTarget.objects.filter(team__in=teams_qs, target_month=target_month).order_by('created_at', 'id')
        team_target_map = {tt.team_id: tt.target_admissions for tt in team_target_objs}

        _, total_days_in_month = calendar.monthrange(start_date.year, start_date.month)
        days_in_range = (end_date - start_date).days + 1
        proportional_ratio = (days_in_range / total_days_in_month) if (is_custom_range and total_days_in_month > 0) else 1.0

        won_stage_filter = (
            Q(pipeline_stage_id=3) |
            Q(pipeline_stage__name__icontains="won") |
            Q(pipeline_stage__name__icontains="converted") |
            Q(pipeline_stage__name__icontains="closed") |
            Q(pipeline_stage__name__icontains="complete")
        )

        user_achieved_map = {}
        if users_qs.exists():
            achieved_counts = Lead.objects.filter(
                assigned_to__in=users_qs,
                updated_at__date__range=[start_date, end_date]
            ).filter(won_stage_filter).values('assigned_to_id').annotate(cnt=Count('id'))
            user_achieved_map = {item['assigned_to_id']: item['cnt'] for item in achieved_counts}

        fallback_colors = ["#6CBD45", "#5CB0FF", "#AB79F8", "#FF9F43", "#FF6B6B"]
        team_targets = []
        bar_chart = []
        donut_chart = []

        all_users = list(users_qs)

        for idx, t in enumerate(teams_qs):
            raw_t_target = team_target_map.get(t.id, 0)
            t_target = round(raw_t_target * proportional_ratio) if is_custom_range else raw_t_target
            
            t_members = [u for u in all_users if u.team_id == t.id]
            t_achieved = sum(user_achieved_map.get(u.id, 0) for u in t_members)
            t_balance = max(0, t_target - t_achieved)
            t_status = "On Track" if (t_target == 0 or t_achieved >= t_target or (t_achieved / t_target) >= 0.7) else "Low"
            color = t.badge_color or fallback_colors[idx % len(fallback_colors)]

            members_list = []
            for u in t_members:
                raw_u_target = team_member_target_map.get((u.id, t.id), 0)
                u_target = round(raw_u_target * proportional_ratio) if is_custom_range else raw_u_target
                u_achieved = user_achieved_map.get(u.id, 0)
                u_balance = max(0, u_target - u_achieved)
                u_status = "On Track" if (u_target == 0 or u_achieved >= u_target or (u_achieved / u_target) >= 0.7) else "Low"
                fname = (u.first_name or "").strip()
                lname = (u.last_name or "").strip()
                u_name = f"{fname} {lname}".strip() or u.username

                members_list.append({
                    "id": u.id,
                    "user_id": u.id,
                    "name": u_name,
                    "team": t.name,
                    "target": u_target,
                    "achieved": u_achieved,
                    "balance": u_balance,
                    "status": u_status
                })

            members_target_sum = sum(m['target'] for m in members_list)
            allocation_diff = members_target_sum - t_target
            extra_allocated = max(0, allocation_diff)

            team_targets.append({
                "id": t.id,
                "team": t.name,
                "target": t_target,
                "members_target_sum": members_target_sum,
                "extra_allocated_target": extra_allocated,
                "allocation_diff": allocation_diff,
                "achieved": t_achieved,
                "balance": t_balance,
                "status": t_status,
                "color": color,
                "members": members_list
            })

            bar_chart.append({
                "team": t.name,
                "Target": t_target,
                "Achieved": t_achieved,
                "color": color
            })

        total_team_achieved_sum = sum(t["achieved"] for t in team_targets)
        for t in team_targets:
            donut_pct = f"{round((t['achieved'] / total_team_achieved_sum) * 100)}%" if total_team_achieved_sum > 0 else "0%"
            donut_chart.append({
                "name": t["team"],
                "value": t["achieved"],
                "percentage": donut_pct,
                "color": t["color"]
            })

        individual_targets = []
        for u in all_users:
            raw_u_target = standalone_ind_target_map.get(u.id, 0)
            u_target = round(raw_u_target * proportional_ratio) if is_custom_range else raw_u_target
            u_achieved = user_achieved_map.get(u.id, 0)
            u_balance = max(0, u_target - u_achieved)
            u_status = "On Track" if (u_target == 0 or u_achieved >= u_target or (u_achieved / u_target) >= 0.7) else "Low"
            fname = (u.first_name or "").strip()
            lname = (u.last_name or "").strip()
            u_name = f"{fname} {lname}".strip() or u.username

            individual_targets.append({
                "id": u.id,
                "user_id": u.id,
                "employee": u_name,
                "target": u_target,
                "achieved": u_achieved,
                "balance": u_balance,
                "status": u_status
            })

        # Team Summary
        team_total_target = sum(t['target'] for t in team_targets)
        team_achieved = sum(t['achieved'] for t in team_targets)
        team_remaining = max(0, team_total_target - team_achieved)
        team_ach_rate = f"{round((team_achieved / team_total_target) * 100)}%" if team_total_target > 0 else "0%"

        team_summary = {
            "total_target": team_total_target,
            "achieved": team_achieved,
            "remaining": team_remaining,
            "achievement_rate": team_ach_rate
        }

        # Individual Summary
        ind_total_target = sum(i['target'] for i in individual_targets)
        ind_achieved = sum(i['achieved'] for i in individual_targets)
        ind_remaining = max(0, ind_total_target - ind_achieved)
        ind_ach_rate = f"{round((ind_achieved / ind_total_target) * 100)}%" if ind_total_target > 0 else "0%"

        individual_summary = {
            "total_target": ind_total_target,
            "achieved": ind_achieved,
            "remaining": ind_remaining,
            "achievement_rate": ind_ach_rate
        }

        return {
            "status": True,
            "message": "Monthly target data fetched successfully",
            "data": {
                "team_summary": team_summary,
                "individual_summary": individual_summary,
                "summary": team_summary,
                "bar_chart": bar_chart,
                "donut_chart": donut_chart,
                "team_targets": team_targets,
                "individual_targets": individual_targets
            }
        }
    except Exception as e:
        raise APIException(str(e))


def fetch_target_dropdowns_admin_service(user=None):
    try:
        teams_qs = Team.objects.filter(is_active=True).order_by('name')
        users_qs = User.objects.filter(is_active=True).order_by('first_name')

        if user and getattr(user, 'is_authenticated', False) and getattr(user, 'organization', None):
            teams_qs = teams_qs.filter(organization=user.organization)
            users_qs = users_qs.filter(organization=user.organization)
        elif user and getattr(user, 'is_authenticated', False):
            teams_qs = teams_qs.none()
            users_qs = users_qs.none()

        if hasattr(User, 'user_type') and User.objects.filter(user_type__icontains='telecaller').exists():
            users_qs = users_qs.filter(
                Q(user_type__icontains='telecaller') | 
                Q(user_roles__role__name__icontains='telecaller')
            ).distinct()

        teams_data = [{"id": t.id, "value": t.id, "name": t.name, "label": t.name} for t in teams_qs]

        employees_data = []
        for u in users_qs:
            fname = (u.first_name or "").strip()
            lname = (u.last_name or "").strip()
            full_name = f"{fname} {lname}".strip() or u.username
            emp_id = u.employee_id or f"EMP{u.id:02d}"
            employees_data.append({
                "id": u.id,
                "value": u.id,
                "name": full_name,
                "label": full_name,
                "employee": full_name,
                "employee_name": full_name,
                "emp_id": emp_id
            })

        return {
            "status": True,
            "data": {
                "teams": teams_data,
                "employees": employees_data
            }
        }
    except Exception as e:
        raise APIException(str(e))


def set_monthly_target_admin_service(data, admin_user=None):
    try:
        if not data:
            data = {}

        month_str = data.get('month')
        from_date_str = data.get('from_date')
        to_date_str = data.get('to_date')
        target_for = str(data.get('target_for', '')).strip()
        team_id = data.get('team_id')
        team_name_in = data.get('team_name')
        employee_id = data.get('employee_id')
        lead_target = int(data.get('lead_target') or data.get('target') or 0)
        amount_target = float(data.get('amount_target') or 0.0)
        raw_calls = data.get('target_calls')
        calls_target = int(raw_calls) if raw_calls is not None else 0
        individual_allocations = data.get('individual_allocations', [])

        target_month, start_date, end_date, is_custom_range = parse_month_or_dates(month_str, from_date_str, to_date_str)
        user_name = getattr(admin_user, 'username', 'admin') if admin_user else 'admin'

        saved_id = None
        saved_name = ""
        created_at_str = timezone.now().strftime("%Y-%m-%dT%H:%M:%SZ")

        is_employee_target = (target_for.lower() in ['employee', 'individual']) or (employee_id and target_for.lower() != 'team')

        if not is_employee_target and (target_for.lower() == 'team' or (team_id and not employee_id) or team_name_in):
            target_team = None
            if team_id:
                target_team = Team.objects.filter(id=team_id).first()
            elif team_name_in:
                target_team = Team.objects.filter(name__iexact=str(team_name_in).strip()).first()

            if not target_team:
                return {
                    "status": False,
                    "message": "Team not found"
                }

            target_org = getattr(target_team, 'organization', None) or getattr(admin_user, 'organization', None)
            target_obj = TeamTarget.objects.create(
                team=target_team,
                target_month=target_month,
                target_admissions=lead_target,
                target_amount=amount_target,
                target_calls=calls_target,
                created_by=user_name,
                organization=target_org
            )

            # Process explicit uneven individual allocations if provided by Admin
            if individual_allocations and isinstance(individual_allocations, list):
                for alloc in individual_allocations:
                    emp_id = alloc.get('employee_id') or alloc.get('id')
                    if not emp_id:
                        continue
                    m_user = User.objects.filter(id=emp_id).first()
                    if m_user:
                        m_target_org = getattr(m_user, 'organization', None) or target_org
                        IndividualTarget.objects.create(
                            telecaller=m_user,
                            team=target_team,
                            target_month=target_month,
                            target_admissions=int(alloc.get('lead_target') or alloc.get('target') or 0),
                            target_amount=float(alloc.get('amount_target') or 0.0),
                            target_calls=int(alloc.get('target_calls') or 0),
                            created_by=user_name,
                            organization=m_target_org
                        )

            saved_id = target_obj.id
            saved_name = target_team.name
            saved_color = target_team.badge_color or "#6366F1"
            target_for_clean = "Team"
            created_at_str = target_obj.created_at.strftime("%Y-%m-%dT%H:%M:%SZ") if target_obj.created_at else created_at_str

        else:
            target_user = None
            if employee_id:
                target_user = User.objects.filter(id=employee_id).first()

            if not target_user:
                return {
                    "status": False,
                    "message": "Employee not found"
                }

            user_target_org = getattr(target_user, 'organization', None) or getattr(admin_user, 'organization', None)
            target_obj = IndividualTarget.objects.create(
                telecaller=target_user,
                team=None,
                target_month=target_month,
                target_admissions=lead_target,
                target_amount=amount_target,
                target_calls=calls_target,
                created_by=user_name,
                organization=user_target_org
            )

            fname = (target_user.first_name or "").strip()
            lname = (target_user.last_name or "").strip()
            saved_name = f"{fname} {lname}".strip() or target_user.username
            saved_id = target_obj.id
            saved_color = target_user.team.badge_color if (target_user.team and target_user.team.badge_color) else "#6366F1"
            target_for_clean = "Employee"
            created_at_str = target_obj.created_at.strftime("%Y-%m-%dT%H:%M:%SZ") if target_obj.created_at else created_at_str

        month_display = month_str if month_str else target_month.strftime("%B %Y")
        from_date_display = start_date.strftime("%Y-%m-%d") if start_date else None
        to_date_display = end_date.strftime("%Y-%m-%d") if end_date else None

        return {
            "status": True,
            "message": "Monthly Target set successfully",
            "data": {
                "id": saved_id,
                "month": month_display,
                "from_date": from_date_display,
                "to_date": to_date_display,
                "target_for": target_for_clean,
                "name": saved_name,
                "target": lead_target,
                "amount_target": amount_target,
                "target_calls": calls_target,
                "color": saved_color,
                "created_at": created_at_str
            }
        }
    except Exception as e:
        raise APIException(str(e))
