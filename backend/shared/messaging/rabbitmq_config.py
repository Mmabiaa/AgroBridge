"""
RabbitMQ Configuration for Event-Driven Communication

This module provides RabbitMQ connection management and event publishing/subscribing
for inter-service communication.
"""

import os
import json
import logging
from typing import Dict, Any, Callable, Optional, List
from datetime import datetime
import pika
from pika.exceptions import AMQPConnectionError, AMQPChannelError

logger = logging.getLogger(__name__)

# RabbitMQ connection parameters
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
RABBITMQ_PORT = int(os.getenv('RABBITMQ_PORT', '5672'))
RABBITMQ_USER = os.getenv('RABBITMQ_USER', 'agrobridge')
RABBITMQ_PASSWORD = os.getenv('RABBITMQ_PASSWORD', 'agrobridge_password')
RABBITMQ_VHOST = os.getenv('RABBITMQ_VHOST', 'agrobridge')

# Connection pool settings
CONNECTION_POOL_SIZE = int(os.getenv('RABBITMQ_POOL_SIZE', '10'))
HEARTBEAT_INTERVAL = int(os.getenv('RABBITMQ_HEARTBEAT', '60'))
BLOCKED_CONNECTION_TIMEOUT = int(os.getenv('RABBITMQ_BLOCKED_TIMEOUT', '300'))


def get_rabbitmq_connection():
    """
    Create and return a RabbitMQ connection
    
    Returns:
        pika.BlockingConnection: RabbitMQ connection
    """
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
    
    parameters = pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        port=RABBITMQ_PORT,
        virtual_host=RABBITMQ_VHOST,
        credentials=credentials,
        heartbeat=HEARTBEAT_INTERVAL,
        blocked_connection_timeout=BLOCKED_CONNECTION_TIMEOUT,
        connection_attempts=3,
        retry_delay=2,
    )
    
    try:
        connection = pika.BlockingConnection(parameters)
        logger.info(f"Connected to RabbitMQ at {RABBITMQ_HOST}:{RABBITMQ_PORT}")
        return connection
    except AMQPConnectionError as e:
        logger.error(f"Failed to connect to RabbitMQ: {e}")
        raise


