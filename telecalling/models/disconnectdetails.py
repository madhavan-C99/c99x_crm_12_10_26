from django.db import models
from .call_details import CallDetails
from .delete_base_model import SafeDeleteModel

class DisconnectedDetails(SafeDeleteModel):
    # --- FK to Main Call ---
    call = models.OneToOneField(CallDetails, on_delete=models.CASCADE, related_name='disconnection_info')
    
    # --- Disconnection Reasons ---
    select_tag_name = models.CharField(max_length=100, null=True, blank=True)
    other_reason=models.TextField(null=True,blank=True,default=None)
    # --- Retry Strategy ---
    retry_notes = models.TextField(null=True, blank=True)
    created_at=models.DateTimeField(auto_now_add=True,null=True)
    created_by=models.CharField(max_length=50,null=True)
    updated_at=models.DateTimeField(auto_now=True,null=True)
    updated_by=models.CharField(max_length=50,null=True)

    def __str__(self):
        return f"Disconnected: {self.call.lead.full_name}"
    
    class Meta:
        db_table = 'telecalling_disconnect_details'