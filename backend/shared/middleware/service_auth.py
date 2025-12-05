"""
Service-to-service authentication middleware
"""
import jwt
from django.conf import settings
from django.http import JsonResponse
import logging

logger = logging.getLogger(__name__)


class ServiceAuthMiddleware:
    """
    Middleware to authenticate service-to-service requests
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Check if this is a service-to-service request
        service_token = request.META.get('HTTP_X_SERVICE_TOKEN')
        
        if service_token:
            try:
                # Verify service token
                payload = jwt.decode(
                    service_token,
                    settings.SERVICE_SECRET_KEY,
                    algorithms=['HS256']
                )
                
                if payload.get('type') == 'service':
                    request.service_name = payload.get('service')
                    request.is_service_request = True
                else:
                    return JsonResponse(
                        {'error': 'Invalid service token'},
                        status=401
                    )
            except jwt.ExpiredSignatureError:
                return JsonResponse(
                    {'error': 'Service token expired'},
                    status=401
                )
            except jwt.InvalidTokenError:
                return JsonResponse(
                    {'error': 'Invalid service token'},
                    status=401
                )
        else:
            request.is_service_request = False
        
        return self.get_response(request)
