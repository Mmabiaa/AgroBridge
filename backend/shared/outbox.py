"""
Outbox Pattern Implementation
Ensures reliable message delivery using transactional outbox pattern
"""

import logging
import json
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from django.db import models, transaction
from django.utils import timezone
import uuid

logger = logging.getLogger(__name__)


class OutboxMessage(models.Model):
    """
    Outbox message model for storing events before publishing
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_type = models.CharField(max_length=255, db_index=True)
    aggregate_type = models.CharField(max_length=255)
    aggregate_id = models.CharField(max_length=255, db_index=True)
    payload = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    processed_at = models.DateTimeField(null=True, blank=True, db_index=True)
    retry_count = models.IntegerField(default=0)
    max_retries = models.IntegerField(default=3)
    error_message = models.TextField(null=True, blank=True)
    correlation_id = models.UUIDField(null=True, blank=True)
    
    class Meta:
        db_table = 'outbox_messages'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['processed_at', 'created_at']),
            models.Index(fields=['event_type', 'processed_at']),
        ]
    
    def __str__(self):
        return f"{self.event_type} - {self.aggregate_id}"
    
    def is_processed(self) -> bool:
        """Check if message has been processed"""
        return self.processed_at is not None
    
    def can_retry(self) -> bool:
        """Check if message can be retried"""
        return self.retry_count < self.max_retries
    
    def mark_processed(self):
        """Mark message as processed"""
        self.processed_at = timezone.now()
        self.save(update_fields=['processed_at'])
    
    def increment_retry(self, error: Optional[str] = None):
        """Increment retry count"""
        self.retry_count += 1
        if error:
            self.error_message = error
        self.save(update_fields=['retry_count', 'error_message'])


class OutboxPublisher:
    """
    Publishes messages from outbox to message broker
    """
    
    def __init__(self, event_publisher=None):
        """
        Initialize outbox publisher
        
        Args:
            event_publisher: Event publisher instance (from events.py)
        """
        self.event_publisher = event_publisher
    
    def save_to_outbox(
        self,
        event_type: str,
        aggregate_type: str,
        aggregate_id: str,
        payload: Dict[str, Any],
        correlation_id: Optional[str] = None,
        max_retries: int = 3
    ) -> OutboxMessage:
        """
        Save message to outbox within a transaction
        
        Args:
            event_type: Type of event
            aggregate_type: Type of aggregate (e.g., 'order', 'payment')
            aggregate_id: ID of the aggregate
            payload: Event payload
            correlation_id: Correlation ID for tracking
            max_retries: Maximum retry attempts
            
        Returns:
            OutboxMessage instance
        """
        message = OutboxMessage.objects.create(
            event_type=event_type,
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            payload=payload,
            correlation_id=correlation_id,
            max_retries=max_retries
        )
        
        logger.info(f"Saved message to outbox: {message.id} - {event_type}")
        return message
    
    def process_pending_messages(self, batch_size: int = 100):
        """
        Process pending messages from outbox
        
        Args:
            batch_size: Number of messages to process in one batch
        """
        # Get unprocessed messages
        messages = OutboxMessage.objects.filter(
            processed_at__isnull=True
        ).order_by('created_at')[:batch_size]
        
        processed_count = 0
        failed_count = 0
        
        for message in messages:
            try:
                self._publish_message(message)
                message.mark_processed()
                processed_count += 1
                
            except Exception as e:
                logger.error(f"Failed to publish message {message.id}: {e}")
                message.increment_retry(str(e))
                failed_count += 1
                
                if not message.can_retry():
                    logger.error(f"Message {message.id} exceeded max retries")
        
        logger.info(f"Processed {processed_count} messages, {failed_count} failed")
    
    def _publish_message(self, message: OutboxMessage):
        """
        Publish a single message to the event broker
        
        Args:
            message: OutboxMessage to publish
        """
        if self.event_publisher is None:
            # Import here to avoid circular dependency
            from .events import get_event_publisher, EventType
            self.event_publisher = get_event_publisher()
        
        # Convert event_type string to EventType enum
        from .events import EventType
        try:
            event_type = EventType(message.event_type)
        except ValueError:
            logger.error(f"Unknown event type: {message.event_type}")
            raise
        
        # Publish event
        self.event_publisher.publish(
            event_type=event_type,
            data=message.payload,
            service=message.aggregate_type,
            correlation_id=str(message.correlation_id) if message.correlation_id else None
        )
        
        logger.info(f"Published message {message.id} to event broker")
    
    def cleanup_old_messages(self, days: int = 7):
        """
        Clean up old processed messages
        
        Args:
            days: Number of days to keep processed messages
        """
        cutoff_date = timezone.now() - timedelta(days=days)
        
        deleted_count, _ = OutboxMessage.objects.filter(
            processed_at__isnull=False,
            processed_at__lt=cutoff_date
        ).delete()
        
        logger.info(f"Cleaned up {deleted_count} old outbox messages")
    
    def retry_failed_messages(self, batch_size: int = 50):
        """
        Retry failed messages that haven't exceeded max retries
        
        Args:
            batch_size: Number of messages to retry
        """
        messages = OutboxMessage.objects.filter(
            processed_at__isnull=True,
            retry_count__gt=0,
            retry_count__lt=models.F('max_retries')
        ).order_by('created_at')[:batch_size]
        
        retry_count = 0
        
        for message in messages:
            try:
                self._publish_message(message)
                message.mark_processed()
                retry_count += 1
                
            except Exception as e:
                logger.error(f"Retry failed for message {message.id}: {e}")
                message.increment_retry(str(e))
        
        logger.info(f"Retried {retry_count} failed messages")


class OutboxProcessor:
    """
    Background processor for outbox messages
    """
    
    def __init__(self, publisher: Optional[OutboxPublisher] = None):
        self.publisher = publisher or OutboxPublisher()
    
    def run(self, interval_seconds: int = 5, batch_size: int = 100):
        """
        Run outbox processor continuously
        
        Args:
            interval_seconds: Interval between processing runs
            batch_size: Number of messages to process per run
        """
        import time
        
        logger.info("Starting outbox processor")
        
        while True:
            try:
                # Process pending messages
                self.publisher.process_pending_messages(batch_size=batch_size)
                
                # Retry failed messages
                self.publisher.retry_failed_messages(batch_size=batch_size // 2)
                
                # Sleep before next run
                time.sleep(interval_seconds)
                
            except KeyboardInterrupt:
                logger.info("Outbox processor stopped")
                break
                
            except Exception as e:
                logger.error(f"Error in outbox processor: {e}")
                time.sleep(interval_seconds)


# Decorator for transactional outbox pattern
def with_outbox(event_type: str, aggregate_type: str):
    """
    Decorator to automatically save events to outbox
    
    Usage:
        @with_outbox(event_type="order.created", aggregate_type="order")
        def create_order(order_data):
            # Create order in database
            order = Order.objects.create(**order_data)
            return order
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Execute function within transaction
            with transaction.atomic():
                result = func(*args, **kwargs)
                
                # Save to outbox
                publisher = OutboxPublisher()
                
                # Extract aggregate_id from result
                aggregate_id = getattr(result, 'id', None) or str(uuid.uuid4())
                
                # Create payload from result
                if hasattr(result, '__dict__'):
                    payload = {k: v for k, v in result.__dict__.items() if not k.startswith('_')}
                else:
                    payload = {'result': str(result)}
                
                publisher.save_to_outbox(
                    event_type=event_type,
                    aggregate_type=aggregate_type,
                    aggregate_id=str(aggregate_id),
                    payload=payload
                )
                
                return result
        
        return wrapper
    return decorator


# Singleton publisher
_outbox_publisher = None


def get_outbox_publisher() -> OutboxPublisher:
    """Get singleton outbox publisher"""
    global _outbox_publisher
    if _outbox_publisher is None:
        _outbox_publisher = OutboxPublisher()
    return _outbox_publisher
