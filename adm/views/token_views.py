from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from ..models.user_session import UserSession

class SessionTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        sid = RefreshToken(attrs["refresh"]).get("sid")

        if sid and not UserSession.objects.filter(session_key=sid, is_active=True).exists():
            raise InvalidToken("Session expired")

        return super().validate(attrs)


class SessionTokenRefreshView(TokenRefreshView):
    serializer_class = SessionTokenRefreshSerializer