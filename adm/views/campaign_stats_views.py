from adm.services.permission_services import authorize_request
from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.decorators import authentication_classes, permission_classes

from ..services.campaign_stats_services import (
    fetch_pipeline_stats,
    fetch_campaign_cards,
    fetch_filter_options,
)

# @authentication_classes([])
# @permission_classes([])
class EducationPipelineStats(APIView):
    class InputSerializer(serializers.Serializer):
        date_filter = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    def post(self, request):
        authorize_request('api_education_pipeline_stats_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        card = fetch_pipeline_stats(user=request.user, **serializer.validated_data)
        return Response({"data": card}, status=status.HTTP_200_OK)

# @authentication_classes([])
# @permission_classes([])
class CampaignCardsList(APIView):
    class InputSerializer(serializers.Serializer):
        campaign_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        campaign_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        search = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    def post(self, request):
        authorize_request('api_campaign_cards_list_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cards = fetch_campaign_cards(user=request.user, **serializer.validated_data)
        return Response({"data": cards}, status=status.HTTP_200_OK)
