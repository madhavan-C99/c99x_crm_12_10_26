import uuid
from django.db import models
from telecalling.models.delete_base_model import SafeDeleteModel


# 1. 👤 Facebook Accounts (Per Organization)
class FBAccount(SafeDeleteModel):
    org = models.ForeignKey('adm.Organization', on_delete=models.CASCADE, related_name='fb_accounts')
    fb_user_id = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    user_token = models.TextField()  # 🔒 Fernet Encrypted Token
    token_expires_at = models.DateTimeField(null=True, blank=True)

    # Audit Trail
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    created_by = models.CharField(max_length=100, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    updated_by = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = "fb_accounts"
        unique_together = ('org', 'fb_user_id')

    def __str__(self):
        return f"{self.name} ({self.fb_user_id})"


# 2. 🔗 Facebook Page Connections (Per-page routing & config)
class FBConnection(SafeDeleteModel):
    org = models.ForeignKey('adm.Organization', on_delete=models.CASCADE, related_name='fb_connections')
    uid = models.CharField(max_length=64, unique=True, default=uuid.uuid4, db_index=True)
    fb_account = models.ForeignKey(FBAccount, on_delete=models.CASCADE, related_name='connections')
    page_id = models.CharField(max_length=100, db_index=True)
    page_name = models.CharField(max_length=255)
    page_token = models.TextField()  # 🔒 Fernet Encrypted Page Token

    ROUTING_CHOICES = [
        ('new', 'New Campaign'),
        ('existing', 'Existing Campaign'),
        ('rules', 'Rules Based')
    ]
    routing_type = models.CharField(max_length=20, choices=ROUTING_CHOICES, default='existing')
    campaign = models.ForeignKey('telecalling.CampaignName', on_delete=models.SET_NULL, null=True, blank=True, related_name='fb_connections')
    rules = models.JSONField(default=list, blank=True)  # [{contains: "Python", campaign_id: 12}]
    fallback_campaign = models.ForeignKey('telecalling.CampaignName', on_delete=models.SET_NULL, null=True, blank=True, related_name='fb_fallback_connections')

    pipeline = models.ForeignKey('adm.PipelineCategory', on_delete=models.CASCADE, related_name='fb_connections')
    field_mapping = models.JSONField(null=True, blank=True)

    FORM_MODE_CHOICES = [
        ('specific', 'Specific Forms'),
        ('all', 'All Forms')
    ]
    form_mode = models.CharField(max_length=20, choices=FORM_MODE_CHOICES, default='all')

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('reauth_required', 'Re-auth Required'),
        ('error', 'Error')
    ]
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='active')

    # Audit Trail
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    created_by = models.CharField(max_length=100, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    updated_by = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = "fb_connections"
        unique_together = ('org', 'page_id')

    def __str__(self):
        return f"{self.page_name} ({self.routing_type})"


# 3. 📝 Connection Selected Forms
class FBConnectionForm(SafeDeleteModel):
    connection = models.ForeignKey(FBConnection, on_delete=models.CASCADE, related_name='forms')
    form_id = models.CharField(max_length=100, db_index=True)
    form_name = models.CharField(max_length=255)

    created_at = models.DateTimeField(auto_now_add=True, null=True)
    created_by = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = "fb_connection_forms"
        unique_together = ('connection', 'form_id')


# 4. 📜 Lead Intake Logs & Idempotency
class FBLeadLog(SafeDeleteModel):
    connection = models.ForeignKey(FBConnection, on_delete=models.SET_NULL, null=True, blank=True, related_name='logs')
    leadgen_id = models.CharField(max_length=100, unique=True, db_index=True)
    form_id = models.CharField(max_length=100, null=True, blank=True)

    STATUS_CHOICES = [
        ('created', 'Created'),
        ('duplicate', 'Duplicate'),
        ('skipped', 'Skipped'),
        ('failed', 'Failed')
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    error = models.TextField(null=True, blank=True)
    raw_payload = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        db_table = "fb_lead_log"
