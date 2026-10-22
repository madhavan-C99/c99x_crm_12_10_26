import hmac
import hashlib
import json
import logging

from django.conf import settings
from django.http import HttpResponse, JsonResponse
from rest_framework.views import APIView
from rest_framework.decorators import authentication_classes, permission_classes

from ..services.meta_webhook_services import ingest_meta_lead_to_crm
from ..services.facebook_integration_services import process_single_leadgen_event

logger = logging.getLogger(__name__)


def verify_meta_signature(request) -> bool:
    """Verifies that the request came securely from Meta Cloud using HMAC SHA-256"""
    signature = request.headers.get("X-Hub-Signature-256", "")
    if not signature.startswith("sha256="):
        return False

    app_secret = getattr(settings, "META_APP_SECRET", "")
    if not app_secret:
        return True  # If no secret configured, bypass

    expected = "sha256=" + hmac.new(
        app_secret.encode("utf-8"), request.body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)


@authentication_classes([])
@permission_classes([])
class MetaLeadWebhookAPIView(APIView):
    """
    Meta Webhook Endpoint:
    GET  -> Verification Handshake (hub.challenge)
    POST -> Ingests Real-time Leads into CRM
    """

    def get(self, request):
        """1. Meta Webhook Setup Handshake"""
        mode = (
            request.query_params.get("hub.mode")
            or request.query_params.get("hub_mode")
            or request.GET.get("hub.mode")
            or request.GET.get("hub_mode")
        )
        token = (
            request.query_params.get("hub.verify_token")
            or request.query_params.get("hub_verify_token")
            or request.GET.get("hub.verify_token")
            or request.GET.get("hub_verify_token")
        )
        challenge = (
            request.query_params.get("hub.challenge")
            or request.query_params.get("hub_challenge")
            or request.GET.get("hub.challenge")
            or request.GET.get("hub_challenge")
        )

        expected_tokens = {
            getattr(settings, "META_VERIFY_TOKEN", "").strip(),
            "10cc75f752eadd0962b830454c2592e0",
            "MY_SECRET_INSTAGRAM_CRM_TOKEN"
        }

        if mode == "subscribe" and token in expected_tokens:
            logger.info("Meta Webhook Verification Handshake Successful! ✅")
            return HttpResponse(challenge, content_type="text/plain", status=200)

        logger.warning(f"Meta Webhook Handshake Failed: Invalid Token (Received: {token})")
        return HttpResponse("Forbidden Token", status=403)

    def post(self, request):
        """2. Receives Live Meta Leads (Always returns 200 OK so Meta never disables the webhook)"""
        # Security Signature check (bypassed in debug mode if needed)
        if not verify_meta_signature(request) and not getattr(settings, "DEBUG", False):
            logger.warning("Invalid Meta Webhook Signature received!")
            return HttpResponse("Forbidden Signature", status=403)

        try:
            payload = request.data if isinstance(request.data, dict) else json.loads(request.body.decode("utf-8"))

            for entry in payload.get("entry", []):
                for change in entry.get("changes", []):
                    value = change.get("value", {})
                    leadgen_id = str(value.get("leadgen_id", ""))
                    form_id = str(value.get("form_id", ""))
                    page_id = str(value.get("page_id", ""))
                    ad_id = str(value.get("ad_id", ""))
                    campaign_id = str(value.get("campaign_id", ""))

                    if leadgen_id:
                        process_single_leadgen_event(
                            leadgen_id=leadgen_id,
                            form_id=form_id,
                            page_id=page_id,
                            ad_id=ad_id,
                            campaign_id=campaign_id,
                            direct_data=value
                        )

            return JsonResponse({"status": "success"}, status=200)

        except Exception as e:
            logger.error("Error processing Meta webhook POST: %s", e)
            return JsonResponse({"status": "received_with_errors"}, status=200)
