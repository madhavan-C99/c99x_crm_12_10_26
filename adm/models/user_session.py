import uuid
from django.conf import settings
from django.db import models
from telecalling.models.delete_base_model import SafeDeleteModel


class UserSession(SafeDeleteModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="login_sessions",
    )
    organization = models.ForeignKey(
        "adm.Organization", 
        on_delete=models.CASCADE,
        related_name="login_sessions",  
        )
    session_key = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    device_name = models.CharField(max_length=100, null=True, blank=True)   # "Windows, Chrome" / "iPhone"
    device_type = models.CharField(max_length=20, null=True, blank=True)    # Desktop / Mobile / Tablet
    browser = models.CharField(max_length=50, null=True, blank=True)
    os = models.CharField(max_length=50, null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    location = models.CharField(max_length=150, null=True, blank=True)      # "Chennai, India"

    last_active_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    logged_out_at = models.DateTimeField(null=True, blank=True)
    logout_reason = models.CharField(max_length=30, null=True, blank=True)  # user / other_sessions / expired

    created_at = models.DateTimeField(auto_now_add=True, null=True)         # login time
    created_by = models.CharField(max_length=50, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    updated_by = models.CharField(max_length=50, null=True)

    class Meta:
        db_table = "adm_user_session"
        indexes = [models.Index(fields=["user", "is_active"])]