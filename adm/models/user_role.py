from django.db import models
from telecalling.models.delete_base_model import SafeDeleteModel
from .role import Role


class UserRole(SafeDeleteModel):
   
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name="user_roles")
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="role_users")

    class Meta:
        db_table = "adm_user_role"
        verbose_name = "User Role"
        verbose_name_plural = "User Roles"
        unique_together = ("user", "role")
