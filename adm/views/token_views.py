from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from ..models.user_session import UserSession

from rest_framework_simplejwt.tokens import AccessToken

class SessionTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        refresh = RefreshToken(attrs["refresh"])
        sid = refresh.get("sid")

        if sid and not UserSession.objects.filter(session_key=sid, is_active=True).exists():
            raise InvalidToken("Session expired")

        data = super().validate(attrs)
        access = AccessToken(data["access"])
        org_id = refresh.get("organization_id")
        access["organization_id"] = org_id
        access["organizationId"] = org_id
        access["has_organization"] = refresh.get("has_organization", bool(org_id))
        data["access"] = str(access)
        return data


class SessionTokenRefreshView(TokenRefreshView):
    serializer_class = SessionTokenRefreshSerializer