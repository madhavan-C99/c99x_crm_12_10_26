from datetime import timedelta

from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models.user_session import UserSession

TOUCH_INTERVAL = timedelta(minutes=5)


class SessionJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None

        user, token = result
        sid = token.get("sid")

        # sid illaadha pazhaya token ku allow (migration time)
        if sid:
            session = UserSession.objects.filter(
                session_key=sid, user=user, is_active=True
            ).first()

            if not session:
                raise AuthenticationFailed(
                    "Session expired. Please login again.", code="session_revoked"
                )

            # last active: 5 min ku oru thadava mattum update (DB load kammi)
            now = timezone.now()
            if not session.last_active_at or now - session.last_active_at > TOUCH_INTERVAL:
                UserSession.objects.filter(id=session.id).update(last_active_at=now)

        return user, token