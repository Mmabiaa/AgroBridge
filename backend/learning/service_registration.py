"""
Service registration for Learning service with Consul
"""
import os
import logging

logger = logging.getLogger(__name__)


def register_service():
    """Register the Learning service with Consul"""
    try:
        from shared.consul_client import ConsulClient
        
        consul_client = ConsulClient()
        
        service_config = {
            'name': 'learning-service',
            'service_id': f"learning-service-{os.getenv('HOSTNAME', 'local')}",
            'address': os.getenv('SERVICE_HOST', 'localhost'),
            'port': int(os.getenv('SERVICE_PORT', '8000')),
            'tags': ['learning', 'education', 'courses', 'django'],
            'meta': {
                'version': '1.0.0',
                'environment': os.getenv('ENVIRONMENT', 'development')
            },
            'check': {
                'http': f"http://{os.getenv('SERVICE_HOST', 'localhost')}:{os.getenv('SERVICE_PORT', '8000')}/health/",
                'interval': '10s',
                'timeout': '5s',
                'deregister_critical_service_after': '30s'
            }
        }
        
        success = consul_client.register_service(service_config)
        
        if success:
            logger.info("Learning service registered successfully with Consul")
        else:
            logger.error("Failed to register Learning service with Consul")
            
    except ImportError:
        logger.warning("Consul client not available, skipping service registration")
    except Exception as e:
        logger.error(f"Error registering Learning service: {str(e)}")


def deregister_service():
    """Deregister the Learning service from Consul"""
    try:
        from shared.consul_client import ConsulClient
        
        consul_client = ConsulClient()
        service_id = f"learning-service-{os.getenv('HOSTNAME', 'local')}"
        
        success = consul_client.deregister_service(service_id)
        
        if success:
            logger.info("Learning service deregistered successfully from Consul")
        else:
            logger.error("Failed to deregister Learning service from Consul")
            
    except ImportError:
        logger.warning("Consul client not available, skipping service deregistration")
    except Exception as e:
        logger.error(f"Error deregistering Learning service: {str(e)}")


# Auto-register on module import in production
if os.getenv('ENVIRONMENT') in ['production', 'staging']:
    register_service()
