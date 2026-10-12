from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from adm.services.permission_services import authorize_request
from adm.services.report_services import (
    fetch_reports_service, execute_report_service,
    track_report_view_service, fetch_recently_viewed_reports_service
)


class FetchReportsApi(APIView):
    class InputSerializer(serializers.Serializer):
        search = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="")

    def post(self, request):
        authorize_request('api_fetch_reports_admin', request.user)
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        search_query = serializer.validated_data.get("search", "")
        reports = fetch_reports_service(search=search_query)

        return Response({
            "success": True,
            "message": "Reports list retrieved successfully",
            "data": reports
        }, status=status.HTTP_200_OK)


class ExecuteReportApi(APIView):
   
    class InputSerializer(serializers.Serializer):
        report_key = serializers.CharField(required=True, allow_blank=False)
        date_filter = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="All")
        from_date = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="")
        to_date = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="")
        start_date = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="")
        end_date = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="")
        search = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="")
        user_id = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="All")
        reporting_manager = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="All")
        reporting_manager_id = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="All")
        pipeline_id = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="All")
        campaign_id = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="All")
        campaign_status = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="All")
        page = serializers.IntegerField(required=False, default=1)
        limit = serializers.IntegerField(required=False, default=50)

    def post(self, request):
        authorize_request('api_execute_report_admin', request.user)
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        result = execute_report_service(serializer.validated_data)
        return Response(result, status=status.HTTP_200_OK)


class TrackReportViewApi(APIView):
    class InputSerializer(serializers.Serializer):
        report_key = serializers.CharField(required=True, allow_blank=False)

    def post(self, request):
        authorize_request('api_fetch_reports_admin', request.user)
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        result = track_report_view_service(request.user, serializer.validated_data.get("report_key"))
        return Response({
            "success": True,
            "message": "Report view tracked successfully",
            "data": result
        }, status=status.HTTP_200_OK)


class FetchRecentlyViewedReportsApi(APIView):
    class InputSerializer(serializers.Serializer):
        limit = serializers.IntegerField(required=False, default=5)

    def post(self, request):
        authorize_request('api_fetch_reports_admin', request.user)
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        limit_val = serializer.validated_data.get("limit", 5)
        result = fetch_recently_viewed_reports_service(request.user, limit=limit_val)
        return Response({
            "success": True,
            "message": "Recently viewed reports fetched successfully",
            "data": result
        }, status=status.HTTP_200_OK)

