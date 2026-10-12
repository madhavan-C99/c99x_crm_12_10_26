from rest_framework.exceptions import APIException
from adm.models import Team, User, Organization
from adm.services.query_services import exec_raw_sql
from django.utils import timezone


def fetch_all_teams_admin(user=None):
    """
    Fetch all active teams using CollectionQuery 'D_FETCH_ALL_TEAMS_ADMIN' (0 Python Loops).
    """
    try:
        org_id = getattr(user, 'organization_id', 0) if (user and hasattr(user, 'organization_id') and user.organization_id) else 0
        teams_data = exec_raw_sql('D_FETCH_ALL_TEAMS_ADMIN', {'organization_id': org_id}) or []
        return {
            "status": True,
            "message": "Teams fetched successfully",
            "data": teams_data
        }
    except Exception as e:
        raise APIException(str(e))


def create_team_admin(admin_user, data):
    
    try:
        name = str(data.get('name', '')).strip()
        if not name:
            return {"status": False, "message": "Team name is required"}

        org = getattr(admin_user, 'organization', None) if admin_user else None
        check_qs = Team.objects.filter(name__iexact=name)
        if org:
            check_qs = check_qs.filter(organization=org)
        if check_qs.exists():
            return {"status": False, "message": f"Team with name '{name}' already exists"}

        color = data.get('color') or "#6366F1"
        lead_id = data.get('lead_id')
        member_ids = data.get('member_ids') or []

        base_code = name.upper().replace(" ", "_")[:30]
        code = base_code
        counter = 1
        while Team.objects.filter(code=code).exists():
            code = f"{base_code}_{counter}"
            counter += 1

        lead_user = User.objects.filter(id=lead_id).first() if lead_id else None

        new_team = Team.objects.create(
            name=name,
            code=code,
            leader=lead_user,
            badge_color=color,
            is_active=True,
            organization=org,
            created_by=getattr(admin_user, 'username', 'admin') if admin_user else 'admin'
        )

        if lead_user:
            lead_user.team = new_team
            lead_user.save()

        assigned_members_count = 0
        if isinstance(member_ids, list) and member_ids:
            members_qs = User.objects.filter(id__in=member_ids)
            members_qs.update(team=new_team)
            assigned_members_count = members_qs.count()

        lead_name = None
        if lead_user:
            fname = (lead_user.first_name or "").strip()
            lname = (lead_user.last_name or "").strip()
            lead_name = f"{fname} {lname}".strip() or lead_user.username

        created_at_str = new_team.created_at.strftime("%Y-%m-%dT%H:%M:%SZ") if new_team.created_at else timezone.now().strftime("%Y-%m-%dT%H:%M:%SZ")
        region_str = new_team.organization.state if (new_team.organization and getattr(new_team.organization, 'state', None)) else "North Region"

        return {
            "status": True,
            "message": "Team created successfully",
            "data": {
                "id": new_team.id,
                "name": new_team.name,
                "region": region_str,
                "lead": lead_name,
                "color": new_team.badge_color,
                "membersCount": assigned_members_count,
                "created_at": created_at_str
            }
        }
    except Exception as e:
        raise APIException(str(e))


