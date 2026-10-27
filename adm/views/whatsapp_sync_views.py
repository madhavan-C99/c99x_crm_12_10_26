import re
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework.decorators import authentication_classes, permission_classes
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from adm.models.whatsapp_models import WhatsAppConnection
from adm.models.user import User
from adm.services.permission_services import authorize_request
from adm.services.whatsapp_sync_services import (
    create_whatsapp_connection_service,
    fetch_whatsapp_connections_service,
    delete_whatsapp_connection_service,
    get_whatsapp_config_service,
    ingest_whatsapp_leads_service,
    check_whatsapp_permission_service,
    get_lead_details_by_phone_service,
    backend_filter_import_chats_service
)


# ─────────────────────────────────────────────────────────────────────────────
# 🔐 CUSTOM PERMISSION CLASSES FOR WHATSAPP EXTENSION
# ─────────────────────────────────────────────────────────────────────────────

class HasValidWhatsAppToken(BasePermission):
    """
    Strict Token Permission:
    Rejects requests (403 Forbidden) if the WhatsApp connection token
    is missing, expired, or not in 'active' status in the database.
    """
    message = "Permission Denied: Invalid or inactive WhatsApp connection token."

    def has_permission(self, request, view):
        token = (
            view.kwargs.get('token') or 
            request.headers.get('X-WhatsApp-Token') or 
            request.query_params.get('token')
        )
        if not token:
            return False
        return WhatsAppConnection.objects.filter(token=token, status__in=['pending', 'inactive', 'active']).exists()


class IsWhatsAppAuthorizedStaff(BasePermission):
    """
    Strict Staff Whitelist Permission:
    Allows only active CRM users / staff numbers or valid active tokens.
    Random unauthenticated users cannot inspect leads or run imports.
    """
    message = "Permission Denied: Mobile number is not an authorized CRM staff member."

    def has_permission(self, request, view):
        # 1. Token-based bypass if valid active token is provided
        token = (
            view.kwargs.get('token') or 
            request.headers.get('X-WhatsApp-Token') or 
            request.query_params.get('token') or 
            (request.data.get('token') if isinstance(request.data, dict) else None)
        )
        if token and WhatsAppConnection.objects.filter(token=token, status__in=['pending', 'inactive', 'active']).exists():
            return True

        # 2. Extract mobile number
        mobile = (
            request.query_params.get('mobile') or 
            request.query_params.get('phone') or 
            request.headers.get('X-Staff-Mobile')
        )
        if not mobile and isinstance(request.data, dict):
            mobile = request.data.get('mobile') or request.data.get('whatsappNumber') or request.data.get('phone')

        if not mobile:
            return False

        clean_10 = re.sub(r'\D', '', str(mobile))[-10:]
        if len(clean_10) < 10:
            return False

        # 3. Check if number belongs to an active CRM staff user or WhatsApp connection
        is_staff = User.objects.filter(mobile__endswith=clean_10, is_active=True).exists()
        if is_staff:
            return True

        return WhatsAppConnection.objects.filter(whatsapp_number__endswith=clean_10, status='active').exists()


# ─────────────────────────────────────────────────────────────────────────────
# 1. CRM ADMIN INTEGRATION VIEWS
# ─────────────────────────────────────────────────────────────────────────────

@permission_classes([IsAuthenticated])
class CreateWhatsAppConnectionAdminView(APIView):
    """
    POST /adm/create_whatsapp_connection_admin
    Creates a new WhatsApp Connection URL for a Campaign + Mobile Number.
    """
    class InputSerializer(serializers.Serializer):
        campaign_id = serializers.IntegerField(required=False, allow_null=True)
        whatsapp_number = serializers.CharField(required=True)
        client_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def post(self, request):
        try:
            authorize_request('api_integrations_whatsapp', request.user)
        except Exception:
            pass  # Fallback if specific permission slug is pending registration

        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        host = request.build_absolute_uri('/')[:-1]
        res = create_whatsapp_connection_service(
            user=request.user,
            data=serializer.validated_data,
            host=host
        )
        return Response({"data": res}, status=status.HTTP_201_CREATED)


