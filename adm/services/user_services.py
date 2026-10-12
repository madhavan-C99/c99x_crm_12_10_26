import datetime
import uuid
import logging
from rest_framework.exceptions import APIException, AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q
from adm.models import User, Role, UserRole, Team, campaign_assigned_agent, Organization, AdminApprovedLossLead, AdminLeadReassignHistory
from telecalling.models import Lead, CampaignName, CallDetails, FollowUp, PipelineStage, DeletedDataLog
from adm.services.lead_services import get_user_display_name
import math


logger = logging.getLogger('django')


def create_user(user_name, **data):
    try:
        user = User.objects.filter(email=data.get('email')).first()
        if user is not None:
            raise APIException("Email id Already exists")

        number = None
        if data.get('mobile_number'):
            number = User.objects.filter(mobile=data.get('mobile_number')).first()
        if number is not None:
            raise APIException("Mobile is Already exists")

        user = User.objects.create_user(data.get('email'), data.get('email'), data.get('password'))
        if data.get('role_id'):
            role_obj = Role.objects.filter(id=data.get('role_id')).first()
            if role_obj:
                UserRole.objects.get_or_create(user=user, role=role_obj)

        user.first_name = data.get('first_name')
        user.last_name = data.get('last_name')
        user.is_active = True
        user.mobile = data.get('mobile_number')
        user.gender = data.get('gender')
        user.ending_date = data.get('ending_date')
        user.address = data.get('address')
        user.validate_token = User.objects.make_random_password(10) + uuid.uuid4().hex[:6].upper()

        user.save()
        data["user_id"] = user.id

        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
        }
    except Exception as e:
        raise APIException(str(e))


def create_role(**data):
    try:
        role = Role(
            name=data.get('name'),
            display_value=data.get('display_value'),
            code=data.get('code'),
            description=data.get('description'),
        )
        role.save()
        return role.code
    except Exception as e:
        raise APIException(str(e))


def create_token(**data):
    username = data.get('username').lower()
    password = data.get('password')

    expired = User.objects.filter(
        Q(email=username) | Q(mobile=username),
        is_active=False
    )

    if expired.exists():
        raise AuthenticationFailed(detail='Your account is disabled.')

    user_obj = User.objects.filter(
        Q(mobile=username) | Q(username=username) | Q(email=username)
    ).first()

    if user_obj is None:
        raise AuthenticationFailed(detail='User does not exist')

    user = authenticate(username=user_obj.username, password=password)

    if user is None:
        raise AuthenticationFailed(detail='Invalid Username or Password')

    if user.ending_date is None or user.ending_date >= datetime.datetime.now().date():
        user.last_login = datetime.datetime.now()
        user.save()

        refresh_tkn = RefreshToken.for_user(user)
        org_id = user.organization.id if user.organization else None
        refresh_tkn['organization_id'] = org_id
        refresh_tkn['organizationId'] = org_id

        access_tkn = refresh_tkn.access_token
        access_tkn['organization_id'] = org_id
        access_tkn['organizationId'] = org_id
    else:
        raise AuthenticationFailed(detail='Your plan has expired. Please renew your plan.')

    token_data = {
        "access": str(access_tkn),
        "refresh": str(refresh_tkn)
    }

    user_role_obj = user.user_roles.select_related('role').first() if hasattr(user, 'user_roles') else None
    role_obj = user_role_obj.role if user_role_obj else None

    user_org = getattr(user, 'organization', None)
    user_data = {
        "user_email": user.email,
        "user_id": user.id,
        "user_mobile": user.mobile,
        "user_name": user.first_name,
        "role": {
            "id": role_obj.id if role_obj else None,
            "code": role_obj.code if role_obj else None,
            "name": role_obj.name if role_obj else None
        },
        "organization": {
            "id": user_org.id,
            "name": getattr(user_org, 'organization_name', None),
            "logo": user_org.logo.url if (getattr(user_org, 'logo', None) and hasattr(user_org.logo, 'url')) else None
        } if user_org else None
    }

    return token_data, user_data


from adm.services.query_services import exec_raw_sql


def fetch_user_permissions(user):
    try:
        if not user or not user.is_authenticated:
            raise APIException("Authentication required")
        perms = user.get_perms() if hasattr(user, 'get_perms') else []
        user_role_obj = user.user_roles.select_related('role').first() if hasattr(user, 'user_roles') else None
        role_code = user_role_obj.role.code if user_role_obj and user_role_obj.role else None
        return {
            "user_id": user.id,
            "role_code": role_code,
            "permissions": perms
        }
    except Exception as e:
        raise APIException(str(e))


# ----------------------------- fetch_all_users_admin -----------------------------

