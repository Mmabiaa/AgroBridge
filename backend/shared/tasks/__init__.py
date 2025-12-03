"""
Shared Celery Tasks

Common tasks that can be used across all microservices.
"""

from .email_tasks import send_email, send_bulk_email
from .image_tasks import process_image, generate_thumbnail
from .notification_tasks import send_notification, send_push_notification

__all__ = [
    'send_email',
    'send_bulk_email',
    'process_image',
    'generate_thumbnail',
    'send_notification',
    'send_push_notification',
]
