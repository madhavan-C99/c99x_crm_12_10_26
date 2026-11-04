from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.permissions import IsAuthenticated

from ..services.target_dashboard_service import (
    fetch_dashboard_targets_service,
    nudge_telecaller_target_service,
)
from ..tasks.api_log_task import api_history_log


class FetchDashboardTargetsView(APIView):
    """
    Returns Target Lead Count & Amount Target progress for Telecalling Dashboard.
    - Executive: Receives only their personal 2 targets.
    - Team Lead / Admin: Receives Team Target, Members Breakdown, and personal target.
    """
    permission_classes = [IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        month = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        from_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        to_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        pipeline_id = serializers.IntegerField(required=False, default=0)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        
        result = fetch_dashboard_targets_service(serializer.validated_data, user=request.user)
        
        # Log API call safely
        try:
            log_data = {
                'user_id': request.user.id if getattr(request.user, 'id', None) else None,
                'api_name': request.path,
                'method': request.method,
                'request_payload': serializer.validated_data,
                'response_payload': result,
                'status_code': 200
            }
            api_history_log(log_data)
        except Exception:
            pass

        return Response({"status": "success", "data": result}, status=status.HTTP_200_OK)

    def get(self, request):
        """Also supports GET query params for convenience"""
        params = {
            'month': request.query_params.get('month'),
            'from_date': request.query_params.get('from_date'),
            'to_date': request.query_params.get('to_date'),
            'pipeline_id': int(request.query_params.get('pipeline_id') or 0),
        }
        result = fetch_dashboard_targets_service(params, user=request.user)
        return Response({"status": "success", "data": result}, status=status.HTTP_200_OK)


class NudgeTelecallerTargetView(APIView):
    """
    Action API for Team Leads or Admins to nudge a telecaller on target progress.
    """
    permission_classes = [IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        telecaller_id = serializers.IntegerField(required=True)
        message = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        result = nudge_telecaller_target_service(serializer.validated_data, sender_user=request.user)

        try:
            log_data = {
                'user_id': request.user.id if getattr(request.user, 'id', None) else None,
                'api_name': request.path,
                'method': request.method,
                'request_payload': serializer.validated_data,
                'response_payload': result,
                'status_code': 200
            }
            api_history_log(log_data)
        except Exception:
            pass

        return Response({"status": "success", "data": result}, status=status.HTTP_200_OK)
