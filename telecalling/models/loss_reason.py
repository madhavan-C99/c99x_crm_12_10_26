from django.db import models
from .delete_base_model import SafeDeleteModel


class LossReason(SafeDeleteModel):
    name = models.CharField(max_length=150)
    pipeline = models.ForeignKey(
        'adm.PipelineCategory',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='loss_reasons'
    )
    is_active = models.BooleanField(default=True)
    organization = models.ForeignKey(
        'adm.Organization',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='loss_reasons'
    )

    created_at = models.DateTimeField(auto_now_add=True, null=True)
    created_by = models.CharField(max_length=100, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    updated_by = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = "telecalling_loss_reason"
        ordering = ["id"]

    def __str__(self):
        return str(self.name)
