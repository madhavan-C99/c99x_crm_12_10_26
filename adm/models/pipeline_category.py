from django.db import models
from django.conf import settings
from telecalling.models.delete_base_model import SafeDeleteModel

class PipelineCategory(SafeDeleteModel):
    category_name = models.CharField(max_length=100)
    display_name = models.CharField(max_length=100, null=True, blank=True)
    organization = models.ForeignKey('adm.Organization', on_delete=models.SET_NULL, null=True, blank=True, related_name='pipeline_categories')
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    created_by = models.CharField(max_length=50, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    updated_by = models.CharField(max_length=50, null=True)

    def __str__(self):
        return str(self.category_name)

    class Meta:
        db_table = 'adm_pipeline_category'