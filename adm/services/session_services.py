from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework.exceptions import APIException, NotFound
from user_agents import parse

from ..models.user_session import UserSession
from ..tasks.session_task import resolve_session_location

TOUCH_INTERVAL = timedelta(minutes=5)


def get_client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def parse_device(user_agent):
    ua = parse(user_agent or "")
    os_name = ua.os.family or "Unknown"
    browser = ua.browser.family or "Unknown"
    device_type = "Mobile" if ua.is_mobile else "Tablet" if ua.is_tablet else "Desktop"

    # Mobile na device peru (iPhone), desktop na "Windows, Chrome"
    if ua.is_mobile or ua.is_tablet:
        device_name = ua.device.family or os_name
    else:
        device_name = f"{os_name}, {browser}"

    return device_name, device_type, browser, os_name


# ---------- LOGIN: session create + sid claim ----------
def create_session(request, user, refresh):
    """
    Login API la refresh = RefreshToken.for_user(user) apram idhai call pannunga.
    refresh token la 'sid' claim add aagum. access_token adhai copy pannum.
    """
    user_agent = request.META.get("HTTP_USER_AGENT", "")
    device_name, device_type, browser, os_name = parse_device(user_agent)
    ip = get_client_ip(request)
    now = timezone.now()

    session = UserSession.objects.create(
        user=user,
        device_name=device_name,
        device_type=device_type,
        browser=browser,
        os=os_name,
        user_agent=user_agent[:1000],
        ip_address=ip,
        last_active_at=now,
        expires_at=now + settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"],
        created_by=str(user),
        organization=user.organization if hasattr(user, "organization") else None
    )
    

    refresh["sid"] = str(session.session_key)

    if ip:
        resolve_session_location(session.id, ip)

    return session


# ---------- LIST ----------
SESSION_LIMIT = 30   # file top la


def get_active_sessions(user, current_sid):
    now = timezone.now()

    sessions = list(
        UserSession.objects
        .filter(user=user, is_active=True)
        .exclude(expires_at__lt=now)
        .order_by("-created_at")[:SESSION_LIMIT]      # latest 30
    )

    # current device 30 kulla illa na, adhaiyum serthukkalaam
    if current_sid and not any(str(s.session_key) == str(current_sid) for s in sessions):
        current = UserSession.objects.filter(session_key=current_sid, user=user, is_active=True).first()
        if current:
            sessions.append(current)

    data = [
        {
            "id": s.id,
            "device_name": s.device_name,
            "device_type": s.device_type,
            "browser": s.browser,
            "os": s.os,
            "ip_address": s.ip_address,
            "location": s.location or "-",
            "login_time": s.created_at,
            "last_active_at": s.last_active_at,
            "status": "Active",
            "is_current": str(s.session_key) == str(current_sid),
        }
        for s in sessions
    ]

    return {"total": len(data), "sessions": data}


# ---------- LOGOUT ----------
def _close(qs, user, reason):
    return qs.update(
        is_active=False,
        logged_out_at=timezone.now(),
        logout_reason=reason,
        updated_by=str(user),
    )


def logout_session(user, session_id):
    qs = UserSession.objects.filter(id=session_id, user=user, is_active=True)
    if not qs.exists():
        raise NotFound("Session not found")
    _close(qs, user, "user")
    return "Session logged out successfully"


def logout_current(user, current_sid):
    if current_sid:
        _close(UserSession.objects.filter(session_key=current_sid, user=user, is_active=True), user, "user")
    return "Logged out successfully"


def logout_other_sessions(user, current_sid):
    qs = UserSession.objects.filter(user=user, is_active=True)
    if current_sid:
        qs = qs.exclude(session_key=current_sid)
    count = _close(qs, user, "other_sessions")
    return f"{count} session(s) logged out"