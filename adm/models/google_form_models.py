import uuid
from django.db import models
from telecalling.models.delete_base_model import SafeDeleteModel


class GoogleFormConnection(SafeDeleteModel):
    # Note: 'organization' is inherited directly from SafeDeleteModel (maps to 'organization_id')
    uid = models.CharField(max_length=64, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    
    pipeline = models.ForeignKey('adm.PipelineCategory', on_delete=models.CASCADE, related_name='google_form_connections')
    campaign = models.ForeignKey('telecalling.CampaignName', on_delete=models.SET_NULL, null=True, blank=True, related_name='google_form_connections')

    webhook_url = models.TextField(blank=True, null=True)
    secret = models.CharField(max_length=100)

    STATUS_CHOICES = [
        ('waiting', 'Waiting'),
        ('active', 'Active'),
        ('error', 'Error')
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')

    total_leads_synced = models.IntegerField(default=0)
    failed_leads_count = models.IntegerField(default=0)

    # 📌 Complete Audit Trail
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    created_by = models.CharField(max_length=100, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    updated_by = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = "crm_google_form_connections"
        ordering = ['-id']

    @property
    def org(self):
        """Backward-compatible alias for organization"""
        return self.organization

    @org.setter
    def org(self, value):
        self.organization = value

    def __str__(self):
        return f"{self.name} ({self.uid}) - {self.status}"
