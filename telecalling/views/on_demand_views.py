from adm.services.permission_services import authorize_request
from rest_framework.views import APIView
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework import status
from telecalling.tasks.api_log_task import api_history_log

from telecalling.services.on_demand_services import (
    fetch_on_demand_pool_leads_service,
    claim_pool_lead_service,
)


class FetchOnDemandPoolLeadsView(APIView):
    """
    Fetch all available unassigned leads in the On-Demand Lead Pool.
    Follows standard CRM View architecture.
    """
    class InputSerializer(serializers.Serializer):
        limit = serializers.IntegerField(required=False, default=100)

    def get(self, request):
        return self._process(request, request.query_params)

    def post(self, request):
        return self._process(request, request.data)

    def _process(self, request, raw_data):
        authorize_request('api_fetch_on_demand_pool_leads', request.user)
        serializer = self.InputSerializer(data=raw_data)
        serializer.is_valid(raise_exception=True)
        leads = fetch_on_demand_pool_leads_service(user=request.user, **serializer.validated_data)
        log_data = {
            'user_id': request.user.id if request.user.id else None,
            'api_name': request.path,
            'method': request.method,
            'request_payload': serializer.validated_data,
            'response_payload': leads,
            'status_code': 200,
        }
        api_history_log(log_data)
        return Response({"data": leads}, status=status.HTTP_200_OK)


class ClaimOnDemandLeadView(APIView):
    """
    Claim an unassigned lead from the On-Demand Lead Pool into user's pipeline.
    Follows standard CRM View architecture.
    """
    class InputSerializer(serializers.Serializer):
        lead_id = serializers.IntegerField(required=True)

    def post(self, request):
        authorize_request('api_claim_on_demand_lead', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        res = claim_pool_lead_service(user=request.user, **serializer.validated_data)
        log_data = {
            'user_id': request.user.id if request.user.id else None,
            'api_name': request.path,
            'method': request.method,
            'request_payload': serializer.validated_data,
            'response_payload': res,
            'status_code': 200 if res.get('success') else 400,
        }
        api_history_log(log_data)
        if res.get("success"):
            return Response({"data": res}, status=status.HTTP_200_OK)
        return Response({"data": res, "message": res.get("message")}, status=status.HTTP_400_BAD_REQUEST)
