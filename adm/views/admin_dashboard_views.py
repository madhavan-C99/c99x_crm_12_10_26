from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import serializers, status
from adm.services.permission_services import authorize_request
from adm.services.admin_dashboard_services import (
    fetch_dashboard_pending_payments,
    fetch_dashboard_performance_overview,
    fetch_dashboard_best_performer
)


class BaseDashboardFilterSerializer(serializers.Serializer):
    pipeline_id = serializers.IntegerField(required=False, allow_null=True)
    campaign_id = serializers.IntegerField(required=False, allow_null=True)
    date_filter = serializers.CharField(required=False, default="Today", allow_blank=True)
    from_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    to_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class DashboardPendingPaymentsApi(APIView):
    def post(self, request):
        authorize_request('api_fetch_all_pending_payments_admin', request.user)
        serializer = BaseDashboardFilterSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        result = fetch_dashboard_pending_payments(
            user=request.user,
            **serializer.validated_data
        )
        return Response(result, status=status.HTTP_200_OK)


class DashboardPerformanceOverviewApi(APIView):
   
    def post(self, request):
        authorize_request('api_fetch_performance_overview_admin', request.user)
        serializer = BaseDashboardFilterSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        result = fetch_dashboard_performance_overview(
            user=request.user,
            **serializer.validated_data
        )
        return Response(result, status=status.HTTP_200_OK)


class DashboardBestPerformerApi(APIView):
  
    def post(self, request):
        authorize_request('api_fetch_performance_overview_admin', request.user)
        serializer = BaseDashboardFilterSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        result = fetch_dashboard_best_performer(
            user=request.user,
            **serializer.validated_data
        )
        return Response(result, status=status.HTTP_200_OK)
