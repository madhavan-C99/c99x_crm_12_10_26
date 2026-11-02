from django.db import connection
from adm.models import CollectionQuery
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
}


def exec_raw_sql(qry_key, qry_vars=dict(), opt_filter=dict()):
    try:
        clean_key = str(qry_key or '').strip()
        upper_key = clean_key.upper()
        resolved_key = QUERY_KEY_ALIASES.get(upper_key, upper_key)

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

            raise APIException(f"Query key '{qry_key}' not found in CollectionQuery registry.")

        replaced_query = replace_query(coll_qry.query, qry_vars)
        with connection.cursor() as cursor:
            cursor.execute(replaced_query)
            res_vals = dict_fetch_all(cursor)
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
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    return obj
