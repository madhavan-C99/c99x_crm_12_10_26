from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from adm.services.permission_services import authorize_request
from adm.services.lead_services import fetch_leads_service, action_lead_management_service
from adm.services.add_new_lead_services import create_new_lead
from adm.services.generic_export_services import export_data_service, is_admin_or_manager_user


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
        return Response({'data': result}, status=status.HTTP_200_OK)


class ExportDataApi(APIView):
    class InputSerializer(serializers.Serializer):
        entity = serializers.CharField(required=True)
        report_key = serializers.CharField(required=False, allow_blank=True, default="")
        export_format = serializers.ChoiceField(choices=['excel', 'xlsx', 'csv', 'pdf'], required=True)
        selected_columns = serializers.ListField(child=serializers.CharField(), required=False, default=list)
        columns = serializers.ListField(child=serializers.CharField(), required=False, default=list)
        filters = serializers.DictField(required=False, default=dict)

    def post(self, request):
        authorize_request('api_export_data_admin', request.user)
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        export_format = "excel" if data["export_format"] == "xlsx" else data["export_format"]
        cols = data.get("selected_columns") or data.get("columns") or []
        filters = dict(data.get("filters") or {})
        if data.get("report_key"):
            filters["report_key"] = data["report_key"]

        result = export_data_service(
            user=request.user,
            entity=data["entity"],
            export_format=export_format,
            selected_columns=cols,
            filters=filters
        )
        return Response({
            "success": True,
            "message": result.get("message", "Export completed successfully"),
            "data": {
                "download_url": result.get("download_url", "")
            }
        }, status=status.HTTP_200_OK)



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
        return Response({'message': res}, status=status.HTTP_200_OK)


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
        return Response({
            "status": "success",
            "message": "Lead created successfully!",
            "data": result
        }, status=status.HTTP_201_CREATED)
