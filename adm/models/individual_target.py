from django.db import models
from django.conf import settings
from telecalling.models.delete_base_model import SafeDeleteModel

class IndividualTarget(SafeDeleteModel):
    organization = models.ForeignKey(
        'adm.Organization',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='individual_targets'
    )
    telecaller = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='individual_monthly_targets'
    )
    team = models.ForeignKey(
        'adm.Team',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='member_individual_targets'
    )
    target_month = models.DateField(null=False)
    target_admissions = models.IntegerField(default=0, null=False)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, default=0.0)
    target_calls = models.IntegerField(default=0, null=False)
    
    # Audit trail fields
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    created_by = models.CharField(max_length=100, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    updated_by = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = 'adm_individual_target'

    def __str__(self):
        return f"Individual Target for {self.telecaller.username} ({self.target_month.strftime('%Y-%m')})"
