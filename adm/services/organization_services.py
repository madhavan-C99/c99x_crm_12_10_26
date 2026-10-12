import base64
from django.core.files.base import ContentFile
from rest_framework.exceptions import APIException
from adm.models import Organization

def get_logo_url(org_obj, request=None):
    if not org_obj or not org_obj.logo:
        return ""
    try:
        url = org_obj.logo.url
        if request:
            return request.build_absolute_uri(url)
        return url
    except Exception:
        return str(org_obj.logo)


def create_organization_profile_admin_service(data, admin_user=None, request=None):
    try:
        if admin_user and getattr(admin_user, 'is_authenticated', False) and getattr(admin_user, 'organization', None):
            return {
                "status": False,
                "message": "You already have an organization assigned. You cannot create another organization."
            }

        org_name = str(data.get('org_name', '')).strip()
        display_name = str(data.get('display_name', '')).strip()
        
        if not org_name:
            return {
                "status": False,
                "message": "Organization name is required"
            }

        address_line_1 = data.get('address_line1') or ""
        address_line_2 = data.get('address_line2') or ""
        gstin = data.get('gst_in') or ""

        created_by_user = getattr(admin_user, 'username', 'admin') if admin_user else 'admin'

        new_org = Organization(
            organization_name=org_name,
            display_name=display_name,
            industry_type=data.get('industry_type', ''),
            company_website=data.get('company_website', ''),
            company_description=data.get('company_description', ''),
            address_line_1=address_line_1,
            address_line_2=address_line_2,
            city=data.get('city', ''),
            state=data.get('state', ''),
            country=data.get('country', 'India'),
            pincode=data.get('pincode', ''),
            official_email=data.get('official_email', ''),
            official_contact=data.get('official_contact', ''),
            gstin=gstin,
            company_pan=data.get('company_pan', ''),
            date_format=data.get('date_format', 'DD/MM/YYYY'),
            time_format=data.get('time_format', '12hrs'),
            created_by=created_by_user
        )

        if data.get('logo'):
            new_org.logo = data.get('logo')

        new_org.save()

        if admin_user and getattr(admin_user, 'is_authenticated', False):
            admin_user.organization = new_org
            admin_user.save()

        return {
            "status": True,
            "message": "Organization Profile created successfully",
            "data": {
                "id": new_org.id,
                "logo_url": get_logo_url(new_org, request=request)
            }
        }
    except Exception as e:
        raise APIException(str(e))


def get_organization_profile_admin_service(request=None, user=None):
    try:
        current_user = user
        if not current_user and request:
            if hasattr(request, 'user'):
                current_user = request.user
            else:
                current_user = request

        org = None
        if current_user and getattr(current_user, 'is_authenticated', False):
            org = getattr(current_user, 'organization', None)

        if not org:
            return {
                "status": False,
                "message": "No organization profile found",
                "data": None
            }

        valid_date_formats = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD-MM-YYYY"]
        raw_date_format = org.date_format or "DD/MM/YYYY"
        if raw_date_format not in valid_date_formats:
            raw_date_format = "DD/MM/YYYY"

        valid_time_formats = ["12hrs", "24hrs", "12hrs (AM/PM)"]
        raw_time_format = org.time_format or "12hrs"
        if raw_time_format not in valid_time_formats:
            raw_time_format = "12hrs"

        company_pan_val = org.company_pan or ""
        if company_pan_val in ["Tamilnadu", "Tamil Nadu", "India"]:
            company_pan_val = ""

        data = {
            "id": org.id,
            "logo_url": get_logo_url(org, request=request),
            "org_name": org.organization_name or "",
            "display_name": org.display_name or "",
            "industry_type": org.industry_type or "",
            "company_website": org.company_website or "",
            "company_description": org.company_description or "",
            "address_line1": org.address_line_1 or "",
            "address_line2": org.address_line_2 or "",
            "city": org.city or "",
            "state": org.state or "",
            "country": org.country or "India",
            "pincode": org.pincode or "",
            "official_email": org.official_email or "",
            "official_contact": org.official_contact or "",
            "gst_in": org.gstin or "",
            "company_pan": company_pan_val,
            "date_format": raw_date_format,
            "time_format": raw_time_format
        }

        return {
            "status": True,
            "data": data
        }
    except Exception as e:
        raise APIException(str(e))


def edit_organization_profile_admin_service(data, admin_user=None, org_id=None, request=None):
    try:
        t_id = org_id or data.get('id')
        org = None
        if admin_user and getattr(admin_user, 'is_authenticated', False) and getattr(admin_user, 'organization', None):
            org = admin_user.organization
        elif t_id:
            org = Organization.objects.filter(id=t_id).first()

        if not org:
            org = Organization.objects.order_by('-id').first()

        if not org:
            return {
                "status": False,
                "message": "Organization Profile not found"
            }

        if 'org_name' in data and data.get('org_name'):
            org.organization_name = str(data.get('org_name')).strip()
        if 'display_name' in data and data.get('display_name'):
            org.display_name = str(data.get('display_name')).strip()
        if 'industry_type' in data:
            org.industry_type = data.get('industry_type') or ""
        if 'company_website' in data:
            org.company_website = data.get('company_website') or ""
        if 'company_description' in data:
            org.company_description = data.get('company_description') or ""
        if 'address_line1' in data:
            org.address_line_1 = data.get('address_line1') or ""
        if 'address_line2' in data:
            org.address_line_2 = data.get('address_line2') or ""
        if 'city' in data:
            org.city = data.get('city') or ""
        if 'state' in data:
            org.state = data.get('state') or ""
        if 'country' in data:
            org.country = data.get('country') or "India"
        if 'pincode' in data:
            org.pincode = data.get('pincode') or ""
        if 'official_email' in data:
            org.official_email = data.get('official_email') or ""
        if 'official_contact' in data:
            org.official_contact = data.get('official_contact') or ""
        if 'gst_in' in data:
            org.gstin = data.get('gst_in') or ""
        if 'company_pan' in data:
            pan_val = data.get('company_pan') or ""
            if pan_val not in ["Tamilnadu", "Tamil Nadu"]:
                org.company_pan = pan_val
        if 'date_format' in data:
            d_fmt = data.get('date_format') or "DD/MM/YYYY"
            valid_date_formats = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD-MM-YYYY"]
            if d_fmt not in valid_date_formats:
                d_fmt = "DD/MM/YYYY"
            org.date_format = d_fmt
        if 'time_format' in data:
            t_fmt = data.get('time_format') or "12hrs"
            org.time_format = t_fmt

        if data.get('logo'):
            org.logo = data.get('logo')

        org.updated_by = getattr(admin_user, 'username', 'admin') if admin_user else 'admin'
        org.save()

        return {
            "status": True,
            "message": "Organization Profile updated successfully",
            "data": {
                "id": org.id,
                "logo_url": get_logo_url(org, request=request)
            }
        }
    except Exception as e:
        raise APIException(str(e))
