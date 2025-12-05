"""
Payment Service Registration with Consul
"""
import os
import logging
from shared.consul_client import ConsulClient

logger = logging.getLogger(__name__)


def register_service():
    """
    Register payment service with Consul
    """
    try:
        consul = ConsulClient()
        
        service_config = {
            'name': 'payment-service',
            'port': int(os.getenv('PAYMENT_SERVICE_PORT', 8015)),
            'tags': ['payment', 'transactions', 'escrow', 'django'],
            'meta': {
                'version': '1.0.0',
                'environment': os.getenv('ENVIRONMENT', 'development')
            }
        }
        
        consul.register_service(**service_config)
        logger.info("Payment service registered with Consul")
        
    except Exception as e:
        logger.error(f"Failed to register payment service: {e}")


def deregister_service():
    """
    Deregister payment service from Consul
    """
    try:
        consul = ConsulClient()
        consul.deregister_service('payment-service')
        logger.info("Payment service deregistered from Consul")
        
    except Exception as e:
        logger.error(f"Failed to deregister payment service: {e}")
