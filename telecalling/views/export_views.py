from adm.services.permission_services import authorize_request
from rest_framework.views import APIView
from adm.services.query_services import exec_raw_sql, delete_exec_raw_sql
from rest_framework.views import APIView
from rest_framework import serializers
from rest_framework.response import Response
from ..services.lead_services import *
from ..services.payment_services import *
from ..services.export_services import *





    
class ExportColumnsView(APIView):

    class InputSerializer(serializers.Serializer):
        page = serializers.CharField(required=True)

    def post(self, request):
        authorize_request('api_export_column', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data=get_export_columns(user=request.user,**serializer.validated_data)


        return Response({"columns": data}, status=200)
    
    
class ExportData(APIView):

    class InputSerializer(serializers.Serializer):
        page = serializers.CharField(required=True)
        columns = serializers.ListField(
            child=serializers.CharField(), required=True
        )
        lead_filter_type = serializers.CharField(required=False)
        from_date = serializers.DateField(required=False)
        to_date = serializers.DateField(required=False)
        date_filter_type = serializers.CharField(required=False, default="year")
        pipeline_stage_id = serializers.IntegerField(required=False, allow_null=True, default=0)
        lead_source_id = serializers.IntegerField(required=False, allow_null=True, default=0)
        course_name_id = serializers.IntegerField(required=False, allow_null=True, default=0)
        priority_id = serializers.IntegerField(required=False, allow_null=True, default=0)
        course_plan_id = serializers.IntegerField(required=False, allow_null=True, default=0)
        payment_status = serializers.IntegerField(required=False, allow_null=True, default=0)
        campaign_name_id = serializers.IntegerField(required=False, allow_null=True, default=0)
        payment_stage_id = serializers.IntegerField(required=False, allow_null=True, default=0)
        pending_amount_id = serializers.CharField(required=False, allow_null=True, default=0)
        course_time_id = serializers.IntegerField(required=False, allow_null=True, default=0)

    def post(self, request):
        authorize_request('api_export_json_data', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = get_export_data(user=request.user, **serializer.validated_data)

        return Response({"data": data}, status=200)