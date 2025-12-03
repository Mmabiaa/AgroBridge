"""
Django management command to setup RabbitMQ exchanges and queues
"""

import logging
from django.core.management.base import BaseCommand
from shared.messaging.rabbitmq_config import get_rabbitmq_connection
import pika

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Setup RabbitMQ exchanges, queues, and bindings'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete existing queues and exchanges before setup',
        )

    def handle(self, *args, **options):
        reset = options.get('reset', False)
        
        self.stdout.write(self.style.SUCCESS('Setting up RabbitMQ infrastructure...'))
        
        try:
            # Connect to RabbitMQ
            connection = get_rabbitmq_connection()
            channel = connection.channel()
            
            # Define exchanges
            exchanges = [
                ('agrobridge.default', 'topic'),
                ('agrobridge.events', 'topic'),
                ('agrobridge.dlx', 'topic'),
            ]
            
            # Define queues with their routing keys
            queues = [
                # Regular queues
                ('default', 'agrobridge.default', 'task.default', {
                    'x-dead-letter-exchange': 'agrobridge.dlx',
                    'x-dead-letter-routing-key': 'dlq.default',
                    'x-message-ttl': 86400000,
                }),
                ('high_priority', 'agrobridge.default', 'task.high', {
                    'x-dead-letter-exchange': 'agrobridge.dlx',
                    'x-dead-letter-routing-key': 'dlq.high',
                    'x-max-priority': 10,
                }),
                ('email', 'agrobridge.default', 'task.email', {
                    'x-dead-letter-exchange': 'agrobridge.dlx',
                    'x-dead-letter-routing-key': 'dlq.email',
                }),
                ('image_processing', 'agrobridge.default', 'task.image', {
                    'x-dead-letter-exchange': 'agrobridge.dlx',
                    'x-dead-letter-routing-key': 'dlq.image',
                }),
                ('ai_processing', 'agrobridge.default', 'task.ai', {
                    'x-dead-letter-exchange': 'agrobridge.dlx',
                    'x-dead-letter-routing-key': 'dlq.ai',
                }),
                ('notifications', 'agrobridge.default', 'task.notification', {
                    'x-dead-letter-exchange': 'agrobridge.dlx',
                    'x-dead-letter-routing-key': 'dlq.notification',
                }),
                ('analytics', 'agrobridge.default', 'task.analytics', {
                    'x-dead-letter-exchange': 'agrobridge.dlx',
                    'x-dead-letter-routing-key': 'dlq.analytics',
                }),
                ('reports', 'agrobridge.default', 'task.report', {
                    'x-dead-letter-exchange': 'agrobridge.dlx',
                    'x-dead-letter-routing-key': 'dlq.report',
                }),
                
                # Dead letter queues
                ('dlq.default', 'agrobridge.dlx', 'dlq.default', {}),
                ('dlq.high', 'agrobridge.dlx', 'dlq.high', {}),
                ('dlq.email', 'agrobridge.dlx', 'dlq.email', {}),
                ('dlq.image', 'agrobridge.dlx', 'dlq.image', {}),
                ('dlq.ai', 'agrobridge.dlx', 'dlq.ai', {}),
                ('dlq.notification', 'agrobridge.dlx', 'dlq.notification', {}),
                ('dlq.analytics', 'agrobridge.dlx', 'dlq.analytics', {}),
                ('dlq.report', 'agrobridge.dlx', 'dlq.report', {}),
            ]
            
            # Reset if requested
            if reset:
                self.stdout.write(self.style.WARNING('Resetting RabbitMQ infrastructure...'))
                
                # Delete queues
                for queue_name, _, _, _ in queues:
                    try:
                        channel.queue_delete(queue=queue_name)
                        self.stdout.write(f'  Deleted queue: {queue_name}')
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(f'  Could not delete queue {queue_name}: {e}'))
                
                # Delete exchanges
                for exchange_name, _ in exchanges:
                    try:
                        channel.exchange_delete(exchange=exchange_name)
                        self.stdout.write(f'  Deleted exchange: {exchange_name}')
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(f'  Could not delete exchange {exchange_name}: {e}'))
            
            # Create exchanges
            self.stdout.write('\nCreating exchanges...')
            for exchange_name, exchange_type in exchanges:
                channel.exchange_declare(
                    exchange=exchange_name,
                    exchange_type=exchange_type,
                    durable=True,
                    auto_delete=False,
                )
                self.stdout.write(self.style.SUCCESS(f'  ✓ Exchange: {exchange_name} ({exchange_type})'))
            
            # Create queues and bindings
            self.stdout.write('\nCreating queues and bindings...')
            for queue_name, exchange_name, routing_key, arguments in queues:
                # Declare queue
                channel.queue_declare(
                    queue=queue_name,
                    durable=True,
                    arguments=arguments,
                )
                
                # Bind queue to exchange
                channel.queue_bind(
                    exchange=exchange_name,
                    queue=queue_name,
                    routing_key=routing_key,
                )
                
                self.stdout.write(self.style.SUCCESS(
                    f'  ✓ Queue: {queue_name} -> {exchange_name} ({routing_key})'
                ))
            
            # Close connection
            connection.close()
            
            self.stdout.write(self.style.SUCCESS('\n✅ RabbitMQ setup completed successfully!'))
            self.stdout.write('\nAccess RabbitMQ Management UI at: http://localhost:15672')
            self.stdout.write('Default credentials: agrobridge / agrobridge_password\n')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n❌ Error setting up RabbitMQ: {e}'))
            logger.error(f'RabbitMQ setup failed: {e}', exc_info=True)
            raise
