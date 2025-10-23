"""
Custom middleware for AgroBridge API
"""
import logging
import time
import uuid
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log API requests and responses
    """
    
    def process_request(self, request):
        """
        Process incoming request
        """
        # Add request ID for tracking
        request.request_id = str(uuid.uuid4())
        request.start_time = time.time()
        
        # Log request details
        logger.info(f"Request {request.request_id}: {request.method} {request.path}", extra={
            'request_id': request.request_id,
            'method': request.method,
            'path': request.path,
            'user': str(request.user) if hasattr(request, 'user') else 'Anonymous',
            'ip': self.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        })
        
        return None
    
    def process_response(self, request, response):
        """
        Process outgoing response
        """
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            
            # Log response details
            logger.info(f"Response {getattr(request, 'request_id', 'unknown')}: {response.status_code}", extra={
                'request_id': getattr(request, 'request_id', 'unknown'),
                'status_code': response.status_code,
                'duration': f"{duration:.3f}s",
                'content_length': len(response.content) if hasattr(response, 'content') else 0,
            })
        
        # Add request ID to response headers
        if hasattr(request, 'request_id'):
            response['X-Request-ID'] = request.request_id
        
        return response
    
    def get_client_ip(self, request):
        """
        Get client IP address from request
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware to add security headers
    """
    
    def process_response(self, request, response):
        """
        Add security headers to response
        """
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Add API version header
        response['X-API-Version'] = 'v1'
        
        return response