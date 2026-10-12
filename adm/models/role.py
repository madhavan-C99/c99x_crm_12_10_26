from django.db import models
from telecalling.models.delete_base_model import SafeDeleteModel
from .perms import Perm


class Role(SafeDeleteModel):
    
    name = models.CharField(max_length=50, unique=True)
    display_value = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(null=True, blank=True)
    
    # ManyToMany to Perm mapped to db_table='adm_role_perms'
    perms = models.ManyToManyField(Perm, related_name="roles", db_table="adm_role_perms")
    
    # Audit & Timestamp Fields
    created_by = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_by = models.CharField(max_length=100, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "adm_role"
        verbose_name = "Role"
        verbose_name_plural = "Roles"
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["code"]),
        ]

    def __str__(self):
        return f"{self.display_value} ({self.code})"
