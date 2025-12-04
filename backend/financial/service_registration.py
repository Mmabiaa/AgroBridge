"""
Service registration for Financial Management Service with Consul
"""
import os
import socket
from shared.consul_client import ConsulClient


def register_financial_service():
    """
    Register the financial management service with Consul
    """
    # Get service configuration from environment
    service_name = os.getenv('SERVICE_NAME', 'financial-service')
    service_id = os.getenv('SERVICE_ID', f'{service_name}-{socket.gethostname()}')
    service_port = int(os.getenv('SERVICE_PORT', '8000'))
    service_host = os.getenv('SERVICE_HOST', socket.gethostbyname(socket.gethostname()))
    
    # Health check configuration
    health_check_interval = os.getenv('HEALTH_CHECK_INTERVAL', '10s')
    health_check_timeout = os.getenv('HEALTH_CHECK_TIMEOUT', '5s')
    health_check_path = '/api/financial/health/'
    
    # Initialize Consul client
    consul_client = ConsulClient()
    
    # Service metadata
    service_meta = {
        'version': '1.0.0',
        'environment': os.getenv('ENVIRONMENT', 'development'),
        'description': 'Financial Management Service - Income, expenses, budgets, and reporting'
    }
    
    # Service tags for discovery and routing
    service_tags = [
        'financial',
        'budgets',
        'expenses',
        'income',
        'reporting',
        'analytics',
        'api',
        'rest'
    ]
    
    # Register service
    success = consul_client.register_service(
        name=service_name,
        service_id=service_id,
        address=service_host,
        port=service_port,
        tags=service_tags,
        meta=service_meta,
        health_check_url=f'http://{service_host}:{service_port}{health_check_path}',
        health_check_interval=health_check_interval,
        health_check_timeout=health_check_timeout
    )
    
    if success:
        print(f"✓ Financial service registered successfully: {service_id}")
        print(f"  - Address: {service_host}:{service_port}")
        print(f"  - Health check: {health_check_path}")
    else:
        print(f"✗ Failed to register financial service: {service_id}")
    
    return success


def deregister_financial_service():
    """
    Deregister the financial management service from Consul
    """
    service_id = os.getenv('SERVICE_ID', f'financial-service-{socket.gethostname()}')
    
    consul_client = ConsulClient()
    success = consul_client.deregister_service(service_id)
    
    if success:
        print(f"✓ Financial service deregistered: {service_id}")
    else:
        print(f"✗ Failed to deregister financial service: {service_id}")
    
    return success


if __name__ == '__main__':
    register_financial_service()
