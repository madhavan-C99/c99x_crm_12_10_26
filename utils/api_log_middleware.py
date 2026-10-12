import json
import logging
from django.utils.deprecation import MiddlewareMixin
from telecalling.models.api_log import ApiLog

logger = logging.getLogger('django')

# Sensitive keys to mask in request/response payloads to prevent leaking confidential data
SENSITIVE_KEYS = {'password', 'token', 'refresh', 'access', 'secret', 'api_key'}


from datetime import date, datetime
from decimal import Decimal
import uuid


def mask_sensitive_data(data):
    
    if isinstance(data, dict):
        masked = {}
        for k, v in data.items():
            if str(k).lower() in SENSITIVE_KEYS:
                masked[k] = "***MASKED***"
            else:
                masked[k] = mask_sensitive_data(v)
        return masked
    elif isinstance(data, (list, tuple, set)):
        return [mask_sensitive_data(item) for item in data]
    elif isinstance(data, (datetime, date)):
        return data.isoformat()
    elif isinstance(data, Decimal):
        return float(data)
    elif isinstance(data, uuid.UUID):
        return str(data)
    elif hasattr(data, '__dict__'):
        return str(data)
    return data



class APIAuditLogMiddleware(MiddlewareMixin):
  
    def process_response(self, request, response):
        path = request.path
        
        # Skip static files, admin site, media files, and favicon requests
        if (path.startswith('/admin/') or 
            path.startswith('/static/') or 
            path.startswith('/media/') or 
            path == '/favicon.ico'):
            return response

        try:
            # 1. Identify User
            user = request.user if (hasattr(request, 'user') and getattr(request.user, 'is_authenticated', False)) else None

            # 2. Extract Request Payload
            request_payload = {}
            if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
                try:
                    if hasattr(request, 'data'):
                        request_payload = request.data
                    elif hasattr(request, 'POST') and request.POST:
                        request_payload = request.POST.dict()
                    elif request.body:
                        request_payload = json.loads(request.body.decode('utf-8'))
                except Exception:
                    request_payload = {}
            elif request.method == 'GET' and request.GET:
                request_payload = request.GET.dict()

            # 3. Extract Response Payload
            response_payload = {}
            if hasattr(response, 'data'):
                response_payload = response.data
            elif getattr(response, 'content', None) and 'application/json' in response.get('Content-Type', ''):
                try:
                    response_payload = json.loads(response.content.decode('utf-8'))
                except Exception:
                    response_payload = {}

            # 4. Mask Confidential Data
            safe_req_payload = mask_sensitive_data(request_payload)
            safe_res_payload = mask_sensitive_data(response_payload)

            # 5. Auto Save to DB Table `api_log`
            ApiLog.objects.create(
                user=user,
                api_name=path,
                method=request.method,
                request_payload=safe_req_payload if isinstance(safe_req_payload, (dict, list)) else {"raw": str(safe_req_payload)},
                response_payload=safe_res_payload if isinstance(safe_res_payload, (dict, list)) else {"raw": str(safe_res_payload)},
                status=str(response.status_code)
            )

        except Exception as e:
            # Prevent audit logging issues from interrupting user API response
            logger.error(f"Error in APIAuditLogMiddleware: {str(e)}")

        return response
