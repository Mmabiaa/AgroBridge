"""
Request ID middleware for distributed tracing
"""
import uuid
import logging

logger = logging.getLogger(__name__)


class RequestIDMiddleware:
    """
    Middleware to add a unique request ID to each request
    for distributed tracing and logging
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Generate or extract request ID
        request_id = request.META.get('HTTP_X_REQUEST_ID', str(uuid.uuid4()))
        request.request_id = request_id
        
        # Add to response headers
        response = self.get_response(request)
        response['X-Request-ID'] = request_id
        
        return response
