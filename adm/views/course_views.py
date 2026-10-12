from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.exceptions import APIException
from adm.services.permission_services import authorize_request
from adm.services.course_services import *


class FetchCoursesSidebarApi(APIView):
    class InputSerializer(serializers.Serializer):
        search = serializers.CharField(required=False, allow_blank=True, default="")

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        search_query = serializer.validated_data.get("search", "")
        courses = fetch_courses_sidebar_service(search=search_query)

        return Response({
            "status": "success",
            "data": courses
        }, status=status.HTTP_200_OK)


class FetchCourseDetailsApi(APIView):
    class InputSerializer(serializers.Serializer):
        course_id = serializers.IntegerField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_id = serializer.validated_data.get("course_id")

        result = fetch_course_details_service(course_id=target_id)
       
        return Response({
            "status": "success",
            "data": result
        }, status=status.HTTP_200_OK)


class CreateCourseApi(APIView):
    class InputSerializer(serializers.Serializer):
        name = serializers.CharField(required=True, max_length=100, allow_blank=False)
        status = serializers.ChoiceField(choices=["Active", "Draft"], required=True)

    def post(self, request):
        authorize_request('api_create_course', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = create_course_service(user=request.user, data=serializer.validated_data)

        return Response({
            "status": "success",
            "data": result
        }, status=status.HTTP_201_CREATED)


class EditCourseApi(APIView):
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=False, allow_null=True)
        course_id = serializers.IntegerField(required=False, allow_null=True)
        name = serializers.CharField(required=False, max_length=100, allow_blank=False, allow_null=True)
        status = serializers.ChoiceField(choices=["Active", "Draft"], required=False, allow_null=True)

    def post(self, request):
        authorize_request('api_edit_course', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = edit_course_service(user=request.user, data=serializer.validated_data)

        return Response({
            "status": "success",
            "data": result
        }, status=status.HTTP_200_OK)


class CreateCoursePlanAdminApi(APIView):
    class InputSerializer(serializers.Serializer):
        course_id = serializers.IntegerField(required=True)
        name = serializers.CharField(required=True, max_length=100, allow_blank=False)
        price = serializers.CharField(required=True)
        duration = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        hours_per_day = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    def post(self, request):
        authorize_request('api_create_course_plan', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = create_course_plan_service(user=request.user, data=serializer.validated_data)

        return Response({
            "status": "success",
            "data": result
        }, status=status.HTTP_201_CREATED)


class EditPlanApi(APIView):
    class InputSerializer(serializers.Serializer):
        plan_id = serializers.IntegerField(required=True)
        name = serializers.CharField(required=False, max_length=100, allow_blank=False, allow_null=True)
        price = serializers.CharField(required=False, allow_null=True)
        duration = serializers.CharField(required=False, allow_null=True)
        hours_per_day = serializers.CharField(required=False, allow_null=True)

    def post(self, request):
        authorize_request('api_edit_plan', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = edit_plan_service(user=request.user, **serializer.validated_data)

        return Response({
            "status": "success",
            "data": result
        }, status=status.HTTP_200_OK)


class DeleteCoursePlanAdminApi(APIView):
    class InputSerializer(serializers.Serializer):
        plan_id = serializers.IntegerField(required=True)
        course_id = serializers.IntegerField(required=False, allow_null=True)

    def post(self, request):
        authorize_request('api_delete_course_plan', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        delete_course_plan_service(**serializer.validated_data)

        return Response({
            "status": "success",
            "message": "Plan deleted successfully"
        }, status=status.HTTP_200_OK)


class EditCourseBatchAdminApi(APIView):
    class InputSerializer(serializers.Serializer):
        batch_id = serializers.IntegerField(required=True)
        name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        plan = serializers.IntegerField(required=False, allow_null=True)
        time = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        trainer = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        total_seats = serializers.IntegerField(required=False, allow_null=True)
        start_date = serializers.DateField(required=False, allow_null=True)
        closing_date = serializers.DateField(required=False, allow_null=True)

    def post(self, request):
        authorize_request('api_edit_course_batch', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = edit_course_batch_service(user=request.user, data=serializer.validated_data)

        return Response({
            "status": "success",
            "data": result
        }, status=status.HTTP_200_OK)


class DeleteCourseBatchAdminApi(APIView):
    class InputSerializer(serializers.Serializer):
        batch_id = serializers.IntegerField(required=True)

    def post(self, request):
        authorize_request('api_delete_course_batch', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        batch_id = serializer.validated_data.get("batch_id")
        delete_course_batch_service(batch_id=batch_id)

        return Response({
            "status": "success",
            "message": "Batch deleted successfully"
        }, status=status.HTTP_200_OK)


class DeleteCourseAdminApi(APIView):
    class InputSerializer(serializers.Serializer):
        course_id = serializers.IntegerField(required=True)

    def post(self, request):
        authorize_request('api_delete_course', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_id = serializer.validated_data.get("course_id")
        success = delete_course_service(course_id=target_id)

        if not success:
            return Response({
                "status": "error",
                "message": "Course not found"
            }, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "status": "success",
            "message": "Course and associated plans/batches deleted successfully"
        }, status=status.HTTP_200_OK)


class CreateBatchApi(APIView):
    class InputSerializer(serializers.Serializer):
        course_id = serializers.IntegerField(required=True)
        name = serializers.CharField(required=True, max_length=100, allow_blank=False)
        plan = serializers.IntegerField(required=True)
        time = serializers.CharField(required=True, max_length=100, allow_blank=False)
        trainer = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        total_seats = serializers.IntegerField(required=True, min_value=1)
        start_date = serializers.DateField(required=False, allow_null=True)
        closing_date = serializers.DateField(required=False, allow_null=True)

    def post(self, request):
        authorize_request('api_create_batch', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = create_batch_service(user=request.user, data=serializer.validated_data)

        return Response({
            "status": "success",
            "data": result
        }, status=status.HTTP_201_CREATED)


class EditBatchApi(APIView):
    class InputSerializer(serializers.Serializer):
        batch_id = serializers.IntegerField(required=True)
        name = serializers.CharField(required=False, max_length=100, allow_blank=False, allow_null=True)
        plan = serializers.IntegerField(required=False, allow_null=True)
        time = serializers.CharField(required=False, max_length=100, allow_blank=False, allow_null=True)
        trainer = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        total_seats = serializers.IntegerField(required=False, min_value=1, allow_null=True)
        start_date = serializers.DateField(required=False, allow_null=True)
        closing_date = serializers.DateField(required=False, allow_null=True)

    def post(self, request):
        authorize_request('api_edit_batch', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = edit_batch_service(user=request.user, **serializer.validated_data)

        return Response({
            "status": "success",
            "data": result
        }, status=status.HTTP_200_OK)
