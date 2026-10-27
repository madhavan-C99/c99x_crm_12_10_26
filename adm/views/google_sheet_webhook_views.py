import logging
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import authentication_classes, permission_classes
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from ..services.google_sheet_webhook_services import ingest_google_sheet_lead_to_crm

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
@authentication_classes([])
@permission_classes([])
class GoogleSheetLeadWebhookAPIView(APIView):
   
    def post(self, request):
        token = (
            request.data.get("secret_token")
            or request.headers.get("X-Secret-Token")
            or request.query_params.get("secret_token")
        )
        expected_token = getattr(settings, "GOOGLE_SHEET_WEBHOOK_SECRET", "MY_GOOGLE_SHEET_CRM_SECRET")

        if token != expected_token:
            logger.warning("Google Sheet Webhook rejected: Invalid secret token provided.")
            return Response(
                {"status": "error", "message": "Forbidden: Invalid secret token"},
                status=status.HTTP_403_FORBIDDEN
            )

        result = ingest_google_sheet_lead_to_crm(request.data or {})

        if result.get("status") == "success":
            return Response(result, status=status.HTTP_201_CREATED)
        elif result.get("status") in ["duplicate", "updated"]:
            # Return 200 OK so Google Apps Script marks it finished and doesn't retry endlessly
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
