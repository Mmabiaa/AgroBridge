"""Service registration for file storage service."""

import os
from shared.consul_client import ConsulClient


def register_service():
    """Register file storage service with Consul."""
    consul = ConsulClient()
    
    service_config = {
        'name': 'file-storage',
        'id': f'file-storage-{os.getenv("HOSTNAME", "local")}',
        'address': os.getenv('SERVICE_HOST', 'localhost'),
        'port': int(os.getenv('SERVICE_PORT', '8000')),
        'tags': ['file-storage', 'storage', 'files', 'media'],
        'meta': {
            'version': '1.0.0',
            'environment': os.getenv('ENVIRONMENT', 'development')
        },
        'check': {
            'http': f'http://{os.getenv("SERVICE_HOST", "localhost")}:{os.getenv("SERVICE_PORT", "8000")}/health/',
            'interval': '10s',
            'timeout': '5s'
        }
    }
    
    success = consul.register_service(service_config)
    
    if success:
        print(f"File storage service registered successfully: {service_config['id']}")
    else:
        print("Failed to register file storage service")
    
    return success


def deregister_service():
    """Deregister file storage service from Consul."""
    consul = ConsulClient()
    service_id = f'file-storage-{os.getenv("HOSTNAME", "local")}'
    
    success = consul.deregister_service(service_id)
    
    if success:
        print(f"File storage service deregistered: {service_id}")
    else:
        print("Failed to deregister file storage service")
    
    return success
