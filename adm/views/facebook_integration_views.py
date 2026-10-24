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
        pipeline_id = request.query_params.get("pipeline_id") or request.query_params.get("pipelineId")
        data = fetch_crm_campaigns_service(request.user, pipeline_id=pipeline_id)
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
        error_desc = request.query_params.get("error_description") or request.query_params.get("error")

        if error_desc or not code:
            err_msg = error_desc or "Authentication canceled or denied."
            html = f"""
            <html><body>
            <script>
                if (window.opener) {{
                    window.opener.postMessage({{ type: "FB_OAUTH_RESPONSE", status: "error", error: "{err_msg}" }}, "*");
                }}
                window.close();
            </script>
            <p>Authentication canceled or failed. Closing window...</p>
            </body></html>
            """
            return HttpResponse(html, content_type="text/html")

        host = request.build_absolute_uri('/')[:-1]
        redirect_uri = f"{host}/adm/fb_oauth_callback"

        try:
            account = exchange_code_for_fb_account(code, state, redirect_uri)
            html = f"""
            <html><body>
            <script>
                if (window.opener) {{
                    window.opener.postMessage({{ type: "FB_OAUTH_RESPONSE", status: "success", accountId: {account.id}, accountName: "{account.name}" }}, "*");
                }}
                window.close();
            </script>
            <p>Authentication successful! Closing window...</p>
            </body></html>
            """
            return HttpResponse(html, content_type="text/html")
        except Exception as e:
            html = f"""
            <html><body>
            <script>
                if (window.opener) {{
                    window.opener.postMessage({{ type: "FB_OAUTH_RESPONSE", status: "error", error: "{str(e)}" }}, "*");
                }}
                window.close();
            </script>
            <p>OAuth Error: {str(e)}. Closing window...</p>
            </body></html>
            """
            return HttpResponse(html, content_type="text/html")


# 3. Pages & Forms (Using camelCase InputSerializer matching Frontend)
class FetchFBPagesAdminView(APIView):
    class InputSerializer(serializers.Serializer):
        accountId = serializers.IntegerField(required=True)

    def post(self, request):
        authorize_request('api_integrations_facebook', request.user)
        serializer = self.InputSerializer(data=request.data or request.query_params)
        serializer.is_valid(raise_exception=True)

        result = fetch_facebook_pages(user=request.user, account_id=serializer.validated_data["accountId"])
        return Response({"data": result}, status=status.HTTP_200_OK)


class FetchFBFormsAdminView(APIView):
    class InputSerializer(serializers.Serializer):
        accountId = serializers.IntegerField(required=True)
        pageId = serializers.CharField(required=True)

    def post(self, request):
        authorize_request('api_integrations_facebook', request.user)
        serializer = self.InputSerializer(data=request.data or request.query_params)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        result = fetch_page_lead_forms(user=request.user, account_id=data["accountId"], page_id=data["pageId"])
        return Response({"data": result}, status=status.HTTP_200_OK)


# 4. Connections Management
class CreateFBConnectionAdminView(APIView):
    class InputSerializer(serializers.Serializer):
        pipelineId = serializers.IntegerField(required=True)
        pipelineName = serializers.CharField(required=False, allow_blank=True, default="")
        pageId = serializers.CharField(required=True)
        pageName = serializers.CharField(required=False, allow_blank=True, default="")
        routing = serializers.DictField(required=True)
        fieldMapping = serializers.DictField(required=False, allow_null=True)
        facebookAccount = serializers.DictField(required=False, allow_null=True)
        accountId = serializers.IntegerField(required=False, allow_null=True)
        formMode = serializers.ChoiceField(choices=['specific', 'all'], default='all')
        formIds = serializers.ListField(child=serializers.CharField(), required=False, default=[])
        forms = serializers.ListField(child=serializers.DictField(), required=False, default=[])

    def post(self, request):
        authorize_request('api_integrations_facebook', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        conn = create_fb_connection(
            user=request.user,
            account_id=data.get("accountId"),
            facebook_account=data.get("facebookAccount"),
            page_id=data["pageId"],
            page_name=data.get("pageName", ""),
            pipeline_id=data["pipelineId"],
            routing_data=data["routing"],
            field_mapping=data.get("fieldMapping"),
            form_mode=data["formMode"],
            form_ids=data.get("formIds", []),
            forms=data.get("forms", [])
        )
        host = request.build_absolute_uri('/')[:-1]
        res = {
            "id": f"conn_{conn.id}",
            "numericId": conn.id,
            "pipelineId": conn.pipeline.id,
            "pageId": conn.page_id,
            "pageName": conn.page_name,
            "status": conn.status,
            "webhookUrl": f"{host}/api/v1/integrations/meta/webhook/"
        }
        return Response({"status": 200, "data": res}, status=status.HTTP_201_CREATED)


class FetchFBConnectionsAdminView(APIView):
    def get(self, request):
        authorize_request('api_integrations_facebook', request.user)
        host = request.build_absolute_uri('/')[:-1]
        data = list_fb_connections_service(request.user, host)
        return Response({"status": 200, "data": data}, status=status.HTTP_200_OK)


class DeleteFBConnectionAdminView(APIView):
    class InputSerializer(serializers.Serializer):
        connection_id = serializers.CharField(required=False)
        connectionId = serializers.CharField(required=False)

        def validate(self, attrs):
            cid = attrs.get("connection_id") or attrs.get("connectionId")
            if not cid:
                raise serializers.ValidationError({"connection_id": "This field is required."})
            return {"connection_id": cid}

    def post(self, request):
        authorize_request('api_integrations_facebook', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        delete_fb_connection_service(user=request.user, connection_id=serializer.validated_data["connection_id"])
        return Response({"status": 200, "data": {"status": "deleted"}}, status=status.HTTP_200_OK)