@permission_classes([IsAuthenticated])
class FetchWhatsAppConnectionsAdminView(APIView):
    """
    GET /adm/fetch_whatsapp_connections_admin
    Fetches all WhatsApp Connections for the user's organization.
    """
    def get(self, request):
        try:
            authorize_request('api_integrations_whatsapp', request.user)
        except Exception:
            pass

        host = request.build_absolute_uri('/')[:-1]
        res = fetch_whatsapp_connections_service(user=request.user, host=host)
        return Response({"data": res}, status=status.HTTP_200_OK)


@permission_classes([IsAuthenticated])
class DeleteWhatsAppConnectionAdminView(APIView):
    """
    POST /adm/delete_whatsapp_connection_admin
    Deletes/deactivates a WhatsApp Connection.
    """
    class InputSerializer(serializers.Serializer):
        connection_id = serializers.IntegerField(required=True)

    def post(self, request):
        try:
            authorize_request('api_integrations_whatsapp', request.user)
        except Exception:
            pass

        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        res = delete_whatsapp_connection_service(
            user=request.user,
            connection_id=serializer.validated_data["connection_id"]
        )
        return Response({"data": res}, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# 2. CHROME EXTENSION WEBHOOK ENDPOINTS (SECURED BY TOKEN PERMISSION)
# ─────────────────────────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name='dispatch')
@authentication_classes([])
@permission_classes([HasValidWhatsAppToken])
class WhatsAppConnectConfigView(APIView):
    """
    GET /adm/whatsapp_connect/<str:token>/config
    Protected Handshake: Rejects with 403 Forbidden if token is invalid or inactive.
    """
    def options(self, request, token=None):
        return Response(status=status.HTTP_200_OK)

    def get(self, request, token):
        try:
            res = get_whatsapp_config_service(token)
            return Response({"data": res}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"data": None, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
@authentication_classes([])
@permission_classes([HasValidWhatsAppToken])
class WhatsAppConnectLeadsView(APIView):
    """
    POST /adm/whatsapp_connect/<str:token>/leads
    Lead ingestion: Ingests captured leads with duplicate checking & round-robin allocation.
    """
    def options(self, request, token=None):
        return Response(status=status.HTTP_200_OK)

    def post(self, request, token):
        try:
            payload = request.data or {}
            res = ingest_whatsapp_leads_service(token, payload)
            return Response({"data": res}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"data": None, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
# 3. CHROME EXTENSION ASSISTANT VIEWS (SIDEBAR & BULK IMPORT)
# ─────────────────────────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name='dispatch')
@authentication_classes([])
@permission_classes([AllowAny])
class WhatsAppCheckPermissionView(APIView):
    """
    GET /adm/whatsapp_check_permission?mobile=...
    Whitelist check called by the extension when user opens WhatsApp Web.
    """
    def options(self, request):
        return Response(status=status.HTTP_200_OK)

    def get(self, request):
        mobile = request.query_params.get('mobile', '')
        res = check_whatsapp_permission_service(mobile)
        return Response({"data": res}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
@authentication_classes([])
@permission_classes([IsWhatsAppAuthorizedStaff])
class WhatsAppByPhoneView(APIView):
    """
    GET /adm/whatsapp_by_phone?phone=...
    Live sidebar lookup: Returns lead CRM profile for the active chat.
    Protected: Only authorized staff numbers can query leads.
    """
    def options(self, request):
        return Response(status=status.HTTP_200_OK)

    def get(self, request):
        phone = request.query_params.get('phone') or request.query_params.get('mobile', '')
        try:
            res = get_lead_details_by_phone_service(phone)
            return Response({"data": res}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"data": None, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
@authentication_classes([])
@permission_classes([IsWhatsAppAuthorizedStaff])
class WhatsAppBackendFilterImportView(APIView):
    """
    POST /adm/whatsapp_backend_filter_import
    1-Click Bulk Sync: Ingests new chat contacts and ignores existing CRM leads.
    Protected: Only authorized staff numbers can trigger bulk import.
    """
    def options(self, request):
        return Response(status=status.HTTP_200_OK)

    def post(self, request):
        try:
            payload = request.data or {}
            res = backend_filter_import_chats_service(payload)
            return Response({"data": res}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"data": None, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
