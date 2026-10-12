from adm.services.permission_services import authorize_request
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from telecalling.views import api_history_log

from ..services.loss_lead_approval_services import *


class FetchLossLeadApprovalRequestsAdmin(APIView):
    
    class InputSerializer(serializers.Serializer):
        pipeline_id = serializers.IntegerField(required=False, allow_null=True)
        search = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        date_filter = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        date_filter_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        from_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        to_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        sort_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        sort_by = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        loss_reason = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        loss_reason_id = serializers.IntegerField(required=False, allow_null=True)
        telecaller = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        telecaller_id = serializers.IntegerField(required=False, allow_null=True)
        assigned_to_id = serializers.IntegerField(required=False, allow_null=True)
        course = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        course_id = serializers.IntegerField(required=False, allow_null=True)
        course_name_id = serializers.IntegerField(required=False, allow_null=True)
        lead_source = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        lead_source_id = serializers.IntegerField(required=False, allow_null=True)
        course_plan_id = serializers.IntegerField(required=False, allow_null=True)
        campaign_id = serializers.IntegerField(required=False, allow_null=True)
        approval_status = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        status = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        page = serializers.IntegerField(required=False, min_value=1, default=1)
        page_size = serializers.IntegerField(required=False, allow_null=True, default=50)

    def post(self, request):
        authorize_request('api_fetch_loss_lead_approval_requests_admin', request.user)
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        result = fetch_loss_lead_approval_requests_admin(user=request.user, **serializer.validated_data)

        log_data = {
            'user_id': request.user.id if (request.user and hasattr(request.user, 'id')) else None,
            'api_name': request.path,
            'method': request.method,
            'request_payload': serializer.validated_data,
            'response_payload': {"status": result.get("status"), "total_records": result.get("total_records", 0)},
            'status_code': 200
        }
        api_history_log(log_data)

        return Response(result, status=status.HTTP_200_OK)


class ActionLossLeadApprovalAdmin(APIView):
    
    class InputSerializer(serializers.Serializer):
        lead_id = serializers.IntegerField(required=False, allow_null=True)
        id = serializers.IntegerField(required=False, allow_null=True)
        action_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        action = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        assigned_to_id = serializers.IntegerField(required=False, allow_null=True)
        can_retarget = serializers.BooleanField(required=False, default=True)
        remarks = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        final_remarks = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        reason = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        detailed_reason = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        comments = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def post(self, request):
        authorize_request('api_action_loss_lead_approval_admin', request.user)
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        payload = {**serializer.validated_data}
        result = action_loss_lead_approval_admin(user=request.user, **payload)

        log_data = {
            'user_id': request.user.id if (request.user and hasattr(request.user, 'id')) else None,
            'api_name': request.path,
            'method': request.method,
            'request_payload': serializer.validated_data,
            'response_payload': result,
            'status_code': 200
        }
        api_history_log(log_data)

        return Response(result, status=status.HTTP_200_OK)



