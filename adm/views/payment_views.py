from datetime import datetime

from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from adm.services.permission_services import authorize_request
from ..services.payment_services import (
    fetch_all_pending_payments_admin,
    export_pending_payments_admin,
    get_pending_payment_filter_dropdowns_admin
)
from telecalling.tasks.api_log_task import api_history_log





class FetchAllPendingPaymentsAdmin(APIView):
    """
    POST /adm/fetch_all_pending_payments_admin
    Fetch all pending payments list with filtering and pagination.
    """
    class InputSerializer(serializers.Serializer):
        search = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        date_filter = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        date_filter_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        from_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        to_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        sort_by = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        sort_type = serializers.ChoiceField(
            choices=("newest", "oldest"), required=False, default="newest"
        )
        pipeline_id = serializers.IntegerField(required=False, allow_null=True)
        course_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        course_plan = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        course_time = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        payment_stage = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        pending_amount = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        course_name_id = serializers.IntegerField(required=False, allow_null=True)
        course_plan_id = serializers.IntegerField(required=False, allow_null=True)
        course_timing_id = serializers.IntegerField(required=False, allow_null=True)
        payment_stage_id = serializers.IntegerField(required=False, allow_null=True)
        pending_amount_range = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        page = serializers.IntegerField(required=False, min_value=1, default=1)
        page_size = serializers.IntegerField(required=False, min_value=1)
        limit = serializers.IntegerField(required=False, min_value=1)

        def validate_from_date(self, value):
            return self._validate_date(value)

        def validate_to_date(self, value):
            return self._validate_date(value)

        @staticmethod
        def _validate_date(value):
            if value in (None, ""):
                return None
            try:
                return datetime.strptime(value, "%Y-%m-%d").date()
            except ValueError as exc:
                raise serializers.ValidationError("Use the YYYY-MM-DD date format.") from exc

    def post(self, request):
        authorize_request('api_fetch_all_pending_payments_admin', request.user)
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        result = fetch_all_pending_payments_admin(user=request.user, **serializer.validated_data)

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



