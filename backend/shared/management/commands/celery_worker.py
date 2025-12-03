"""
Django management command to start Celery worker
"""

import sys
from django.core.management.base import BaseCommand
from shared.messaging.celery_config import celery_app


class Command(BaseCommand):
    help = 'Start Celery worker for async task processing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--queue',
            type=str,
            default='default',
            help='Queue name to consume from (default, email, image_processing, etc.)',
        )
        parser.add_argument(
            '--concurrency',
            type=int,
            default=4,
            help='Number of concurrent worker processes',
        )
        parser.add_argument(
            '--loglevel',
            type=str,
            default='info',
            choices=['debug', 'info', 'warning', 'error', 'critical'],
            help='Logging level',
        )
        parser.add_argument(
            '--autoscale',
            type=str,
            help='Autoscale workers (format: max,min)',
        )

    def handle(self, *args, **options):
        queue = options['queue']
        concurrency = options['concurrency']
        loglevel = options['loglevel']
        autoscale = options.get('autoscale')
        
        self.stdout.write(self.style.SUCCESS(f'Starting Celery worker for queue: {queue}'))
        
        # Build worker arguments
        worker_args = [
            'worker',
            f'--queues={queue}',
            f'--loglevel={loglevel}',
            '--without-gossip',
            '--without-mingle',
            '--without-heartbeat',
        ]
        
        if autoscale:
            worker_args.append(f'--autoscale={autoscale}')
        else:
            worker_args.append(f'--concurrency={concurrency}')
        
        # Start worker
        celery_app.worker_main(argv=['celery'] + worker_args)
