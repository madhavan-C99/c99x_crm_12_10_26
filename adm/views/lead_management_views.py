from adm.services.permission_services import authorize_request
from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.decorators import authentication_classes, permission_classes

from ..services.lead_management_services import (
    fetch_add_lead_dropdowns,
    create_new_lead,
)


# @authentication_classes([])
# @permission_classes([])
class AddLeadDropdownsView(APIView):
    class InputSerializer(serializers.Serializer):
        pass

    def post(self, request):
        authorize_request('api_lead_mgmt_add_dropdowns_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = fetch_add_lead_dropdowns(user=request.user, **serializer.validated_data)
        return Response({"data": data}, status=status.HTTP_200_OK)


# @authentication_classes([])
# @permission_classes([])
class AddNewLeadView(APIView):
    class InputSerializer(serializers.Serializer):
        first_name = serializers.CharField(required=False, allow_blank=True, default="")
        last_name = serializers.CharField(required=False, allow_blank=True, default="")
        mobile_no = serializers.CharField(required=True)
        email = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        pipeline_category_id = serializers.IntegerField(required=False, allow_null=True)
        campaign_id = serializers.IntegerField(required=False, allow_null=True)
        lead_source_id = serializers.IntegerField(required=False, allow_null=True)
        assigned_to_id = serializers.IntegerField(required=False, allow_null=True)
        enquiry_date = serializers.CharField(required=False, allow_null=True)

    def post(self, request):
        authorize_request('api_lead_mgmt_add_new_lead_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = create_new_lead(user=request.user, **serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_201_CREATED)