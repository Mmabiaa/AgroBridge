"""
Event-Driven Communication Infrastructure
Provides event publishing and consumption capabilities for all services
"""

import json
import logging
from typing import Dict, Any, Optional, Callable, List
from datetime import datetime
from enum import Enum
import pika
from pika.exceptions import AMQPConnectionError
from django.conf import settings
from dataclasses import dataclass, asdict
import uuid

logger = logging.getLogger(__name__)


class EventType(Enum):
    """Standard event types across all services"""
    # User events
    USER_REGISTERED = "user.registered"
    USER_UPDATED = "user.updated"
    USER_DELETED = "user.deleted"
    
    # Order events
    ORDER_CREATED = "order.created"
    ORDER_CONFIRMED = "order.confirmed"
    ORDER_CANCELLED = "order.cancelled"
    ORDER_COMPLETED = "order.completed"
    
    # Payment events
    PAYMENT_INITIATED = "payment.initiated"
    PAYMENT_COMPLETED = "payment.completed"
    PAYMENT_FAILED = "payment.failed"
    PAYMENT_REFUNDED = "payment.refunded"
    
    # Inventory events
    INVENTORY_RESERVED = "inventory.reserved"
    INVENTORY_RELEASED = "inventory.released"
    INVENTORY_UPDATED = "inventory.updated"
    
    # Notification events
    NOTIFICATION_SENT = "notification.sent"
    NOTIFICATION_FAILED = "notification.failed"
    
    # Farm events
    FARM_CREATED = "farm.created"
    FARM_UPDATED = "farm.updated"
    CROP_PLANTED = "crop.planted"
    HARVEST_RECORDED = "harvest.recorded"
    
    # IoT events
    SENSOR_READING = "sensor.reading"
    ALERT_TRIGGERED = "alert.triggered"
    DEVICE_REGISTERED = "device.registered"
    
    # Emergency events
    EMERGENCY_ALERT = "emergency.alert"
    INCIDENT_REPORTED = "incident.reported"


@dataclass
class Event:
    """Base event structure"""
    event_id: str
    event_type: str
    timestamp: str
    service: str
    data: Dict[str, Any]
    correlation_id: Optional[str] = None
    causation_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary"""
        return asdict(self)
    
    def to_json(self) -> str:
        """Convert event to JSON string"""
        return json.dumps(self.to_dict())
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Event':
        """Create event from dictionary"""
        return cls(**data)
    
    @classmethod
    def from_json(cls, json_str: str) -> 'Event':
        """Create event from JSON string"""
        return cls.from_dict(json.loads(json_str))


class EventPublisher:
    """
    Event publisher for publishing events to RabbitMQ
    """
    
    def __init__(self):
        self.connection = None
        self.channel = None
        self.exchange_name = getattr(settings, 'RABBITMQ_EXCHANGE', 'agrobridge.events')
        self._connect()
    
    def _connect(self):
        """Establish connection to RabbitMQ"""
        try:
            rabbitmq_host = getattr(settings, 'RABBITMQ_HOST', 'localhost')
            rabbitmq_port = getattr(settings, 'RABBITMQ_PORT', 5672)
            rabbitmq_user = getattr(settings, 'RABBITMQ_USER', 'guest')
            rabbitmq_pass = getattr(settings, 'RABBITMQ_PASSWORD', 'guest')
            
            credentials = pika.PlainCredentials(rabbitmq_user, rabbitmq_pass)
            parameters = pika.ConnectionParameters(
                host=rabbitmq_host,
                port=rabbitmq_port,
                credentials=credentials,
                heartbeat=600,
                blocked_connection_timeout=300
            )
            
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()
            
            # Declare exchange
            self.channel.exchange_declare(
                exchange=self.exchange_name,
                exchange_type='topic',
                durable=True
            )
            
            logger.info(f"Connected to RabbitMQ at {rabbitmq_host}:{rabbitmq_port}")
            
        except AMQPConnectionError as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise
    
    def publish(
        self,
        event_type: EventType,
        data: Dict[str, Any],
        service: str,
        correlation_id: Optional[str] = None,
        causation_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Publish an event
        
        Args:
            event_type: Type of event
            data: Event data
            service: Service publishing the event
            correlation_id: Correlation ID for tracking related events
            causation_id: ID of the event that caused this event
            metadata: Additional metadata
            
        Returns:
            Event ID
        """
        try:
            # Ensure connection is alive
            if not self.connection or self.connection.is_closed:
                self._connect()
            
            # Create event
            event = Event(
                event_id=str(uuid.uuid4()),
                event_type=event_type.value,
                timestamp=datetime.utcnow().isoformat(),
                service=service,
                data=data,
                correlation_id=correlation_id or str(uuid.uuid4()),
                causation_id=causation_id,
                metadata=metadata or {}
            )
            
            # Publish to exchange with routing key
            routing_key = event_type.value
            self.channel.basic_publish(
                exchange=self.exchange_name,
                routing_key=routing_key,
                body=event.to_json(),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Persistent
                    content_type='application/json',
                    correlation_id=event.correlation_id,
                    message_id=event.event_id,
                    timestamp=int(datetime.utcnow().timestamp())
                )
            )
            
            logger.info(f"Published event {event.event_id}: {event_type.value}")
            return event.event_id
            
        except Exception as e:
            logger.error(f"Failed to publish event: {e}")
            raise
    
    def close(self):
        """Close connection"""
        if self.connection and not self.connection.is_closed:
            self.connection.close()
            logger.info("Closed RabbitMQ connection")


