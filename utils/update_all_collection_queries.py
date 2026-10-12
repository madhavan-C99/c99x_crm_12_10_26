import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_api.settings')
django.setup()

from adm.models import CollectionQuery

def update_collection_queries():
    
    org_tables = [
        'adm_pipeline_category', 'telecalling_lead', 'adm_team',
        'telecalling_campaign', 'telecalling_lead_source',
        'telecalling_pipeline_stage', 'telecalling_call_details',
        'telecalling_user_settings', 'adm_user'
    ]

    updated_count = 0
    queries = CollectionQuery.objects.all()

    for q in queries:
        sql = q.query or ""
        sql_lower = sql.lower()

        if '@_organization_id' not in sql:
            matched_table = next((tbl for tbl in org_tables if tbl in sql_lower), None)
            if matched_table:
                filter_clause = f" ({matched_table}.organization_id = @_organization_id OR @_organization_id IS NULL OR @_organization_id = 0) "
                
                if 'where' in sql_lower:
                    if 'order by' in sql_lower:
                        idx = sql_lower.find('order by')
                        new_sql = sql[:idx] + f" AND {filter_clause} " + sql[idx:]
                    elif 'group by' in sql_lower:
                        idx = sql_lower.find('group by')
                        new_sql = sql[:idx] + f" AND {filter_clause} " + sql[idx:]
                    else:
                        new_sql = sql + f" AND {filter_clause} "
                else:
                    if 'order by' in sql_lower:
                        idx = sql_lower.find('order by')
                        new_sql = sql[:idx] + f" WHERE {filter_clause} " + sql[idx:]
                    elif 'group by' in sql_lower:
                        idx = sql_lower.find('group by')
                        new_sql = sql[:idx] + f" WHERE {filter_clause} " + sql[idx:]
                    else:
                        new_sql = sql + f" WHERE {filter_clause} "
                
                q.query = new_sql
                q.save()
                updated_count += 1
                print(f"[UPDATED] Key: {q.key} | Table: {matched_table}")

    print(f"\nDone! Updated {updated_count} CollectionQuery records.")

if __name__ == '__main__':
    update_collection_queries()