def fetch_all_users_admin(user, page=1, page_size=50, search=None, sort=None, sort_by=None):
    """
    Fetch all admin users using CollectionQuery 'D_FETCH_ALL_USERS_ADMIN' (0 Python Loops).
    """
    try:
        org_id = getattr(user, 'organization_id', 0) if (user and hasattr(user, 'organization_id') and user.organization_id) else 0
        search_str = str(search).strip() if search else ''

        # ⚡ Direct Collection Query Execution from DB - Zero Python Loops!
        raw_users = exec_raw_sql('D_FETCH_ALL_USERS_ADMIN', {
            'organization_id': org_id,
            'search': search_str
        }) or []

        # Sort users array based on frontend request ("newest" vs "oldest")
        sort_val = str(sort or sort_by or "newest").lower().strip()
        if sort_val in ["oldest", "asc"]:
            raw_users.sort(key=lambda u: u.get("id", 0))
        else:
            raw_users.sort(key=lambda u: u.get("id", 0), reverse=True)

        total_records = len(raw_users)
        page = int(page or 1)
        page_size_val = str(page_size or "50").lower()

        if page_size_val in ['0', 'all', 'none']:
            actual_page_size = total_records or 1
            paged_users = raw_users
            total_pages = 1
            page = 1
        else:
            actual_page_size = int(page_size_val)
            total_pages = math.ceil(total_records / actual_page_size) if actual_page_size > 0 else 1
            start = (page - 1) * actual_page_size
            end = start + actual_page_size
            paged_users = raw_users[start:end]

        return {
            "status": True,
            "message": "Users fetched successfully",
            "total_records": total_records,
            "total_pages": total_pages,
            "current_page": page,
            "page_size": actual_page_size,
            "data": paged_users,
            "users": paged_users
        }
    except Exception as e:
        raise APIException(str(e))


# ----------------------------- create_user_admin_service -----------------------------

def create_user_admin(admin_user, data):
    try:
        email = str(data.get('email') or '').strip().lower()
        emp_id = str(data.get('emp_id') or '').strip()
        contact_no = str(data.get('contact_no') or data.get('mobile') or '').strip()
        full_name = str(data.get('full_name') or '').strip()

        # 1. Compulsory Employee ID Validation
        if not emp_id:
            return {
                "status": False,
                "message": "Employee ID is a compulsory field."
            }

        if User.objects.filter(employee_id__iexact=emp_id).exists():
            return {
                "status": False,
                "message": f"User with Employee ID '{emp_id}' already exists."
            }

        # 2. Compulsory Mobile Number & Smart 10-Digit Validation
        if not contact_no:
            return {
                "status": False,
                "message": "Mobile number is a compulsory field."
            }

        clean_digits = "".join(filter(str.isdigit, contact_no))
        last_10 = clean_digits[-10:] if len(clean_digits) >= 10 else clean_digits

        if len(last_10) < 10:
            return {
                "status": False,
                "message": "Please enter a valid 10-digit mobile number."
            }

        if User.objects.filter(Q(mobile=contact_no) | Q(mobile__endswith=last_10)).exists():
            return {
                "status": False,
                "message": f"User with mobile number '{contact_no}' already exists."
            }

        # 3. Compulsory Email Unique Validation
        if email and User.objects.filter(email=email).exists():
            return {
                "status": False,
                "message": f"User with email '{email}' already exists."
            }

        # Handle name splitting
        name_parts = full_name.split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        # Username is set directly to the email input
        username = email

        # Default password for admin created user if not passed
        raw_password = data.get('password') or "Password@123"

        user = User.objects.create_user(username, email, raw_password)
        user.first_name = first_name
        user.last_name = last_name
        user.mobile = contact_no
        user.address = data.get('location')
        user.employee_id = emp_id

        status_val = str(data.get('status') or 'Active').lower()
        user.is_active = (status_val in ['active', 'true', '1'])

        # Joined date / starting date
        joined_date = data.get('joined_date')
        if joined_date:
            try:
                from datetime import datetime
                user.starting_date = datetime.strptime(str(joined_date), '%Y-%m-%d').date()
            except Exception:
                pass

        # Handle Reporting To Manager (by Name or ID)
        reporting_to_val = data.get('reporting_to')
        if reporting_to_val:
            mgr = None
            if isinstance(reporting_to_val, int) or str(reporting_to_val).isdigit():
                mgr = User.objects.filter(id=int(reporting_to_val)).first()
            else:
                mgr = User.objects.filter(Q(first_name__icontains=reporting_to_val) | Q(username__icontains=reporting_to_val)).first()
            if mgr:
                user.reporting_to = mgr

        # Handle Team (by Name or ID)
        team_val = data.get('team')
        if team_val:
            team_obj = None
            if isinstance(team_val, int) or str(team_val).isdigit():
                team_obj = Team.objects.filter(id=int(team_val)).first()
            else:
                team_obj = Team.objects.filter(name__icontains=team_val).first()
                if not team_obj:
                    team_obj = Team.objects.create(name=team_val, code=team_val[:10].upper())
            if team_obj:
                user.team = team_obj

        # Handle Role (by Name or ID or Role IDs array)
        role_val = data.get('role') or data.get('role_ids')
        role_obj = None
        if role_val:
            if isinstance(role_val, list):
                for r_id in role_val:
                    r = Role.objects.filter(id=r_id).first()
                    if r:
                        UserRole.objects.get_or_create(user=user, role=r)
                        if not role_obj:
                            role_obj = r
                            user.user_type = r.display_value or r.name
            else:
                if isinstance(role_val, int) or str(role_val).isdigit():
                    role_obj = Role.objects.filter(id=int(role_val)).first()
                else:
                    role_obj = Role.objects.filter(Q(name__icontains=role_val) | Q(display_value__icontains=role_val)).first()
                    if not role_obj:
                        role_obj = Role.objects.create(name=role_val.lower(), display_value=role_val, code=role_val[:3].upper())
                if role_obj:
                    UserRole.objects.get_or_create(user=user, role=role_obj)
                    user.user_type = role_obj.display_value or role_obj.name

        org_val = data.get('organization_id') or data.get('organization')
        org_obj = None
        if org_val:
            if isinstance(org_val, int) or str(org_val).isdigit():
                org_obj = Organization.objects.filter(id=int(org_val)).first()
            else:
                org_obj = Organization.objects.filter(organization_name__icontains=str(org_val)).first()

        if not org_obj and admin_user and getattr(admin_user, 'is_authenticated', False) and getattr(admin_user, 'organization', None):
            org_obj = admin_user.organization

        if not org_obj:
            org_obj = Organization.objects.order_by('id').first()

        if org_obj:
            user.organization = org_obj

        user.save()

        reporting_to_display = user.reporting_to.get_full_name() if user.reporting_to else (user.team.leader.get_full_name() if (user.team and user.team.leader) else None)
        role_display = role_obj.display_value if role_obj else (user.user_type or "Executive")
        team_display = user.team.name if user.team else None

        return {
            "status": True,
            "message": "User created successfully",
            "data": {
                "id": user.id,
                "emp_id": user.employee_id,
                "full_name": user.get_full_name(),
                "email": user.email,
                "contact_no": user.mobile or "",
                "location": user.address or "",
                "role": role_display,
                "reporting_to": reporting_to_display,
                "status": "Active" if user.is_active else "Deactive",
                "joined_date": str(user.starting_date) if user.starting_date else None,
                "team": team_display,
                "is_lead_enabled": not user.disable_lead_assignment,
                "created_at": user.created_at.isoformat() if user.created_at else None
            }
        }
    except Exception as e:
        raise APIException(str(e))


