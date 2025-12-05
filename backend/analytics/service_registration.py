"""
Analytics Service Registration with Consul
"""
import logging

logger = logging.getLogger(__name__)


def register_analytics_service():
    """
    Register analytics service with Consul
    """
    try:
        from shared.consul_client import ConsulClient
        
        consul_client = ConsulClient()
        
        service_config = {
            'name': 'analytics-service',
            'service_id': 'analytics-service-1',
            'port': 8000,
            'tags': ['analytics', 'metrics', 'predictions', 'reports'],
            'meta': {
                'version': '1.0.0',
                'description': 'Analytics and predictive insights service'
            },
            'check': {
                'http': 'http://localhost:8000/api/analytics/health/',
                'interval': '30s',
                'timeout': '5s'
            }
        }
        
        success = consul_client.register_service(service_config)
        
        if success:
            logger.info("Analytics service registered with Consul successfully")
        else:
            logger.warning("Failed to register analytics service with Consul")
            
    except ImportError:
        logger.warning("Consul client not available, skipping service registration")
    except Exception as e:
        logger.error(f"Error registering analytics service: {e}")


def deregister_analytics_service():
    """
    Deregister analytics service from Consul
    """
    try:
        from shared.consul_client import ConsulClient
        
        consul_client = ConsulClient()
        success = consul_client.deregister_service('analytics-service-1')
        
        if success:
            logger.info("Analytics service deregistered from Consul")
        else:
            logger.warning("Failed to deregister analytics service from Consul")
            
    except ImportError:
        logger.warning("Consul client not available")
    except Exception as e:
        logger.error(f"Error deregistering analytics service: {e}")
