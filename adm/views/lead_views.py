from adm.services.permission_services import authorize_request
from rest_framework.views import APIView
from rest_framework.decorators import authentication_classes, permission_classes
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from ..services.lead_services import *
# from telecalling.tasks.api_log_task import api_history_log

# @authentication_classes([])
# @permission_classes([])
class FetchAllLeadsAdmin(APIView):
   
    class InputSerializer(serializers.Serializer):
        lead_filter_type = serializers.CharField(required=False, default="all")
        lead_stage_id = serializers.IntegerField(required=False, allow_null=True)
        pipeline_stage_id = serializers.IntegerField(required=False, allow_null=True)
        search = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        tele_id = serializers.IntegerField(required=False, allow_null=True)
        telecaller_id = serializers.IntegerField(required=False, allow_null=True)
        assigned_to = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        from_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        to_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        created_date_from = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        created_date_to = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        date_filter_type = serializers.CharField(required=False, default="all")
        lead_source_id = serializers.IntegerField(required=False, allow_null=True)
        source_id = serializers.IntegerField(required=False, allow_null=True)
        course_name_id = serializers.IntegerField(required=False, allow_null=True)
        priority_id = serializers.IntegerField(required=False, allow_null=True)
        course_plan_id = serializers.IntegerField(required=False, allow_null=True)
        campaign_name_id = serializers.IntegerField(required=False, allow_null=True)
        campaign_id = serializers.IntegerField(required=False, allow_null=True)
        pipeline_id = serializers.IntegerField(required=False, allow_null=True)
        pipeline_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        sort_by = serializers.CharField(required=False, default="-created_at")
        sort_order = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        page = serializers.IntegerField(required=False, default=1)
        page_size = serializers.IntegerField(required=False, allow_null=True, default=50)
        rows_per_page = serializers.IntegerField(required=False, allow_null=True)
        
    def post(self, request):
        authorize_request('api_fetch_all_leads_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = fetch_all_leads_admin(user=request.user, **serializer.validated_data)

        payload = {
            "total_records": result.get("total_records", 0),
            "total_count": result.get("total_count", 0),
            "stats": result.get("stats", {}),
            "leads": result.get("leads", []),
            "tab_counts": result.get("tab_counts", {}),
            "page": result.get("page", 1),
            "page_size": result.get("page_size", 50),
            "total_pages": result.get("total_pages", 1)
        }

        return Response({
            "status": True,
            "message": result.get("message", "Leads fetched successfully"),
            "data": payload,
            **payload
        }, status=status.HTTP_200_OK)



   
# -------------------------------------admin add new lead views------------------------------------------
    
# @authentication_classes([])
# @permission_classes([])
class AddNewLeadAdmin(APIView):
    """
    GET  -> Modal open aagum podhu Dropdowns tarum (Pipelines, Campaigns, Sources, Telecallers)
    POST -> Form Submit pannum podhu puthu lead-ah save pannum
    """
    class InputSerializer(serializers.Serializer):
        name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        first_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        last_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        full_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        mobile_no = serializers.CharField(required=True)
        email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
        pipeline = serializers.CharField(required=False, default="Education")
        pipeline_stage_id = serializers.IntegerField(required=False, allow_null=True, default=1)
        campaign_id = serializers.IntegerField(required=False, allow_null=True)
        campaign = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        lead_source_id = serializers.IntegerField(required=False, allow_null=True)
        source = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        assigned_to_id = serializers.IntegerField(required=False, allow_null=True)
        enquiry_date = serializers.DateTimeField(required=False, allow_null=True)
        priority_id = serializers.IntegerField(required=False, allow_null=True, default=None)
        
        
    def get(self, request):
        authorize_request('api_add_new_lead_admin', request.user)
        """Modal open aagum podhu Dropdowns edukka"""
        result = get_add_lead_dropdowns_admin()
        return Response({"data": result}, status=status.HTTP_200_OK)
    
    
    def post(self, request):
        authorize_request('api_add_new_lead_admin', request.user)
        """Form Submit panni puthu lead-ah save panna"""
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = add_new_lead_admin(user=request.user, **serializer.validated_data)
            if isinstance(result, dict) and result.get("status") in ["failed", False]:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            return Response({"status": True, "data": result, **(result if isinstance(result, dict) else {})}, status=status.HTTP_201_CREATED)
        except APIException as e:
            msg = str(e.detail if hasattr(e, 'detail') else e)
            return Response({"status": "failed", "message": msg}, status=status.HTTP_400_BAD_REQUEST)




# ----------------------------upload lead excel file view------------------------------------------

# @authentication_classes([])
# @permission_classes([])
class UploadLeadExcelAdmin(APIView):
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
    def post(self, request):
        authorize_request('api_upload_lead_excel_admin', request.user)
        
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            candidate = request.data.get('file')
            if hasattr(candidate, 'read') and hasattr(candidate, 'size'):
                uploaded_file = candidate
            else:
                uploaded_file = None

        leads_data = request.data.get('leads') or request.data.get('data') or request.data.get('rows') or request.data.get('leads_data')
        
        if not uploaded_file and not leads_data and isinstance(request.data, list):
            leads_data = request.data

        if not uploaded_file and not leads_data:
            return Response({
                "status": "failed",
                "message": "Please select a valid Excel or CSV file or provide leads data to upload."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = upload_lead_excel_admin(file_obj=uploaded_file, leads_data=leads_data, user=request.user)
            if isinstance(result, dict) and result.get("status") in ["failed", False]:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            return Response({"status": True, "data": result, **(result if isinstance(result, dict) else {})}, status=status.HTTP_200_OK)
        except Exception as e:
            detail = getattr(e, 'detail', str(e))
            if isinstance(detail, dict):
                parts = []
                for k, v in detail.items():
                    val_str = ", ".join(v) if isinstance(v, list) else str(v)
                    parts.append(f"{k}: {val_str}")
                msg = " | ".join(parts)
            elif isinstance(detail, list):
                msg = ", ".join(str(item) for item in detail)
            else:
                msg = str(detail)
            return Response({"status": "failed", "message": msg}, status=status.HTTP_400_BAD_REQUEST)
     

# --------------------------------------fetch_pipeline_leads_admin----------------------------------

# @authentication_classes([])
# @permission_classes([])
class FetchPipelineLeadsAdmin(APIView):
    
    class InputSerializer(serializers.Serializer):
        pipeline_id = serializers.IntegerField(required=False, allow_null=True, default=1)
        lead_stage_id = serializers.IntegerField(required=False, allow_null=True)
        pipeline_stage_id = serializers.IntegerField(required=False, allow_null=True)
        assigned_to = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        assigned_to_id = serializers.IntegerField(required=False, allow_null=True)
        source_id = serializers.IntegerField(required=False, allow_null=True)
        lead_source_id = serializers.IntegerField(required=False, allow_null=True)
        campaign_id = serializers.IntegerField(required=False, allow_null=True)
        campaign_name_id = serializers.IntegerField(required=False, allow_null=True)
        course_plan_id = serializers.IntegerField(required=False, allow_null=True)
        search = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        date_filter_type = serializers.CharField(required=False, default="all")
        from_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        to_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def post(self, request):
        authorize_request('api_fetch_pipeline_leads_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = fetch_pipeline_leads_admin(**serializer.validated_data)

        return Response(result, status=status.HTTP_200_OK)




# --------------------------------------fetch_lead_details_admin----------------------------------

# @authentication_classes([])
# @permission_classes([])
class FetchLeadDetailsAdmin(APIView):
   
    class InputSerializer(serializers.Serializer):
        lead_id = serializers.IntegerField(required=True)

    def post(self, request):
        authorize_request('api_fetch_lead_details_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = fetch_lead_details_admin(**serializer.validated_data)


        return Response(result, status=status.HTTP_200_OK)

      
# ---------------------------get_mark_as_won_info_admin-----------------------------

# @authentication_classes([])
# @permission_classes([])
class GetMarkAsWonInfoAdmin(APIView):
    
    class InputSerializer(serializers.Serializer):
        lead_id = serializers.IntegerField(required=True)

    def post(self, request):
        authorize_request('api_get_mark_as_won_info_admin', request.user)
        # 🔴 Validating lead_id via Serializer before proceeding
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lead_id = serializer.validated_data.get("lead_id")
        result = get_mark_as_won_info_admin(lead_id)

        # log_data = {
        #     'user_id': request.user.id if request.user.id else None,
        #     'api_name': request.path,
        #     'method': request.method,
        #     'request_payload': serializer.validated_data,
        #     'response_payload': {"status": result.get("status")},
        #     'status_code': 200
        # }
        # api_history_log(log_data)

        return Response(result, status=status.HTTP_200_OK)
    
    
    
    
# --------------------------------------mark_as_won_admin----------------------------------

# @authentication_classes([])
# @permission_classes([])
class MarkAsWonAdmin(APIView):
   
    class InputSerializer(serializers.Serializer):
        lead_id = serializers.IntegerField(required=True)
        paid_through = serializers.CharField(required=False, allow_blank=True, default="")
        amount_paid = serializers.FloatField(required=False, default=0)
        is_full_payment = serializers.BooleanField(required=False, default=False)
        due_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        payment_status = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        next_followup = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        summary = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def post(self, request):
        authorize_request('api_mark_as_won_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = mark_as_won_admin(**serializer.validated_data)

        # log_data = {
        #     'user_id': request.user.id if request.user.id else None,
        #     'api_name': request.path,
        #     'method': request.method,
        #     'request_payload': serializer.validated_data,
        #     'response_payload': {"status": result.get("status"), "message": result.get("message")},
        #     'status_code': 200
        # }
        # api_history_log(log_data)

        return Response(result, status=status.HTTP_200_OK)
    
    
    


# ---------------------------get_mark_as_lost_info_admin, mark_as_lost_admin--------------------

# @authentication_classes([])
# @permission_classes([])
class GetMarkAsLostInfoAdmin(APIView):
   
    class InputSerializer(serializers.Serializer):
        lead_id = serializers.IntegerField(required=True)

    def post(self, request):
        authorize_request('api_get_mark_as_lost_info_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lead_id = serializer.validated_data.get("lead_id")
        result = get_mark_as_lost_info_admin(lead_id)

        # log_data = {
        #     'user_id': request.user.id if request.user.id else None,
        #     'api_name': request.path,
        #     'method': request.method,
        #     'request_payload': serializer.validated_data,
        #      'response_payload': {"status": result.get("status")},
            # 'status_code': 200
        # }
        
        return Response(result, status=status.HTTP_200_OK)


# @authentication_classes([])
# @permission_classes([])
class MarkAsLostAdmin(APIView):
    
    class InputSerializer(serializers.Serializer):
        lead_id = serializers.IntegerField(required=False, allow_null=True)
        id = serializers.IntegerField(required=False, allow_null=True)
        stage = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        main_reason_id = serializers.IntegerField(required=False, allow_null=True)
        main_reason = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        sub_reason_id = serializers.IntegerField(required=False, allow_null=True)
        sub_reason = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        detailed_reason = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        reason = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        remarks = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def post(self, request):
        authorize_request('api_mark_as_lost_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = {**serializer.validated_data, **request.data}
        result = mark_as_lost_admin(user=request.user, admin_user=request.user, **payload)

        # log_data = {
        #     'user_id': request.user.id if request.user.id else None,
        #     'api_name': request.path,
        #     'method': request.method,
        #     'request_payload': serializer.validated_data,
        #     'response_payload': {"status": result.get("status"), "message": result.get("message")},
        #     'status_code': 200
        # }
        # api_history_log(log_data)

        return Response(result, status=status.HTTP_200_OK)
    
    
    
    

# --------------------------------------edit_lead_admin----------------------------------

# @authentication_classes([])
# @permission_classes([])
class EditLeadAdmin(APIView):
  
    class InputSerializer(serializers.Serializer):
        lead_id = serializers.IntegerField(required=False, allow_null=True)
        id = serializers.IntegerField(required=False, allow_null=True)
        first_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        last_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        full_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        mobile_no = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        alt_mobile = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        email = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        created_at = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        enquiry_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        assigned_to = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        course_plan = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        course = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        pipeline = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        campaign = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        stage = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        tag = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        amount_paid = serializers.FloatField(required=False, allow_null=True)
        pending_amount = serializers.FloatField(required=False, allow_null=True)
        total_amount = serializers.FloatField(required=False, allow_null=True)

    def post(self, request):
        authorize_request('api_edit_lead_admin', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = edit_lead_admin(**serializer.validated_data)
            if isinstance(result, dict) and result.get("status") in ["failed", False]:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            return Response({"status": True, "data": result, **(result if isinstance(result, dict) else {})}, status=status.HTTP_200_OK)
        except APIException as e:
            msg = str(e.detail if hasattr(e, 'detail') else e)
            return Response({"status": "failed", "message": msg}, status=status.HTTP_400_BAD_REQUEST)


# @authentication_classes([])
# @permission_classes([])
class DeleteLeadAdmin(APIView):
    def post(self, request):
        authorize_request('api_delete_lead_admin', request.user)
        lead_id = request.data.get("lead_id") or request.data.get("id")
        result = delete_lead_admin(request.user, lead_id)

        # log_data = {
        #     'user_id': request.user.id if getattr(request.user, 'id', None) else None,
        #     'api_name': request.path,
        #     'method': request.method,
        #     'request_payload': request.data,
        #      'response_payload': result,
        #     'status_code': 200
        # }
        # api_history_log(log_data)

        return Response(result, status=status.HTTP_200_OK)


# @authentication_classes([])
# @permission_classes([])
class ReassignLeadAdmin(APIView):
    def post(self, request):
        authorize_request('api_reassign_lead_admin', request.user)
        lead_id = request.data.get("lead_id") or request.data.get("id")
        new_telecaller_id = request.data.get("new_telecaller_id") or request.data.get("telecaller_id") or request.data.get("assigned_to_id")
        reason = request.data.get("reason") or request.data.get("remarks") or request.data.get("reassigned_reason")

        result = reassign_lead_admin(request.user, lead_id, new_telecaller_id, reason)

        # log_data = {
        #     'user_id': request.user.id if getattr(request.user, 'id', None) else None,
        #     'api_name': request.path,
        #     'method': request.method,
        #     'request_payload': request.data,
        #     'response_payload': result,
        #     'status_code': 200
        # }
        # api_history_log(log_data)

        return Response(result, status=status.HTTP_200_OK)
