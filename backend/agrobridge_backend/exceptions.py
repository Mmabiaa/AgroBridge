"""
Custom exception handlers for AgroBridge API
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides consistent error response format
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        # Log the error
        logger.error(f"API Error: {exc}", exc_info=True, extra={
            'request': context.get('request'),
            'view': context.get('view'),
        })

        # Create custom error response format
        custom_response_data = {
            'error': {
                'code': get_error_code(exc),
                'message': get_error_message(exc, response.data),
                'details': get_error_details(response.data),
                'timestamp': timezone.now().isoformat(),
            }
        }

        # Add retry-after information for throttling errors
        if exc.__class__.__name__ == 'Throttled':
            wait_time = getattr(exc, 'wait', None)
            if wait_time:
                custom_response_data['error']['retry_after'] = int(wait_time)

        # Add request ID if available
        request = context.get('request')
        if request and hasattr(request, 'META'):
            request_id = request.META.get('HTTP_X_REQUEST_ID')
            if request_id:
                custom_response_data['error']['request_id'] = request_id

        response.data = custom_response_data

    return response


def get_error_code(exc):
    """
    Get standardized error code based on exception type
    """
    error_codes = {
        'ValidationError': 'VALIDATION_ERROR',
        'AuthenticationFailed': 'AUTHENTICATION_FAILED',
        'NotAuthenticated': 'NOT_AUTHENTICATED',
        'PermissionDenied': 'PERMISSION_DENIED',
        'NotFound': 'NOT_FOUND',
        'MethodNotAllowed': 'METHOD_NOT_ALLOWED',
        'Throttled': 'RATE_LIMIT_EXCEEDED',
        'ParseError': 'PARSE_ERROR',
        'UnsupportedMediaType': 'UNSUPPORTED_MEDIA_TYPE',
    }
    
    exc_name = exc.__class__.__name__
    return error_codes.get(exc_name, 'INTERNAL_ERROR')


def get_error_message(exc, response_data):
    """
    Get user-friendly error message
    """
    # Special handling for throttling errors
    if exc.__class__.__name__ == 'Throttled':
        wait_time = getattr(exc, 'wait', None)
        if wait_time:
            if wait_time < 60:
                return f"Too many requests. Please wait {int(wait_time)} seconds before trying again."
            elif wait_time < 3600:
                minutes = int(wait_time / 60)
                return f"Too many requests. Please wait {minutes} minute{'s' if minutes > 1 else ''} before trying again."
            else:
                hours = int(wait_time / 3600)
                return f"Too many requests. Please wait {hours} hour{'s' if hours > 1 else ''} before trying again."
        return "Too many requests. Please try again later."
    
    if hasattr(exc, 'detail'):
        if isinstance(exc.detail, str):
            return exc.detail
        elif isinstance(exc.detail, dict):
            # For validation errors, return the first error message
            for field, errors in exc.detail.items():
                if isinstance(errors, list) and errors:
                    return f"{field}: {errors[0]}"
                return str(errors)
        elif isinstance(exc.detail, list) and exc.detail:
            return str(exc.detail[0])
    
    return str(exc)


def get_error_details(response_data):
    """
    Get detailed error information for debugging
    """
    if isinstance(response_data, dict):
        # For validation errors, structure field errors properly
        if any(isinstance(v, list) for v in response_data.values()):
            return {'field_errors': response_data}
        return response_data
    elif isinstance(response_data, list):
        return {'errors': response_data}
    
    return None