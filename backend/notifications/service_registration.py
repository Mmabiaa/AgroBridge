"""
Notification Service Registration with Consul

This module handles service registration with Consul for service discovery.
"""

import logging
import os
from django.conf import settings

logger = logging.getLogger(__name__)


def register_service():
    """
    Register notification service with Consul
    """
    try:
        # Import consul client
        from shared.consul_client import ConsulClient
        
        # Get service configuration
        service_name = getattr(settings, 'SERVICE_NAME', 'notification-service')
        service_host = os.getenv('SERVICE_HOST', 'localhost')
        service_port = int(os.getenv('SERVICE_PORT', '8007'))
        
        # Initialize Consul client
        consul = ConsulClient()
        
        # Register service
        consul.register_service(
            name=service_name,
            service_id=f"{service_name}-{service_host}-{service_port}",
            address=service_host,
            port=service_port,
            tags=['notification', 'messaging', 'websocket', 'django'],
            meta={
                'version': '1.0.0',
                'environment': os.getenv('ENVIRONMENT', 'development'),
            },
            check={
                'http': f'http://{service_host}:{service_port}/api/v1/notifications/health/',
                'interval': '30s',
                'timeout': '5s',
                'deregister_critical_service_after': '1m',
            }
        )
        
        logger.info(f"Registered {service_name} with Consul at {service_host}:{service_port}")
        
    except ImportError:
        logger.warning("Consul client not available, skipping service registration")
    except Exception as e:
        logger.error(f"Failed to register service with Consul: {e}")


def deregister_service():
    """
    Deregister notification service from Consul
    """
    try:
        from shared.consul_client import ConsulClient
        
        service_name = getattr(settings, 'SERVICE_NAME', 'notification-service')
        service_host = os.getenv('SERVICE_HOST', 'localhost')
        service_port = int(os.getenv('SERVICE_PORT', '8007'))
        service_id = f"{service_name}-{service_host}-{service_port}"
        
        consul = ConsulClient()
        consul.deregister_service(service_id)
        
        logger.info(f"Deregistered {service_name} from Consul")
        
    except ImportError:
        logger.warning("Consul client not available, skipping service deregistration")
    except Exception as e:
        logger.error(f"Failed to deregister service from Consul: {e}")
