from django.conf import settings
from .delete_base_model import SafeDeleteModel
from django.db import models



class LossLeadDetail(SafeDeleteModel):
    lead = models.OneToOneField(
        'Lead',
        on_delete=models.CASCADE,
        related_name='loss_detail'
    )

    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='loss_reports'
    )

    follow_up_days = models.PositiveIntegerField(default=0)

    main_reason_id = models.IntegerField(null=True, blank=True)

    loss_reason = models.ForeignKey(
        'telecalling.LossReason',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='loss_details'
    )

    detailed_reason = models.TextField(null=True)

    created_at = models.DateTimeField(auto_now_add=True, null=True)
    created_by = models.CharField(max_length=50, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    updated_by = models.CharField(max_length=50, null=True)

    class Meta:
        db_table = "telecalling_loss_lead_detail"

    def __str__(self):
        return f"Loss - Lead {self.lead_id} | {self.main_reason_id}"