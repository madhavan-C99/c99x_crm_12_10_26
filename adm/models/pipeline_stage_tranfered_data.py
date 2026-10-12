from django.db import models


class PipelineStageTranferedData(models.Model):
    original_stage_id = models.IntegerField()
    pipeline = models.ForeignKey('adm.PipelineCategory', on_delete=models.SET_NULL, null=True, blank=True)
    pipeline_name = models.CharField(max_length=150, null=True, blank=True)
    stage_name = models.CharField(max_length=150)
    stage_type = models.CharField(max_length=50, default="open")
    order_no = models.IntegerField(default=1)

    # Organization context
    organization = models.ForeignKey('adm.Organization', on_delete=models.SET_NULL, null=True, blank=True)
    organization_name = models.CharField(max_length=150, null=True, blank=True)

    # Tags snapshot
    tags_snapshot = models.JSONField(default=list, blank=True)

    # Leads transferred tracking
    leads_transferred_count = models.IntegerField(default=0)
    transferred_lead_ids = models.JSONField(default=list, blank=True)

    # Additional related data snapshots
    transferred_leads_snapshot = models.JSONField(default=list, blank=True)
    calls_snapshot = models.JSONField(default=list, blank=True)
    pending_followups_snapshot = models.JSONField(default=list, blank=True)
    payments_snapshot = models.JSONField(default=dict, blank=True)

    # Target destination info
    target_stage_id = models.IntegerField(null=True, blank=True)
    target_stage_name = models.CharField(max_length=150, null=True, blank=True)
    target_tag_id = models.IntegerField(null=True, blank=True)
    target_tag_name = models.CharField(max_length=150, null=True, blank=True)

    # Audit metadata & reasons
    deletion_reason = models.TextField(null=True, blank=True)
    deleted_by = models.CharField(max_length=150, default="admin")
    deleted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.stage_name} (Transferred at {self.deleted_at})"

    class Meta:
        db_table = "adm_pipeline_stage_tranfered_data"
        ordering = ["-deleted_at"]


# Backward compatibility alias
PipelineStageDeletedLog = PipelineStageTranferedData
