"""
Community Service Registration with Consul
"""
import os
import logging

logger = logging.getLogger(__name__)


def register_service():
    """Register the community service with Consul."""
    try:
        from shared.consul_client import ConsulClient, ServiceConfig, get_service_instance_id, get_local_ip
        
        service_name = 'community-service'
        service_id = get_service_instance_id(service_name)
        host = get_local_ip()
        port = int(os.getenv('SERVICE_PORT', 8000))
        
        config = ServiceConfig(
            name=service_name,
            service_id=service_id,
            host=host,
            port=port,
            tags=['community', 'social', 'messaging'],
            meta={
                'version': '1.0.0',
                'environment': os.getenv('ENVIRONMENT', 'development')
            },
            health_check_path='/health/'
        )
        
        consul_client = ConsulClient()
        if consul_client.register_service(config):
            logger.info(f"Community service registered with Consul: {service_id}")
        else:
            logger.debug("Community service registration skipped (Consul not available)")
        
    except ImportError:
        logger.debug("Consul client not available, skipping service registration")
    except Exception as e:
        logger.debug(f"Failed to register community service with Consul: {e}")


def deregister_service():
    """Deregister the community service from Consul."""
    try:
        from shared.consul_client import ConsulClient, get_service_instance_id
        
        service_name = 'community-service'
        service_id = get_service_instance_id(service_name)
        
        consul_client = ConsulClient()
        if consul_client.deregister_service(service_id):
            logger.info(f"Community service deregistered from Consul: {service_id}")
        
    except ImportError:
        logger.debug("Consul client not available, skipping service deregistration")
    except Exception as e:
        logger.debug(f"Failed to deregister community service from Consul: {e}")
