from django.db import models
from telecalling.models.delete_base_model import SafeDeleteModel
from .notifications_templates import NotificationTemplate
from .user import User

class NotificationLogs(SafeDeleteModel):
    user = models.ForeignKey(User,on_delete=models.CASCADE,null=True)
    notification_template = models.ForeignKey(NotificationTemplate,on_delete=models.CASCADE)
    notification_text = models.CharField(max_length=1200)
    html_message = models.CharField(max_length=1200,null=True)
    to_ids = models.CharField(max_length=100)
    subject = models.CharField(max_length=150)
    source = models.CharField(max_length=150)
    sent_by = models.CharField(max_length=150)
    status = models.CharField(max_length=100)
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user_id
    
    class Meta:
        db_table = 'adm_notification_logs'