from rest_framework import serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from adm.services.permission_services import authorize_request
from adm.services.query_services import exec_raw_sql


class GetSelectOptions(APIView):

    class InputSerializer(serializers.Serializer):
        field = serializers.CharField(required=True, allow_blank=False)
        opt_filter = serializers.DictField(required=False, default=dict)

    def post(self, request):
        authorize_request("api_get_select_option", request.user)

        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        organization_id = getattr(request.user, "organization_id", None)
        if not organization_id:
            raise PermissionDenied(
                "Your user account is not assigned to an organization."
            )

        opt_filter = dict(data.get("opt_filter") or {})
        pipe_id = (
            opt_filter.get("pipeline_id")
            or request.data.get("pipeline_id")
            or request.data.get("pipeline_category_id")
            or request.query_params.get("pipeline_id")
        )
        if pipe_id:
            opt_filter["pipeline_id"] = pipe_id
        opt_filter["organization_id"] = organization_id

        target_role = (
            opt_filter.get("role")
            or opt_filter.get("target_role")
            or request.data.get("role")
            or request.data.get("target_role")
            or request.query_params.get("role")
        )
        if target_role:
            opt_filter["role"] = target_role

        selected_lead = (
            opt_filter.get("lead_id")
            or opt_filter.get("leader_id")
            or request.data.get("lead_id")
            or request.data.get("leader_id")
            or request.query_params.get("lead_id")
        )
        if selected_lead:
            opt_filter["lead_id"] = selected_lead

        team_param = (
            opt_filter.get("team_id")
            or request.data.get("team_id")
            or request.query_params.get("team_id")
        )
        if team_param:
            opt_filter["team_id"] = team_param

        for_target = (
            opt_filter.get("for_target")
            or request.data.get("for_target")
            or request.query_params.get("for_target")
        )
        if for_target is not None:
            opt_filter["for_target"] = for_target

        month_param = (
            opt_filter.get("month")
            or opt_filter.get("target_month")
            or request.data.get("month")
            or request.data.get("target_month")
            or request.query_params.get("month")
        )
        if month_param:
            opt_filter["month"] = month_param

        result = exec_raw_sql(data["field"], opt_filter)

        return Response(
            {"data": result or []},
            status=status.HTTP_200_OK,
        )