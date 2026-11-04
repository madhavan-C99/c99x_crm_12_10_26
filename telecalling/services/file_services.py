import zoneinfo


from django.utils import timezone
from ..models.daily_report_history import DailyReport


from django.contrib.auth import get_user_model

from rest_framework.exceptions import APIException

from adm.services.query_services import exec_raw_sql


from django.utils import timezone


from ..services.dashboard_services import get_user_details

from ..tasks.notification_task import send_lead_assigned_notification






def daily_report(**data):

    try:

        user_id = data.get("id")



        User = get_user_model() 



        tele = User.objects.filter(id=user_id).first()

        if tele is None:

            raise APIException("Telecaller Not Found")



        # 🔥 correct param passing

        report = exec_raw_sql(

            "D_FETCH_DAILY_REPORT_PDF",

            {"id": user_id}

        )

        

        ist = zoneinfo.ZoneInfo("Asia/Kolkata")

        today_ist = timezone.now().astimezone(ist).date()



        latest_report = DailyReport.objects.filter(

            user_id=user_id,

            report_date=today_ist

        ).order_by('id').last()



        return {

            "dashboard_data": report[0] if report else {"dashboard_data": []},

            "manual_data": {

                "tomorrow_conversation": latest_report.total_expected_conversion if latest_report else "",

                "lead_for_tomorrow": latest_report.actual_expected_conversion if latest_report else "",

                "own_message": latest_report.notes_for_manager if latest_report else "",

            }

        }



        # return report[0]



    except Exception as e:

        raise APIException(e)













def submit_daily_report(user, **data):

    try:

        ist = zoneinfo.ZoneInfo("Asia/Kolkata")

        today_ist = timezone.now().astimezone(ist).date()

        json_data = data.get("data", {})



        report, created = DailyReport.objects.update_or_create(

            user=user,

            report_date=today_ist,

            defaults={

                "total_leads": json_data.get("total_leads", 0),

                "new_leads": json_data.get("new_leads", 0),

                "call_spoked": json_data.get("call_spoked", 0),

                "not_respond": json_data.get("not_respond", 0),

                "follow_up": json_data.get("follow_up", 0),

                "pending_follow_up": json_data.get("pending_follow_up", 0),

                "partial_payment": json_data.get("partial_payment", 0),

                "full_payment": json_data.get("full_payment", 0),

                "total_expected_conversion": int(data.get("tomorrow_conversation") or 0),

                "actual_expected_conversion": int(data.get("lead_for_tomorrow") or 0),

                "notes_for_manager": data.get("own_message", ""),

                "is_submitted": True,

                "submitted_at": timezone.now().astimezone(ist),

            }

        )



        return {

            "status": "success",

            "message": "Daily report submitted successfully" if created else "Daily report updated successfully",

            "data": {

                "id": report.id,

                "report_date": str(report.report_date),

                "total_leads": report.total_leads,

                "new_leads": report.new_leads,

                "call_spoked": report.call_spoked,

                "not_respond": report.not_respond,

                "follow_up": report.follow_up,

                "pending_follow_up": report.pending_follow_up,

                "partial_payment": report.partial_payment,

                "full_payment": report.full_payment,

                "tomorrow_conversation": report.total_expected_conversion,

                "lead_for_tomorrow": report.actual_expected_conversion,

                "own_message": report.notes_for_manager,

                "is_submitted": report.is_submitted,

                "submitted_at": report.submitted_at.astimezone(ist).strftime("%Y-%m-%d %H:%M:%S") if report.submitted_at else None,

            },

        }



    except Exception as e:

        raise APIException(str(e))









def download_daily_reports(user, **data):

    """API 2: Download report - Get latest report data for today and return response"""

    try:

        today = timezone.now().date()



        # Get the latest report for today's date for this user

        report = (

            DailyReport.objects

            .filter(user_id=user.id, report_date=today)

            .order_by('created_at')   # or 'id' / 'updated_at' - whichever marks "latest"

            .last()

        )



        if not report:

            raise APIException("Report not found for today")

    

        user_details=get_user_details(user)



        # Prepare response with all data

        response_data = {

            'status': 'success',

            'message': 'Report data retrieved successfully',

            'user_name':user_details["name"],

            'user_role': user_details["role"],

            'data': {

                'id': report.id,

                'report_date': report.report_date,

                'user': user.username,

                'total_leads': report.total_leads,

                'new_leads': report.new_leads,

                'call_spoked': report.call_spoked,

                'not_respond': report.not_respond,

                'follow_up': report.follow_up,

                'pending_follow_up': report.pending_follow_up,

                'partial_payment': report.partial_payment,

                'full_payment': report.full_payment,

                "tomorrow_conversation": report.total_expected_conversion,

                "lead_for_tomorrow": report.actual_expected_conversion,

                "own_message": report.notes_for_manager,

                # 'is_submitted': report.is_submitted,

                # 'submitted_at': report.submitted_at,

                'created_at': report.created_at,

                'updated_at': report.updated_at

            }

        }



        return response_data



    except APIException:

        raise

    except Exception as e:

        raise APIException(str(e))

        







