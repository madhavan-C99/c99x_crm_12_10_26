from django.db import models
from telecalling.models.delete_base_model import SafeDeleteModel

class PaymentMode(SafeDeleteModel):
    name = models.CharField(max_length=100)                       # e.g., 'Cash', 'UPI'
    code = models.CharField(max_length=50, null=True, blank=True)   # e.g., 'cash', 'upi'
    category = models.CharField(max_length=50, default='Online')    # 'Online' or 'Offline'
    organization = models.ForeignKey(
        'adm.Organization', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='payment_modes'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    created_by = models.CharField(max_length=50, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    updated_by = models.CharField(max_length=50, null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'adm_payment_mode'
