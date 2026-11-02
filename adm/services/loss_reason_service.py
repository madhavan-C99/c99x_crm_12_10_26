from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import ValidationError

from adm.services.query_services import exec_raw_sql
from telecalling.models import LossReason


def fetch_loss_reasons_admin_service(user=None, data=None):
    data = data or {}
    opt_filter = {}

    if user and getattr(user, 'organization_id', None):
        opt_filter['organization_id'] = user.organization_id

    if data.get('pipeline_id'):
        opt_filter['pipeline_id'] = data.get('pipeline_id')
    elif data.get('pipeline_category_id'):
        opt_filter['pipeline_id'] = data.get('pipeline_category_id')

    res_options = exec_raw_sql('L_LOSS_REASONS', opt_filter)
    return res_options or []


def create_loss_reason_admin_service(admin_user, data):
    name = (data.get('name') or '').strip()
    if not name:
        raise ValidationError("Loss reason name is required.")

    org = getattr(admin_user, 'organization', None) if admin_user else None
    created_by_str = (admin_user.get_full_name() or admin_user.username) if admin_user else "Admin"

    existing_qs = LossReason.objects.filter(name__iexact=name)
    if org:
        existing_qs = existing_qs.filter(Q(organization__isnull=True) | Q(organization=org))

    if existing_qs.exists():
        obj = existing_qs.first()
        if not obj.is_active:
            obj.is_active = True
            obj.updated_by = created_by_str
            obj.save(update_fields=['is_active', 'updated_by'])
            return {
                "id": obj.id,
                "name": obj.name,
                "is_active": obj.is_active,
                "message": "Loss reason reactivated successfully."
            }
        raise ValidationError(f"Loss reason '{name}' already exists.")

    obj = LossReason.objects.create(
        name=name,
        is_active=True,
        organization=org,
        created_by=created_by_str,
        updated_by=created_by_str
    )
    return {
        "id": obj.id,
        "name": obj.name,
        "is_active": obj.is_active,
        "message": "Loss reason created successfully."
    }


def update_loss_reason_admin_service(admin_user, data):
    reason_id = data.get('id') or data.get('loss_reason_id')
    if not reason_id:
        raise ValidationError("Loss reason ID is required.")

    obj = LossReason.objects.filter(id=reason_id).first()
    if not obj:
        raise ValidationError("Loss reason not found.")

    updated_by_str = (admin_user.get_full_name() or admin_user.username) if admin_user else "Admin"
    update_fields = ['updated_by']
    obj.updated_by = updated_by_str

    if data.get('name') and str(data['name']).strip():
        new_name = str(data['name']).strip()
        if LossReason.objects.filter(name__iexact=new_name).exclude(id=obj.id).exists():
            raise ValidationError(f"Loss reason with name '{new_name}' already exists.")
        obj.name = new_name
        update_fields.append('name')

    if 'is_active' in data and data['is_active'] is not None:
        obj.is_active = bool(data['is_active'])
        update_fields.append('is_active')

    obj.save(update_fields=update_fields)

    return {
        "id": obj.id,
        "name": obj.name,
        "is_active": obj.is_active,
        "message": "Loss reason updated successfully."
    }


def get_loss_reasons_by_pipeline_service(pipeline_id):
    if not pipeline_id:
        raise ValidationError("pipeline_id is required.")

    reasons = LossReason.objects.filter(
        pipeline_id=pipeline_id,
        is_active=True
    ).order_by('id')

    return [
        {
            "id": r.id,
            "pipeline_id": r.pipeline_id,
            "reason": r.name
        }
        for r in reasons
    ]


def add_loss_reason_by_pipeline_service(pipeline_id, reason_text, user=None):
    if not pipeline_id:
        raise ValidationError("pipeline_id is required.")
    reason_clean = (reason_text or "").strip()
    if not reason_clean:
        raise ValidationError("reason is required.")

    org = getattr(user, 'organization', None) if user else None
    created_by_str = (user.get_full_name() or user.username) if user else "Admin"

    existing = LossReason.objects.filter(
        pipeline_id=pipeline_id,
        name__iexact=reason_clean
    ).first()

    if existing:
        if not existing.is_active:
            existing.is_active = True
            existing.updated_by = created_by_str
            existing.save(update_fields=['is_active', 'updated_by'])
            return {
                "id": existing.id,
                "pipeline_id": existing.pipeline_id,
                "reason": existing.name,
                "message": f"Loss reason reactivated successfully for pipeline {pipeline_id}."
            }
        raise ValidationError(f"Loss reason '{reason_clean}' already exists for this pipeline.")

    obj = LossReason.objects.create(
        name=reason_clean,
        pipeline_id=pipeline_id,
        is_active=True,
        organization=org,
        created_by=created_by_str,
        updated_by=created_by_str
    )

    return {
        "id": obj.id,
        "pipeline_id": obj.pipeline_id,
        "reason": obj.name,
        "message": f"Loss reason added successfully for pipeline {pipeline_id}."
    }


def delete_loss_reason_by_pipeline_service(pipeline_id, reason_id=None, reason_text=None, user=None):
    if not pipeline_id:
        raise ValidationError("pipeline_id is required.")

    qs = LossReason.objects.filter(pipeline_id=pipeline_id)
    if reason_id:
        obj = qs.filter(id=reason_id).first()
    elif reason_text:
        obj = qs.filter(name__iexact=str(reason_text).strip()).first()
    else:
        raise ValidationError("reason_id or reason is required.")

    if not obj:
        raise ValidationError("Loss reason not found for the given pipeline.")

    user_id = getattr(user, 'id', None) if user else None
    obj.save_delete(user_id=user_id)

    return {
        "id": obj.id,
        "pipeline_id": pipeline_id,
        "message": "Loss reason deleted successfully."
    }