# ----------------------------- edit_user_admin_service -----------------------------

def edit_user_admin(admin_user, data):
    try:
        user_id = data.get('id') or data.get('user_id')
        emp_id_input = data.get('emp_id')

        user = None
        if user_id:
            user = User.objects.filter(id=user_id).first()
        elif emp_id_input:
            user = User.objects.filter(employee_id=emp_id_input).first()

        if not user:
            return {
                "status": False,
                "message": "User not found"
            }

        if admin_user and getattr(admin_user, 'is_authenticated', False) and getattr(admin_user, 'organization', None):
            if user.organization_id != admin_user.organization_id:
                return {
                    "status": False,
                    "message": "User not found"
                }

        # Handle Full Name update
        full_name = data.get('full_name')
        if full_name:
            name_parts = str(full_name).strip().split(" ", 1)
            user.first_name = name_parts[0]
            user.last_name = name_parts[1] if len(name_parts) > 1 else ""

        # Handle Employee ID update & validation
        if 'emp_id' in data:
            emp_val = str(data.get('emp_id') or '').strip()
            if not emp_val:
                return {
                    "status": False,
                    "message": "Employee ID is a compulsory field."
                }
            if User.objects.filter(employee_id__iexact=emp_val).exclude(id=user.id).exists():
                return {
                    "status": False,
                    "message": f"User with Employee ID '{emp_val}' already exists."
                }
            user.employee_id = emp_val

        # Handle Email & Mobile validation
        if 'email' in data and data.get('email'):
            em_val = str(data['email']).strip().lower()
            if User.objects.filter(email=em_val).exclude(id=user.id).exists():
                return {
                    "status": False,
                    "message": f"User with email '{em_val}' already exists."
                }
            user.email = em_val
            user.username = em_val

        if 'contact_no' in data or 'mobile' in data:
            mob_val = str(data.get('contact_no') or data.get('mobile') or '').strip()
            if not mob_val:
                return {
                    "status": False,
                    "message": "Mobile number is a compulsory field."
                }
            clean_digits = "".join(filter(str.isdigit, mob_val))
            last_10 = clean_digits[-10:] if len(clean_digits) >= 10 else clean_digits
            if len(last_10) < 10:
                return {
                    "status": False,
                    "message": "Please enter a valid 10-digit mobile number."
                }
            if User.objects.filter(Q(mobile=mob_val) | Q(mobile__endswith=last_10)).exclude(id=user.id).exists():
                return {
                    "status": False,
                    "message": f"User with mobile number '{mob_val}' already exists."
                }
            user.mobile = mob_val

        if 'location' in data:
            user.address = data['location']

        if 'status' in data:
            status_val = str(data['status']).lower()
            user.is_active = (status_val in ['active', 'true', '1'])

        # Joined date / starting date
        joined_date = data.get('joined_date')
        if joined_date:
            try:
                from datetime import datetime
                user.starting_date = datetime.strptime(str(joined_date), '%Y-%m-%d').date()
            except Exception:
                pass

        # Handle Reporting To Manager
        reporting_to_val = data.get('reporting_to')
        if reporting_to_val:
            mgr = None
            if isinstance(reporting_to_val, int) or str(reporting_to_val).isdigit():
                mgr = User.objects.filter(id=int(reporting_to_val)).first()
            else:
                mgr = User.objects.filter(Q(first_name__icontains=reporting_to_val) | Q(username__icontains=reporting_to_val)).first()
            if mgr:
                user.reporting_to = mgr

        # Handle Team
        team_val = data.get('team')
        if team_val:
            team_obj = None
            if isinstance(team_val, int) or str(team_val).isdigit():
                team_obj = Team.objects.filter(id=int(team_val)).first()
            else:
                team_obj = Team.objects.filter(name__icontains=team_val).first()
                if not team_obj:
                    team_obj = Team.objects.create(
                        name=team_val, 
                        code=team_val[:10].upper(),
                        organization=admin_user.organization if (admin_user and getattr(admin_user, 'organization', None)) else None
                    )
            if team_obj:
                user.team = team_obj

        # Handle Role update
        role_val = data.get('role') or data.get('role_ids')
        role_obj = None
        if role_val:
            UserRole.objects.filter(user=user).delete()
            if isinstance(role_val, list):
                for r_id in role_val:
                    r = Role.objects.filter(id=r_id).first()
                    if r:
                        UserRole.objects.get_or_create(user=user, role=r)
                        if not role_obj:
                            role_obj = r
            else:
                if isinstance(role_val, int) or str(role_val).isdigit():
                    role_obj = Role.objects.filter(id=int(role_val)).first()
                else:
                    role_obj = Role.objects.filter(Q(name__icontains=role_val) | Q(display_value__icontains=role_val)).first()
                    if not role_obj:
                        role_obj = Role.objects.create(name=role_val.lower(), display_value=role_val, code=role_val[:3].upper())
                if role_obj:
                    UserRole.objects.get_or_create(user=user, role=role_obj)

        org_val = data.get('organization_id') or data.get('organization')
        if org_val:
            org_obj = None
            if isinstance(org_val, int) or str(org_val).isdigit():
                org_obj = Organization.objects.filter(id=int(org_val)).first()
            else:
                org_obj = Organization.objects.filter(organization_name__icontains=str(org_val)).first()
            if org_obj:
                user.organization = org_obj
        elif not user.organization:
            if admin_user and getattr(admin_user, 'is_authenticated', False) and getattr(admin_user, 'organization', None):
                user.organization = admin_user.organization

        user.save()

        reporting_to_display = user.reporting_to.get_full_name() if user.reporting_to else (user.team.leader.get_full_name() if (user.team and user.team.leader) else None)
        user_role_item = user.user_roles.select_related('role').first()
        role_display = user_role_item.role.display_value if (user_role_item and user_role_item.role) else (user.user_type or "Executive")
        team_display = user.team.name if user.team else None

        return {
            "status": True,
            "message": "User details updated successfully",
            "data": {
                "id": user.id,
                "emp_id": user.employee_id or f"EMP-{user.id:04d}",
                "full_name": user.get_full_name(),
                "email": user.email,
                "contact_no": user.mobile or "",
                "location": user.address or "",
                "role": role_display,
                "reporting_to": reporting_to_display,
                "status": "Active" if user.is_active else "Deactive",
                "joined_date": str(user.starting_date) if user.starting_date else None,
                "team": team_display,
                "updated_at": user.updated_at.isoformat() if user.updated_at else None
            }
        }
    except Exception as e:
        raise APIException(str(e))


