from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..services import session_services as session_service


def current_sid(request):
    return request.auth.get("sid") if request.auth else None


class SessionListView(APIView):

    def get(self, request):
        data = session_service.get_active_sessions(request.user, current_sid(request))
        return Response({"data": data}, status=status.HTTP_200_OK)


class SessionLogoutView(APIView):

    def post(self, request, session_id):
        message = session_service.logout_session(request.user, session_id)
        return Response({"data": message}, status=status.HTTP_200_OK)


class LogoutOtherSessionsView(APIView):

    def post(self, request):
        message = session_service.logout_other_sessions(request.user, current_sid(request))
        return Response({"data": message}, status=status.HTTP_200_OK)


class LogoutView(APIView):

    def post(self, request):
        message = session_service.logout_current(request.user, current_sid(request))
        return Response({"data": message}, status=status.HTTP_200_OK)