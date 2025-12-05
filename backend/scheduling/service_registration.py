"""
Service registration for scheduling service with Consul
"""
import os
import logging
from shared.consul_client import ConsulClient

logger = logging.getLogger(__name__)


def register_scheduling_service():
    """
    Register scheduling service with Consul
    """
    try:
        consul_client = ConsulClient()
        
        service_config = {
            'name': 'scheduling-service',
            'service_id': f"scheduling-service-{os.getenv('HOSTNAME', 'local')}",
            'address': os.getenv('SERVICE_HOST', 'localhost'),
            'port': int(os.getenv('SERVICE_PORT', '8000')),
            'tags': ['scheduling', 'tasks', 'calendar', 'django'],
            'meta': {
                'version': '1.0.0',
                'environment': os.getenv('ENVIRONMENT', 'development')
            },
            'check': {
                'http': f"http://{os.getenv('SERVICE_HOST', 'localhost')}:{os.getenv('SERVICE_PORT', '8000')}/health/",
                'interval': '30s',
                'timeout': '5s',
                'deregister_critical_service_after': '1m'
            }
        }
        
        success = consul_client.register_service(service_config)
        
        if success:
            logger.info("Scheduling service registered successfully with Consul")
        else:
            logger.error("Failed to register scheduling service with Consul")
        
        return success
    
    except Exception as e:
        logger.error(f"Error registering scheduling service: {str(e)}")
        return False


def deregister_scheduling_service():
    """
    Deregister scheduling service from Consul
    """
    try:
        consul_client = ConsulClient()
        service_id = f"scheduling-service-{os.getenv('HOSTNAME', 'local')}"
        
        success = consul_client.deregister_service(service_id)
        
        if success:
            logger.info("Scheduling service deregistered successfully from Consul")
        else:
            logger.error("Failed to deregister scheduling service from Consul")
        
        return success
    
    except Exception as e:
        logger.error(f"Error deregistering scheduling service: {str(e)}")
        return False
