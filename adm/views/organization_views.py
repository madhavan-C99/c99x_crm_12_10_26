from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from adm.services.permission_services import authorize_request
from adm.services.organization_services import (
    create_organization_profile_admin_service,
    get_organization_profile_admin_service,
    edit_organization_profile_admin_service
)


class HybridLogoField(serializers.Field):
    def to_internal_value(self, data):
        if not data:
            return None
        if hasattr(data, 'read'):
            return serializers.ImageField().to_internal_value(data)
        return data


class CreateOrganizationProfileAdminApi(APIView):
    """
    POST /adm/create_organization_profile_admin
    Create Organization Profile with Logo & Address.
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    class InputSerializer(serializers.Serializer):
        logo = HybridLogoField(required=False, allow_null=True)
        org_name = serializers.CharField(required=True)
        display_name = serializers.CharField(required=True)
        industry_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        company_website = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        company_description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        address_line1 = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        address_line2 = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        city = serializers.CharField(required=True)
        state = serializers.CharField(required=True)
        country = serializers.CharField(required=False, default="India")
        pincode = serializers.CharField(required=True)
        official_email = serializers.EmailField(required=True)
        official_contact = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        gst_in = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        company_pan = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        date_format = serializers.CharField(required=False, default="DD/MM/YYYY")
        time_format = serializers.CharField(required=False, default="12hrs")

    def post(self, request):
        if request.user and request.user.is_authenticated:
            authorize_request('api_create_organization_profile_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        res = create_organization_profile_admin_service(
            data=serializer.validated_data,
            admin_user=request.user if request.user and request.user.is_authenticated else None,
            request=request
        )
        status_code = status.HTTP_201_CREATED if res.get("status") else status.HTTP_400_BAD_REQUEST
        return Response(res, status=status_code)


class GetOrganizationProfileAdminApi(APIView):
    """
    GET /adm/get_organization_profile_admin
    Fetch Organization Profile details for logged in user's tenant.
    """
    def get(self, request):
        if request.user and request.user.is_authenticated:
            authorize_request('api_get_organization_profile_admin', request.user)
        res = get_organization_profile_admin_service(request=request, user=request.user)
        return Response(res, status=status.HTTP_200_OK)


class EditOrganizationProfileAdminApi(APIView):
    """
    POST /adm/edit_organization_profile_admin
    Update Organization Profile details for tenant.
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=False, allow_null=True)
        logo = HybridLogoField(required=False, allow_null=True)
        org_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        display_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        industry_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        company_website = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        company_description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        address_line1 = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        address_line2 = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        city = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        state = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        country = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        pincode = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        official_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
        official_contact = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        gst_in = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        company_pan = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        date_format = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        time_format = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def post(self, request):
        if request.user and request.user.is_authenticated:
            authorize_request('api_edit_organization_profile_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        res = edit_organization_profile_admin_service(
            data=serializer.validated_data,
            admin_user=request.user if request.user and request.user.is_authenticated else None,
            request=request
        )
        status_code = status.HTTP_200_OK if res.get("status") else status.HTTP_400_BAD_REQUEST
        return Response(res, status=status_code)
