"""
Payment Service Registration with Consul
"""
import os
import logging

logger = logging.getLogger(__name__)


def register_service():
    """
    Register payment service with Consul
    """
    try:
        from shared.consul_client import ConsulClient, ServiceConfig, get_service_instance_id, get_local_ip
        
        service_name = 'payment-service'
        service_id = get_service_instance_id(service_name)
        host = get_local_ip()
        port = int(os.getenv('PAYMENT_SERVICE_PORT', 8015))
        
        config = ServiceConfig(
            name=service_name,
            service_id=service_id,
            host=host,
            port=port,
            tags=['payment', 'transactions', 'escrow', 'django'],
            meta={
                'version': '1.0.0',
                'environment': os.getenv('ENVIRONMENT', 'development')
            },
            health_check_path='/health/'
        )
        
        consul = ConsulClient()
        if consul.register_service(config):
            logger.info(f"Payment service registered with Consul: {service_id}")
        else:
            logger.warning("Payment service registration skipped (Consul not available)")
        
    except ImportError:
        logger.warning("Consul client not available, skipping service registration")
    except Exception as e:
        logger.warning(f"Failed to register payment service with Consul: {e}")


def deregister_service():
    """
    Deregister payment service from Consul
    """
    try:
        from shared.consul_client import ConsulClient, get_service_instance_id
        
        service_name = 'payment-service'
        service_id = get_service_instance_id(service_name)
        
        consul = ConsulClient()
        if consul.deregister_service(service_id):
            logger.info(f"Payment service deregistered from Consul: {service_id}")
        
    except ImportError:
        logger.debug("Consul client not available, skipping service deregistration")
    except Exception as e:
        logger.warning(f"Failed to deregister payment service: {e}")
