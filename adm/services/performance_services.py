import datetime

import calendar

import openpyxl

from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

from openpyxl.utils import get_column_letter

from django.db.models import Q, Count, Avg, Sum

from django.utils import timezone

from django.http import HttpResponse

from rest_framework.exceptions import APIException, ValidationError



from telecalling.models import User, Lead, CallDetails, FollowUp, PaymentInfo

from adm.models import Team, TeamTarget, IndividualTarget

from utils.constants import UITheme



def get_date_range(date_filter_type, from_date_str=None, to_date_str=None):

    

    today = timezone.now().date()

    

    dft = str(date_filter_type or '').lower().strip()

    

    if dft == 'today':

        return today, today

    elif dft == 'yesterday':

        yesterday = today - datetime.timedelta(days=1)

        return yesterday, yesterday

    elif dft in ['last_7_days', 'last 7 days', 'weekly', 'this_week', 'week']:

        return today - datetime.timedelta(days=7), today

    elif dft in ['last_30_days', 'last 30 days', '30 days']:

        return today - datetime.timedelta(days=30), today

    elif dft in ['this_month', 'this month', 'monthly', 'month']:

        start_month = today.replace(day=1)

        return start_month, today

    elif dft == 'custom' and from_date_str and to_date_str:

        try:

            s_date = datetime.datetime.strptime(from_date_str[:10], '%Y-%m-%d').date()

            e_date = datetime.datetime.strptime(to_date_str[:10], '%Y-%m-%d').date()

            return s_date, e_date

        except Exception:

            pass

            

    # Default to current month

    return today.replace(day=1), today





