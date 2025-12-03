"""
Management command to register authentication service with Consul
"""

from django.core.management.base import BaseCommand
import sys
import os
import logging

# Add parent directory to path to import shared modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

from shared.consul_client import ConsulClient, ServiceConfig, get_service_instance_id, get_local_ip

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Register authentication service with Consul'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--host',
            type=str,
            default=os.getenv('SERVICE_HOST', get_local_ip()),
            help='Service host address'
        )
        parser.add_argument(
            '--port',
            type=int,
            default=int(os.getenv('SERVICE_PORT', '8001')),
            help='Service port'
        )
        parser.add_argument(
            '--consul-host',
            type=str,
            default=os.getenv('CONSUL_HOST', 'localhost'),
            help='Consul server host'
        )
        parser.add_argument(
            '--consul-port',
            type=int,
            default=int(os.getenv('CONSUL_PORT', '8500')),
            help='Consul server port'
        )
    
    def handle(self, *args, **options):
        service_host = options['host']
        service_port = options['port']
        consul_host = options['consul_host']
        consul_port = options['consul_port']
        
        self.stdout.write(self.style.SUCCESS(
            f'Registering authentication service at {service_host}:{service_port}'
        ))
        
        try:
            # Initialize Consul client
            consul_client = ConsulClient(host=consul_host, port=consul_port)
            
            # Check Consul health
            if not consul_client.health_check():
                self.stdout.write(self.style.ERROR(
                    f'Consul is not healthy at {consul_host}:{consul_port}'
                ))
                return
            
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
                self.stdout.write(self.style.SUCCESS(
                    f'✅ Successfully registered service: {service_config.service_id}'
                ))
                self.stdout.write(self.style.SUCCESS(
                    f'   Service Name: {service_config.name}'
                ))
                self.stdout.write(self.style.SUCCESS(
                    f'   Address: {service_config.host}:{service_config.port}'
                ))
                self.stdout.write(self.style.SUCCESS(
                    f'   Health Check: http://{service_config.host}:{service_config.port}{service_config.health_check_path}'
                ))
            else:
                self.stdout.write(self.style.ERROR(
                    '❌ Failed to register service with Consul'
                ))
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f'❌ Error registering service: {str(e)}'
            ))
            logger.error(f'Service registration error: {e}', exc_info=True)
