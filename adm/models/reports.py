from django.db import models
from telecalling.models.delete_base_model import SafeDeleteModel
from .user import User


class ReportCatalog(SafeDeleteModel):
    report_name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100)
    report_key = models.CharField(max_length=100, unique=True, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True, null=True)
    created_by = models.CharField(max_length=50, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    updated_by = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"{self.report_name} ({self.category})"

    class Meta:
        db_table = 'adm_report_catalog'
        ordering = ['id']


class UserRecentReport(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='recent_reports'
    )
    report = models.ForeignKey(
        ReportCatalog,
        on_delete=models.CASCADE,
        related_name='user_views'
    )
    viewed_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'adm_user_recent_report'
        ordering = ['-viewed_at']
        unique_together = ('user', 'report')

    def __str__(self):
        return f"{self.user} viewed {self.report.report_name}"
