"""Service registration for emergency response service with Consul."""

import os
import socket
from shared.consul_client import ConsulClient


def register_service():
    """Register emergency response service with Consul."""
    service_name = "emergency-response-service"
    service_id = f"{service_name}-{socket.gethostname()}"
    service_port = int(os.getenv('EMERGENCY_SERVICE_PORT', '8018'))
    
    consul_client = ConsulClient()
    
    # Register service
    consul_client.register_service(
        name=service_name,
        service_id=service_id,
        address=socket.gethostbyname(socket.gethostname()),
        port=service_port,
        tags=['emergency', 'alerts', 'incidents', 'response'],
        meta={
            'version': '1.0.0',
            'environment': os.getenv('ENVIRONMENT', 'development')
        }
    )
    
    print(f"Emergency response service registered with Consul: {service_id}")


def deregister_service():
    """Deregister emergency response service from Consul."""
    service_name = "emergency-response-service"
    service_id = f"{service_name}-{socket.gethostname()}"
    
    consul_client = ConsulClient()
    consul_client.deregister_service(service_id)
    
    print(f"Emergency response service deregistered from Consul: {service_id}")


if __name__ == '__main__':
    register_service()