class RabbitMQPublisher:
    """
    RabbitMQ event publisher for inter-service communication
    """
    
    def __init__(self, exchange_name: str = 'agrobridge.events', exchange_type: str = 'topic'):
        """
        Initialize publisher
        
        Args:
            exchange_name: Name of the exchange
            exchange_type: Type of exchange (topic, direct, fanout)
        """
        self.exchange_name = exchange_name
        self.exchange_type = exchange_type
        self.connection = None
        self.channel = None
        self._connect()
    
    def _connect(self):
        """Establish connection and declare exchange"""
        try:
            self.connection = get_rabbitmq_connection()
            self.channel = self.connection.channel()
            
            # Declare exchange
            self.channel.exchange_declare(
                exchange=self.exchange_name,
                exchange_type=self.exchange_type,
                durable=True,
                auto_delete=False,
            )
            
            logger.info(f"Publisher connected to exchange: {self.exchange_name}")
        except Exception as e:
            logger.error(f"Failed to initialize publisher: {e}")
            raise
    
    def publish_event(
        self,
        event_type: str,
        data: Dict[str, Any],
        routing_key: Optional[str] = None,
        priority: int = 0,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Publish an event to the exchange
        
        Args:
            event_type: Type of event (e.g., 'user.registered', 'order.placed')
            data: Event data payload
            routing_key: Routing key (defaults to event_type)
            priority: Message priority (0-10)
            metadata: Additional metadata
            
        Returns:
            bool: True if published successfully
        """
        if routing_key is None:
            routing_key = event_type
        
        # Construct event message
        event = {
            'event_type': event_type,
            'timestamp': datetime.utcnow().isoformat(),
            'data': data,
            'metadata': metadata or {},
        }
        
        try:
            # Ensure connection is alive
            if self.connection is None or self.connection.is_closed:
                self._connect()
            
            # Publish message
            self.channel.basic_publish(
                exchange=self.exchange_name,
                routing_key=routing_key,
                body=json.dumps(event),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Persistent
                    content_type='application/json',
                    priority=priority,
                    timestamp=int(datetime.utcnow().timestamp()),
                ),
            )
            
            logger.info(f"Published event: {event_type} with routing key: {routing_key}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to publish event {event_type}: {e}")
            return False
    
    def close(self):
        """Close connection"""
        if self.connection and not self.connection.is_closed:
            self.connection.close()
            logger.info("Publisher connection closed")


class RabbitMQSubscriber:
    """
    RabbitMQ event subscriber for consuming events
    """
    
    def __init__(
        self,
        exchange_name: str = 'agrobridge.events',
        queue_name: Optional[str] = None,
        routing_keys: Optional[List[str]] = None,
    ):
        """
        Initialize subscriber
        
        Args:
            exchange_name: Name of the exchange to subscribe to
            queue_name: Name of the queue (auto-generated if None)
            routing_keys: List of routing keys to bind (subscribes to all if None)
        """
        self.exchange_name = exchange_name
        self.queue_name = queue_name
        self.routing_keys = routing_keys or ['#']  # Subscribe to all by default
        self.connection = None
        self.channel = None
        self.callbacks = {}
    
    def _connect(self):
        """Establish connection and declare queue"""
        try:
            self.connection = get_rabbitmq_connection()
            self.channel = self.connection.channel()
            
            # Declare exchange
            self.channel.exchange_declare(
                exchange=self.exchange_name,
                exchange_type='topic',
                durable=True,
            )
            
            # Declare queue
            if self.queue_name:
                self.channel.queue_declare(
                    queue=self.queue_name,
                    durable=True,
                    arguments={
                        'x-message-ttl': 86400000,  # 24 hours
                    }
                )
            else:
                # Auto-generated exclusive queue
                result = self.channel.queue_declare(queue='', exclusive=True)
                self.queue_name = result.method.queue
            
            # Bind queue to exchange with routing keys
            for routing_key in self.routing_keys:
                self.channel.queue_bind(
                    exchange=self.exchange_name,
                    queue=self.queue_name,
                    routing_key=routing_key,
                )
            
            logger.info(f"Subscriber connected to queue: {self.queue_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize subscriber: {e}")
            raise
    
    def register_callback(self, event_type: str, callback: Callable):
        """
        Register a callback function for an event type
        
        Args:
            event_type: Event type to listen for
            callback: Function to call when event is received
        """
        self.callbacks[event_type] = callback
        logger.info(f"Registered callback for event type: {event_type}")
    
    def _handle_message(self, ch, method, properties, body):
        """Internal message handler"""
        try:
            # Parse event
            event = json.loads(body)
            event_type = event.get('event_type')
            
            logger.info(f"Received event: {event_type}")
            
            # Call registered callback
            if event_type in self.callbacks:
                callback = self.callbacks[event_type]
                callback(event)
                ch.basic_ack(delivery_tag=method.delivery_tag)
            else:
                logger.warning(f"No callback registered for event type: {event_type}")
                ch.basic_ack(delivery_tag=method.delivery_tag)
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse event message: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        except Exception as e:
            logger.error(f"Error processing event: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
    
    def start_consuming(self):
        """Start consuming messages"""
        try:
            if self.connection is None or self.connection.is_closed:
                self._connect()
            
            # Set QoS
            self.channel.basic_qos(prefetch_count=10)
            
            # Start consuming
            self.channel.basic_consume(
                queue=self.queue_name,
                on_message_callback=self._handle_message,
                auto_ack=False,
            )
            
            logger.info(f"Started consuming from queue: {self.queue_name}")
            self.channel.start_consuming()
            
        except KeyboardInterrupt:
            logger.info("Stopping consumer...")
            self.stop_consuming()
        except Exception as e:
            logger.error(f"Error in consumer: {e}")
            raise
    
    def stop_consuming(self):
        """Stop consuming messages"""
        if self.channel:
            self.channel.stop_consuming()
        self.close()
    
    def close(self):
        """Close connection"""
        if self.connection and not self.connection.is_closed:
            self.connection.close()
            logger.info("Subscriber connection closed")


# Convenience functions
def publish_event(
    event_type: str,
    data: Dict[str, Any],
    exchange_name: str = 'agrobridge.events',
    routing_key: Optional[str] = None,
    priority: int = 0,
    metadata: Optional[Dict[str, Any]] = None,
) -> bool:
    """
    Publish an event (convenience function)
    
    Args:
        event_type: Type of event
        data: Event data
        exchange_name: Exchange to publish to
        routing_key: Routing key
        priority: Message priority
        metadata: Additional metadata
        
    Returns:
        bool: True if published successfully
    """
    publisher = RabbitMQPublisher(exchange_name=exchange_name)
    try:
        return publisher.publish_event(
            event_type=event_type,
            data=data,
            routing_key=routing_key,
            priority=priority,
            metadata=metadata,
        )
    finally:
        publisher.close()


def subscribe_to_events(
    event_handlers: Dict[str, Callable],
    exchange_name: str = 'agrobridge.events',
    queue_name: Optional[str] = None,
    routing_keys: Optional[List[str]] = None,
):
    """
    Subscribe to events (convenience function)
    
    Args:
        event_handlers: Dictionary mapping event types to handler functions
        exchange_name: Exchange to subscribe to
        queue_name: Queue name
        routing_keys: Routing keys to bind
    """
    subscriber = RabbitMQSubscriber(
        exchange_name=exchange_name,
        queue_name=queue_name,
        routing_keys=routing_keys,
    )
    
    # Register all handlers
    for event_type, handler in event_handlers.items():
        subscriber.register_callback(event_type, handler)
    
    # Start consuming
    subscriber.start_consuming()
