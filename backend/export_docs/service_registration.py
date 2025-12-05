"""Service registration for export documentation service with Consul."""

import os
import socket
from shared.consul_client import ConsulClient


def register_service():
    """Register export documentation service with Consul."""
    service_name = "export-docs-service"
    service_id = f"{service_name}-{socket.gethostname()}"
    service_port = int(os.getenv('EXPORT_DOCS_SERVICE_PORT', '8017'))
    
    consul_client = ConsulClient()
    
    # Register service
    consul_client.register_service(
        name=service_name,
        service_id=service_id,
        address=socket.gethostbyname(socket.gethostname()),
        port=service_port,
        tags=['export', 'documentation', 'compliance', 'customs'],
        meta={
            'version': '1.0.0',
            'environment': os.getenv('ENVIRONMENT', 'development')
        }
    )
    
    print(f"Export documentation service registered with Consul: {service_id}")


def deregister_service():
    """Deregister export documentation service from Consul."""
    service_name = "export-docs-service"
    service_id = f"{service_name}-{socket.gethostname()}"
    
    consul_client = ConsulClient()
    consul_client.deregister_service(service_id)
    
    print(f"Export documentation service deregistered from Consul: {service_id}")


if __name__ == '__main__':
    register_service()
