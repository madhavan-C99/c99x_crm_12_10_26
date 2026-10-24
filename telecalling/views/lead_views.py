from adm.services.permission_services import authorize_request
from rest_framework.views import APIView
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework import status
from ..services.lead_services import *
from rest_framework.decorators import authentication_classes, permission_classes


class FetchAllLeads(APIView):
    class InputSerializer(serializers.Serializer):
        # tele_id=serializers.IntegerField(required=True)
        lead_filter_type=serializers.CharField(required=False)
        from_date = serializers.DateField(required=False)
        to_date = serializers.DateField(required=False)
        date_filter_type = serializers.CharField(required=False, default="year") 
        pipeline_id = serializers.IntegerField(required=False, allow_null=True, default=0)
        pipeline_stage_id = serializers.IntegerField(required=False, allow_null=True,default=0)
        lead_source_id = serializers.IntegerField(required=False, allow_null=True,default=0)
        course_name_id = serializers.IntegerField(required=False, allow_null=True,default=0)
        priority_id = serializers.IntegerField(required=False, allow_null=True,default=0)
        course_plan_id = serializers.IntegerField(required=False, allow_null=True,default=0)
        payment_status= serializers.IntegerField(required=False, allow_null=True,default=0)
        campaign_name_id = serializers.IntegerField(required=False, allow_null=True,default=0)
        
    def post(self,request):
        authorize_request('api_fetch_all_leads', request.user)
        serializer=self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead=fetch_leads(user=request.user,**serializer.validated_data)
        log_data = {
            'user_id': request.user.id if request.user.id else None,
            'api_name': request.path,
            'method': request.method,
            'request_payload':  serializer.validated_data, 
            'response_payload': lead, 
            'status_code': 201
        }
        api_history_log(log_data)
        return Response({"data":lead},status=status.HTTP_201_CREATED)
    
    



# @authentication_classes([])
# @permission_classes([])   
class UpdateCourse(APIView):
    class InputSerializer(serializers.Serializer):
        id=serializers.IntegerField(required=True)
        count=serializers.IntegerField(required=True)
        
    def post(self,request):
        authorize_request('api_update_course', request.user)
        serializer=self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead=course_count(**serializer.validated_data)
        return Response({"data":lead},status=status.HTTP_201_CREATED)        
 
class AddNewLead(APIView):   
    class InputSerializer(serializers.Serializer):
        full_name=serializers.CharField(required=False,allow_null=True,allow_blank=True)
        mobile=serializers.CharField(required=True)
        campaign_id=serializers.IntegerField(required=False)
        enquiry_date=serializers.DateField(required=False,allow_null=True)
        lead_source_id = serializers.IntegerField(required=False, allow_null=True) 
        
    def post(self,request):
        authorize_request('api_add_new_lead', request.user)
        serializer=self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead=add_new_lead(user=request.user,**serializer.validated_data)
        log_data = {
            'user_id': request.user.id if request.user.id else None,
            'api_name': request.path,
            'method': request.method,
            'request_payload':  serializer.validated_data, 
            'response_payload': lead, 
            'status_code': 201
        }
        api_history_log(log_data)
        return Response({"data":lead},status=status.HTTP_201_CREATED)      
   
   
    