# ----------------------------- toggle_user_status_admin_service -----------------------------

def toggle_user_status_admin(admin_user, data):
    try:
        user_id = data.get('id') or data.get('user_id')
        emp_id_input = data.get('emp_id')
        status_input = data.get('status')

        if status_input is None and 'is_active' in data:
            status_input = data.get('is_active')

        user = None
        if user_id:
            user = User.objects.filter(id=user_id).first()
        elif emp_id_input:
            user = User.objects.filter(employee_id=emp_id_input).first()

        if not user or status_input is None:
            return {
                "status": False,
                "message": "User not found or invalid status"
            }

        if admin_user and getattr(admin_user, 'is_authenticated', False) and getattr(admin_user, 'organization', None):
            if user.organization_id != admin_user.organization_id:
                return {
                    "status": False,
                    "message": "User not found or invalid status"
                }

        status_str = str(status_input).strip().lower()
        if status_str in ['active', 'true', '1']:
            user.is_active = True
            new_status_str = "Active"
        elif status_str in ['deactive', 'inactive', 'false', '0']:
            user.is_active = False
            new_status_str = "Deactive"
        else:
            return {
                "status": False,
                "message": "User not found or invalid status"
            }

        user.save()

        emp_id_display = user.employee_id or f"EMP-{user.id:04d}"
        name_display = user.first_name or user.get_full_name() or user.username

        return {
            "status": True,
            "message": f"User status updated to {new_status_str} successfully",
            "data": {
                "id": user.id,
                "emp_id": emp_id_display,
                "name": name_display,
                "status": new_status_str,
                "updated_at": user.updated_at.isoformat() if user.updated_at else None
            }
        }
    except Exception as e:
        raise APIException(str(e))


# ----------------------------- change_user_password_admin_service -----------------------------

def change_user_password_admin(admin_user, data):
    try:
        import re
        user_id = data.get('id') or data.get('user_id')
        emp_id_input = data.get('emp_id')

        new_password = data.get('newPassword') or data.get('new_password')
        confirm_password = data.get('confirmPassword') or data.get('confirm_password')

        user = None
        if user_id:
            user = User.objects.filter(id=user_id).first()
        elif emp_id_input:
            user = User.objects.filter(employee_id=emp_id_input).first()

        if not user:
            return {
                "status": False,
                "message": "User not found"
            }

        if admin_user and getattr(admin_user, 'is_authenticated', False) and getattr(admin_user, 'organization', None):
            if user.organization_id != admin_user.organization_id:
                return {
                    "status": False,
                    "message": "User not found"
                }

        if not new_password or not confirm_password:
            return {
                "status": False,
                "message": "Password must be at least 8 characters long and contain numbers/symbols"
            }

        if new_password != confirm_password:
            return {
                "status": False,
                "message": "Passwords do not match"
            }

        # Check length (>= 8), contains digits, and contains symbols
        if len(new_password) < 8 or not re.search(r'\d', new_password) or not re.search(r'[^a-zA-Z0-9]', new_password):
            return {
                "status": False,
                "message": "Password must be at least 8 characters long and contain numbers/symbols"
            }

        user.set_password(new_password)
        if hasattr(user, 'last_pwd_changed_at'):
            from django.utils import timezone
            user.last_pwd_changed_at = timezone.now()
        user.save()

        return {
            "status": True,
            "message": "User password updated successfully"
        }
    except Exception as e:
        raise APIException(str(e))


