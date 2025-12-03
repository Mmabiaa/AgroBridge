"""
Standardized API response utilities
"""
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
from typing import Any, Optional, Dict


def success_response(
    data: Any = None,
    message: Optional[str] = None,
    status_code: int = status.HTTP_200_OK,
    pagination: Optional[Dict] = None
) -> Response:
    """
    Create a standardized success response
    
    Args:
        data: Response data
        message: Optional success message
        status_code: HTTP status code
        pagination: Optional pagination metadata
    
    Returns:
        Response object
    """
    response_data = {
        'success': True,
        'meta': {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'version': 'v1'
        }
    }
    
    if message:
        response_data['message'] = message
    
    if data is not None:
        response_data['data'] = data
    
    if pagination:
        response_data['pagination'] = pagination
    
    return Response(response_data, status=status_code)


def error_response(
    error_type: str,
    title: str,
    detail: str,
    status_code: int = status.HTTP_400_BAD_REQUEST,
    errors: Optional[list] = None,
    instance: Optional[str] = None
) -> Response:
    """
    Create a standardized error response following RFC 7807
    
    Args:
        error_type: Error type identifier
        title: Short error title
        detail: Detailed error message
        status_code: HTTP status code
        errors: Optional list of field-specific errors
        instance: Optional URI reference to the specific occurrence
    
    Returns:
        Response object
    """
    response_data = {
        'success': False,
        'error': {
            'type': error_type,
            'title': title,
            'status': status_code,
            'detail': detail,
        },
        'meta': {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
        }
    }
    
    if instance:
        response_data['error']['instance'] = instance
    
    if errors:
        response_data['error']['errors'] = errors
    
    return Response(response_data, status=status_code)
