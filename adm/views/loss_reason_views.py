from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from adm.services.permission_services import authorize_request
from adm.services.loss_reason_service import *


class FetchLossReasonsAdminApi(APIView):
    class InputSerializer(serializers.Serializer):
        search = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        status = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def post(self, request):
        authorize_request('api_fetch_loss_reasons_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        res = fetch_loss_reasons_admin_service(user=request.user, data=serializer.validated_data)
        return Response(res, status=status.HTTP_200_OK)



class CreateLossReasonAdminApi(APIView):
    class InputSerializer(serializers.Serializer):
        name = serializers.CharField(required=True)

    def post(self, request):
        authorize_request('api_create_loss_reason_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        res = create_loss_reason_admin_service(admin_user=request.user, data=serializer.validated_data)
        return Response(res, status=status.HTTP_201_CREATED)


class UpdateLossReasonAdminApi(APIView):
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=False, allow_null=True)
        loss_reason_id = serializers.IntegerField(required=False, allow_null=True)
        name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        is_active = serializers.BooleanField(required=False, allow_null=True)

    def post(self, request):
        authorize_request('api_update_loss_reason_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        res = update_loss_reason_admin_service(admin_user=request.user, data=serializer.validated_data)
        return Response(res, status=status.HTTP_200_OK)


class GetLossReasonsAdminApi(APIView):
    class InputSerializer(serializers.Serializer):
        pipeline_id = serializers.IntegerField(required=True)

    def post(self, request):
        authorize_request('api_get_loss_reasons_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        res = get_loss_reasons_by_pipeline_service(
            pipeline_id=serializer.validated_data['pipeline_id']
        )
        return Response(res, status=status.HTTP_200_OK)


class AddLossReasonAdminApi(APIView):
    class InputSerializer(serializers.Serializer):
        pipeline_id = serializers.IntegerField(required=True)
        reason = serializers.CharField(required=True)

    def post(self, request):
        authorize_request('api_add_loss_reason_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        res = add_loss_reason_by_pipeline_service(
            pipeline_id=serializer.validated_data['pipeline_id'],
            reason_text=serializer.validated_data['reason'],
            user=request.user
        )
        return Response(res, status=status.HTTP_201_CREATED)


class DeleteLossReasonAdminApi(APIView):
    class InputSerializer(serializers.Serializer):
        pipeline_id = serializers.IntegerField(required=True)
        reason_id = serializers.IntegerField(required=False, allow_null=True)
        reason = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def post(self, request):
        authorize_request('api_delete_loss_reason_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        res = delete_loss_reason_by_pipeline_service(
            pipeline_id=serializer.validated_data['pipeline_id'],
            reason_id=serializer.validated_data.get('reason_id'),
            reason_text=serializer.validated_data.get('reason'),
            user=request.user
        )
        return Response(res, status=status.HTTP_200_OK)