# ----------------------------- enable_disable_lead_assignment_admin_service -----------------------------

def enable_disable_lead_assignment_admin(admin_user, data):
    try:
        user_id = data.get('id') or data.get('user_id')
        emp_id_input = data.get('emp_id')

        user = None
        if user_id:
            user = User.objects.filter(id=user_id).first()
        elif emp_id_input:
            user = User.objects.filter(employee_id=emp_id_input).first()

        if not user:
            return {
                "status": False,
                "message": "User not found"
            }

        if admin_user and getattr(admin_user, 'is_authenticated', False) and getattr(admin_user, 'organization', None):
            if user.organization_id != admin_user.organization_id:
                return {
                    "status": False,
                    "message": "User not found"
                }

        if 'disable_lead_assignment' in data:
            val = data['disable_lead_assignment']
            user.disable_lead_assignment = bool(val)
        elif 'is_lead_enabled' in data:
            val = data['is_lead_enabled']
            user.disable_lead_assignment = not bool(val)
        else:
            user.disable_lead_assignment = not user.disable_lead_assignment

        user.save()

        return {
            "status": True,
            "message": "Lead assignment status updated successfully",
            "data": {
                "id": user.id,
                "emp_id": user.employee_id or f"EMP-{user.id:04d}",
                "name": user.get_full_name() or user.username,
                "is_lead_enabled": not user.disable_lead_assignment,
                "disable_lead_assignment": user.disable_lead_assignment
            }
        }
    except Exception as e:
        raise APIException(str(e))


# ----------------------------- transfer_leads_admin_service -----------------------------

def transfer_leads_admin(admin_user, data):
    try:
        from adm.services.lead_services import bulk_transfer_leads_admin
        from_user_id = data.get('from_user_id') or data.get('from_id') or data.get('from_telecaller_id')
        to_user_id = data.get('to_user_id') or data.get('to_id') or data.get('to_telecaller_id')
        campaign_id = data.get('campaign_id')
        reason = data.get('reason')

        result = bulk_transfer_leads_admin(
            user=admin_user,
            from_telecaller_id=from_user_id,
            to_telecaller_id=to_user_id,
            campaign_id=campaign_id,
            reason=reason
        )
        return result
    except APIException as ae:
        return {
            "status": False,
            "message": str(ae)
        }
    except Exception as e:
        raise APIException(str(e))


# ----------------------------- delete_user_admin_service -----------------------------

# ----------------------------- delete_user_admin_service & summary -----------------------------

def fetch_user_delete_summary_admin(data, admin_user=None):
    """
    1. Fetch User Assigned Leads & Stats API (For Pre-Delete Review Modal)
    POST /adm/fetch_user_delete_summary_admin
    """
    try:
        if not isinstance(data, dict):
            data = {}

        user_id = data.get('user_id') or data.get('id')
        emp_id = data.get('emp_id') or data.get('employee_id')

        target_user = None
        if user_id:
            target_user = User.objects.filter(id=user_id).first()
        elif emp_id:
            target_user = User.objects.filter(employee_id=emp_id).first()

        if not target_user:
            return {
                "status": False,
                "message": "User not found"
            }

        if admin_user and getattr(admin_user, 'is_authenticated', False) and getattr(admin_user, 'organization', None):
            if target_user.organization_id != admin_user.organization_id:
                return {
                    "status": False,
                    "message": "User not found"
                }

        fname = (target_user.first_name or "").strip()
        lname = (target_user.last_name or "").strip()
        user_name = f"{fname} {lname}".strip() or target_user.username

        user_role_item = target_user.user_roles.select_related('role').first() if hasattr(target_user, 'user_roles') else None
        role_display = user_role_item.role.display_value if (user_role_item and user_role_item.role) else (target_user.user_type or "Telecaller")

        location_str = target_user.address if target_user.address else ""

        assigned_leads_qs = Lead.objects.filter(assigned_to=target_user)
        total_assigned_leads = assigned_leads_qs.count()
        has_assigned_leads = (total_assigned_leads > 0)

        new_leads_cnt = assigned_leads_qs.filter(
            Q(pipeline_stage__name__icontains="new")
        ).count()

        closed_won_lost_filter = (
            Q(pipeline_stage__name__icontains="won") |
            Q(pipeline_stage__name__icontains="converted") |
            Q(pipeline_stage__name__icontains="closed") |
            Q(pipeline_stage__name__icontains="complete") |
            Q(pipeline_stage__name__icontains="loss") |
            Q(pipeline_stage__name__icontains="lost")
        )

        active_leads_cnt = max(0, total_assigned_leads - assigned_leads_qs.filter(closed_won_lost_filter).count())

        followups_cnt = FollowUp.objects.filter(telecaller=target_user, is_attended=False).values('lead_id').distinct().count()
        if followups_cnt == 0:
            followups_cnt = assigned_leads_qs.filter(
                Q(pipeline_stage_id=2) | Q(pipeline_stage__name__icontains="follow")
            ).count()

        campaigns_count = assigned_leads_qs.filter(campaign__isnull=False).values('campaign_id').distinct().count()

        return {
            "status": True,
            "message": "User summary fetched successfully",
            "data": {
                "user_id": target_user.id,
                "user_name": user_name,
                "role": role_display,
                "location": location_str,
                "has_assigned_leads": has_assigned_leads,
                "total_assigned_leads": total_assigned_leads,
                "active_leads": active_leads_cnt,
                "new_leads": new_leads_cnt,
                "follow_ups": followups_cnt,
                "campaigns_count": campaigns_count
            }
        }
    except Exception as e:
        raise APIException(str(e))


