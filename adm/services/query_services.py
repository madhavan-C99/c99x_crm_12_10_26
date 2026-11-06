from django.db import connection
from django.db.models import Q
from adm.models import CollectionQuery, Role, User, Organization, Team
from rest_framework.exceptions import APIException
from datetime import date, datetime
from telecalling.models.courses import CourseName

import re


QUERY_KEY_ALIASES = {
    'L_COURSES': 'L_COURSE_NAMES',
    'L_COURSE': 'L_COURSE_NAMES',
    'L_COURSENAME': 'L_COURSE_NAMES',
    'L_PLANS': 'L_COURSE_PLANS',
    'L_TIMINGS': 'L_COURSE_TIMINGS',
    'L_TIMES': 'L_COURSE_TIMINGS',
    'L_SOURCES': 'L_LEAD_SOURCES',
    'L_LEAD_SOURCE': 'L_LEAD_SOURCES',
    'L_ROLES': 'L_ROLES',
    'L_REPORTING_MANAGERS': 'L_REPORTING_MANAGERS',
    'L_REPORTING_MANAGER': 'L_REPORTING_MANAGERS',
    'L_CATEGORY': 'L_CATEGORIES',
    'L_PIPELINE_CATEGORY': 'L_CATEGORIES',
    'L_PIPELINE_CATEGORIES': 'L_CATEGORIES',
    'L_UNASSIGNED_TEAM_LEADS': 'L_UNASSIGNED_TEAM_LEADS',
    'L_UNASSIGNED_TEAM_LEAD': 'L_UNASSIGNED_TEAM_LEADS',
    'L_UNASSIGNED_TELECALLERS': 'L_UNASSIGNED_TELECALLERS',
    'L_UNASSIGNED_TELECALLER': 'L_UNASSIGNED_TELECALLERS',
    'L_CAMPAIGN_MANAGER': 'L_CAMPAIGN_MANAGERS',
}


def fetch_reporting_managers_hierarchy(org_id, target_role=None):
    """
    Returns reporting managers sorted strictly by enterprise hierarchy:
      1. Org Admin (1st user of organization)
      2. Admin (adm)
      3. Manager (mgr)
      4. Asst Manager (amgr)
      5. Team Lead (tl)

    Label format: {name} ({role_code}) e.g. gunal (adm), harini (tl)
    Filters managers based on target_role (only superiors are shown).
    Executives / Telecallers / Developers are strictly excluded.
    """
    if not org_id:
        return []

    org = Organization.objects.filter(id=org_id).first()
    if not org:
        return []

    first_user = User.objects.filter(organization=org, is_active=True).order_by('id').first()
    org_admin_id = first_user.id if first_user else None

    ROLE_RANK = {
        'org_admin': 1,
        'admin': 2,
        'manager': 3,
        'asst_manager': 4,
        'team_lead': 5,
        'executive': 6,
    }

    ROLE_SHORT_CODE = {
        'org_admin': 'Org_adm',
        'admin': 'Adm',
        'manager': 'Mgr',
        'asst_manager': 'Amgr',
        'team_lead': 'Tl',
    }

    users = User.objects.filter(
        organization=org,
        is_active=True
    ).prefetch_related('user_roles__role').order_by('id')

    manager_candidates = []
    for u in users:
        role_objs = [ur.role for ur in u.user_roles.all() if ur.role]
        role_names = [r.name.lower() for r in role_objs]
        role_codes = [r.code.upper() for r in role_objs]

        if u.id == org_admin_id:
            role_key = 'org_admin'
        elif 'admin' in role_names or 'ADM' in role_codes:
            role_key = 'admin'
        elif 'manager' in role_names or 'MGR' in role_codes:
            role_key = 'manager'
        elif 'asst_manager' in role_names or 'AMGR' in role_codes:
            role_key = 'asst_manager'
        elif 'team_lead' in role_names or 'TEAM_LEAD' in role_codes:
            role_key = 'team_lead'
        else:
            continue

        rank = ROLE_RANK[role_key]
        short_code = ROLE_SHORT_CODE[role_key]

        raw_name = (f"{u.first_name or ''} {u.last_name or ''}").strip() or u.username
        name = raw_name.title() if raw_name else ""
        label = f"{name} ({short_code})"

        manager_candidates.append({
            'value': u.id,
            'label': label,
            'role_key': role_key,
            'rank': rank,
            'name': name
        })

    manager_candidates.sort(key=lambda x: (x['rank'], x['name'].lower()))

    if target_role:
        target_str = str(target_role).strip().lower().replace(" ", "_")
        if target_str.isdigit():
            r_obj = Role.objects.filter(id=int(target_str)).first()
            if r_obj:
                target_str = r_obj.name.lower().replace(" ", "_")

        target_rank = ROLE_RANK.get(target_str, 99)
        manager_candidates = [m for m in manager_candidates if m['rank'] < target_rank]

    return [{'value': m['value'], 'label': m['label']} for m in manager_candidates]


