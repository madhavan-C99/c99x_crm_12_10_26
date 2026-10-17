from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response

from adm.services.permission_services import authorize_request
from adm.services.lead_import_services import verify_lead_rows, submit_lead_rows


class VerifyLeadImportView(APIView):
    class InputSerializer(serializers.Serializer):
        rows = serializers.ListField(
            child=serializers.DictField(),
            required=True,
            allow_empty=False
        )

    def post(self, request):
        authorize_request('api_verify_lead_import', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = verify_lead_rows(user=request.user, **serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_200_OK)


class SubmitLeadImportView(APIView):
    class InputSerializer(serializers.Serializer):
        rows = serializers.ListField(
            child=serializers.DictField(),
            required=True,
            allow_empty=False
        )
        campaign_id = serializers.IntegerField(required=True)
        source_id = serializers.IntegerField(required=False, allow_null=True)
        assigned_to_id = serializers.IntegerField(required=False, allow_null=True)
        pipeline_stage_id = serializers.IntegerField(required=False, allow_null=True)

    def post(self, request):
        authorize_request('api_submit_lead_import', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = submit_lead_rows(user=request.user, **serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_201_CREATED)
