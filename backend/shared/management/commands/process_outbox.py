"""
Management command to process outbox messages
"""

from django.core.management.base import BaseCommand
from shared.outbox import OutboxProcessor
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Process outbox messages and publish to event broker'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--interval',
            type=int,
            default=5,
            help='Interval between processing runs in seconds (default: 5)'
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=100,
            help='Number of messages to process per batch (default: 100)'
        )
    
    def handle(self, *args, **options):
        interval = options['interval']
        batch_size = options['batch_size']
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Starting outbox processor (interval: {interval}s, batch: {batch_size})'
            )
        )
        
        processor = OutboxProcessor()
        
        try:
            processor.run(interval_seconds=interval, batch_size=batch_size)
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('Outbox processor stopped'))
