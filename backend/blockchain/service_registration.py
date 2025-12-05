"""Service registration for blockchain service with Consul."""

import os
from shared.consul_client import ConsulClient


def register_service():
    """Register blockchain service with Consul."""
    consul = ConsulClient()
    
    service_config = {
        'name': 'blockchain-service',
        'id': f"blockchain-service-{os.getenv('HOSTNAME', 'local')}",
        'address': os.getenv('SERVICE_HOST', 'localhost'),
        'port': int(os.getenv('SERVICE_PORT', '8000')),
        'tags': ['blockchain', 'certificates', 'supply-chain', 'verification'],
        'meta': {
            'version': '1.0.0',
            'environment': os.getenv('ENVIRONMENT', 'development'),
            'blockchain_network': os.getenv('BLOCKCHAIN_NETWORK', 'ethereum')
        },
        'check': {
            'http': f"http://{os.getenv('SERVICE_HOST', 'localhost')}:{os.getenv('SERVICE_PORT', '8000')}/health",
            'interval': '10s',
            'timeout': '5s',
            'deregister_critical_service_after': '30s'
        }
    }
    
    success = consul.register_service(service_config)
    
    if success:
        print(f"✅ Blockchain service registered with Consul: {service_config['id']}")
    else:
        print("❌ Failed to register blockchain service with Consul")
    
    return success


def deregister_service():
    """Deregister blockchain service from Consul."""
    consul = ConsulClient()
    service_id = f"blockchain-service-{os.getenv('HOSTNAME', 'local')}"
    
    success = consul.deregister_service(service_id)
    
    if success:
        print(f"✅ Blockchain service deregistered from Consul: {service_id}")
    else:
        print("❌ Failed to deregister blockchain service from Consul")
    
    return success
