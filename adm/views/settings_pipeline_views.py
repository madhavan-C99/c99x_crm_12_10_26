from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from adm.services.permission_services import authorize_request
from adm.services.settings_pipeline_service import (
    fetch_pipeline_categories,
    create_pipeline_category,
    update_pipeline_stages,
    check_stage_leads,
    transfer_and_delete_pipeline_stage,
    check_tag_leads,
    transfer_and_delete_pipeline_tag,
    fetch_pipeline_stage_tranfered_data,
)


class FetchPipelineCategoriesView(APIView):
   
    class InputSerializer(serializers.Serializer):
        pass

    def post(self, request):
        authorize_request('api_pipeline_categories_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = fetch_pipeline_categories(user=request.user, **serializer.validated_data)
        return Response({"data": data}, status=status.HTTP_200_OK)


class CreatePipelineCategoryView(APIView):
   
    class InputSerializer(serializers.Serializer):
        name = serializers.CharField(required=True)
        is_default = serializers.BooleanField(required=False, default=False)
        stages = serializers.ListField(required=False)
        terminals = serializers.DictField(required=False)

    def post(self, request):
        authorize_request('api_pipeline_categories_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = create_pipeline_category(user=request.user, **serializer.validated_data)
        return Response({"data": data, "message": "Pipeline created successfully"}, status=status.HTTP_200_OK)


class UpdatePipelineStagesView(APIView):
   
    class InputSerializer(serializers.Serializer):
        pipeline_id = serializers.IntegerField(required=True)
        name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        is_default = serializers.BooleanField(required=False, allow_null=True)
        stages = serializers.ListField(required=False)
        terminals = serializers.DictField(required=False)

    def post(self, request):
        authorize_request('api_pipeline_categories_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = update_pipeline_stages(user=request.user, **serializer.validated_data)
        return Response({"data": data, "message": "Pipeline stages updated successfully"}, status=status.HTTP_200_OK)


class CheckStageLeadsView(APIView):
    
    class InputSerializer(serializers.Serializer):
        stage_id = serializers.IntegerField(required=True)

    def post(self, request):
        authorize_request('api_pipeline_categories_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = check_stage_leads(user=request.user, **serializer.validated_data)
        return Response({"data": data}, status=status.HTTP_200_OK)


class TransferPipelineStageDataView(APIView):
   
    class InputSerializer(serializers.Serializer):
        pipeline_id = serializers.IntegerField(required=True)
        stage_id = serializers.IntegerField(required=True)
        target_stage_id = serializers.IntegerField(required=False, allow_null=True)
        target_priority_id = serializers.IntegerField(required=False, allow_null=True)
        deletion_reason = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    def post(self, request):
        authorize_request('api_pipeline_categories_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = transfer_and_delete_pipeline_stage(user=request.user, **serializer.validated_data)
        return Response({"data": data, "message": "Stage deleted and leads transferred successfully"}, status=status.HTTP_200_OK)


class CheckTagLeadsView(APIView):
    
    class InputSerializer(serializers.Serializer):
        stage_id = serializers.CharField(required=True)
        tag_id = serializers.IntegerField(required=False, allow_null=True)
        tag_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    def post(self, request):
        authorize_request('api_pipeline_categories_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = check_tag_leads(user=request.user, **serializer.validated_data)
        return Response({"data": data}, status=status.HTTP_200_OK)


class TransferPipelineTagDataView(APIView):
    
    class InputSerializer(serializers.Serializer):
        pipeline_id = serializers.IntegerField(required=True)
        stage_id = serializers.CharField(required=True)
        tag_id = serializers.IntegerField(required=False, allow_null=True)
        tag_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        target_stage_id = serializers.CharField(required=False, allow_null=True)
        target_tag_id = serializers.IntegerField(required=False, allow_null=True)
        deletion_reason = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    def post(self, request):
        authorize_request('api_pipeline_categories_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = transfer_and_delete_pipeline_tag(user=request.user, **serializer.validated_data)
        return Response({"data": data, "message": "Tag deleted and leads transferred successfully"}, status=status.HTTP_200_OK)


class FetchPipelineStageTranferedDataView(APIView):
  
    class InputSerializer(serializers.Serializer):
        pipeline_id = serializers.IntegerField(required=False, allow_null=True)
        stage_id = serializers.IntegerField(required=False, allow_null=True)
        limit = serializers.IntegerField(required=False, default=50)

    def post(self, request):
        authorize_request('api_pipeline_categories_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = fetch_pipeline_stage_tranfered_data(user=request.user, **serializer.validated_data)
        return Response({"data": data, "count": len(data)}, status=status.HTTP_200_OK)
