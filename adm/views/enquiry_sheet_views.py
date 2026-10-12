from adm.services.permission_services import authorize_request
from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from ..services.enquiry_sheet_services import (
    fetch_campaign_enquiry_sheet,
    fetch_lead_summary_report,
    update_lead_summary,
    delete_lead_summary,
    bulk_delete_leads,
    move_lead_campaign,
    assign_lead_telecaller,
    change_lead_status,
    fetch_call_log_report,
    fetch_disposition_log,
)


class CampaignEnquirySheetView(APIView):
    """
    POST /adm/campaign_enquiry_sheet
    Fetch campaign enquiry sheet analytics & stats.
    """
    class InputSerializer(serializers.Serializer):
        campaign_id = serializers.IntegerField(required=False, allow_null=True)
        campaign_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    def post(self, request):
        authorize_request('api_campaign_enquiry_sheet_admin', request.user)
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        data = fetch_campaign_enquiry_sheet(
            user=request.user, 
            **serializer.validated_data
        )
        return Response({"data": data}, status=status.HTTP_200_OK)


class LeadSummaryReportView(APIView):
    """
    POST /adm/lead_summary_report
    Fetch lead summary report with multi-filter & pagination support.
    """
    class InputSerializer(serializers.Serializer):
        campaign_id = serializers.IntegerField(required=False, allow_null=True)
        campaign_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        search = serializers.CharField(required=False, allow_blank=True, default="")
        date_range = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        assigned_to = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        assigned_to_id = serializers.IntegerField(required=False, allow_null=True)
        stages = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        stage_id = serializers.IntegerField(required=False, allow_null=True)
        filter_campaign = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        course_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        course_plan = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        lead_source = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        payment_status = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        priority = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        page = serializers.IntegerField(required=False, default=1)
        page_size = serializers.IntegerField(required=False, default=50)

    def post(self, request):
        authorize_request('api_lead_summary_report_admin', request.user)
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        data = fetch_lead_summary_report(
            user=request.user,
            **serializer.validated_data
        )
        return Response({"data": data}, status=status.HTTP_200_OK)


class UpdateLeadSummaryView(APIView):
    """
    POST /adm/update_lead_summary
    Update individual lead summary record.
    """
    class InputSerializer(serializers.Serializer):
        lead_id = serializers.IntegerField(required=False, allow_null=True)
        id = serializers.IntegerField(required=False, allow_null=True)

    def post(self, request):
        authorize_request('api_update_lead_summary_admin', request.user)
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        lead_id = serializer.validated_data.get('lead_id') or serializer.validated_data.get('id')
        data = update_lead_summary(lead_id=lead_id, payload=request.data)
        return Response({"data": data}, status=status.HTTP_200_OK)


class DeleteLeadSummaryView(APIView):
    """
    POST /adm/delete_lead_summary
    Soft delete single or multiple lead summary records.
    """
    class InputSerializer(serializers.Serializer):
        lead_id = serializers.IntegerField(required=False, allow_null=True)
        id = serializers.IntegerField(required=False, allow_null=True)
        lead_ids = serializers.ListField(child=serializers.IntegerField(), required=False, default=list)

    def post(self, request):
        authorize_request('api_delete_lead_summary_admin', request.user)
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        
        val_data = serializer.validated_data
        lead_ids = val_data.get('lead_ids') or []
        lead_id = val_data.get('lead_id') or val_data.get('id')

        target_ids = list(lead_ids)
        if lead_id and lead_id not in target_ids:
            target_ids.append(lead_id)

        if target_ids:
            data = bulk_delete_leads(lead_ids=target_ids, user=request.user)
        else:
            data = {"status": "error", "message": "No valid lead IDs provided"}

        return Response({"data": data}, status=status.HTTP_200_OK)


class MoveLeadCampaignView(APIView):
    """
    POST /adm/move_lead_campaign
    Move selected leads to a target campaign.
    """
    class InputSerializer(serializers.Serializer):
        lead_ids = serializers.ListField(child=serializers.IntegerField(), required=True)
        target_campaign = serializers.CharField(required=True)
        note = serializers.CharField(required=False, allow_blank=True, default="")

    def post(self, request):
        authorize_request('api_move_lead_campaign_admin', request.user)
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        data = move_lead_campaign(
            lead_ids=serializer.validated_data.get('lead_ids'),
            target_campaign=serializer.validated_data.get('target_campaign'),
            note=serializer.validated_data.get('note')
        )
        return Response({"data": data}, status=status.HTTP_200_OK)


class AssignLeadTelecallerView(APIView):
    """
    POST /adm/assign_lead_telecaller
    Assign selected leads to a telecaller.
    """
    class InputSerializer(serializers.Serializer):
        lead_ids = serializers.ListField(child=serializers.IntegerField(), required=True)
        telecaller = serializers.CharField(required=True)
        note = serializers.CharField(required=False, allow_blank=True, default="")

    def post(self, request):
        authorize_request('api_assign_lead_telecaller_admin', request.user)
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        data = assign_lead_telecaller(
            lead_ids=serializer.validated_data.get('lead_ids'),
            telecaller=serializer.validated_data.get('telecaller'),
            note=serializer.validated_data.get('note')
        )
        return Response({"data": data}, status=status.HTTP_200_OK)


class ChangeLeadStatusView(APIView):
    """
    POST /adm/change_lead_status
    Change pipeline status for selected leads.
    """
    class InputSerializer(serializers.Serializer):
        lead_ids = serializers.ListField(child=serializers.IntegerField(), required=True)
        status_name = serializers.CharField(required=True)
        note = serializers.CharField(required=False, allow_blank=True, default="")

    def post(self, request):
        authorize_request('api_change_lead_status_admin', request.user)
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        data = change_lead_status(
            lead_ids=serializer.validated_data.get('lead_ids'),
            status_name=serializer.validated_data.get('status_name'),
            note=serializer.validated_data.get('note')
        )
        return Response({"data": data}, status=status.HTTP_200_OK)


class CallLogReportView(APIView):
    """
    POST /adm/call_log_report
    Fetch call log report details.
    """
    class InputSerializer(serializers.Serializer):
        campaign_id = serializers.IntegerField(required=False, allow_null=True)
        campaign_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        filter_campaign = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        search = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        date_range = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        assigned_to = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        call_status = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        call_direction = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        page = serializers.IntegerField(required=False, default=1)
        page_size = serializers.IntegerField(required=False, default=50)

    def post(self, request):
        authorize_request('api_call_log_report_admin', request.user)
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        data = fetch_call_log_report(
            request.user,
            **serializer.validated_data
        )
        return Response({"data": data}, status=status.HTTP_200_OK)


class DispositionLogView(APIView):
    """
    POST /adm/disposition_log_report
    Fetch disposition log report details.
    """
    class InputSerializer(serializers.Serializer):
        campaign_id = serializers.IntegerField(required=False, allow_null=True)
        campaign_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        filter_campaign = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        search = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        date_range = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        assigned_to = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        stages = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        page = serializers.IntegerField(required=False, default=1)
        page_size = serializers.IntegerField(required=False, default=50)

    def post(self, request):
        authorize_request('api_disposition_log_report_admin', request.user)
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        data = fetch_disposition_log(
            request.user,
            **serializer.validated_data
        )
        return Response({"data": data}, status=status.HTTP_200_OK)