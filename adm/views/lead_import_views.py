from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from adm.services.lead_import_services import verify_lead_rows, submit_lead_rows


class VerifyLeadImportView(APIView):
    def post(self, request):
        rows = request.data.get("rows", [])
        if not isinstance(rows, list):
            return Response({"status": False, "message": "rows must be a list."}, status=status.HTTP_400_BAD_REQUEST)

        result = verify_lead_rows(rows=rows, user=request.user)
        return Response({"status": True, "data": result}, status=status.HTTP_200_OK)


class SubmitLeadImportView(APIView):
    def post(self, request):
        data = request.data
        rows = data.get("rows", [])
        if not isinstance(rows, list):
            return Response({"status": False, "message": "rows must be a list."}, status=status.HTTP_400_BAD_REQUEST)

        result = submit_lead_rows(
            rows=rows,
            user=request.user,
            campaign_id=data.get("campaign_id"),
            source_id=data.get("source_id"),
            assigned_to_id=data.get("assigned_to_id"),
            pipeline_stage_id=data.get("pipeline_stage_id"),
        )
        return Response({"status": True, "data": result}, status=status.HTTP_201_CREATED)
