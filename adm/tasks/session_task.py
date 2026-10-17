import ipaddress
import logging
import requests
from huey.contrib.djhuey import task
from ..models.user_session import UserSession
logger = logging.getLogger(__name__)


@task()
def resolve_session_location(session_id, ip):
    try:
        if ipaddress.ip_address(ip).is_private:
            UserSession.objects.filter(id=session_id).update(location="Local Network")
            return

        res = requests.get(
            f"http://ip-api.com/json/{ip}?fields=status,city,country", timeout=5
        ).json()

        if res.get("status") == "success":
            location = ", ".join(x for x in [res.get("city"), res.get("country")] if x)
            UserSession.objects.filter(id=session_id).update(location=location)
    except Exception:
        logger.exception("Location lookup failed for session %s", session_id)
        