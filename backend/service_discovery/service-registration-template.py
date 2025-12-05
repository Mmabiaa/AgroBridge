"""
Service Registration Template for AgroBridge Microservices

This template provides a standardized way to register microservices
with Consul service discovery.

Usage:
    from service_discovery.service_registration_template import register_with_consul
    
    # In your Django app's ready() method or startup script
    register_with_consul(
        service_name='marketplace-service',
        port=8004,
        tags=['marketplace', 'v1', 'django']
    )
"""

import os
import sys
import logging
import atexit
from typing import List, Dict, Optional

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.consul_client import (
    ConsulClient,
    ServiceConfig,
    get_service_instance_id,
    get_local_ip
)

logger = logging.getLogger(__name__)

# Global Consul client instance
_consul_client: Optional[ConsulClient] = None
_registered_service_id: Optional[str] = None


def register_with_consul(
    service_name: str,
    port: int,
    tags: Optional[List[str]] = None,
    meta: Optional[Dict[str, str]] = None,
    health_check_path: str = "/health",
    host: Optional[str] = None,
    consul_host: Optional[str] = None,
    consul_port: Optional[int] = None
) -> bool:
    """
    Register a microservice with Consul
    
    Args:
        service_name: Name of the service (e.g., 'marketplace-service')
        port: Port the service is running on
        tags: List of tags for service discovery (e.g., ['v1', 'django'])
        meta: Additional metadata as key-value pairs
        health_check_path: Path for health check endpoint (default: '/health')
        host: Service host address (default: auto-detected local IP)
        consul_host: Consul server host (default: from env or 'localhost')
        consul_port: Consul server port (default: from env or 8500)
        
    Returns:
        True if registration successful, False otherwise
        
    Example:
        >>> register_with_consul(
        ...     service_name='marketplace-service',
        ...     port=8004,
        ...     tags=['marketplace', 'v1', 'django'],
        ...     meta={'version': '1.0.0', 'environment': 'production'}
        ... )
        True
    """
    global _consul_client, _registered_service_id
    
    try:
        # Initialize Consul client if not already done
        if _consul_client is None:
            _consul_client = ConsulClient(
                host=consul_host,
                port=consul_port
            )
        
        # Check if Consul is healthy
        if not _consul_client.health_check():
            logger.error("Consul is not healthy, skipping registration")
            return False
        
        # Generate unique service instance ID
        service_id = get_service_instance_id(service_name)
        _registered_service_id = service_id
        
        # Determine service host
        if host is None:
            host = get_local_ip()
        
        # Prepare tags
        if tags is None:
            tags = []
        
        # Add default tags
        default_tags = [
            f"version:{os.getenv('SERVICE_VERSION', '1.0.0')}",
            f"environment:{os.getenv('ENVIRONMENT', 'development')}"
        ]
        tags.extend(default_tags)
        
        # Prepare metadata
        if meta is None:
            meta = {}
        
        # Add default metadata
        meta.update({
            'service_version': os.getenv('SERVICE_VERSION', '1.0.0'),
            'environment': os.getenv('ENVIRONMENT', 'development'),
            'python_version': f"{sys.version_info.major}.{sys.version_info.minor}",
        })
        
        # Create service configuration
        config = ServiceConfig(
            name=service_name,
            service_id=service_id,
            host=host,
            port=port,
            tags=tags,
            meta=meta,
            health_check_path=health_check_path
        )
        
        # Register the service
        success = _consul_client.register_service(config)
        
        if success:
            logger.info(
                f"Successfully registered {service_name} with Consul "
                f"(ID: {service_id}, Address: {host}:{port})"
            )
            
            # Register cleanup on exit
            atexit.register(deregister_on_exit)
        else:
            logger.error(f"Failed to register {service_name} with Consul")
        
        return success
        
    except Exception as e:
        logger.error(f"Error registering service with Consul: {e}")
        return False


def deregister_on_exit():
    """
    Deregister service from Consul on application exit
    
    This function is automatically called when the application exits
    if registration was successful.
    """
    global _consul_client, _registered_service_id
    
    if _consul_client and _registered_service_id:
        try:
            _consul_client.deregister_service(_registered_service_id)
            logger.info(f"Deregistered service {_registered_service_id} from Consul")
        except Exception as e:
            logger.error(f"Error deregistering service from Consul: {e}")


def discover_service(
    service_name: str,
    tag: Optional[str] = None,
    consul_host: Optional[str] = None,
    consul_port: Optional[int] = None
) -> Optional[str]:
    """
    Discover a service address from Consul
    
    Args:
        service_name: Name of the service to discover
        tag: Optional tag to filter services
        consul_host: Consul server host (default: from env or 'localhost')
        consul_port: Consul server port (default: from env or 8500)
        
    Returns:
        Service address in format 'host:port' or None if not found
        
    Example:
        >>> address = discover_service('marketplace-service')
        >>> print(address)
        '172.20.0.10:8004'
    """
    global _consul_client
    
    try:
        # Initialize Consul client if not already done
        if _consul_client is None:
            _consul_client = ConsulClient(
                host=consul_host,
                port=consul_port
            )
        
        # Discover the service
        address = _consul_client.get_service_address(service_name, tag=tag)
        return address
        
    except Exception as e:
        logger.error(f"Error discovering service {service_name}: {e}")
        return None


# Service name constants for easy reference
class ServiceNames:
    """Constants for all AgroBridge microservice names"""
    AUTHENTICATION = "authentication-service"
    USER = "user-service"
    FARM_MANAGEMENT = "farm-management-service"
    MARKETPLACE = "marketplace-service"
    AI_ASSISTANT = "ai-assistant-service"
    CROP_DETECTION = "crop-detection-service"
    IOT = "iot-service"
    NOTIFICATION = "notification-service"
    FINANCIAL = "financial-service"
    LEARNING = "learning-service"
    COMMUNITY = "community-service"
    SCHEDULING = "scheduling-service"
    ANALYTICS = "analytics-service"
    PAYMENT = "payment-service"
    ADMIN = "admin-service"


# Example usage for each service
if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Example: Register marketplace service
    success = register_with_consul(
        service_name=ServiceNames.MARKETPLACE,
        port=8004,
        tags=['marketplace', 'v1', 'django'],
        meta={
            'description': 'Marketplace service for product listings and orders',
            'team': 'marketplace-team'
        }
    )
    
    if success:
        print("Service registered successfully!")
        
        # Example: Discover another service
        auth_address = discover_service(ServiceNames.AUTHENTICATION)
        if auth_address:
            print(f"Authentication service found at: {auth_address}")
        else:
            print("Authentication service not found")
    else:
        print("Service registration failed!")