def delete_user_admin(admin_user, data):
    """
    2. Delete User API (Final Permanent Delete with Guard & Audit History Logging)
    POST /adm/delete_user_admin
    """
    try:
        if not isinstance(data, dict):
            data = {}

        user_id = data.get('id') or data.get('user_id')
        emp_id_input = data.get('emp_id') or data.get('employee_id')

        user = None
        if user_id:
            user = User.objects.filter(id=user_id).first()
        elif emp_id_input:
            user = User.objects.filter(employee_id=emp_id_input).first()

        if not user:
            return {
                "status": False,
                "message": "User not found"
            }

        if admin_user and getattr(admin_user, 'is_authenticated', False) and getattr(admin_user, 'organization', None):
            if user.organization_id != admin_user.organization_id:
                return {
                    "status": False,
                    "message": "User not found"
                }

        if user == admin_user:
            return {
                "status": False,
                "message": "Cannot delete currently logged in admin user"
            }

        assigned_leads_count = Lead.objects.filter(assigned_to=user).count()
        if assigned_leads_count > 0:
            return {
                "status": False,
                "message": "You can't delete this user until their assigned leads are transferred to another user."
            }

        fname = (user.first_name or "").strip()
        lname = (user.last_name or "").strip()
        user_name = f"{fname} {lname}".strip() or user.username
        user_role_item = user.user_roles.select_related('role').first() if hasattr(user, 'user_roles') else None
        role_display = user_role_item.role.display_value if (user_role_item and user_role_item.role) else (user.user_type or "Telecaller")

        user_json_snapshot = {
            "id": user.id,
            "employee_id": user.employee_id,
            "username": user.username,
            "email": user.email,
            "full_name": user_name,
            "mobile": user.mobile,
            "role": role_display,
            "team_id": user.team_id,
            "organization_id": user.organization_id,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }

        deleter = admin_user if (admin_user and getattr(admin_user, 'is_authenticated', False)) else None
        DeletedDataLog.objects.create(
            table_name="adm_user",
            row_id=user.id,
            data=user_json_snapshot,
            deleted_by=deleter
        )

        user.delete()

        return {
            "status": True,
            "message": "User deleted successfully!"
        }
    except Exception as e:
        raise APIException(str(e))


def fetch_user_dropdowns_admin(user=None):
    try:
        roles_qs = Role.objects.exclude(
            Q(name__iexact='developer') | Q(code__iexact='DEV')
        ).values("id", "name", "display_value", "code").order_by("id")
        roles = [
            {
                "id": r["id"],
                "name": r["display_value"] or r["name"],
                "code": r["code"]
            }
            for r in roles_qs
        ]

        users_qs = User.objects.filter(is_active=True).filter(
            Q(user_roles__role__name__iexact='telecaller') |
            Q(user_roles__role__code__iexact='TEL') |
            Q(user_type__iexact='telecaller')
        ).distinct().order_by("id")

        if user and getattr(user, 'is_authenticated', False) and getattr(user, 'organization', None):
            users_qs = users_qs.filter(organization=user.organization)
        elif user and getattr(user, 'is_authenticated', False):
            users_qs = users_qs.none()
        managers = []
        for u in users_qs:
            fname = (u.first_name or "").strip()
            lname = (u.last_name or "").strip()
            full_name = f"{fname} {lname}".strip() or u.username
            managers.append({
                "id": u.id,
                "name": full_name,
                "emp_id": u.employee_id or f"EMP-{u.id:04d}"
            })

        # 3. Fetch Active Teams
        teams_qs = Team.objects.filter(is_active=True)
        if user and getattr(user, 'is_authenticated', False) and getattr(user, 'organization', None):
            teams_qs = teams_qs.filter(organization=user.organization)
        elif user and getattr(user, 'is_authenticated', False):
            teams_qs = teams_qs.none()
        teams = list(teams_qs.values("id", "name", "code").order_by("id"))

        return {
            "status": True,
            "message": "Dropdown options fetched successfully",
            "data": {
                "roles": roles,
                "managers": managers,
                "teams": teams
            }
        }
    except Exception as e:
        raise APIException(str(e))


