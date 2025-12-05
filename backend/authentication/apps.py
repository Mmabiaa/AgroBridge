from django.apps import AppConfig
import os
import logging

logger = logging.getLogger(__name__)


class AuthenticationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'authentication'
    
    def ready(self):
        """
        Called when Django starts up
        Register service with Consul if enabled
        """
        # Only register in production or when explicitly enabled
        register_consul = os.getenv('REGISTER_CONSUL', 'false').lower() == 'true'
        
        if register_consul:
            try:
                import sys
                sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                
                from shared.consul_client import ConsulClient, ServiceConfig, get_service_instance_id, get_local_ip
                
                service_host = os.getenv('SERVICE_HOST', get_local_ip())
                service_port = int(os.getenv('SERVICE_PORT', '8001'))
                consul_host = os.getenv('CONSUL_HOST', 'localhost')
                consul_port = int(os.getenv('CONSUL_PORT', '8500'))
                
                # Initialize Consul client
                consul_client = ConsulClient(host=consul_host, port=consul_port)
                
                # Create service configuration
                service_config = ServiceConfig(
                    name='authentication-service',
                    service_id=get_service_instance_id('authentication-service'),
                    host=service_host,
                    port=service_port,
                    tags=['authentication', 'auth', 'user-management', 'v1'],
                    meta={
                        'version': '1.0.0',
                        'environment': os.getenv('ENVIRONMENT', 'development'),
                        'framework': 'django',
                        'language': 'python'
                    },
                    health_check_path='/api/auth/health/',
                    health_check_interval='10s',
                    health_check_timeout='5s',
                    health_check_deregister_critical_after='30s'
                )
                
                # Register service
                success = consul_client.register_service(service_config)
                
                if success:
                    logger.info(f'✅ Authentication service registered with Consul: {service_config.service_id}')
                else:
                    logger.warning('⚠️  Failed to register authentication service with Consul')
                    
            except Exception as e:
                logger.error(f'❌ Error registering authentication service with Consul: {e}')