def fetch_unassigned_team_leads(org_id, team_id=None):
    """
    Returns only users with role 'team_lead' who are NOT already leading
    another active team or belonging to another team.
    """
    if not org_id:
        return []

    tl_roles = Role.objects.filter(Q(code__iexact='TEAM_LEAD') | Q(name__iexact='team_lead'))
    
    qs = User.objects.filter(
        organization_id=org_id,
        is_active=True,
        user_roles__role__in=tl_roles
    ).distinct()

    # Exclude users who already lead an active team (except current team if editing)
    active_teams = Team.objects.filter(organization_id=org_id, is_active=True)
    if team_id:
        try:
            active_teams = active_teams.exclude(id=int(team_id))
        except (ValueError, TypeError):
            pass
    busy_leader_ids = set(active_teams.exclude(leader__isnull=True).values_list('leader_id', flat=True))
    qs = qs.exclude(id__in=busy_leader_ids)

    # Exclude users who are already members of another team
    other_members_qs = User.objects.filter(organization_id=org_id, team__isnull=False, team__is_active=True)
    if team_id:
        try:
            other_members_qs = other_members_qs.exclude(team_id=int(team_id))
        except (ValueError, TypeError):
            pass
    busy_member_ids = set(other_members_qs.values_list('id', flat=True))
    qs = qs.exclude(id__in=busy_member_ids)

    res = []
    for u in qs.order_by('first_name', 'last_name', 'username'):
        name = (f"{u.first_name or ''} {u.last_name or ''}").strip() or u.username
        res.append({'value': u.id, 'label': name})
    return res


def fetch_unassigned_telecallers(org_id, team_id=None, selected_lead_id=None):
    """
    Returns only users with role 'executive'/'telecaller' who do NOT belong
    to any team. Strictly excludes Admin, Manager, Asst Manager, TL, Dev.
    Also excludes the currently selected Team Lead in modal.
    """
    if not org_id:
        return []

    # 1. Strictly Executive / Telecaller roles only
    exec_roles = Role.objects.filter(
        Q(code__in=['EXE', 'TEL']) | 
        Q(name__in=['executive', 'telecaller'])
    )

    qs = User.objects.filter(
        organization_id=org_id,
        is_active=True,
        user_roles__role__in=exec_roles
    ).distinct()

    # 2. Strictly Exclude Admin, Manager, Asst Manager, Team Lead, Developer
    excluded_roles = Role.objects.filter(
        Q(code__in=['ADM', 'MGR', 'AMGR', 'DEV', 'TEAM_LEAD']) |
        Q(name__in=['admin', 'manager', 'asst_manager', 'developer', 'team_lead'])
    )
    qs = qs.exclude(user_roles__role__in=excluded_roles)

    # 3. Exclude anyone who is a leader of ANY active team
    active_leaders = set(Team.objects.filter(organization_id=org_id, is_active=True).exclude(leader__isnull=True).values_list('leader_id', flat=True))
    qs = qs.exclude(id__in=active_leaders)

    # 4. Exclude users who are already in another team
    if team_id:
        try:
            t_int = int(team_id)
            qs = qs.filter(Q(team_id__isnull=True) | Q(team_id=t_int))
        except (ValueError, TypeError):
            qs = qs.filter(team_id__isnull=True)
    else:
        qs = qs.filter(team_id__isnull=True)

    # 5. Exclude the selected TL in modal (madhavan issue fix)
    if selected_lead_id:
        try:
            qs = qs.exclude(id=int(selected_lead_id))
        except (ValueError, TypeError):
            pass

    res = []
    for u in qs.order_by('first_name', 'last_name', 'username'):
        name = (f"{u.first_name or ''} {u.last_name or ''}").strip() or u.username
        res.append({'value': u.id, 'label': name})
    return res


