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
        cursor = connection.cursor()
        cursor.execute(replaced_query)
        res_vals = dict_fetch_all(cursor)
        cursor.close()
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
    for key, raw_val in sorted(qry_vars.items(), key=lambda x: len(x[0]), reverse=True):
        if raw_val is None:
            val = ""
        elif isinstance(raw_val, (int, float)):
            val = str(raw_val)
        else:
            val = str(raw_val).replace("'", "''")  # SQL Injection Prevention
        replquery = replquery.replace("@_" + key, val)

    return re.sub(r'@[_a-zA-Z0-9]+', '', replquery)


def make_serializable(obj):
    if isinstance(obj, list):
        return [make_serializable(item) for item in obj]
    if isinstance(obj, dict):
        return {key: make_serializable(value) for key, value in obj.items()}
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    return obj
