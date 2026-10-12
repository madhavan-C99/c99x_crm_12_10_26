from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from adm.services.permission_services import (
    authorize_request,
    create_permission,
    assign_permission_to_role,
    fetch_perms_list,
    fetch_roles_list,
    get_roles_and_permissions_service,
    create_role_matrix_service,
    update_role_permission_service,
)


class AddPermAPIView(APIView):
    """
    POST /adm/perm_add
    Register a new system permission code.
    """
    class InputSerializer(serializers.Serializer):
        name = serializers.CharField(required=True)
        display_value = serializers.CharField(required=True)
        code = serializers.CharField(required=True)
        perm_group = serializers.CharField(required=False, default="perm_apis")

    def post(self, request):
        authorize_request('api_add_perm', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_name = request.user.username if request.user and request.user.is_authenticated else 'system'
        perm_name = create_permission(user_name, **serializer.validated_data)

        return Response({
            "status": "success",
            "message": f"Permission '{perm_name}' registered successfully!",
            "data": serializer.validated_data
        }, status=status.HTTP_201_CREATED)


class FetchPermsListAPIView(APIView):
    """
    POST /adm/perm_list
    Fetch all registered system permissions list.
    """
    def post(self, request):
        authorize_request('api_fetch_perms_list', request.user)
        perms_list = fetch_perms_list()
        return Response({
            "status": "success",
            "data": perms_list
        }, status=status.HTTP_200_OK)


class FetchRolesListAPIView(APIView):
    """
    POST /adm/role_list
    Fetch all system roles list.
    """
    def post(self, request):
        authorize_request('api_fetch_roles_list', request.user)
        roles_list = fetch_roles_list()
        return Response({
            "status": "success",
            "data": roles_list
        }, status=status.HTTP_200_OK)


class AssignRolePermAPIView(APIView):
    """
    POST /adm/role_assign_perm
    Assign a permission to a role.
    """
    class InputSerializer(serializers.Serializer):
        role_id = serializers.IntegerField(required=True)
        perm_id = serializers.IntegerField(required=True)

    def post(self, request):
        authorize_request('api_assign_role_perm', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_name = request.user.username if request.user and request.user.is_authenticated else 'system'
        result_msg = assign_permission_to_role(user_name=user_name, **serializer.validated_data)

        return Response({
            "status": "success",
            "message": result_msg
        }, status=status.HTTP_200_OK)


class GetRolesAndPermissionsApi(APIView):
    """
    GET /adm/get_roles_and_permissions
    Fetch Role & Permission Matrix for tenant.
    """
    def get(self, request):
        authorize_request('api_get_roles_and_permissions', request.user)
        result = get_roles_and_permissions_service(user=request.user)
        return Response({
            "status": True,
            "message": "Roles and permissions fetched successfully",
            "data": result
        }, status=status.HTTP_200_OK)


class CreateRoleApi(APIView):
    """
    POST /adm/create_role
    Create a new Role in matrix (optionally duplicate permissions from an existing role).
    """
    class InputSerializer(serializers.Serializer):
        name = serializers.CharField(required=True)
        duplicate_from = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def post(self, request):
        authorize_request('api_create_role', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        res = create_role_matrix_service(
            admin_user=request.user,
            data=serializer.validated_data
        )

        status_code = status.HTTP_201_CREATED if res.get('status') else status.HTTP_400_BAD_REQUEST
        return Response(res, status=status_code)


class UpdateRolePermissionApi(APIView):
    """
    POST /adm/update_role_permission
    Toggle individual permission access for a specific role in Matrix.
    """
    class InputSerializer(serializers.Serializer):
        role_id = serializers.IntegerField(required=False, allow_null=True)
        permission_id = serializers.IntegerField(required=False, allow_null=True)
        has_permission = serializers.BooleanField(required=True)
        category_id = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="")
        role_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        perm_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def post(self, request):
        authorize_request('api_update_role_permission', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        res = update_role_permission_service(
            admin_user=request.user,
            data=serializer.validated_data
        )

        status_code = status.HTTP_200_OK if res.get('status') else status.HTTP_400_BAD_REQUEST
        return Response(res, status=status_code)
