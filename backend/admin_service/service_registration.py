"""
Service registration for Admin Service with Consul
"""
import os
import logging

logger = logging.getLogger(__name__)


def register_service():
    """Register admin service with Consul"""
    try:
        from shared.consul_client import ConsulClient
        
        consul = ConsulClient()
        
        service_config = {
            'name': 'admin-service',
            'id': f"admin-service-{os.getenv('HOSTNAME', 'local')}",
            'address': os.getenv('SERVICE_HOST', 'localhost'),
            'port': int(os.getenv('SERVICE_PORT', '8000')),
            'tags': ['admin', 'management', 'monitoring'],
            'meta': {
                'version': '1.0.0',
                'environment': os.getenv('ENVIRONMENT', 'development')
            },
            'check': {
                'http': f"http://{os.getenv('SERVICE_HOST', 'localhost')}:{os.getenv('SERVICE_PORT', '8000')}/health/",
                'interval': '10s',
                'timeout': '5s'
            }
        }
        
        success = consul.register_service(service_config)
        
        if success:
            logger.info("Admin service registered successfully with Consul")
        else:
            logger.error("Failed to register admin service with Consul")
            
        return success
        
    except ImportError:
        logger.warning("Consul client not available, skipping service registration")
        return False
    except Exception as e:
        logger.error(f"Error registering admin service: {str(e)}")
        return False


def deregister_service():
    """Deregister admin service from Consul"""
    try:
        from shared.consul_client import ConsulClient
        
        consul = ConsulClient()
        service_id = f"admin-service-{os.getenv('HOSTNAME', 'local')}"
        
        success = consul.deregister_service(service_id)
        
        if success:
            logger.info("Admin service deregistered successfully from Consul")
        else:
            logger.error("Failed to deregister admin service from Consul")
            
        return success
        
    except ImportError:
        logger.warning("Consul client not available, skipping service deregistration")
        return False
    except Exception as e:
        logger.error(f"Error deregistering admin service: {str(e)}")
        return False
