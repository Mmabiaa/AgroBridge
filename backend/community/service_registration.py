"""
Community Service Registration with Consul
"""
import os
import socket


def register_service():
    """Register the community service with Consul."""
    try:
        from shared.consul_client import ConsulClient
        
        service_name = 'community-service'
        service_id = f'{service_name}-{socket.gethostname()}'
        service_port = int(os.getenv('SERVICE_PORT', 8000))
        
        consul_client = ConsulClient()
        
        # Register service
        consul_client.register_service(
            name=service_name,
            service_id=service_id,
            address=socket.gethostbyname(socket.gethostname()),
            port=service_port,
            tags=['community', 'social', 'messaging'],
            meta={
                'version': '1.0.0',
                'environment': os.getenv('ENVIRONMENT', 'development')
            }
        )
        
        print(f"Community service registered with Consul: {service_id}")
        
    except Exception as e:
        print(f"Failed to register community service with Consul: {e}")


def deregister_service():
    """Deregister the community service from Consul."""
    try:
        from shared.consul_client import ConsulClient
        
        service_name = 'community-service'
        service_id = f'{service_name}-{socket.gethostname()}'
        
        consul_client = ConsulClient()
        consul_client.deregister_service(service_id)
        
        print(f"Community service deregistered from Consul: {service_id}")
        
    except Exception as e:
        print(f"Failed to deregister community service from Consul: {e}")