def fetch_user_campaigns_admin(data, admin_user=None):
    """
    1. Fetch User Campaigns List API
    POST /adm/fetch_user_campaigns_admin
    Returns user campaigns summary and breakdown matching frontend expected format.
    Includes assigned_leads, unassigned_leads, called_leads, rescheduled_leads, closed_leads.
    """
    try:
        if not isinstance(data, dict):
            data = {}

        user_id = data.get('user_id') or data.get('id')
        emp_id = data.get('emp_id') or data.get('employee_id')

        target_user = None
        if user_id:
            target_user = User.objects.filter(id=user_id).first()
        elif emp_id:
            target_user = User.objects.filter(employee_id=emp_id).first()

        if not target_user:
            return {
                "status": False,
                "message": "User not found"
            }

        if admin_user and getattr(admin_user, 'is_authenticated', False) and getattr(admin_user, 'organization', None):
            if target_user.organization_id != admin_user.organization_id:
                return {
                    "status": False,
                    "message": "User not found"
                }

        fname = (target_user.first_name or "").strip()
        lname = (target_user.last_name or "").strip()
        user_name = f"{fname} {lname}".strip() or target_user.username

        ca_qs = campaign_assigned_agent.objects.select_related('campaign', 'campaign__pipeline_category').filter(agent_user=target_user).order_by('campaign_id')

        seen_campaigns = set()
        campaigns_list = []
        idx = 1
        total_leads_sum = 0

        def build_campaign_metrics(camp):
            user_leads = Lead.objects.filter(assigned_to=target_user, campaign=camp)
            assigned_cnt = user_leads.count()
            total_leads_cnt = Lead.objects.filter(campaign=camp).count()

            called_cnt = user_leads.filter(calls__isnull=False).distinct().count()
            rescheduled_cnt = user_leads.filter(
                Q(followups__isnull=False) | Q(pipeline_stage__name__icontains="follow")
            ).distinct().count()
            closed_cnt = user_leads.filter(
                Q(pipeline_stage__name__iregex=r'won|loss|lost|closed')
            ).distinct().count()

            pipeline_name = camp.pipeline_category.display_name or camp.pipeline_category.category_name if (hasattr(camp, 'pipeline_category') and camp.pipeline_category) else "Education"

            return {
                "id": camp.id,
                "s_no": idx,
                "campaign_name": camp.name,
                "pipeline_name": pipeline_name,
                "total_leads": total_leads_cnt,
                "assigned_leads": assigned_cnt,
                "called_leads": called_cnt,
                "rescheduled_leads": rescheduled_cnt,
                "closed_leads": closed_cnt
            }, assigned_cnt

        for ca in ca_qs:
            camp = ca.campaign
            if not camp or camp.id in seen_campaigns:
                continue
            seen_campaigns.add(camp.id)

            camp_dict, assigned_cnt = build_campaign_metrics(camp)
            camp_dict["s_no"] = idx
            campaigns_list.append(camp_dict)
            total_leads_sum += assigned_cnt
            idx += 1

        leads_campaign_ids = Lead.objects.filter(assigned_to=target_user, campaign__isnull=False).values_list('campaign_id', flat=True).distinct()
        for c_id in leads_campaign_ids:
            if c_id not in seen_campaigns:
                seen_campaigns.add(c_id)
                camp = CampaignName.objects.filter(id=c_id).first()
                if camp:
                    camp_dict, assigned_cnt = build_campaign_metrics(camp)
                    camp_dict["s_no"] = idx
                    campaigns_list.append(camp_dict)
                    total_leads_sum += assigned_cnt
                    idx += 1

        null_campaign_leads = Lead.objects.filter(assigned_to=target_user, campaign__isnull=True).count()
        if null_campaign_leads > 0:
            total_leads_sum += null_campaign_leads

        return {
            "status": True,
            "message": "User campaigns fetched successfully",
            "data": {
                "user_id": target_user.id,
                "user_name": user_name,
                "total_campaigns": len(campaigns_list),
                "total_leads": total_leads_sum,
                "total_assigned_leads": total_leads_sum,
                "campaigns": campaigns_list
            }
        }
    except Exception as e:
        raise APIException(str(e))


def fetch_user_transfer_campaigns_admin(from_user_id=None, emp_id=None, admin_user=None):
    return fetch_user_campaigns_admin_service({"user_id": from_user_id, "emp_id": emp_id}, admin_user=admin_user)


def fetch_transfer_telecallers_admin(data=None, user=None):
    
    try:
        if not isinstance(data, dict):
            data = {}

        from_user_id = data.get('from_user_id') or data.get('from_id')

        users_qs = User.objects.filter(is_active=True).order_by('id')

        if user and getattr(user, 'is_authenticated', False) and getattr(user, 'organization', None):
            users_qs = users_qs.filter(organization=user.organization)

        if from_user_id:
            users_qs = users_qs.exclude(id=from_user_id)

        users_qs = users_qs.exclude(
            Q(user_roles__role__code__in=['ADM', 'DEV', 'ADMIN', 'DEVELOPER']) |
            Q(user_type__icontains='admin') |
            Q(user_type__icontains='developer')
        ).distinct()

        result_list = []
        for idx, u in enumerate(users_qs):
            fname = (u.first_name or "").strip()
            lname = (u.last_name or "").strip()
            u_name = f"{fname} {lname}".strip() or u.username

            current_leads = Lead.objects.filter(assigned_to=u).count()
            team_color = u.team.badge_color if (u.team and u.team.badge_color) else "#505AF2"
            seg_colors = [team_color, team_color, team_color]

            result_list.append({
                "id": u.id,
                "name": u_name,
                "email": u.email or f"user{u.id}@gmail.com",
                "current_leads": current_leads,
                "segments": seg_colors
            })

        return {
            "status": True,
            "message": "Telecallers list fetched successfully",
            "data": result_list
        }
    except Exception as e:
        raise APIException(str(e))


