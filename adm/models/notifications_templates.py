from django.db import models
from telecalling.models.delete_base_model import SafeDeleteModel


class NotificationTemplate(SafeDeleteModel):
    key = models.CharField(max_length=50)
    template_body = models.CharField(max_length=5000)
    html_template_body = models.CharField(max_length=5000,null=True)
    subject = models.CharField(max_length=150)
    created_by = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return self.key
    
    class Meta:
        db_table = 'adm_notification_template'
        