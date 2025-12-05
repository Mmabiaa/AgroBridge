"""
Message Queue and Event Bus Infrastructure

This module provides RabbitMQ and Celery configuration for asynchronous
task processing and event-driven communication between microservices.
"""

from .celery_config import celery_app
from .rabbitmq_config import (
    get_rabbitmq_connection,
    publish_event,
    subscribe_to_events,
    RabbitMQPublisher,
    RabbitMQSubscriber,
)

__all__ = [
    'celery_app',
    'get_rabbitmq_connection',
    'publish_event',
    'subscribe_to_events',
    'RabbitMQPublisher',
    'RabbitMQSubscriber',
]
