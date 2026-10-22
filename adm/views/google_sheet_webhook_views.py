import logging
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import authentication_classes, permission_classes

from ..services.google_sheet_webhook_services import ingest_google_sheet_lead_to_crm

logger = logging.getLogger(__name__)


@authentication_classes([])
@permission_classes([])
class GoogleSheetLeadWebhookAPIView(APIView):
    """
    Public Webhook Endpoint to receive leads from Google Sheets (via Google Apps Script)
    or Website Forms.
    URL: POST /adm/webhook/google_sheet_lead
    """

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
        elif result.get("status") == "duplicate":
            # Return 200 OK so Google Apps Script marks it finished and doesn't retry endlessly
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
