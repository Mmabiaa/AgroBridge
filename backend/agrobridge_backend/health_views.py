"""
Health check views for AgroBridge API
"""
from django.http import JsonResponse
from django.db import connection
from django.utils import timezone
from django.conf import settings
import redis
import logging

logger = logging.getLogger(__name__)


def health_check(request):
    """
    Basic health check endpoint
    """
    return JsonResponse({
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'version': '1.0.0'
    })


def detailed_health_check(request):
    """
    Detailed health check with dependency status
    """
    health_status = {
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'version': '1.0.0',
        'checks': {}
    }
    
    overall_healthy = True
    
    # Database check
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        health_status['checks']['database'] = {
            'status': 'healthy',
            'message': 'Database connection successful'
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status['checks']['database'] = {
            'status': 'unhealthy',
            'message': f'Database connection failed: {str(e)}'
        }
        overall_healthy = False
    
    # Redis check (for channels)
    try:
        if hasattr(settings, 'CHANNEL_LAYERS'):
            redis_config = settings.CHANNEL_LAYERS['default']['CONFIG']
            redis_host = redis_config['hosts'][0][0]
            redis_port = redis_config['hosts'][0][1]
            
            r = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)
            r.ping()
            
            health_status['checks']['redis'] = {
                'status': 'healthy',
                'message': 'Redis connection successful'
            }
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        health_status['checks']['redis'] = {
            'status': 'unhealthy',
            'message': f'Redis connection failed: {str(e)}'
        }
        overall_healthy = False
    
    # Update overall status
    if not overall_healthy:
        health_status['status'] = 'unhealthy'
    
    status_code = 200 if overall_healthy else 503
    return JsonResponse(health_status, status=status_code)