def check_is_telecaller(user):

    """

    Returns True if user is strictly a Telecaller (and not Admin/Manager/Superuser)

    """

    if not user or not getattr(user, 'is_authenticated', False):

        return False

        

    if getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False):

        return False



    if hasattr(user, 'user_roles'):

        role_names = [str(r).lower() for r in user.user_roles.values_list('role__name', flat=True) if r]

        role_codes = [str(c).upper() for c in user.user_roles.values_list('role__code', flat=True) if c]

        if any(r in ['admin', 'superadmin', 'developer', 'manager', 'team lead'] for r in role_names) or any(c in ['ADMIN', 'SUPERADMIN', 'DEV', 'MGR'] for c in role_codes):

            return False

        if any('telecaller' in r for r in role_names) or any('TELE' in c for c in role_codes):

            return True



    if getattr(user, 'user_type', None) and 'telecaller' in str(user.user_type).lower():

        return True



    return False





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

        

        # Filter for actual telecalling agents (Executives / Team Leads) - exclude Admin, Manager, Dev, Superuser
        users_qs = users_qs.exclude(
            Q(is_superuser=True) |
            Q(user_roles__role__code__in=['ADM', 'MGR', 'AMGR', 'DEV']) |
            Q(user_roles__role__name__in=['admin', 'manager', 'asst_manager', 'developer', 'superadmin']) |
            Q(user_type__in=['admin', 'Admin', 'manager', 'Manager', 'asst manager', 'asst_manager', 'developer'])
        ).distinct()



        # 🔒 Check if current logged-in user is a Telecaller

        is_telecaller = check_is_telecaller(user)



        if is_telecaller:

            # 🛡️ Telecaller Privacy: Strictly restrict to own user ID

            users_qs = users_qs.filter(id=user.id)

        else:

            # 👔 Admin / Manager Filtering

            telecaller_id = data.get('telecaller_id')

            if telecaller_id and int(telecaller_id) > 0:

                users_qs = users_qs.filter(id=int(telecaller_id))

            elif team_id and int(team_id) > 0:

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

        seen_user_ids = set()

        deduped_users = []

        for u in users_qs.select_related('team'):

            if u.id not in seen_user_ids:

                seen_user_ids.add(u.id)

                deduped_users.append(u)

        users_list = deduped_users

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



            # 6. Admissions (Won Stage) & Weighted Payment Credit in Date Range (Excluding loss)

            won_stage_filter = (
                Q(pipeline_stage__stage_type__in=['closed_won', 'terminal_joined']) |
                Q(pipeline_stage__order_no=98) |
                Q(pipeline_stage__name__iexact="won")
            )

            won_leads = Lead.objects.filter(

                assigned_to=user, 

                updated_at__date__range=[start_date, end_date]

            ).filter(won_stage_filter)

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



            # 9. Intermediate Metrics for 5-Sector Scorecard

            # Avg Calling Duration

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



            # Dynamic Response Time Calculation (Enquiry to First Call)

            call_resp_qs = CallDetails.objects.filter(

                telecaller=user,

                created_at__date__range=[start_date, end_date],

                lead__enquiry_date__isnull=False

            ).select_related('lead')[:30]



            resp_times = []

            for c in call_resp_qs:

                if c.lead and c.lead.enquiry_date:

                    try:

                        c_dt = c.created_at

                        l_dt = c.lead.enquiry_date

                        if timezone.is_aware(c_dt) and timezone.is_naive(l_dt):

                            l_dt = timezone.make_aware(l_dt)

                        elif timezone.is_naive(c_dt) and timezone.is_aware(l_dt):

                            c_dt = timezone.make_aware(c_dt)

                        diff_sec = max(0, (c_dt - l_dt).total_seconds())

                        resp_times.append(diff_sec)

                    except Exception:

                        pass



            avg_resp_seconds = int(sum(resp_times) / len(resp_times)) if resp_times else 0

            if avg_resp_seconds > 0:

                resp_mins = avg_resp_seconds // 60

                resp_secs = avg_resp_seconds % 60

                dyn_resp_time = f"{resp_mins}m {resp_secs}s"

            else:

                dyn_resp_time = "< 15m"



            # 10. Pure 5-Sector Mathematical Performance Score Calculations (Scale 0-20 each, Total 100 Pts)

            # Sector 1: Conversion Rate (Max 20 Pts)

            conversion_score_val = min(20.0, round((conv_rate_val / 20.0) * 20.0, 1)) if conv_rate_val > 0 else 0.0



            # Sector 2: Admissions Target (Max 20 Pts)

            target_lead_score_val = min(20.0, round((admissions / target_admissions * 20.0), 1)) if target_admissions > 0 else (20.0 if admissions > 0 else 0.0)



            # Sector 3: Revenue / Calls Target (Max 20 Pts)

            target_amount_score_val = min(20.0, round((calls_made / target_calls * 20.0), 1)) if target_calls > 0 else (20.0 if calls_made > 0 else 10.0)



            # Sector 4: Follow-up Discipline (Max 20 Pts)

            if total_fups_count > 0:

                followup_discipline_score_val = min(20.0, round((followups_done / total_fups_count) * 20.0, 1))

            elif leads_assigned > 0 or calls_made > 0 or admissions > 0:

                followup_discipline_score_val = 20.0 # Full score if active telecaller has zero pending followups

            else:

                followup_discipline_score_val = 0.0 # Zero activity telecaller gets 0



            # Sector 5: Speed Score (10 AM - 7 PM) (Max 20 Pts)

            speed_score_val = 20.0 if (0 < avg_resp_seconds <= 900) else (15.0 if avg_resp_seconds <= 1800 else 12.0)



            # Unified Overall Performance Score (Sum of 5 Sectors = Max 100 Pts)

            total_score_val = (

                conversion_score_val + 

                target_lead_score_val + 

                target_amount_score_val + 

                followup_discipline_score_val + 

                speed_score_val

            )

            performance_score = min(100, round(total_score_val))



            # Rating Badges (Purely derived from the 5-sector unified total)

            if performance_score >= 70:

                rating_label = "Good"

                rating_badge_color = UITheme.RATING_GOOD_BG # Green

            elif performance_score >= 45:

                rating_label = "Average"

                rating_badge_color = UITheme.RATING_AVERAGE_BG # Yellow

            else:

                rating_label = "Needs Improvement"

                rating_badge_color = UITheme.RATING_NEEDS_IMP_BG # Red



            # Special Overachiever Badges

            special_badge = None

            if full_payments_count > 0 and admissions > 0 and full_payments_count >= round(admissions * 0.75):

                special_badge = f"Full Payment Converter ({full_payments_count}/{admissions} Full Payments)"

            elif admissions > target_admissions and calls_made > target_calls and pending_followups == 0:

                adm_pct_val = round((admissions / target_admissions) * 100) if target_admissions > 0 else 100

                special_badge = f"Triple Crown MVP ({adm_pct_val}% Target)"

            elif admissions > target_admissions:

                adm_pct_val = round((admissions / target_admissions) * 100) if target_admissions > 0 else 100

                special_badge = f"Star Performer ({adm_pct_val}% Target)"

            elif calls_made > target_calls:

                c_pct = round((calls_made / target_calls) * 100) if target_calls > 0 else 100

                special_badge = f"Call Champion ({c_pct}% Calls Target)"

            elif pending_followups == 0 and followups_done > 0:

                special_badge = "100% Follow-up Discipline"



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

                "avg_calling_duration": avg_calling_duration,

                "avg_response_time": dyn_resp_time,

                "conversion_score_val": conversion_score_val,

                "target_lead_score_val": target_lead_score_val,

                "target_amount_score_val": target_amount_score_val,

                "target_amount": target_calls,

                "achieved_amount": calls_made,

                "followup_discipline_score_val": followup_discipline_score_val,

                "speed_score_val": speed_score_val

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

                "avg_response_time": rank1.get("avg_response_time", "< 15m"),

                "highlights": [

                    { "type": "highest_conversion", "title": "Highest Conversion Rate", "value": f"{rank1['conversion_rate']} conversion" },

                    { "type": "most_admissions", "title": "Most Admissions", "value": f"{rank1['admissions']} admissions this month" },

                    { "type": "best_followup", "title": "Best Follow-Up Discipline", "value": f"{rank1['followup_completion_rate']} follow-up completion" },

                    { "type": "fastest_response", "title": "Fastest Response Time", "value": f"Avg {rank1.get('avg_response_time', '< 15m')}" }

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



        # 🛡️ TELECALLER VIEW: Return Clean, Precise Single-User Dashboard

        if is_telecaller:

            t = telecaller_list[0] if telecaller_list else None

            if not t:

                return {

                    "is_telecaller": True,

                    "telecaller_info": None,

                    "overall_score": None,

                    "sectors": [],

                    "work_metrics": None,

                    "message": "No performance data found for this period."

                }



            return {

                "is_telecaller": True,

                "telecaller_info": {

                    "id": t.get("telecaller_id"),

                    "name": t.get("telecaller_name"),

                    "team": t.get("team_name"),

                    "team_badge_color": t.get("team_badge_color")

                },

                "overall_score": {

                    "total_score": t.get("performance_score", 0),

                    "rating": t.get("rating_label", ""),

                    "rating_badge_color": t.get("rating_badge_color", ""),

                    "special_badge": t.get("special_badge")

                },

                "sectors": [

                    {

                        "sector_id": 1,

                        "name": "Conversion Rate",

                        "weightage": 20,

                        "score_earned": t.get("conversion_score_val", 0.0),

                        "conversion_rate": t.get("conversion_rate", "0.0%"),

                        "status": "Target Achieved" if (t.get("conversion_score_val") or 0.0) >= 20.0 else "In Progress"

                    },

                    {

                        "sector_id": 2,

                        "name": "Admissions Target",

                        "weightage": 20,

                        "score_earned": t.get("target_lead_score_val", 0.0),

                        "target": t.get("target_admissions", 0),

                        "achieved": t.get("admissions", 0),

                        "status": "Target Exceeded" if (t.get("admissions") or 0) >= (t.get("target_admissions") or 0) and (t.get("target_admissions") or 0) > 0 else "Pending"

                    },

                    {

                        "sector_id": 3,

                        "name": "Revenue / Amount Target",

                        "weightage": 20,

                        "score_earned": t.get("target_amount_score_val", 0.0),

                        "target_amount": t.get("target_amount", 0),

                        "achieved_amount": t.get("achieved_amount", 0),

                        "status": "Target Exceeded" if (t.get("achieved_amount") or 0) >= (t.get("target_amount") or 0) and (t.get("target_amount") or 0) > 0 else "Pending"

                    },

                    {

                        "sector_id": 4,

                        "name": "Follow-Up Discipline",

                        "weightage": 20,

                        "score_earned": t.get("followup_discipline_score_val", 0.0),

                        "completed_followups": t.get("followups_done", 0),

                        "pending_followups": t.get("pending_followups", 0),

                        "completion_rate": t.get("followup_completion_rate", "100%"),

                        "status": "Clean" if (t.get("pending_followups") or 0) == 0 else f"{t.get('pending_followups', 0)} Pending"

                    },

                    {

                        "sector_id": 5,

                        "name": "Speed Score (10 AM - 7 PM)",

                        "weightage": 20,

                        "score_earned": t.get("speed_score_val", 0.0),

                        "avg_response_time": t.get("avg_response_time", "< 15m"),

                        "status": "Fast Responder" if (t.get("speed_score_val") or 0.0) >= 15.0 else "Average"

                    }

                ],

                "work_metrics": {

                    "leads_assigned": t.get("leads_assigned", 0),

                    "calls_made": t.get("calls_made", 0),

                    "target_calls": t.get("target_calls", 0),

                    "pending_followups": t.get("pending_followups", 0),

                    "admissions": t.get("admissions", 0),

                    "avg_calling_duration": t.get("avg_calling_duration", "00:00")

                }

            }



        # 👔 ADMIN / MANAGER VIEW: Return Full Admin Scaffolding

        return {

            "is_telecaller": False,

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

    except Exception as e:

        raise APIException(str(e))





def assign_users_to_team_admin(data, admin_user=None):

    team_id = data.get('team_id')

    telecaller_ids = data.get('telecaller_ids') or data.get('user_ids') or []



    if not team_id:

        raise ValidationError("team_id is required.")

    if not telecaller_ids or not isinstance(telecaller_ids, list):

        raise ValidationError("telecaller_ids array is required.")



    team = Team.objects.filter(id=team_id).first()

    if not team:

        raise ValidationError(f"Team with ID {team_id} not found.")



    updated_count = User.objects.filter(id__in=telecaller_ids).update(team=team)



    return {

        "team_id": team.id,

        "team_name": team.name,

        "assigned_count": updated_count,

        "message": f"{updated_count} telecaller(s) assigned to team '{team.name}' successfully!"

    }





def update_telecaller_target_admin(data, admin_user=None):

    telecaller_id = data.get('telecaller_id') or data.get('user_id')

    target_admissions = data.get('target_admissions') or data.get('target_count') or 0

    target_calls = data.get('target_calls', 0)

    target_month_str = data.get('target_month') or data.get('month')



    if not telecaller_id:

        raise ValidationError("telecaller_id is required.")



    telecaller = User.objects.filter(id=telecaller_id).first()

    if not telecaller:

        raise ValidationError(f"Telecaller with ID {telecaller_id} not found.")



    if target_month_str:

        try:

            target_month = datetime.datetime.strptime(str(target_month_str)[:10], '%Y-%m-%d').date().replace(day=1)

        except Exception:

            target_month = timezone.now().date().replace(day=1)

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

        "telecaller_id": telecaller.id,

        "telecaller_name": t_name,

        "target_month": target_month.strftime('%Y-%m-%d'),

        "target_admissions": target_obj.target_admissions,

        "target_calls": target_obj.target_calls,

        "message": f"Targets updated successfully for '{t_name}' ({target_month.strftime('%B %Y')})!"

    }





def parse_month_or_dates(month_str, from_date_str=None, to_date_str=None):

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
            Q(pipeline_stage__stage_type__in=['closed_won', 'terminal_joined']) |
            Q(pipeline_stage__order_no=98) |
            Q(pipeline_stage__name__iexact="won")
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

            t_status = "-" if t_target == 0 else ("On Track" if (t_achieved >= t_target or (t_achieved / t_target) >= 0.7) else "Low")

            color = t.badge_color or fallback_colors[idx % len(fallback_colors)]



            t_explicit_sum = sum(team_member_target_map.get((u.id, t.id), 0) for u in t_members)
            has_explicit_allocations = t_explicit_sum > 0

            members_list = []

            for idx, u in enumerate(t_members):
                u_achieved = user_achieved_map.get(u.id, 0)

                if has_explicit_allocations:
                    raw_u_target = team_member_target_map.get((u.id, t.id), 0)
                    u_target = round(raw_u_target * proportional_ratio) if is_custom_range else raw_u_target
                    u_balance = max(0, u_target - u_achieved)
                    u_status = "-" if u_target == 0 else ("On Track" if (u_achieved >= u_target or (u_achieved / u_target) >= 0.7) else "Low")
                else:
                    # When not distributed to individual members: Target, Balance & Status are "-"
                    u_target = "-"
                    u_balance = "-"
                    u_status = "-"

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

            members_target_sum = sum(m['target'] for m in members_list if isinstance(m.get('target'), (int, float)))
            allocation_diff = (members_target_sum - t_target) if has_explicit_allocations else 0
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



        for t in team_targets:
            t_tgt = t.get("target") or 0
            if isinstance(t_tgt, (int, float)) and t_tgt > 0:
                donut_pct = f"{round((t['achieved'] / t_tgt) * 100)}%"
            else:
                donut_pct = "0%"

            donut_chart.append({
                "name": t["team"],
                "value": t["achieved"],
                "percentage": donut_pct,
                "color": t["color"]
            })



        individual_targets = []

        # Individual targets for ALL telecallers (including both Team Member targets & Separate Individual targets)
        for u in all_users:
            u_achieved = user_achieved_map.get(u.id, 0)

            # Check if user has a Team Member target OR a Standalone Individual target
            raw_u_target = None
            if u.team_id and (u.id, u.team_id) in team_member_target_map:
                raw_u_target = team_member_target_map[(u.id, u.team_id)]
            elif u.id in standalone_ind_target_map:
                raw_u_target = standalone_ind_target_map[u.id]

            if raw_u_target is not None and raw_u_target > 0:
                u_target = round(raw_u_target * proportional_ratio) if is_custom_range else raw_u_target
                u_balance = max(0, u_target - u_achieved)
                u_status = "-" if u_target == 0 else ("On Track" if (u_achieved >= u_target or (u_target > 0 and (u_achieved / u_target) >= 0.7)) else "Low")
            else:
                u_target = "-"
                u_balance = "-"
                u_status = "-"

            fname = (u.first_name or "").strip()
            lname = (u.last_name or "").strip()
            u_name = f"{fname} {lname}".strip() or u.username
            team_name = u.team.name if getattr(u, 'team', None) else "-"

            individual_targets.append({
                "id": u.id,
                "user_id": u.id,
                "employee": u_name,
                "team": team_name,
                "team_id": u.team_id,
                "target": u_target,
                "achieved": u_achieved,
                "balance": u_balance,
                "status": u_status
            })

        # Team Summary
        team_total_target = sum(t['target'] for t in team_targets if isinstance(t.get('target'), (int, float)))
        team_achieved = sum(t['achieved'] for t in team_targets if isinstance(t.get('achieved'), (int, float)))
        team_remaining = max(0, team_total_target - team_achieved)
        team_ach_rate = f"{round((team_achieved / team_total_target) * 100)}%" if team_total_target > 0 else "0%"

        team_summary = {
            "total_target": team_total_target,
            "achieved": team_achieved,
            "remaining": team_remaining,
            "achievement_rate": team_ach_rate
        }

        # Individual Summary (Aggregates both Team Member targets & Separate Individual targets)
        ind_total_target = sum(i['target'] for i in individual_targets if isinstance(i.get('target'), (int, float)))
        ind_achieved = sum(i['achieved'] for i in individual_targets if isinstance(i.get('achieved'), (int, float)))
        ind_remaining = max(0, ind_total_target - ind_achieved)
        ind_ach_rate = f"{round((ind_achieved / ind_total_target) * 100)}%" if ind_total_target > 0 else "0%"

        individual_summary = {
            "total_target": ind_total_target,
            "achieved": ind_achieved,
            "remaining": ind_remaining,
            "achievement_rate": ind_ach_rate
        }


        return {

            "team_summary": team_summary,

            "individual_summary": individual_summary,

            "summary": team_summary,

            "bar_chart": bar_chart,

            "donut_chart": donut_chart,

            "team_targets": team_targets,

            "individual_targets": individual_targets

        }

    except Exception as e:

        raise APIException(str(e))





def fetch_target_dropdowns_admin_service(user=None, month=None):
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

        # Parse target_month to filter out already-targeted teams & employees
        target_month = None
        if month:
            try:
                target_month, _, _, _ = parse_month_or_dates(month)
            except Exception:
                target_month = None
        if not target_month:
            target_month = timezone.now().date().replace(day=1)

        existing_targeted_team_ids = set(
            TeamTarget.objects.filter(team__in=teams_qs, target_month=target_month)
            .values_list('team_id', flat=True)
        )
        existing_targeted_user_ids = set(
            IndividualTarget.objects.filter(telecaller__in=users_qs, target_month=target_month)
            .values_list('telecaller_id', flat=True)
        )

        teams_data = []
        for t in teams_qs:
            # Rule: Once target is set for that month, do NOT show in dropdown again
            if t.id in existing_targeted_team_ids:
                continue

            t_mems = [
                {
                    "id": u.id,
                    "employee_id": u.employee_id or f"EMP{u.id:02d}",
                    "name": f"{(u.first_name or '').strip()} {(u.last_name or '').strip()}".strip() or u.username,
                    "team": t.name,
                    "team_name": t.name
                }
                for u in users_qs if u.team_id == t.id
            ]
            teams_data.append({
                "id": t.id,
                "value": t.id,
                "name": t.name,
                "label": t.name,
                "has_target_set": False,
                "members": t_mems,
                "employees": t_mems
            })

        employees_data = []
        for u in users_qs:
            # Rule: Team members should NOT be shown in individual target dropdown
            if u.team_id is not None:
                continue

            # Rule: Once target is set for that month, do NOT show in dropdown again
            if u.id in existing_targeted_user_ids:
                continue

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
                "emp_id": emp_id,
                "team": "",
                "team_name": "",
                "team_id": None
            })

        return {
            "teams": teams_data,
            "employees": employees_data
        }
    except Exception as e:
        raise APIException(str(e))


