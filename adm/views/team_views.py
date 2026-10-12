from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from adm.services.team_services import (
    fetch_all_teams_admin, create_team_admin,
    edit_team_admin, delete_team_admin,
    fetch_team_dropdowns_admin
)
from adm.services.permission_services import authorize_request


class FetchAllTeamsAdminApi(APIView):
    def get(self, request):
        authorize_request('api_fetch_all_teams_admin', request.user)
        res = fetch_all_teams_admin(user=request.user)
        return Response({"data": res}, status=status.HTTP_200_OK)


class CreateTeamAdminApi(APIView):
    class InputSerializer(serializers.Serializer):
        name = serializers.CharField(required=True)
        color = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="#6366F1")
        lead_id = serializers.IntegerField(required=False, allow_null=True)
        member_ids = serializers.ListField(
            child=serializers.IntegerField(), required=False, default=[]
        )

    def post(self, request):
        authorize_request('api_create_team_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        res = create_team_admin(
            admin_user=request.user,
            data=serializer.validated_data
        )
        return Response({"data": res}, status=status.HTTP_201_CREATED)

class EditTeamAdminApi(APIView):
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=False, allow_null=True)
        team_id = serializers.IntegerField(required=False, allow_null=True)
        name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        color = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        branch_id = serializers.IntegerField(required=False, allow_null=True)
        lead_id = serializers.IntegerField(required=False, allow_null=True)
        member_ids = serializers.ListField(
            child=serializers.IntegerField(), required=False, allow_null=True
        )

    def post(self, request):
        authorize_request('api_edit_team_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        res = edit_team_admin(
            admin_user=request.user,
            data=serializer.validated_data
        )
        return Response({"data": res}, status=status.HTTP_200_OK)


class DeleteTeamAdminApi(APIView):
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=False, allow_null=True)
        team_id = serializers.IntegerField(required=False, allow_null=True)

    def post(self, request):
        authorize_request('api_delete_team_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        res = delete_team_admin(
            admin_user=request.user,
            data=serializer.validated_data
        )
        return Response({"data": res}, status=status.HTTP_200_OK)



