from django.db import models
from telecalling.models.delete_base_model import SafeDeleteModel


class WhatsAppConnection(SafeDeleteModel):
    # Note: 'organization' is inherited directly from SafeDeleteModel (maps to 'organization_id')
    token = models.CharField(max_length=64, unique=True, db_index=True)
    client_name = models.CharField(max_length=255, default="CRM Admin")
    whatsapp_number = models.CharField(max_length=30)  # e.g. "917639761616"

    pipeline = models.ForeignKey(
        'adm.PipelineCategory',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='whatsapp_connections'
    )
    campaign = models.ForeignKey(
        'telecalling.CampaignName',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='whatsapp_connections'
    )

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('inactive', 'Inactive'),
        ('active', 'Active'),
        ('revoked', 'Revoked')
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_leads_synced = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True, null=True)
    created_by = models.CharField(max_length=100, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    updated_by = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = "crm_whatsapp_connections"
        ordering = ['-id']

    @property
    def org(self):
        """Backward-compatible alias for organization"""
        return self.organization

    @org.setter
    def org(self, value):
        self.organization = value

    def __str__(self):
        return f"{self.client_name} - {self.whatsapp_number} ({self.token})"
