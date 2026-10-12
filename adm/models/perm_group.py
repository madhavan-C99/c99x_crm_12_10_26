from django.db import models

class PermGroup(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    display_value = models.CharField(max_length=100, null=True, blank=True)
    organization = models.ForeignKey('adm.Organization', on_delete=models.SET_NULL, null=True, blank=True)
    pipeline = models.ForeignKey('adm.PipelineCategory', on_delete=models.SET_NULL, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, null=True)
    created_by = models.CharField(max_length=100, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    updated_by = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = 'adm_perm_group'

    def __str__(self):
        return f"{self.display_value or self.name} ({self.code})"
