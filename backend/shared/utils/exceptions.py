"""
Custom exception classes
"""
from rest_framework.exceptions import APIException
from rest_framework import status


class ServiceUnavailableException(APIException):
    """Exception for when a dependent service is unavailable"""
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = 'Service temporarily unavailable.'
    default_code = 'service_unavailable'


class ResourceNotFoundException(APIException):
    """Exception for when a resource is not found"""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Resource not found.'
    default_code = 'not_found'


class ValidationException(APIException):
    """Exception for validation errors"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Validation error.'
    default_code = 'validation_error'


class UnauthorizedException(APIException):
    """Exception for unauthorized access"""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Authentication credentials were not provided or are invalid.'
    default_code = 'unauthorized'


class ForbiddenException(APIException):
    """Exception for forbidden access"""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to perform this action.'
    default_code = 'forbidden'


class RateLimitExceededException(APIException):
    """Exception for rate limit exceeded"""
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = 'Rate limit exceeded. Please try again later.'
    default_code = 'rate_limit_exceeded'