def exec_raw_sql(qry_key, qry_vars=dict(), opt_filter=dict()):
    try:
        clean_key = str(qry_key or '').strip()
        upper_key = clean_key.upper()
        resolved_key = QUERY_KEY_ALIASES.get(upper_key, upper_key)

        if resolved_key == 'L_REPORTING_MANAGERS':
            merged = {**(opt_filter or {}), **(qry_vars or {})}
            org_id = merged.get('organization_id')
            target_role = merged.get('role') or merged.get('target_role') or merged.get('role_name')
            return fetch_reporting_managers_hierarchy(org_id=org_id, target_role=target_role)

        if resolved_key == 'L_UNASSIGNED_TEAM_LEADS':
            merged = {**(opt_filter or {}), **(qry_vars or {})}
            org_id = merged.get('organization_id')
            team_id = merged.get('team_id') or merged.get('id')
            return fetch_unassigned_team_leads(org_id=org_id, team_id=team_id)

        if resolved_key == 'L_UNASSIGNED_TELECALLERS':
            merged = {**(opt_filter or {}), **(qry_vars or {})}
            org_id = merged.get('organization_id')
            team_id = merged.get('team_id') or merged.get('id')
            selected_lead_id = merged.get('lead_id') or merged.get('leader_id') or merged.get('team_lead_id')
            return fetch_unassigned_telecallers(org_id=org_id, team_id=team_id, selected_lead_id=selected_lead_id)

        if resolved_key == 'L_TEAMS':
            merged = {**(opt_filter or {}), **(qry_vars or {})}
            for_target = merged.get('for_target')
            raw_month = merged.get('month') or merged.get('target_month')

            if str(for_target).lower() in ('true', '1') or raw_month:
                qry_vars = dict(qry_vars) if qry_vars else {}
                qry_vars['for_target'] = 'true'

                parsed_ym = None
                if raw_month:
                    m_str = str(raw_month).strip()
                    if len(m_str) >= 7 and m_str[:4].isdigit() and m_str[4] == '-' and m_str[5:7].isdigit():
                        parsed_ym = m_str[:7]
                    else:
                        for fmt in ["%B %Y", "%b %Y", "%Y-%m", "%Y-%m-%d"]:
                            try:
                                dt = datetime.strptime(m_str, fmt)
                                parsed_ym = dt.strftime("%Y-%m")
                                break
                            except Exception:
                                pass
                if not parsed_ym:
                    from django.utils import timezone
                    parsed_ym = timezone.now().strftime("%Y-%m")
                qry_vars['month'] = parsed_ym

        if resolved_key == 'L_TELECALLERS':
            qry_vars = dict(qry_vars) if qry_vars else {}
            if qry_vars.get('campaign_id') in (None, ''):
                qry_vars['campaign_id'] = 0

        # Try exact, case-insensitive, or resolved alias lookup
        coll_qry = (
            CollectionQuery.objects.filter(key=clean_key).first() or
            CollectionQuery.objects.filter(key__iexact=clean_key).first() or
            CollectionQuery.objects.filter(key=resolved_key).first() or
            CollectionQuery.objects.filter(key__iexact=resolved_key).first()
        )

        if not coll_qry:
            # Safe ORM fallback for core dropdowns if missing from registry
            if resolved_key in ('L_COURSES', 'L_COURSE_NAMES'):
                org_id = qry_vars.get('organization_id')
                qs = CourseName.objects.filter(is_active=True)
                if org_id:
                    qs = qs.filter(organization_id=org_id)
                return [{"value": c.id, "label": c.course_name} for c in qs.order_by('course_name')]

            if resolved_key in ('L_CATEGORIES', 'L_PIPELINE_CATEGORIES', 'L_CATEGORY'):
                org_id = qry_vars.get('organization_id')
                from adm.models.pipeline_category import PipelineCategory
                qs = PipelineCategory.objects.filter(is_active=True)
                if org_id:
                    qs = qs.filter(organization_id=org_id)
                return [
                    {
                        'id': c.id,
                        'value': c.id,
                        'label': c.category_name,
                        'pipeline_id': c.id,
                        'category_name': c.category_name,
                    }
                    for c in qs.order_by('id')
                ]

            if resolved_key in ('L_CAMPAIGN_MANAGERS', 'L_CAMPAIGN_MANAGER'):
                org_id = qry_vars.get('organization_id')
                mgr_roles = Role.objects.filter(
                    Q(code__in=['ADM', 'MGR']) |
                    Q(name__in=['admin', 'manager'])
                )
                qs = User.objects.filter(is_active=True)
                if org_id:
                    qs = qs.filter(organization_id=org_id)
                qs = qs.filter(
                    Q(user_roles__role__in=mgr_roles) |
                    Q(user_type__in=['admin', 'manager', 'Admin', 'Manager']) |
                    Q(is_superuser=True)
                ).exclude(
                    Q(user_roles__role__code__in=['AMGR', 'EXE', 'DEV', 'TEAM_LEAD']) |
                    Q(user_roles__role__name__in=['asst_manager', 'executive', 'telecaller', 'developer', 'team_lead']) |
                    Q(user_type__in=['asst manager', 'asst_manager', 'Asst Manager', 'executive', 'telecaller', 'agent', 'team lead', 'developer', 'Executive', 'Telecaller', 'Agent', 'Team Lead'])
                ).distinct()
                return [
                    {
                        'id': u.id,
                        'value': u.id,
                        'label': (f"{u.first_name or ''} {u.last_name or ''}".strip()) or u.username,
                        'name': (f"{u.first_name or ''} {u.last_name or ''}".strip()) or u.username,
                    }
                    for u in qs.order_by('first_name', 'username')
                ]

            if resolved_key == 'L_TELECALLERS':
                org_id = qry_vars.get('organization_id')
                agent_roles = Role.objects.filter(
                    Q(code__in=['TEAM_LEAD', 'TL', 'EXE', 'TEL']) |
                    Q(name__in=['team_lead', 'team lead', 'executive', 'telecaller', 'counselor'])
                )
                qs = User.objects.filter(is_active=True)
                if org_id:
                    qs = qs.filter(organization_id=org_id)
                qs = qs.filter(
                    Q(user_roles__role__in=agent_roles) |
                    Q(user_type__in=['Team Lead', 'team lead', 'Executive', 'executive', 'telecaller', 'agent'])
                ).exclude(
                    Q(user_roles__role__code__in=['ADM', 'MGR', 'AMGR', 'DEV']) |
                    Q(user_roles__role__name__in=['admin', 'manager', 'asst_manager', 'developer']) |
                    Q(user_type__in=['admin', 'Admin', 'manager', 'Manager', 'asst manager', 'asst_manager', 'developer'])
                ).distinct()
                return [
                    {
                        'id': u.id,
                        'value': u.id,
                        'label': (f"{u.first_name or ''} {u.last_name or ''}".strip()) or u.username,
                        'name': (f"{u.first_name or ''} {u.last_name or ''}".strip()) or u.username,
                    }
                    for u in qs.order_by('first_name', 'username')
                ]

            raise APIException(f"Query key '{qry_key}' not found in CollectionQuery registry.")

        replaced_query = replace_query(coll_qry.query, qry_vars)
        with connection.cursor() as cursor:
            cursor.execute(replaced_query)
            res_vals = dict_fetch_all(cursor)
        if resolved_key == 'L_ROLES':
            res_vals = [
                r for r in res_vals
                if str(r.get('name') or r.get('label') or r.get('display_value') or '').strip().lower() not in ('developer', 'dev')
            ]
        if resolved_key == 'L_CATEGORIES':
            for r in res_vals:
                if 'id' not in r and 'value' in r:
                    r['id'] = r['value']
                if 'value' not in r and 'id' in r:
                    r['value'] = r['id']
                if 'pipeline_id' not in r:
                    r['pipeline_id'] = r.get('id') or r.get('value')
                if 'category_name' not in r:
                    r['category_name'] = r.get('label')
        if resolved_key in ('L_CAMPAIGN_MANAGERS', 'L_CAMPAIGN_MANAGER'):
            for r in res_vals:
                if 'id' not in r and 'value' in r:
                    r['id'] = r['value']
                if 'value' not in r and 'id' in r:
                    r['value'] = r['id']
                if 'name' not in r and 'label' in r:
                    r['name'] = r['label']
                r.pop('email', None)
        if resolved_key == 'L_TELECALLERS':
            for r in res_vals:
                if 'id' not in r and 'value' in r:
                    r['id'] = r['value']
                if 'value' not in r and 'id' in r:
                    r['value'] = r['id']
                if 'name' not in r and 'label' in r:
                    r['name'] = r['label']
        return make_serializable(res_vals)

    except APIException:
        raise
    except Exception as e:
        raise APIException(e)


