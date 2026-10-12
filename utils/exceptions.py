import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist, ValidationError as DjangoValidationError
from django.db import IntegrityError

logger = logging.getLogger('django')


def api_exception_handler(exception, context):
    """
    Global Custom Exception Handler for Django REST Framework.
    Catches unhandled exceptions, Django DoesNotExist, DB IntegrityError, and returns safe, clean JSON responses.
    """
    # 1. Call DRF's default exception handler first to handle DRF's native exceptions
    response = exception_handler(exception, context)

    view_name = context['view'].__class__.__name__ if 'view' in context and hasattr(context['view'], '__class__') else 'UnknownView'

    # 2. Handle Django's ObjectDoesNotExist ➔ Return 404 NOT FOUND
    if isinstance(exception, ObjectDoesNotExist):
        logger.warning(f"ObjectDoesNotExist in {view_name}: {exception}")
        return Response({
            "status": "error",
            "message": str(exception) or "The requested record does not exist.",
            "code": status.HTTP_404_NOT_FOUND
        }, status=status.HTTP_404_NOT_FOUND)

    # 3. Handle Django's DB IntegrityError (e.g. Duplicate Key / Foreign Key failure) ➔ Return 400 BAD REQUEST
    if isinstance(exception, IntegrityError):
        logger.error(f"IntegrityError in {view_name}: {exception}")
        return Response({
            "status": "error",
            "message": "Database integrity error (e.g. duplicate record or invalid reference).",
            "code": status.HTTP_400_BAD_REQUEST
        }, status=status.HTTP_400_BAD_REQUEST)

    # 4. Handle Django's native ValidationError
    if isinstance(exception, DjangoValidationError):
        logger.warning(f"ValidationError in {view_name}: {exception}")
        msg = exception.message_dict if hasattr(exception, 'message_dict') else (exception.messages if hasattr(exception, 'messages') else str(exception))
        return Response({
            "status": "error",
            "message": msg,
            "code": status.HTTP_400_BAD_REQUEST
        }, status=status.HTTP_400_BAD_REQUEST)

    # 5. Handle Standard DRF Exceptions
    if response is not None:
        msg = response.data.get("detail") if isinstance(response.data, dict) and "detail" in response.data else response.data
        response.data = {
            "status": "error",
            "message": msg,
            "code": response.status_code
        }
        return response

    # 6. Unhandled Server Exceptions (e.g. KeyError, AttributeError, System crashes) ➔ Log & Return Safe 500
    logger.error(f"Unhandled Exception in {view_name}: {exception}", exc_info=True)
    return Response({
        "status": "error",
        "message": "An unexpected internal server error occurred. Please try again later.",
        "code": status.HTTP_500_INTERNAL_SERVER_ERROR
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)