def set_monthly_target_admin_service(data, admin_user=None):

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

    created_at_str = timezone.localtime(timezone.now()).strftime("%d-%m-%Y %I:%M %p")



    is_employee_target = (target_for.lower() in ['employee', 'individual']) or (employee_id and target_for.lower() != 'team')



    if not is_employee_target and (target_for.lower() == 'team' or (team_id and not employee_id) or team_name_in):

        target_team = None

        if team_id:

            target_team = Team.objects.filter(id=team_id).first()

        elif team_name_in:

            target_team = Team.objects.filter(name__iexact=str(team_name_in).strip()).first()



        if not target_team:

            raise ValidationError("Team not found.")



        target_org = getattr(target_team, 'organization', None) or getattr(admin_user, 'organization', None)

        existing_tt = TeamTarget.objects.filter(team=target_team, target_month=target_month)
        if existing_tt.exists():
            target_obj = existing_tt.first()
            target_obj.target_admissions = lead_target
            target_obj.target_amount = amount_target
            target_obj.target_calls = calls_target
            target_obj.organization = target_org
            target_obj.updated_by = user_name
            target_obj.save()
            existing_tt.exclude(id=target_obj.id).delete()
        else:
            target_obj = TeamTarget.objects.create(
                team=target_team,
                target_month=target_month,
                target_admissions=lead_target,
                target_amount=amount_target,
                target_calls=calls_target,
                created_by=user_name,
                updated_by=user_name,
                organization=target_org
            )

        # Process explicit individual allocations if provided, otherwise auto equal-distribute among team members
        if individual_allocations and isinstance(individual_allocations, list) and len(individual_allocations) > 0:
            for alloc in individual_allocations:
                emp_id = alloc.get('employee_id') or alloc.get('id')
                if not emp_id:
                    continue
                m_user = User.objects.filter(id=emp_id).first()
                if m_user:
                    m_target_org = getattr(m_user, 'organization', None) or target_org
                    m_lead = int(alloc.get('lead_target') or alloc.get('target') or 0)
                    m_amt = float(alloc.get('amount_target') or 0.0)
                    m_calls = int(alloc.get('target_calls') or 0)

                    existing_m_target = IndividualTarget.objects.filter(
                        telecaller=m_user,
                        team=target_team,
                        target_month=target_month
                    )
                    if existing_m_target.exists():
                        m_target_obj = existing_m_target.first()
                        m_target_obj.target_admissions = m_lead
                        m_target_obj.target_amount = m_amt
                        m_target_obj.target_calls = m_calls
                        m_target_obj.organization = m_target_org
                        m_target_obj.updated_by = user_name
                        m_target_obj.save()
                        existing_m_target.exclude(id=m_target_obj.id).delete()
                    else:
                        IndividualTarget.objects.create(
                            telecaller=m_user,
                            team=target_team,
                            target_month=target_month,
                            target_admissions=m_lead,
                            target_amount=m_amt,
                            target_calls=m_calls,
                            created_by=user_name,
                            updated_by=user_name,
                            organization=m_target_org
                        )
        else:
            # When individual_allocations is not provided (unselected), do NOT auto equal-distribute!
            # Clear any existing individual targets for this team in this month so stale splits don't remain
            IndividualTarget.objects.filter(
                team=target_team,
                target_month=target_month
            ).delete()

        saved_id = target_obj.id

        saved_name = target_team.name

        saved_color = target_team.badge_color or "#6366F1"

        target_for_clean = "Team"

        created_at_str = timezone.localtime(target_obj.created_at).strftime("%d-%m-%Y %I:%M %p") if target_obj.created_at else created_at_str



    else:

        target_user = None

        if employee_id:

            target_user = User.objects.filter(id=employee_id).first()



        if not target_user:

            raise ValidationError("Employee not found.")



        user_target_org = getattr(target_user, 'organization', None) or getattr(admin_user, 'organization', None)

        existing_ind = IndividualTarget.objects.filter(
            telecaller=target_user,
            team__isnull=True,
            target_month=target_month
        )
        if existing_ind.exists():
            target_obj = existing_ind.first()
            target_obj.target_admissions = lead_target
            target_obj.target_amount = amount_target
            target_obj.target_calls = calls_target
            target_obj.organization = user_target_org
            target_obj.updated_by = user_name
            target_obj.save()
            existing_ind.exclude(id=target_obj.id).delete()
        else:
            target_obj = IndividualTarget.objects.create(
                telecaller=target_user,
                team=None,
                target_month=target_month,
                target_admissions=lead_target,
                target_amount=amount_target,
                target_calls=calls_target,
                created_by=user_name,
                updated_by=user_name,
                organization=user_target_org
            )



        fname = (target_user.first_name or "").strip()

        lname = (target_user.last_name or "").strip()

        saved_name = f"{fname} {lname}".strip() or target_user.username

        saved_id = target_obj.id

        saved_color = target_user.team.badge_color if (target_user.team and target_user.team.badge_color) else "#6366F1"

        target_for_clean = "Employee"

        created_at_str = timezone.localtime(target_obj.created_at).strftime("%d-%m-%Y %I:%M %p") if target_obj.created_at else created_at_str



    month_display = month_str if month_str else target_month.strftime("%B %Y")

    from_date_display = start_date.strftime("%Y-%m-%d") if start_date else None

    to_date_display = end_date.strftime("%Y-%m-%d") if end_date else None



    return {

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

        "created_at": created_at_str,

        "message": "Monthly Target set successfully"

    }

