from adm.services.permission_services import authorize_request
from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.http import HttpResponse

from ..services.facebook_integration_services import (
    fetch_crm_pipelines_service,
    fetch_crm_campaigns_service,
    fetch_crm_fields_service,
    generate_fb_oauth_url,
    exchange_code_for_fb_account,
    fetch_facebook_pages,
    fetch_page_lead_forms,
    create_fb_connection,
    list_fb_connections_service,
    delete_fb_connection_service,
    process_single_leadgen_event
)


# 1. Integration Helpers for UI Dropdowns
class FetchCRMPipelinesAdminView(APIView):
    def get(self, request):
        authorize_request('api_integrations_facebook', request.user)
        data = fetch_crm_pipelines_service(request.user)
        return Response({"data": data}, status=status.HTTP_200_OK)


class FetchCRMCampaignsAdminView(APIView):
    def get(self, request):
        authorize_request('api_integrations_facebook', request.user)
        data = fetch_crm_campaigns_service(request.user)
        return Response({"data": data}, status=status.HTTP_200_OK)


class FetchCRMFieldsAdminView(APIView):
    def get(self, request):
        authorize_request('api_integrations_facebook', request.user)
        data = fetch_crm_fields_service(request.user)
        return Response({"data": data}, status=status.HTTP_200_OK)


# 2. OAuth Start & Callback
class FBOAuthStartAdminView(APIView):
    class InputSerializer(serializers.Serializer):
        reauth = serializers.BooleanField(required=False, default=False)

    def post(self, request):
        authorize_request('api_integrations_facebook', request.user)
        serializer = self.InputSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        host = request.build_absolute_uri('/')[:-1]
        redirect_uri = f"{host}/adm/fb_oauth_callback"
        auth_url = generate_fb_oauth_url(request.user, reauth=serializer.validated_data["reauth"], redirect_uri=redirect_uri)
        return Response({"data": {"authUrl": auth_url}}, status=status.HTTP_200_OK)


class FBOAuthCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.query_params.get("code")
        state = request.query_params.get("state")
        host = request.build_absolute_uri('/')[:-1]
        redirect_uri = f"{host}/adm/fb_oauth_callback"

        try:
            account = exchange_code_for_fb_account(code, state, redirect_uri)
            html = f"""
            <html><body>
            <script>
                if (window.opener) {{
                    window.opener.postMessage({{ accountId: {account.id}, accountName: "{account.name}" }}, "*");
                }}
                window.close();
            </script>
            <p>Authentication successful! Closing window...</p>
            </body></html>
            """
            return HttpResponse(html, content_type="text/html")
        except Exception as e:
            return HttpResponse(f"OAuth Error: {str(e)}", status=400)


# 3. Pages & Forms (Using InputSerializer)
class FetchFBPagesAdminView(APIView):
    class InputSerializer(serializers.Serializer):
        account_id = serializers.IntegerField(required=True)

    def post(self, request):
        authorize_request('api_integrations_facebook', request.user)
        serializer = self.InputSerializer(data=request.data or request.query_params)
        serializer.is_valid(raise_exception=True)

        result = fetch_facebook_pages(user=request.user, **serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_200_OK)


class FetchFBFormsAdminView(APIView):
    class InputSerializer(serializers.Serializer):
        account_id = serializers.IntegerField(required=True)
        page_id = serializers.CharField(required=True)

    def post(self, request):
        authorize_request('api_integrations_facebook', request.user)
        serializer = self.InputSerializer(data=request.data or request.query_params)
        serializer.is_valid(raise_exception=True)

        result = fetch_page_lead_forms(user=request.user, **serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_200_OK)


# 4. Connections Management
class CreateFBConnectionAdminView(APIView):
    class InputSerializer(serializers.Serializer):
        accountId = serializers.IntegerField(required=True)
        pageId = serializers.CharField(required=True)
        pipelineId = serializers.IntegerField(required=True)
        routing = serializers.DictField(required=True)
        fieldMapping = serializers.DictField(required=False, allow_null=True)
        formMode = serializers.ChoiceField(choices=['specific', 'all'], default='all')
        formIds = serializers.ListField(child=serializers.CharField(), required=False, default=[])

    def post(self, request):
        authorize_request('api_integrations_facebook', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        conn = create_fb_connection(
            user=request.user,
            account_id=data["accountId"],
            page_id=data["pageId"],
            pipeline_id=data["pipelineId"],
            routing_data=data["routing"],
            field_mapping=data.get("fieldMapping"),
            form_mode=data["formMode"],
            form_ids=data.get("formIds", [])
        )
        host = request.build_absolute_uri('/')[:-1]
        res = {
            "id": conn.id,
            "uid": conn.uid,
            "page": {"id": conn.page_id, "name": conn.page_name},
            "status": conn.status,
            "webhookUrl": f"{host}/adm/manual_fb_lead_push_admin?uid={conn.uid}"
        }
        return Response({"data": res}, status=status.HTTP_201_CREATED)


class FetchFBConnectionsAdminView(APIView):
    def get(self, request):
        authorize_request('api_integrations_facebook', request.user)
        host = request.build_absolute_uri('/')[:-1]
        data = list_fb_connections_service(request.user, host)
        return Response({"data": data}, status=status.HTTP_200_OK)


class DeleteFBConnectionAdminView(APIView):
    class InputSerializer(serializers.Serializer):
        connection_id = serializers.IntegerField(required=True)

    def post(self, request):
        authorize_request('api_integrations_facebook', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        delete_fb_connection_service(user=request.user, **serializer.validated_data)
        return Response({"data": {"status": "deleted"}}, status=status.HTTP_200_OK)


# 5. Manual Push Webhook Endpoint
class ManualFBLeadPushAdminView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.query_params.get("uid") or request.data.get("uid")
        payload = request.data or {}
        for entry in payload.get("entry", []):
            for change in entry.get("changes", []):
                val = change.get("value", {})
                process_single_leadgen_event(
                    leadgen_id=str(val.get("leadgen_id", "")),
                    form_id=str(val.get("form_id", "")),
                    connection_uid=uid,
                    direct_data=val
                )
        return Response({"data": {"status": "received"}}, status=status.HTTP_200_OK)
