from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from adm.services.permission_services import authorize_request
from adm.services.lead_services import fetch_leads_service, action_lead_management_service
from adm.services.add_new_lead_services import create_new_lead
from adm.services.generic_export_services import (
    initiate_export_service,
    fetch_export_logs_service,
    download_export_file_service,
    is_admin_or_manager_user
)


class FetchLeadsApi(APIView):
    class InputSerializer(serializers.Serializer):
        action = serializers.ChoiceField(
            choices=['FETCH_ALL', 'PIPELINE', 'FETCH_ONE', 'WON_LIST', 'LOST_LIST', 'FETCH_HISTORY'],
            default='FETCH_ALL'
        )
        lead_id = serializers.IntegerField(required=False, allow_null=True)
        filters = serializers.JSONField(required=False, default=dict)

    def post(self, request):
        authorize_request('api_fetch_all_leads', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        result = fetch_leads_service(
            user=request.user,
            action=data.get('action'),
            lead_id=data.get('lead_id'),
            filters=data.get('filters', {})
        )
        return Response(result, status=status.HTTP_200_OK)


class ExportDataApi(APIView):
    class InputSerializer(serializers.Serializer):
        entity = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        export_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        report_key = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        report_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        file_format = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        format = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        columns = serializers.ListField(required=False, default=list)
        filters = serializers.DictField(required=False, default=dict)
        pipeline_id = serializers.IntegerField(required=False, allow_null=True)
        campaign_id = serializers.IntegerField(required=False, allow_null=True)
        date_filter = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        from_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        to_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def post(self, request):
        raw_payload = dict(request.data or {})
        serializer = self.InputSerializer(data=raw_payload)
        serializer.is_valid(raise_exception=True)

        result = initiate_export_service(
            user=request.user,
            payload={**raw_payload, **serializer.validated_data},
            request=request
        )
        return Response({"data": result}, status=status.HTTP_200_OK)


class ExportLogsApi(APIView):
    class InputSerializer(serializers.Serializer):
        page = serializers.IntegerField(required=False, default=1)
        limit = serializers.IntegerField(required=False, default=25)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        result = fetch_export_logs_service(
            user=request.user,
            page=serializer.validated_data.get('page', 1),
            limit=serializer.validated_data.get('limit', 25)
        )
        return Response(result, status=status.HTTP_200_OK)


class ExportDownloadApi(APIView):
    class InputSerializer(serializers.Serializer):
        export_id = serializers.IntegerField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        result = download_export_file_service(
            user=request.user,
            export_id=serializer.validated_data['export_id']
        )
        http_status = result.pop('_status', status.HTTP_200_OK)
        return Response({'data': result}, status=http_status)



class ActionLeadManagementApi(APIView):
    
    class InputSerializer(serializers.Serializer):
        action = serializers.ChoiceField(
            choices=['MARK_WON', 'MARK_LOST', 'REASSIGN', 'CHANGE_STATUS', 'MOVE_CAMPAIGN'],
            required=True
        )
        lead_id = serializers.IntegerField(required=True)
        payload = serializers.JSONField(required=False, default=dict)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        res = action_lead_management_service(
            user=request.user,
            action=data.get('action'),
            lead_id=data.get('lead_id'),
            payload=data.get('payload', {})
        )
        return Response({'data': res}, status=status.HTTP_200_OK)


class CreateLeadApi(APIView):
   
    class InputSerializer(serializers.Serializer):
        full_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        first_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        last_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        mobile_no = serializers.CharField(required=True)
        email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
        pipeline_stage_id = serializers.IntegerField(required=False, allow_null=True, default=1)
        campaign_id = serializers.IntegerField(required=False, allow_null=True)
        lead_source_id = serializers.IntegerField(required=False, allow_null=True)
        assigned_to_id = serializers.IntegerField(required=False, allow_null=True)
        priority_id = serializers.IntegerField(required=False, allow_null=True)

    def post(self, request):
        
        authorize_request('api_add_new_lead_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = create_new_lead(user=request.user, **serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_201_CREATED)
