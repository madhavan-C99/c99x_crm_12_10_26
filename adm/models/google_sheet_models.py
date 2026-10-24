import uuid
from django.db import models
from telecalling.models.delete_base_model import SafeDeleteModel


# 1. 👤 Connected Google Accounts (OAuth Storage)
class GoogleAccount(SafeDeleteModel):
    org = models.ForeignKey('adm.Organization', on_delete=models.CASCADE, related_name='google_accounts')
    google_user_id = models.CharField(max_length=150, db_index=True)
    google_email = models.CharField(max_length=255)
    name = models.CharField(max_length=255, default="Google User")
    refresh_token = models.TextField()  # 🔒 Fernet AES-128 Encrypted Refresh Token
    token_expires_at = models.DateTimeField(null=True, blank=True)

    # 📌 Complete Audit Trail
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    created_by = models.CharField(max_length=100, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    updated_by = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = "adm_google_account"
        unique_together = ('org', 'google_user_id')

    def __str__(self):
        return f"{self.google_email} ({self.name})"


# 2. 🔗 Google Sheet Connections (Per-Sheet & Tab Routing)
class GoogleSheetConnection(SafeDeleteModel):
    org = models.ForeignKey('adm.Organization', on_delete=models.CASCADE, related_name='google_sheet_connections')
    uid = models.CharField(max_length=64, unique=True, default=uuid.uuid4, db_index=True)
    google_account = models.ForeignKey(GoogleAccount, on_delete=models.CASCADE, related_name='connections')
    
    spreadsheet_id = models.CharField(max_length=255, db_index=True)
    spreadsheet_name = models.CharField(max_length=255)
    sheet_tab_name = models.CharField(max_length=100, default="Sheet1")
    
    # 📌 Row Tracking (கடைசியாக எந்த Row வரை sync ஆனது என்பதை டிராக் செய்ய)
    last_synced_row = models.IntegerField(default=1)

    pipeline = models.ForeignKey('adm.PipelineCategory', on_delete=models.CASCADE, related_name='google_sheet_connections')
    campaign = models.ForeignKey('telecalling.CampaignName', on_delete=models.SET_NULL, null=True, blank=True, related_name='google_sheet_connections')
    
    field_mapping = models.JSONField(default=dict, blank=True)
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('error', 'Error')
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    # 📌 Complete Audit Trail
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    created_by = models.CharField(max_length=100, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    updated_by = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = "adm_google_sheet_connection"
        unique_together = ('org', 'spreadsheet_id', 'sheet_tab_name')

    def __str__(self):
        return f"{self.spreadsheet_name} - {self.sheet_tab_name} ({self.status})"


# 3. 📜 Sheet Ingestion Logs & Idempotency (டூப்ளிகேட் லீட் தடுப்பு)
class GoogleSheetLeadLog(SafeDeleteModel):
    connection = models.ForeignKey(GoogleSheetConnection, on_delete=models.CASCADE, related_name='logs')
    row_number = models.IntegerField(db_index=True)
    row_hash = models.CharField(max_length=64, unique=True, db_index=True)  # Hash of (spreadsheet_id + row_number + phone)
    
    STATUS_CHOICES = [
        ('created', 'Created'),
        ('duplicate', 'Duplicate'),
        ('skipped', 'Skipped'),
        ('failed', 'Failed')
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    error = models.TextField(null=True, blank=True)
    raw_payload = models.JSONField(null=True, blank=True)
    
    # 📌 Complete Audit Trail
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    created_by = models.CharField(max_length=100, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    updated_by = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = "adm_google_sheet_lead_log"
