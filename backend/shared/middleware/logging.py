"""
Request/response logging middleware
"""
import logging
import time
import json

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware:
    """
    Middleware to log all requests and responses
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Start timer
        start_time = time.time()
        
        # Log request
        request_id = getattr(request, 'request_id', 'unknown')
        logger.info(
            f"Request started",
            extra={
                'request_id': request_id,
                'method': request.method,
                'path': request.path,
                'user': str(request.user) if hasattr(request, 'user') else 'anonymous',
            }
        )
        
        # Process request
        response = self.get_response(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Log response
        logger.info(
            f"Request completed",
            extra={
                'request_id': request_id,
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code,
                'duration_ms': round(duration * 1000, 2),
            }
        )
        
        return response
