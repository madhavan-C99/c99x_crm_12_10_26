from django.db import models
from rest_framework.exceptions import PermissionDenied, APIException
from adm.models import Perm, PermGroup, Role, UserRole
import logging

logger = logging.getLogger('django')


def authorize_request(perm_name: str, user):
    """
    TL's Exact MoneyShift Authorization Helper:
    1. Superuser / Developer role gets 100% Super-Access instantly.
    2. Checks if perm_name exists in user's assigned permissions.
    3. Raises PermissionDenied if unauthorized.
    """
    try:
        if not user or not user.is_authenticated:
            raise PermissionDenied("Authentication required. Please login.")

        # 💻 Admin & Developer Super-Access Check (Instant 100% Access)
        user_role_obj = user.user_roles.select_related('role').first() if hasattr(user, 'user_roles') else None
        role_obj = user_role_obj.role if user_role_obj else None
        if role_obj:
            r_code = str(role_obj.code or '').upper()
            r_name = str(role_obj.name or '').lower()
            if r_code in ['DEV', 'ADMIN', 'SUPERADMIN'] or r_name in ['developer', 'admin', 'superadmin', 'super admin'] or getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False):
                return True
        elif getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False):
            return True

        # 📞 User Permissions Check by Name
        user_perms = user.get_perms() if hasattr(user, 'get_perms') else []
        if perm_name in user_perms:
            return True
        else:
            raise PermissionDenied(f"Not Authorized to use this API: '{perm_name}'")

    except PermissionDenied as pd:
        raise pd
    except Exception as e:
        raise APIException(str(e))


def create_permission(user_name, **data):

    try:
        new_perm = Perm.objects.create(
            name=data.get('name'),
            display_value=data.get('display_value'),
            code=data.get('code'),
            perm_group=data.get('perm_group', 'perm_apis'),
            created_by=user_name
        )

        # Auto-assign newly created permission to Developer (DEV) role
        dev_role = Role.objects.filter(code="DEV").first()
        if dev_role is not None:
            dev_role.perms.add(new_perm)

        return new_perm.name

    except Exception as e:
        raise APIException(str(e))


def assign_permission_to_role(**data):
   
    try:
        role_id = data.get('role_id')
        perm_id = data.get('perm_id')
        user_name = data.get('user_name', 'system')

        role_obj = Role.objects.get(id=role_id)
        perm_obj = Perm.objects.get(id=perm_id)

        role_obj.perms.add(perm_obj)
        return f"Assigned {perm_obj.code} to {role_obj.name}"

    except Exception as e:
        raise APIException(str(e))


def fetch_perms_list():
   
    try:
        perms = Perm.objects.filter(perm_group="perm_apis").values('id', 'name', 'display_value', 'code', 'perm_group', 'created_at')
        return list(perms)
    except Exception as e:
        raise APIException(str(e))


def fetch_roles_list():
  
    try:
        roles = Role.objects.all().values('id', 'name', 'display_value', 'code', 'description', 'created_at')
        return list(roles)
    except Exception as e:
        raise APIException(str(e))


def get_roles_and_permissions_service(user=None):
   
    try:
        # 1. Dynamically query all roles from adm_role DB table (excluding DEV developer role)
        db_roles = Role.objects.prefetch_related('perms').exclude(code__in=['DEV', 'DEVELOPER']).order_by('id')

        roles_list = []
        role_perms_map = {}

        for r in db_roles:
            role_code_upper = str(r.code or '').upper()
            role_name_lower = str(r.name or '').lower()

            if role_code_upper in ['ADM', 'ADMIN', 'ORG_ADMIN'] or role_name_lower in ['admin', 'org_admin']:
                role_id = 'org_admin'
                role_display_name = 'Org Admin'
            else:
                role_id = role_name_lower.replace(' ', '_')
                role_display_name = r.display_value or r.name

            roles_list.append({
                "id": role_id,
                "name": role_display_name
            })

            perm_ids = set(r.perms.values_list('id', flat=True))
            role_perms_map[role_id] = {
                "code": role_code_upper,
                "perm_ids": perm_ids
            }

        # 2. Dynamically query all PermGroups and Perms from DB (excluding developer internal query/testing/helper APIs)
        EXCLUDED_DEV_PERMS = {
            'api_collection_query', 'api_add_perm', 'api_fetch_perms_list',
            'api_fetch_roles_list', 'api_assign_role_perm', 'api_testing_notifiy',
            'api_whatsapp_webhook', 'api_export_column', 'api_export_json_data',
            'api_filter_options_view_admin', 'api_get_filter_dropdowns_admin',
            'api_get_select_option', 'api_get_selected_option',
            'api_notification_api', 'api_mark_notification_read',
            'api_coursename', 'api_get_all_settings_api'
        }
        groups = PermGroup.objects.all().prefetch_related('permissions').order_by('id')

        categories_list = []
        for group in groups:
            group_perms = group.permissions.exclude(code__in=EXCLUDED_DEV_PERMS).order_by('id')
            if not group_perms.exists():
                continue

            perm_objects = []

            for perm in group_perms:
                perm_id = (perm.code or perm.name or '').lower()
                perm_name = perm.display_value or perm.name

                values_dict = {}
                for role_id, r_info in role_perms_map.items():
                    # Org Admin / Super Admin role gets True for all perms
                    if r_info['code'] in ['ADM', 'DEV', 'ORG_ADMIN'] or role_id in ['org_admin', 'admin']:
                        values_dict[role_id] = True
                    else:
                        values_dict[role_id] = perm.id in r_info['perm_ids']

                perm_objects.append({
                    "id": perm_id,
                    "name": perm_name,
                    "info": f"Allows {perm_name.lower()}",
                    "values": values_dict
                })

            categories_list.append({
                "id": (group.code or '').lower(),
                "name": group.display_value or group.name,
                "permissions": perm_objects
            })

        return {
            "roles": roles_list,
            "categories": categories_list
        }

    except Exception as e:
        logger.error(f"Error in get_roles_and_permissions_service: {str(e)}", exc_info=True)
        raise APIException(str(e))


