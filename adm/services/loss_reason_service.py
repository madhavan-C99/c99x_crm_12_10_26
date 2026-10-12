from adm.services.query_services import exec_raw_sql
from telecalling.models import LossReason
from rest_framework.exceptions import APIException
from django.db.models import Q


def fetch_loss_reasons_admin_service(user=None, data=None):
    try:
        data = data or {}
        opt_filter = {}

        if user and getattr(user, 'organization_id', None):
            opt_filter['organization_id'] = user.organization_id

        res_options = exec_raw_sql('L_LOSS_REASONS', opt_filter)

        return {
            "status": True,
            "message": "Loss reasons fetched successfully",
            "data": res_options or []
        }
    except Exception as e:
        raise APIException(str(e))


def create_loss_reason_admin_service(admin_user, data):
    try:
        name = data.get('name', '').strip()
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
                obj.save()
                return {"status": True, "message": "Loss reason reactivated successfully", "id": obj.id}
            raise APIException(f"Loss reason '{name}' already exists")

        obj = LossReason.objects.create(
            name=name,
            is_active=True,
            organization=org,
            created_by=created_by_str,
            updated_by=created_by_str
        )
        return {
            "status": True,
            "message": "Loss reason created successfully",
            "data": {
                "id": obj.id,
                "name": obj.name,
                "is_active": obj.is_active
            }
        }
    except Exception as e:
        raise APIException(str(e))


def update_loss_reason_admin_service(admin_user, data):
    try:
        reason_id = data.get('id') or data.get('loss_reason_id')
        if not reason_id:
            raise APIException("loss_reason_id or id is required")

        obj = LossReason.objects.filter(id=reason_id).first()
        if not obj:
            raise APIException("Loss reason not found")

        updated_by_str = (admin_user.get_full_name() or admin_user.username) if admin_user else "Admin"

        if data.get('name') and str(data['name']).strip():
            obj.name = str(data['name']).strip()

        if 'is_active' in data and data['is_active'] is not None:
            obj.is_active = bool(data['is_active'])

        obj.updated_by = updated_by_str
        obj.save()

        return {
            "status": True,
            "message": "Loss reason updated successfully",
            "data": {
                "id": obj.id,
                "name": obj.name,
                "is_active": obj.is_active
            }
        }
    except Exception as e:
        raise APIException(str(e))


def get_loss_reasons_by_pipeline_service(pipeline_id):
    try:
        if not pipeline_id:
            raise APIException("pipeline_id is required")

        reasons = LossReason.objects.filter(
            pipeline_id=pipeline_id,
            is_active=True
        ).order_by('id')

        data = [
            {
                "id": r.id,
                "pipeline_id": r.pipeline_id,
                "reason": r.name
            }
            for r in reasons
        ]

        return {
            "status": "success",
            "pipeline_id": int(pipeline_id),
            "data": data
        }
    except Exception as e:
        raise APIException(str(e))


def add_loss_reason_by_pipeline_service(pipeline_id, reason_text, user=None):
    try:
        if not pipeline_id:
            raise APIException("pipeline_id is required")
        if not reason_text or not str(reason_text).strip():
            raise APIException("reason is required")

        reason_clean = str(reason_text).strip()
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
                existing.save()
                return {
                    "status": "success",
                    "message": f"Loss reason added successfully for pipeline {pipeline_id}",
                    "data": {
                        "id": existing.id,
                        "pipeline_id": existing.pipeline_id,
                        "reason": existing.name
                    }
                }
            raise APIException(f"Loss reason '{reason_clean}' already exists for this pipeline")

        obj = LossReason.objects.create(
            name=reason_clean,
            pipeline_id=pipeline_id,
            is_active=True,
            organization=org,
            created_by=created_by_str,
            updated_by=created_by_str
        )

        return {
            "status": "success",
            "message": f"Loss reason added successfully for pipeline {pipeline_id}",
            "data": {
                "id": obj.id,
                "pipeline_id": obj.pipeline_id,
                "reason": obj.name
            }
        }
    except Exception as e:
        raise APIException(str(e))


def delete_loss_reason_by_pipeline_service(pipeline_id, reason_id=None, reason_text=None, user=None):
    try:
        if not pipeline_id:
            raise APIException("pipeline_id is required")

        qs = LossReason.objects.filter(pipeline_id=pipeline_id)

        if reason_id:
            obj = qs.filter(id=reason_id).first()
        elif reason_text:
            obj = qs.filter(name__iexact=str(reason_text).strip()).first()
        else:
            raise APIException("reason_id or reason is required")

        if not obj:
            raise APIException("Loss reason not found for the given pipeline")

        user_id = getattr(user, 'id', None) if user else None
        obj.save_delete(user_id=user_id)

        return {
            "status": "success",
            "message": "Loss reason deleted successfully"
        }
    except Exception as e:
        raise APIException(str(e))