def edit_team_admin(admin_user, data):
  
    try:
        t_id = data.get('id') or data.get('team_id') or data.get('teamId')
        if not t_id:
            return {"status": False, "message": "Team ID is required"}

        team_qs = Team.objects.filter(id=t_id)
        if admin_user and getattr(admin_user, 'is_authenticated', False) and getattr(admin_user, 'organization', None):
            team_qs = team_qs.filter(organization=admin_user.organization)

        team = team_qs.first()
        if not team:
            return {"status": False, "message": "Team not found"}

        name = data.get('name')
        if name and str(name).strip():
            name_str = str(name).strip()
            check_qs = Team.objects.filter(name__iexact=name_str).exclude(id=team.id)
            if admin_user and getattr(admin_user, 'is_authenticated', False) and getattr(admin_user, 'organization', None):
                check_qs = check_qs.filter(organization=admin_user.organization)
            if check_qs.exists():
                return {"status": False, "message": f"Team with name '{name_str}' already exists"}
            team.name = name_str

        if data.get('color'):
            team.badge_color = data.get('color')

        if 'lead_id' in data:
            lead_id = data.get('lead_id')
            if lead_id:
                lead_user = User.objects.filter(id=lead_id).first()
                team.leader = lead_user
                if lead_user:
                    lead_user.team = team
                    lead_user.save()
            else:
                team.leader = None

        if 'member_ids' in data:
            member_ids = data.get('member_ids')
            if isinstance(member_ids, list):
                User.objects.filter(team=team).update(team=None)
                if member_ids:
                    User.objects.filter(id__in=member_ids).update(team=team)

        team.updated_by = getattr(admin_user, 'username', 'admin') if admin_user else 'admin'
        team.save()

        updated_at_str = team.updated_at.strftime("%Y-%m-%dT%H:%M:%SZ") if team.updated_at else timezone.now().strftime("%Y-%m-%dT%H:%M:%SZ")
        region_str = team.organization.state if (team.organization and getattr(team.organization, 'state', None)) else "North Region"

        return {
            "status": True,
            "message": "Team updated successfully",
            "data": {
                "id": team.id,
                "name": team.name,
                "region": region_str,
                "color": team.badge_color,
                "updated_at": updated_at_str
            }
        }
    except Exception as e:
        raise APIException(str(e))


def delete_team_admin(admin_user, data):
    """
    Soft Delete a Team using Pure Django ORM.
    """
    try:
        t_id = data.get('id') or data.get('team_id') or data.get('teamId')
        if not t_id:
            return {"status": False, "message": "Team ID is required"}

        team_qs = Team.objects.filter(id=t_id)
        if admin_user and getattr(admin_user, 'is_authenticated', False) and getattr(admin_user, 'organization', None):
            team_qs = team_qs.filter(organization=admin_user.organization)

        team = team_qs.first()
        if not team:
            return {"status": False, "message": "Team not found"}

        User.objects.filter(team=team).update(team=None)
        deleter_id = admin_user.id if (admin_user and getattr(admin_user, 'is_authenticated', False)) else None
        team.save_delete(user_id=deleter_id)

        return {
            "status": True,
            "message": "Team deleted successfully. Assigned members are now unassigned."
        }
    except Exception as e:
        raise APIException(str(e))


def fetch_team_dropdowns_admin(user=None, data=None):
    """
    Fetch dropdown options for Team Create & Edit modals (Leader & Members selection).
    Returns ALL active users under 'users', 'telecallers', 'members', 'leaders'.
    """
    try:
        data = data or {}
        users_qs = User.objects.filter(is_active=True).select_related('team').order_by("first_name", "username")

        if user and getattr(user, 'is_authenticated', False) and getattr(user, 'organization_id', None):
            users_qs = users_qs.filter(organization_id=user.organization_id)

        all_users = []
        for u in users_qs:
            fname = (u.first_name or "").strip()
            lname = (u.last_name or "").strip()
            display_name = f"{fname} {lname}".strip() if (fname or lname) else u.username

            all_users.append({
                "id": u.id,
                "value": u.id,
                "name": display_name,
                "label": display_name,
                "username": u.username,
                "email": u.email or "",
                "role": getattr(getattr(u, 'role', None), 'name', None) or getattr(u, 'user_type', None) or "User",
                "team_id": u.team_id,
                "team_name": u.team.name if u.team else None
            })

        teams_qs = Team.objects.filter(is_active=True).order_by("name")
        if user and getattr(user, 'is_authenticated', False) and getattr(user, 'organization_id', None):
            teams_qs = teams_qs.filter(organization_id=user.organization_id)

        all_teams = [{"id": t.id, "value": t.id, "name": t.name, "label": t.name} for t in teams_qs]

        return {
            "status": True,
            "message": "Team dropdowns fetched successfully",
            "data": {
                "users": all_users,
                "telecallers": all_users,
                "members": all_users,
                "leaders": all_users,
                "teams": all_teams
            }
        }
    except Exception as e:
        raise APIException(str(e))