def create_role_matrix_service(admin_user, data):
    
    try:
        name = (data.get('name') or '').strip()
        duplicate_from = (data.get('duplicate_from') or '').strip()

        if not name:
            return {
                "status": False,
                "message": "Role name is required"
            }

        if not duplicate_from:
            return {
                "status": False,
                "message": "duplicate_from is required. Please select a base role to copy permissions from."
            }

        dup_key = duplicate_from.lower()
        source_role = Role.objects.filter(
            models.Q(name__iexact=dup_key) | 
            models.Q(code__iexact=dup_key) |
            models.Q(name__iexact=dup_key.replace('_', ' '))
        ).first()

        if not source_role:
            return {
                "status": False,
                "message": f"Selected base role '{duplicate_from}' does not exist."
            }

        role_id_key = name.lower().replace(' ', '_')
        role_code = role_id_key.upper()[:50]

        if Role.objects.filter(name__iexact=name).exists() or Role.objects.filter(code__iexact=role_code).exists():
            return {
                "status": False,
                "message": f"Role name '{name}' already exists"
            }

        user_name = admin_user.username if admin_user and admin_user.is_authenticated else 'system'

        new_role = Role.objects.create(
            name=role_id_key,
            display_value=name,
            code=role_code,
            description=f"Custom role created from {source_role.display_value or source_role.name}",
            created_by=user_name
        )

        source_perms = list(source_role.perms.all())
        new_role.perms.set(source_perms)

        created_at_iso = new_role.created_at.strftime('%Y-%m-%dT%H:%M:%SZ') if new_role.created_at else None

        return {
            "status": True,
            "message": "Role created successfully",
            "data": {
                "id": role_id_key,
                "name": new_role.display_value or new_role.name,
                "duplicate_from": duplicate_from,
                "created_at": created_at_iso
            }
        }

    except Exception as e:
        logger.error(f"Error in create_role_matrix_service: {str(e)}", exc_info=True)
        return {
            "status": False,
            "message": str(e)
        }


def update_role_permission_service(admin_user, data):
   
    try:
        role_id = (data.get('role_id') or '').strip()
        category_id = (data.get('category_id') or '').strip()
        permission_id = (data.get('permission_id') or '').strip()
        has_permission = bool(data.get('has_permission'))

        if not role_id or not permission_id:
            return {
                "status": False,
                "message": "Invalid role or permission ID"
            }

        # 1. Match Role in Database
        role_key = role_id.lower()
        if role_key in ['org_admin', 'admin', 'adm']:
            role_obj = Role.objects.filter(models.Q(code__iexact='ADM') | models.Q(name__iexact='admin') | models.Q(name__iexact='org_admin')).first()
        else:
            role_obj = Role.objects.filter(
                models.Q(name__iexact=role_key) | 
                models.Q(code__iexact=role_key) |
                models.Q(name__iexact=role_key.replace('_', ' '))
            ).first()

        if not role_obj:
            return {
                "status": False,
                "message": "Invalid role or permission ID"
            }

        # 2. Match Permission in Database
        perm_key = permission_id.lower()
        perm_obj = Perm.objects.filter(
            models.Q(code__iexact=perm_key) | 
            models.Q(name__iexact=perm_key)
        ).first()

        if not perm_obj:
            return {
                "status": False,
                "message": "Invalid role or permission ID"
            }

        # 3. Grant (add) or Revoke (remove) permission link in adm_role_perms table
        user_name = admin_user.username if admin_user and admin_user.is_authenticated else 'system'

        if has_permission:
            role_obj.perms.add(perm_obj)
        else:
            role_obj.perms.remove(perm_obj)

        role_obj.updated_by = user_name
        role_obj.save()

        return {
            "status": True,
            "message": "Permission updated successfully",
            "data": {
                "role_id": role_id,
                "category_id": category_id,
                "permission_id": permission_id,
                "has_permission": has_permission
            }
        }

    except Exception as e:
        logger.error(f"Error in update_role_permission_service: {str(e)}", exc_info=True)
        return {
            "status": False,
            "message": str(e)
        }