def edit_team_target_distribution_admin_service(data, admin_user=None):
    """
    Edits the distribution of leads among team members for an existing Team Target.
    CORE RULES:
    1. Team Target is LOCKED and CANNOT be modified.
    2. Sum of member targets CANNOT exceed the locked Team Target.
    3. Employees must belong to this specific team.
    """
    if not data:
        data = {}

    team_id = data.get('team_id')
    month_str = data.get('month')
    from_date_str = data.get('from_date')
    to_date_str = data.get('to_date')
    individual_allocations = data.get('individual_allocations', [])

    # 1. Parse Month
    target_month, _, _, _ = parse_month_or_dates(month_str, from_date_str, to_date_str)
    user_name = getattr(admin_user, 'username', 'admin') if admin_user else 'admin'

    # 2. Validate Team
    target_team = Team.objects.filter(id=team_id, is_active=True).first()
    if not target_team:
        raise ValidationError("Team not found or inactive.")

    target_org = getattr(target_team, 'organization', None) or getattr(admin_user, 'organization', None)

    # 3. Check if Team Target exists (Must be set first - LOCKED)
    team_target_obj = TeamTarget.objects.filter(team=target_team, target_month=target_month).first()
    if not team_target_obj:
        raise ValidationError(
            f"Team Target has not been set for '{target_team.name}' for {target_month.strftime('%B %Y')}. "
            "Please set the Team Target first before distributing leads to members."
        )

    locked_team_target = int(team_target_obj.target_admissions or 0)

    # 4. Validate Member Allocations & Calculate Sum
    allocated_sum = 0
    valid_allocations = []

    for alloc in individual_allocations:
        emp_id = alloc.get('employee_id') or alloc.get('id') or alloc.get('user_id')
        lead_target = int(alloc.get('lead_target') or alloc.get('target') or 0)
        amount_target = float(alloc.get('amount_target') or 0.0)
        target_calls = int(alloc.get('target_calls') or 0)

        if not emp_id:
            continue

        # Check if employee exists and is active
        m_user = User.objects.filter(id=emp_id, is_active=True).first()
        if not m_user:
            raise ValidationError(f"Employee with ID {emp_id} not found.")

        # Check if employee actually belongs to this team
        if m_user.team_id != target_team.id:
            raise ValidationError(f"Employee '{m_user.username}' does not belong to team '{target_team.name}'.")

        allocated_sum += lead_target
        valid_allocations.append({
            "user": m_user,
            "lead_target": lead_target,
            "amount_target": amount_target,
            "target_calls": target_calls
        })

    # Rule Check: Sum of members cannot exceed the locked Team Target
    if allocated_sum > locked_team_target:
        raise ValidationError(
            f"Total distributed leads ({allocated_sum}) exceeds the locked Team Target ({locked_team_target}). "
            f"You can allocate at most {locked_team_target} leads."
        )

    # 5. Update or Create IndividualTarget for each member
    updated_members = []
    allocated_user_ids = []

    for item in valid_allocations:
        m_user = item["user"]
        m_lead = item["lead_target"]
        m_amt = item["amount_target"]
        m_calls = item["target_calls"]
        m_target_org = getattr(m_user, 'organization', None) or target_org

        allocated_user_ids.append(m_user.id)

        ind_target_obj, _ = IndividualTarget.objects.update_or_create(
            telecaller=m_user,
            team=target_team,
            target_month=target_month,
            defaults={
                "target_admissions": m_lead,
                "target_amount": m_amt,
                "target_calls": m_calls,
                "organization": m_target_org,
                "updated_by": user_name
            }
        )

        fname = (m_user.first_name or "").strip()
        lname = (m_user.last_name or "").strip()
        u_name = f"{fname} {lname}".strip() or m_user.username

        updated_members.append({
            "employee_id": m_user.id,
            "name": u_name,
            "target": m_lead
        })

    # 6. Any other team member not in the payload gets target cleared/deleted
    IndividualTarget.objects.filter(
        team=target_team,
        target_month=target_month
    ).exclude(telecaller_id__in=allocated_user_ids).delete()

    return {
        "team_id": target_team.id,
        "team_name": target_team.name,
        "target_month": target_month.strftime('%B %Y'),
        "locked_team_target": locked_team_target,
        "total_distributed": allocated_sum,
        "remaining_unallocated": max(0, locked_team_target - allocated_sum),
        "members": updated_members
    }

