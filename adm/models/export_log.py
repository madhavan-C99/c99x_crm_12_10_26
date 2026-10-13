from django.db import models
from django.conf import settings
from telecalling.models.delete_base_model import SafeDeleteModel


class ExportLog(SafeDeleteModel):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='export_logs'
    )
    report_key = models.CharField(max_length=100)
    report_type = models.CharField(max_length=100, default='Reports')
    campaign_name = models.CharField(max_length=150, null=True, blank=True)
    pipeline_name = models.CharField(max_length=150, null=True, blank=True)
    file_format = models.CharField(max_length=20, default='xlsx')        # 'xlsx', 'csv', 'pdf'
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    file_path = models.CharField(max_length=500, null=True, blank=True)
    file_name = models.CharField(max_length=255, null=True, blank=True)
    download_url = models.CharField(max_length=500, null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'adm_export_log'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.report_type} ({self.status}) - {self.user.username}"
