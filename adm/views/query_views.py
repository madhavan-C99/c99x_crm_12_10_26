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

        opt_filter = dict(data["opt_filter"])
        opt_filter["organization_id"] = organization_id

        result = exec_raw_sql(data["field"], opt_filter)

        return Response(
            {"data": result or []},
            status=status.HTTP_200_OK,
        )