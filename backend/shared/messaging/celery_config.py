"""
Celery Configuration for Async Task Processing

This module configures Celery for distributed task processing across
all microservices with RabbitMQ as the message broker.
"""

import os
from celery import Celery
from kombu import Exchange, Queue

# Get configuration from environment
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
RABBITMQ_PORT = os.getenv('RABBITMQ_PORT', '5672')
RABBITMQ_USER = os.getenv('RABBITMQ_USER', 'agrobridge')
RABBITMQ_PASSWORD = os.getenv('RABBITMQ_PASSWORD', 'agrobridge_password')
RABBITMQ_VHOST = os.getenv('RABBITMQ_VHOST', 'agrobridge')

# Construct broker URL
BROKER_URL = f'amqp://{RABBITMQ_USER}:{RABBITMQ_PASSWORD}@{RABBITMQ_HOST}:{RABBITMQ_PORT}/{RABBITMQ_VHOST}'

# Result backend (using Redis)
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = os.getenv('REDIS_PORT', '6379')
REDIS_DB = os.getenv('CELERY_REDIS_DB', '1')
RESULT_BACKEND = f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}'

# Create Celery app
celery_app = Celery('agrobridge')

# Configure Celery
celery_app.conf.update(
    # Broker settings
    broker_url=BROKER_URL,
    result_backend=RESULT_BACKEND,
    
    # Task settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Task execution settings
    task_acks_late=True,  # Acknowledge after task completion
    task_reject_on_worker_lost=True,  # Reject task if worker dies
    task_track_started=True,  # Track when task starts
    task_time_limit=300,  # 5 minutes hard limit
    task_soft_time_limit=240,  # 4 minutes soft limit
    
    # Retry settings
    task_default_retry_delay=60,  # 1 minute
    task_max_retries=3,
    
    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    result_persistent=True,
    
    # Worker settings
    worker_prefetch_multiplier=4,  # Number of tasks to prefetch
    worker_max_tasks_per_child=1000,  # Restart worker after 1000 tasks
    worker_disable_rate_limits=False,
    
    # Monitoring
    worker_send_task_events=True,
    task_send_sent_event=True,
    
    # Dead letter queue settings
    task_reject_on_worker_lost=True,
    task_acks_on_failure_or_timeout=True,
)

# Define exchanges
default_exchange = Exchange('agrobridge.default', type='topic', durable=True)
events_exchange = Exchange('agrobridge.events', type='topic', durable=True)
dlx_exchange = Exchange('agrobridge.dlx', type='topic', durable=True)

# Define queues with dead letter exchange
celery_app.conf.task_queues = (
    # Default queue
    Queue(
        'default',
        exchange=default_exchange,
        routing_key='task.default',
        queue_arguments={
            'x-dead-letter-exchange': 'agrobridge.dlx',
            'x-dead-letter-routing-key': 'dlq.default',
            'x-message-ttl': 86400000,  # 24 hours
        }
    ),
    
    # High priority queue
    Queue(
        'high_priority',
        exchange=default_exchange,
        routing_key='task.high',
        queue_arguments={
            'x-dead-letter-exchange': 'agrobridge.dlx',
            'x-dead-letter-routing-key': 'dlq.high',
            'x-max-priority': 10,
        }
    ),
    
    # Service-specific queues
    Queue(
        'email',
        exchange=default_exchange,
        routing_key='task.email',
        queue_arguments={
            'x-dead-letter-exchange': 'agrobridge.dlx',
            'x-dead-letter-routing-key': 'dlq.email',
        }
    ),
    
    Queue(
        'image_processing',
        exchange=default_exchange,
        routing_key='task.image',
        queue_arguments={
            'x-dead-letter-exchange': 'agrobridge.dlx',
            'x-dead-letter-routing-key': 'dlq.image',
        }
    ),
    
    Queue(
        'ai_processing',
        exchange=default_exchange,
        routing_key='task.ai',
        queue_arguments={
            'x-dead-letter-exchange': 'agrobridge.dlx',
            'x-dead-letter-routing-key': 'dlq.ai',
        }
    ),
    
    Queue(
        'notifications',
        exchange=default_exchange,
        routing_key='task.notification',
        queue_arguments={
            'x-dead-letter-exchange': 'agrobridge.dlx',
            'x-dead-letter-routing-key': 'dlq.notification',
        }
    ),
    
    Queue(
        'analytics',
        exchange=default_exchange,
        routing_key='task.analytics',
        queue_arguments={
            'x-dead-letter-exchange': 'agrobridge.dlx',
            'x-dead-letter-routing-key': 'dlq.analytics',
        }
    ),
    
    Queue(
        'reports',
        exchange=default_exchange,
        routing_key='task.report',
        queue_arguments={
            'x-dead-letter-exchange': 'agrobridge.dlx',
            'x-dead-letter-routing-key': 'dlq.report',
        }
    ),
    
    # Dead letter queues
    Queue(
        'dlq.default',
        exchange=dlx_exchange,
        routing_key='dlq.default',
        durable=True,
    ),
    
    Queue(
        'dlq.high',
        exchange=dlx_exchange,
        routing_key='dlq.high',
        durable=True,
    ),
    
    Queue(
        'dlq.email',
        exchange=dlx_exchange,
        routing_key='dlq.email',
        durable=True,
    ),
    
    Queue(
        'dlq.image',
        exchange=dlx_exchange,
        routing_key='dlq.image',
        durable=True,
    ),
    
    Queue(
        'dlq.ai',
        exchange=dlx_exchange,
        routing_key='dlq.ai',
        durable=True,
    ),
    
    Queue(
        'dlq.notification',
        exchange=dlx_exchange,
        routing_key='dlq.notification',
        durable=True,
    ),
    
    Queue(
        'dlq.analytics',
        exchange=dlx_exchange,
        routing_key='dlq.analytics',
        durable=True,
    ),
    
    Queue(
        'dlq.report',
        exchange=dlx_exchange,
        routing_key='dlq.report',
        durable=True,
    ),
)

# Task routing
celery_app.conf.task_routes = {
    # Email tasks
    'shared.tasks.email.*': {'queue': 'email'},
    '*.tasks.send_email': {'queue': 'email'},
    
    # Image processing tasks
    'shared.tasks.image.*': {'queue': 'image_processing'},
    '*.tasks.process_image': {'queue': 'image_processing'},
    '*.tasks.generate_thumbnail': {'queue': 'image_processing'},
    
    # AI tasks
    'ai_assistant.tasks.*': {'queue': 'ai_processing'},
    'crop_detection.tasks.*': {'queue': 'ai_processing'},
    
    # Notification tasks
    'notifications.tasks.*': {'queue': 'notifications'},
    '*.tasks.send_notification': {'queue': 'notifications'},
    
    # Analytics tasks
    'analytics.tasks.*': {'queue': 'analytics'},
    '*.tasks.calculate_metrics': {'queue': 'analytics'},
    
    # Report generation tasks
    '*.tasks.generate_report': {'queue': 'reports'},
    '*.tasks.export_data': {'queue': 'reports'},
    
    # High priority tasks
    '*.tasks.emergency_alert': {'queue': 'high_priority'},
    '*.tasks.critical_notification': {'queue': 'high_priority'},
}

# Auto-discover tasks from all installed apps
celery_app.autodiscover_tasks()


def get_celery_app():
    """Get configured Celery app instance"""
    return celery_app