def dict_fetch_all(cursor):
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]


def delete_exec_raw_sql(qry_key, qry_vars=dict()):
    try:
        coll_qry = CollectionQuery.objects.filter(key=qry_key).first()
        if coll_qry is not None:
            replaced_query = replace_query(coll_qry.query, qry_vars)
            cursor = connection.cursor()
            cursor.execute(replaced_query)
            cursor.close()
    except Exception as e:
        raise APIException(e)


def replace_query(qry, qry_vars):
    replquery = qry
    date_keys = {'from_date', 'to_date', 'start_date', 'end_date', 'date'}

    for key, raw_val in sorted(qry_vars.items(), key=lambda x: len(x[0]), reverse=True):
        is_empty = raw_val is None or (isinstance(raw_val, str) and raw_val.strip() == "")

        if is_empty:
            if key in date_keys:
                # Direct date casts like '@_from_date'::date must be NULL when empty
                replquery = replquery.replace(f"'@_{key} 00:00:00'", "NULL")
                replquery = replquery.replace(f"'@_{key} 23:59:59'", "NULL")
                replquery = replquery.replace(f"'@_{key}'", "NULL")
                replquery = replquery.replace(f"@_{key}", "NULL")
            else:
                # Quoted string placeholders become '' so ('@_key' = '') evaluates to TRUE in SQL!
                replquery = replquery.replace(f"'@_{key}'", "''")
                # Unquoted placeholders
                if key.endswith('_id') or key == 'id':
                    replquery = replquery.replace(f"@_{key}", "0")
                else:
                    replquery = replquery.replace(f"@_{key}", "NULL")
        elif isinstance(raw_val, (int, float)):
            val = str(raw_val)
            replquery = replquery.replace("@_" + key, val)
        else:
            val = str(raw_val).replace("'", "''")  # SQL Injection Prevention
            replquery = replquery.replace("@_" + key, val)

    # Cleanup remaining unpassed @variables safely
    for dk in date_keys:
        replquery = replquery.replace(f"'@_{dk}'", "NULL")
        replquery = replquery.replace(f"@_{dk}", "NULL")

    replquery = re.sub(r"'@[_a-zA-Z0-9]+'", "''", replquery)
    replquery = re.sub(r'@_id\\b|@[_a-zA-Z0-9]+_id\\b', '0', replquery)
    replquery = re.sub(r'@[_a-zA-Z0-9]+', 'NULL', replquery)
    replquery = replquery.strip().rstrip(',').strip()
    return replquery


def make_serializable(obj):
    if isinstance(obj, list):
        return [make_serializable(item) for item in obj]
    if isinstance(obj, dict):
        return {key: make_serializable(value) for key, value in obj.items()}
    if isinstance(obj, datetime):
        from django.utils import timezone
        if timezone.is_aware(obj):
            return timezone.localtime(obj).isoformat()
        return obj.isoformat()
    if isinstance(obj, date):
        return obj.isoformat()
    return obj