class FetchPipelineLead(APIView):
    class InputSerializer(serializers.Serializer):
        from_date = serializers.DateField(required=False)
        to_date = serializers.DateField(required=False)
        date_filter_type = serializers.CharField(required=False, default="year")
        pipeline_id = serializers.IntegerField(required=False, allow_null=True, default=0)
        pipeline_stage_id = serializers.IntegerField(required=False, allow_null=True,default=0)
        lead_source_id = serializers.IntegerField(required=False, allow_null=True,default=0)
        course_name_id = serializers.IntegerField(required=False, allow_null=True,default=0)
        priority_id = serializers.IntegerField(required=False, allow_null=True,default=0)
        course_plan_id = serializers.IntegerField(required=False, allow_null=True,default=0)
        payment_status = serializers.CharField(required=False, allow_null=True,default=0)
        followup_status = serializers.CharField(required=False, allow_blank=True, allow_null=True,default=0)

    def post(self, request):
        authorize_request('api_fetch_pipeline_lead', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead = fetch_pipeline_leads(user=request.user, **serializer.validated_data)
        log_data = {
            'user_id': request.user.id if request.user.id else None,
            'api_name': request.path,
            'method': request.method,
            'request_payload': serializer.validated_data,
            'response_payload': lead,
            'status_code': 202
        }
        api_history_log(log_data)
        return Response({"data": lead}, status=status.HTTP_202_ACCEPTED)


# @authentication_classes([])
# @permission_classes([])   
class GetSelectedOption(APIView):
    class InputSerializer(serializers.Serializer):
        dropdown_category=serializers.CharField(required=True)
        filter_id=serializers.CharField(required=False,allow_null=True,allow_blank=True)
        course_name_id=serializers.CharField(required=False,allow_null=True,allow_blank=True)        
        
    def post(self,request):
        authorize_request('api_get_selected_option', request.user)
        serializer=self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead=get_selected_option(user=request.user,**serializer.validated_data)
        log_data = {
            'user_id': request.user.id if request.user.id else None,
            'api_name': request.path,
            'method': request.method,
            'request_payload':  serializer.validated_data, 
            'response_payload': lead, 
            'status_code': 202
        }
        api_history_log(log_data)
        return Response({"data":lead},status=status.HTTP_202_ACCEPTED)  







class LeadFormDetail(APIView):
    class InputSerializer(serializers.Serializer):
        # basic
        lead_id=serializers.IntegerField(required=True)
        fullname=serializers.CharField(required=False,allow_null=True)
        mobile=serializers.CharField(required=False,allow_null=True)
        alternative_mobile=serializers.CharField(required=False,allow_null=True,allow_blank=True)
        email=serializers.EmailField(required=False,allow_null=True,allow_blank=True)
        location=serializers.CharField(required=False,allow_null=True,allow_blank=True)
        education_id=serializers.IntegerField(required=False,allow_null=True)
        education = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        passed_out_year=serializers.CharField(required=False,allow_null=True,allow_blank=True)
        experience=serializers.CharField(required=False,allow_null=True,allow_blank=True)
        
        # lead 
        enquiry_date=serializers.DateTimeField(required=False,allow_null=True)
        current_status=serializers.CharField(required=False,allow_null=True)
        lead_source_id=serializers.IntegerField(required=False,allow_null=True)
        campaign_name_id=serializers.IntegerField(required=False,allow_null=True)
        # course_id=serializers.IntegerField(required=False,allow_null=True)
        course_plan_id=serializers.IntegerField(required=False,allow_null=True)
        course_name_id=serializers.IntegerField(required=False,allow_null=True)
        course_timing_id=serializers.IntegerField(required=False,allow_null=True)
        preferred_timing_id=serializers.IntegerField(required=False,allow_null=True)
        
        # pipeline
        pipeline_stage_id=serializers.IntegerField(required=False,allow_null=True)
        priority_id=serializers.IntegerField(required=False,allow_null=True)
        
        # payment info
        amount_paid=serializers.FloatField(required=False,allow_null=True)
        pending_amount=serializers.FloatField(required=False,allow_null=True)
        is_full_payment=serializers.BooleanField(required=False,allow_null=True)
        due_date=serializers.DateTimeField(required=False,allow_null=True)
        payment_status_id=serializers.IntegerField(required=False,allow_null=True)
        # next_followup=serializers.DateTimeField(required=False,allow_null=True)
        notes=serializers.CharField(required=False,allow_null=True)
        
        # referal
        referal_list=serializers.JSONField(required=False)

    def post(self,request):
        authorize_request('api_lead_form_detail', request.user)
        serializer=self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead=lead_form_details(user=request.user,**serializer.validated_data)
        log_data = {
            'user_id': request.user.id if request.user.id else None,
            'api_name': request.path,
            'method': request.method,
            'request_payload':  serializer.validated_data, 
            'response_payload': lead, 
            'status_code': 201
        }
        api_history_log(log_data)
        return Response({"data":lead},status=status.HTTP_201_CREATED)  
    
    
class FetchOneLead(APIView):
    class InputSerializer(serializers.Serializer):
        lead_id=serializers.IntegerField(required=True)
        
    def post(self,request):
        authorize_request('api_fetch_one_lead', request.user)
        serializer=self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead=fetch_one_lead(user=request.user,**serializer.validated_data)
        log_data = {
            'user_id': request.user.id if request.user.id else None,
            'api_name': request.path,
            'method': request.method,
            'request_payload':  serializer.validated_data, 
            'response_payload': lead, 
            'status_code': 202
        }
        api_history_log(log_data)
        return Response({"data":lead},status=status.HTTP_202_ACCEPTED)     




     
class FetchCallHistoryApi(APIView):
    class InputSerializer(serializers.Serializer):
        lead_id=serializers.IntegerField(required=True)
        
    def post(self,request):
        authorize_request('api_fetch_call_history_api', request.user)
        serializer=self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead=fetch_call_history(user=request.user,**serializer.validated_data)
        log_data = {
            'user_id': request.user.id if request.user.id else None,
            'api_name': request.path,
            'method': request.method,
            'request_payload':  serializer.validated_data, 
            'response_payload': lead, 
            'status_code': 201
        }
        api_history_log(log_data)
        return Response({"data":lead},status=status.HTTP_201_CREATED)     



    
class CallConnectForm(APIView):
    class InputSerializer(serializers.Serializer):
        lead_id = serializers.IntegerField(required=True)
        connection_status = serializers.CharField(required=True)
        call_duration = serializers.CharField(required=False)
        stage_id = serializers.CharField(required=False)
        select_tag_id = serializers.CharField(required=False,allow_null=True)
        next_followup = serializers.DateTimeField(required=False, allow_null=True)
        call_summary = serializers.CharField(required=False,allow_blank=True)
        upload_record = serializers.FileField(required=False)

    def post(self, request):
        authorize_request('api_call_connect_form', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = call_connect_api(user=request.user, **serializer.validated_data)
        log_data = {
            'user_id': request.user.id if request.user.id else None,
            'api_name': request.path,
            'method': request.method,
            'request_payload':  serializer.validated_data, 
            'response_payload': result, 
            'status_code': 201
        }
        api_history_log(log_data)
        return Response({"data": result}, status=status.HTTP_201_CREATED)



class CallDisconnectSelectTag(APIView):
    class InputSerializer(serializers.Serializer):
        lead_id = serializers.IntegerField(required=True)  
    def post(self, request):
        authorize_request('api_call_disconnect_select_tag', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = call_disconnect_select_api(user=request.user, **serializer.validated_data) 
        log_data = {
            'user_id': request.user.id if request.user.id else None,
            'api_name': request.path,
            'method': request.method,
            'request_payload':  serializer.validated_data, 
            'response_payload': result, 
            'status_code': 201
        }
        api_history_log(log_data)
        return Response({"data": result}, status=status.HTTP_201_CREATED)

class CallDisconnectForm(APIView):
    class InputSerializer(serializers.Serializer):
        lead_id = serializers.IntegerField(required=True)      
        select_tag_id = serializers.CharField(required=False)
        next_followup = serializers.DateTimeField(required=False,allow_null=True)
        retry_notes = serializers.CharField(required=False,allow_null=True,allow_blank=True)
        other_reason=serializers.CharField(required=False,allow_null=True,allow_blank=True)

    def post(self, request):
        authorize_request('api_call_disconnect_form', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = call_disconnect_api(user=request.user, **serializer.validated_data) 
        log_data = {
            'user_id': request.user.id if request.user.id else None,
            'api_name': request.path,
            'method': request.method,
            'request_payload':  serializer.validated_data, 
            'response_payload': result, 
            'status_code': 201
        }
        api_history_log(log_data)
        return Response({"data": result}, status=status.HTTP_201_CREATED)
 
 
 

class FetchOneLossLeadDetail(APIView):
    class InputSerializer(serializers.Serializer):
        lead_id = serializers.IntegerField(required=True)    
    def post(self,request):
        authorize_request('api_fetch_one_loss_lead_detail', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = fetch_one_loss_detail(user=request.user, **serializer.validated_data)  
        log_data = {
            'user_id': request.user.id if request.user.id else None,
            'api_name': request.path,
            'method': request.method,
            'request_payload':  serializer.validated_data, 
            'response_payload': {}, 
            'status_code': 201
        }
        api_history_log(log_data)
        return Response({"data": result}, status=status.HTTP_201_CREATED)
     
     

class LossLeadUpdateApi(APIView):
    class InputSerializer(serializers.Serializer):
        lead_id = serializers.IntegerField(required=True)    
        pipeline_stage_id = serializers.IntegerField(required=False, default=4)
        priority_id = serializers.IntegerField(required=False, allow_null=True)
        enquiry_date = serializers.DateTimeField(required=False, allow_null=True)
        follow_up_days = serializers.CharField(required=False, allow_null=True, allow_blank=True, default="0")
        main_reason_id = serializers.IntegerField(required=False, allow_null=True)
        loss_reason = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="")
        
    def post(self,request):
        authorize_request('api_loss_lead_update_api', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = loss_detail_update(user=request.user, **serializer.validated_data)  
        log_data = {
            'user_id': request.user.id if request.user.id else None,
            'api_name': request.path,
            'method': request.method,
            'request_payload':  serializer.validated_data, 
            'response_payload': result, 
            'status_code': 201
        }
        api_history_log(log_data)
        return Response({"data": result}, status=status.HTTP_201_CREATED)



class FetchOneWonLeadDetail(APIView):
    class InputSerializer(serializers.Serializer):
        lead_id = serializers.IntegerField(required=True)    
    def post(self,request):
        authorize_request('api_fetch_one_won_lead_detail', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = fetch_one_won_detail(user=request.user, **serializer.validated_data)
        log_data = {
            'user_id': request.user.id if request.user.id else None,
            'api_name': request.path,
            'method': request.method,
            'request_payload':  serializer.validated_data, 
            'response_payload': result, 
            'status_code': 201
        }
        api_history_log(log_data)  
        return Response({"data": result}, status=status.HTTP_201_CREATED)

class WonLeadUpdateApi(APIView):
    class InputSerilaizers(serializers.Serializer):
        lead_id=serializers.IntegerField(required=True)
        pipeline_stage_id=serializers.IntegerField(required=True)
        priority_id=serializers.IntegerField(required=False, allow_null=True)
        paid_amount=serializers.FloatField(required=False, default=0)
        pending_amount=serializers.FloatField(required=False, default=0)
        due_date=serializers.DateField(required=False, allow_null=True)
        next_followup=serializers.DateTimeField(required=False, allow_null=True)
        notes=serializers.CharField(required=False, allow_null=True, allow_blank=True)
        payment_status=serializers.CharField(required=False, allow_null=True, allow_blank=True)
        pipeline_stage=serializers.CharField(required=False, allow_null=True, allow_blank=True)
        
    def post(self,request):
        authorize_request('api_won_lead_update_api', request.user)
        serializer=self.InputSerilaizers(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment=won_detail_update(request.user,**serializer.validated_data)
        log_data = {
            'user_id': request.user.id if request.user.id else None,
            'api_name': request.path,
            'method': request.method,
            'request_payload':  serializer.validated_data, 
            'response_payload': payment, 
            'status_code': 202
        }
        api_history_log(log_data)
        return Response({"data":payment},status=status.HTTP_202_ACCEPTED)