def transfer_single_campaign_leads_admin(admin_user, data):
  
    try:
        if not isinstance(data, dict):
            data = {}

        from_user_id = data.get('from_user_id')
        campaign_id = data.get('campaign_id')
        distributions = data.get('distributions') or []

        if not from_user_id:
            return {"status": False, "message": "from_user_id is required"}
        if not campaign_id:
            return {"status": False, "message": "campaign_id is required"}
        if not distributions or not isinstance(distributions, list):
            return {"status": False, "message": "distributions array is required"}

        from_user = User.objects.filter(id=from_user_id).first()
        if not from_user:
            return {"status": False, "message": "Source user not found"}

        from_fname = (from_user.first_name or "").strip()
        from_lname = (from_user.last_name or "").strip()
        from_user_name = f"{from_fname} {from_lname}".strip() or from_user.username

        leads_qs = Lead.objects.filter(assigned_to=from_user, campaign_id=campaign_id).order_by('id')
        available_leads = list(leads_qs)

        if not available_leads:
            return {"status": False, "message": "No leads found for this user in the specified campaign"}

        reassigned_by_name = get_user_display_name(admin_user) if admin_user else "Admin"
        followup_stage = PipelineStage.objects.filter(id=2).first() or PipelineStage.objects.filter(name__icontains="follow").first()

        total_transferred = 0
        current_index = 0

        for dist in distributions:
            dest_id = dist.get('telecaller_id')
            l_count = int(dist.get('lead_count') or 0)
            if not dest_id or l_count <= 0:
                continue

            dest_user = User.objects.filter(id=dest_id, is_active=True).first()
            if not dest_user:
                continue

            batch_leads = available_leads[current_index : current_index + l_count]
            current_index += len(batch_leads)

            history_records = []
            for lead in batch_leads:
                lead.assigned_to = dest_user
                if lead.pipeline_stage_id in [4] or (lead.pipeline_stage and "loss" in lead.pipeline_stage.name.lower()):
                    if followup_stage:
                        lead.pipeline_stage = followup_stage
                    lead.current_status = "working"

                AdminApprovedLossLead.objects.filter(lead=lead).delete()

                history_rec = AdminLeadReassignHistory(
                    lead=lead,
                    previous_telecaller=from_user,
                    new_telecaller=dest_user,
                    reassigned_by=admin_user if (admin_user and getattr(admin_user, 'is_authenticated', False)) else None,
                    attended_calls_count=0,
                    reassigned_reason=f"Single Campaign #{campaign_id} Reassignment",
                    created_by=reassigned_by_name
                )
                history_records.append(history_rec)
                total_transferred += 1

            if batch_leads:
                Lead.objects.bulk_update(batch_leads, ['assigned_to', 'pipeline_stage', 'current_status'])

            if history_records:
                AdminLeadReassignHistory.objects.bulk_create(history_records)

        return {
            "status": True,
            "message": f"{total_transferred} Leads Reassigned Successfully!",
            "data": {
                "transferred_leads": total_transferred,
                "from_user": from_user_name,
                "campaign_id": campaign_id
            }
        }
    except Exception as e:
        raise APIException(str(e))


def transfer_all_campaigns_leads_admin(admin_user, data):
  
    try:
        if not isinstance(data, dict):
            data = {}

        from_user_id = data.get('from_user_id')
        to_telecaller_id = data.get('to_telecaller_id') or data.get('to_user_id')

        if not from_user_id:
            return {"status": False, "message": "from_user_id is required"}
        if not to_telecaller_id:
            return {"status": False, "message": "to_telecaller_id is required"}
        if from_user_id == to_telecaller_id:
            return {"status": False, "message": "Source and Destination telecallers cannot be the same"}

        from_user = User.objects.filter(id=from_user_id).first()
        if not from_user:
            return {"status": False, "message": "Source user not found"}

        to_telecaller = User.objects.filter(id=to_telecaller_id, is_active=True).first()
        if not to_telecaller:
            return {"status": False, "message": "Destination telecaller not found or inactive"}

        from_fname = (from_user.first_name or "").strip()
        from_lname = (from_user.last_name or "").strip()
        from_user_name = f"{from_fname} {from_lname}".strip() or from_user.username

        to_fname = (to_telecaller.first_name or "").strip()
        to_lname = (to_telecaller.last_name or "").strip()
        to_telecaller_name = f"{to_fname} {to_lname}".strip() or to_telecaller.username

        leads_qs = Lead.objects.filter(assigned_to=from_user)
        all_leads = list(leads_qs)

        if not all_leads:
            return {"status": False, "message": "No leads found for source user to transfer"}

        distinct_campaigns_count = Lead.objects.filter(assigned_to=from_user, campaign__isnull=False).values('campaign_id').distinct().count()
        if distinct_campaigns_count == 0:
            distinct_campaigns_count = int(data.get('total_campaigns') or 1)

        reassigned_by_name = get_user_display_name(admin_user) if admin_user else "Admin"
        followup_stage = PipelineStage.objects.filter(id=2).first() or PipelineStage.objects.filter(name__icontains="follow").first()

        history_records = []
        transferred_count = 0

        for lead in all_leads:
            lead.assigned_to = to_telecaller
            if lead.pipeline_stage_id in [4] or (lead.pipeline_stage and "loss" in lead.pipeline_stage.name.lower()):
                if followup_stage:
                    lead.pipeline_stage = followup_stage
                lead.current_status = "working"

            lead.save()
            AdminApprovedLossLead.objects.filter(lead=lead).delete()

            history_rec = AdminLeadReassignHistory(
                lead=lead,
                previous_telecaller=from_user,
                new_telecaller=to_telecaller,
                reassigned_by=admin_user if (admin_user and getattr(admin_user, 'is_authenticated', False)) else None,
                attended_calls_count=0,
                reassigned_reason="Transfer All Campaigns Bulk Transfer",
                created_by=reassigned_by_name
            )
            history_records.append(history_rec)
            transferred_count += 1

        if history_records:
            AdminLeadReassignHistory.objects.bulk_create(history_records)

        return {
            "status": True,
            "message": f"{transferred_count} Leads Reassigned Successfully!",
            "data": {
                "transferred_leads": transferred_count,
                "transferred_campaigns": distinct_campaigns_count,
                "from_user": from_user_name,
                "to_telecaller": to_telecaller_name
            }
        }
    except Exception as e:
        raise APIException(str(e))








