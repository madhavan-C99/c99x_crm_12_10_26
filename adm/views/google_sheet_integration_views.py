"""
========================================================================================
📌 LEGACY GOOGLE SHEETS OAUTH VIEWS (PRESERVED AS COMMENTS / ARCHIVED)
========================================================================================
Notice: This OAuth & Google Drive polling system was replaced by the faster,
zero-verification Google Forms Direct Apps Script integration (see adm/views/google_form_views.py).
All code is preserved below as reference and can be re-enabled whenever needed.
========================================================================================

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from django.http import HttpResponse
from adm.services.permission_services import authorize_request

from ..services.google_sheet_services import (
    generate_google_oauth_url,
    exchange_code_for_google_account,
    fetch_user_spreadsheets_service,
    fetch_sheet_details_service,
    create_google_sheet_connection_service,
    list_google_sheet_connections_service,
    delete_google_sheet_connection_service
)


# 1. OAuth Start
class GoogleOAuthStartView(APIView):
    def post(self, request):
        authorize_request('api_integrations_facebook', request.user)
        host = request.build_absolute_uri('/')[:-1]
        redirect_uri = f"{host}/adm/integrations_google_oauth_callback"
        auth_url = generate_google_oauth_url(request.user, redirect_uri)
        return Response({"status": 200, "data": {"authUrl": auth_url}}, status=status.HTTP_200_OK)


# 2. OAuth Callback (No AllowAny - uses CRM Standard Auth)
class GoogleOAuthCallbackView(APIView):
    def get(self, request):
        code = request.query_params.get("code")
        error = request.query_params.get("error")
        if error or not code:
            html = f'''<script>
                if (window.opener) {{ window.opener.postMessage({{ type: "GOOGLE_OAUTH_RESPONSE", status: "error", error: "{error or 'Canceled'}" }}, "*"); }}
                window.close();
            </script><p>Authentication canceled. Closing window...</p>'''
            return HttpResponse(html, content_type="text/html")

        host = request.build_absolute_uri('/')[:-1]
        redirect_uri = f"{host}/adm/integrations_google_oauth_callback"
        try:
            account = exchange_code_for_google_account(code, redirect_uri, request.user)
            html = f'''<script>
                if (window.opener) {{ window.opener.postMessage({{ type: "GOOGLE_OAUTH_RESPONSE", status: "success", accountId: {account.id}, email: "{account.google_email}" }}, "*"); }}
                window.close();
            </script><p>Authentication successful! Closing window...</p>'''
            return HttpResponse(html, content_type="text/html")
        except Exception as e:
            html = f'''<script>
                if (window.opener) {{ window.opener.postMessage({{ type: "GOOGLE_OAUTH_RESPONSE", status: "error", error: "{str(e)}" }}, "*"); }}
                window.close();
            </script><p>Error: {str(e)}</p>'''
            return HttpResponse(html, content_type="text/html")


# 3. Fetch Spreadsheets from Google Drive
class FetchGoogleSpreadsheetsView(APIView):
    class InputSerializer(serializers.Serializer):
        accountId = serializers.IntegerField(required=True)

    def post(self, request):
        authorize_request('api_integrations_facebook', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sheets = fetch_user_spreadsheets_service(request.user, serializer.validated_data["accountId"])
        return Response({"status": 200, "data": sheets}, status=status.HTTP_200_OK)


# 4. Fetch Sheet Details (Tabs + Headers)
class FetchGoogleSheetDetailsView(APIView):
    class InputSerializer(serializers.Serializer):
        accountId = serializers.IntegerField(required=True)
        spreadsheetId = serializers.CharField(required=True)

    def post(self, request):
        authorize_request('api_integrations_facebook', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        details = fetch_sheet_details_service(request.user, **serializer.validated_data)
        return Response({"status": 200, "data": details}, status=status.HTTP_200_OK)


# 5. Create Connection
class CreateGoogleSheetConnectionView(APIView):
    class InputSerializer(serializers.Serializer):
        accountId = serializers.IntegerField(required=True)
        spreadsheetId = serializers.CharField(required=True)
        spreadsheetName = serializers.CharField(required=True)
        sheetTabName = serializers.CharField(required=False, default="Sheet1")
        pipelineId = serializers.IntegerField(required=True)
        routing = serializers.DictField(required=True)
        fieldMapping = serializers.DictField(required=False, allow_null=True)
        syncHistoricalLeads = serializers.BooleanField(required=False, default=False)

    def post(self, request):
        authorize_request('api_integrations_facebook', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        conn = create_google_sheet_connection_service(
            user=request.user,
            account_id=data["accountId"],
            spreadsheet_id=data["spreadsheetId"],
            spreadsheet_name=data["spreadsheetName"],
            sheet_tab_name=data.get("sheetTabName", "Sheet1"),
            pipeline_id=data["pipelineId"],
            routing_data=data["routing"],
            field_mapping=data.get("fieldMapping"),
            sync_historical=data.get("syncHistoricalLeads", False)
        )
        return Response({
            "status": 200,
            "data": {
                "id": f"gs_conn_{conn.id}",
                "numericId": conn.id,
                "spreadsheetName": conn.spreadsheet_name,
                "sheetTabName": conn.sheet_tab_name,
                "status": conn.status
            }
        }, status=status.HTTP_201_CREATED)


# 6. List Connections
class FetchGoogleSheetConnectionsView(APIView):
    def get(self, request):
        authorize_request('api_integrations_facebook', request.user)
        data = list_google_sheet_connections_service(request.user)
        return Response({"status": 200, "data": data}, status=status.HTTP_200_OK)


# 7. Delete Connection
class DeleteGoogleSheetConnectionView(APIView):
    class InputSerializer(serializers.Serializer):
        connectionId = serializers.CharField(required=True)

    def post(self, request):
        authorize_request('api_integrations_facebook', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        delete_google_sheet_connection_service(request.user, serializer.validated_data["connectionId"])
        return Response({"status": 200, "data": {"status": "deleted"}}, status=status.HTTP_200_OK)
"""
