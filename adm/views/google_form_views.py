from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.decorators import authentication_classes, permission_classes
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from adm.services.permission_services import authorize_request
from adm.services.google_form_services import (
    create_google_form_connection_service,
    fetch_google_form_connections_service,
    delete_google_form_connection_service,
    ingest_google_form_lead_service
)


class CreateGoogleConnectionAdminView(APIView):
    class InputSerializer(serializers.Serializer):
        name = serializers.CharField(required=True)
        routing = serializers.DictField(required=True)

    def post(self, request):
        authorize_request('api_integrations_google', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        host = request.build_absolute_uri('/')[:-1]
        data = create_google_form_connection_service(user=request.user, data=serializer.validated_data, host=host)
        return Response({"data": data}, status=status.HTTP_201_CREATED)


class FetchGoogleConnectionsAdminView(APIView):
    def get(self, request):
        authorize_request('api_integrations_google', request.user)
        host = request.build_absolute_uri('/')[:-1]
        data = fetch_google_form_connections_service(user=request.user, host=host)
        return Response({"data": data}, status=status.HTTP_200_OK)


class DeleteGoogleConnectionAdminView(APIView):
    class InputSerializer(serializers.Serializer):
        connectionId = serializers.IntegerField(required=True)

    def post(self, request):
        authorize_request('api_integrations_google', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        delete_google_form_connection_service(user=request.user, connection_id=serializer.validated_data["connectionId"])
        return Response({"data": {"status": "deleted"}}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
@authentication_classes([])
@permission_classes([])
class GoogleFormLeadWebhookView(APIView):
    def post(self, request, uid):
        result = ingest_google_form_lead_service(uid=uid, payload=request.data or {})
        code = result.get("code", 200)
        if result.get("status") == "success":
            return Response(result, status=status.HTTP_200_OK)
        elif result.get("status") == "duplicate":
            return Response(result, status=status.HTTP_200_OK)
        elif code == 404:
            return Response(result, status=status.HTTP_404_NOT_FOUND)
        elif code == 403:
            return Response(result, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