class EventConsumer:
    """
    Event consumer for consuming events from RabbitMQ
    """
    
    def __init__(self, service_name: str):
        self.service_name = service_name
        self.connection = None
        self.channel = None
        self.exchange_name = getattr(settings, 'RABBITMQ_EXCHANGE', 'agrobridge.events')
        self.handlers: Dict[str, List[Callable]] = {}
        self._connect()
    
    def _connect(self):
        """Establish connection to RabbitMQ"""
        try:
            rabbitmq_host = getattr(settings, 'RABBITMQ_HOST', 'localhost')
            rabbitmq_port = getattr(settings, 'RABBITMQ_PORT', 5672)
            rabbitmq_user = getattr(settings, 'RABBITMQ_USER', 'guest')
            rabbitmq_pass = getattr(settings, 'RABBITMQ_PASSWORD', 'guest')
            
            credentials = pika.PlainCredentials(rabbitmq_user, rabbitmq_pass)
            parameters = pika.ConnectionParameters(
                host=rabbitmq_host,
                port=rabbitmq_port,
                credentials=credentials,
                heartbeat=600,
                blocked_connection_timeout=300
            )
            
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()
            
            # Declare exchange
            self.channel.exchange_declare(
                exchange=self.exchange_name,
                exchange_type='topic',
                durable=True
            )
            
            logger.info(f"Consumer connected to RabbitMQ at {rabbitmq_host}:{rabbitmq_port}")
            
        except AMQPConnectionError as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise
    
    def subscribe(self, event_type: EventType, handler: Callable[[Event], None]):
        """
        Subscribe to an event type
        
        Args:
            event_type: Type of event to subscribe to
            handler: Handler function to process the event
        """
        event_type_str = event_type.value
        
        if event_type_str not in self.handlers:
            self.handlers[event_type_str] = []
        
        self.handlers[event_type_str].append(handler)
        logger.info(f"Subscribed to {event_type_str}")
    
    def start_consuming(self):
        """Start consuming events"""
        try:
            # Create queue for this service
            queue_name = f"{self.service_name}.events"
            self.channel.queue_declare(queue=queue_name, durable=True)
            
            # Bind queue to exchange for subscribed event types
            for event_type in self.handlers.keys():
                self.channel.queue_bind(
                    exchange=self.exchange_name,
                    queue=queue_name,
                    routing_key=event_type
                )
                logger.info(f"Bound queue {queue_name} to {event_type}")
            
            # Set up consumer
            self.channel.basic_qos(prefetch_count=1)
            self.channel.basic_consume(
                queue=queue_name,
                on_message_callback=self._on_message
            )
            
            logger.info(f"Started consuming events for {self.service_name}")
            self.channel.start_consuming()
            
        except Exception as e:
            logger.error(f"Error consuming events: {e}")
            raise
    
    def _on_message(self, channel, method, properties, body):
        """Handle incoming message"""
        try:
            # Parse event
            event = Event.from_json(body.decode())
            
            # Get handlers for this event type
            handlers = self.handlers.get(event.event_type, [])
            
            # Execute handlers
            for handler in handlers:
                try:
                    handler(event)
                except Exception as e:
                    logger.error(f"Error in event handler: {e}")
            
            # Acknowledge message
            channel.basic_ack(delivery_tag=method.delivery_tag)
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            # Reject and requeue message
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
    
    def close(self):
        """Close connection"""
        if self.connection and not self.connection.is_closed:
            self.connection.close()
            logger.info("Closed consumer connection")


# Singleton instances
_publisher = None
_consumers = {}


def get_event_publisher() -> EventPublisher:
    """Get singleton event publisher"""
    global _publisher
    if _publisher is None:
        _publisher = EventPublisher()
    return _publisher


def get_event_consumer(service_name: str) -> EventConsumer:
    """Get event consumer for service"""
    global _consumers
    if service_name not in _consumers:
        _consumers[service_name] = EventConsumer(service_name)
    return _consumers[service_name]


def publish_event(
    event_type: EventType,
    data: Dict[str, Any],
    service: str,
    correlation_id: Optional[str] = None,
    causation_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> str:
    """
    Convenience function to publish an event
    
    Args:
        event_type: Type of event
        data: Event data
        service: Service publishing the event
        correlation_id: Correlation ID for tracking related events
        causation_id: ID of the event that caused this event
        metadata: Additional metadata
        
    Returns:
        Event ID
    """
    publisher = get_event_publisher()
    return publisher.publish(
        event_type=event_type,
        data=data,
        service=service,
        correlation_id=correlation_id,
        causation_id=causation_id,
        metadata=metadata
    )
