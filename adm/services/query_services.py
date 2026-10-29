from django.db import connection
from adm.models import CollectionQuery
from rest_framework.exceptions import APIException
from datetime import date, datetime
import re


def exec_raw_sql(qry_key, qry_vars=dict(), opt_filter=dict()):
    try:
        if qry_key == 'L_TELECALLERS':
            qry_vars = dict(qry_vars) if qry_vars else {}
            if qry_vars.get('campaign_id') in (None, ''):
                qry_vars['campaign_id'] = 0

        try:
            coll_qry = CollectionQuery.objects.get(key=qry_key)
        except CollectionQuery.DoesNotExist:
            from telecalling.services.lead_services import DROPDOWN_MODEL_MAP, get_selected_option
            if qry_key in DROPDOWN_MODEL_MAP:
                return get_selected_option(dropdown_category=qry_key, **qry_vars)
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
    return replquery


def make_serializable(obj):
    if isinstance(obj, list):
        return [make_serializable(item) for item in obj]
    if isinstance(obj, dict):
        return {key: make_serializable(value) for key, value in obj.items()}
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    return obj
