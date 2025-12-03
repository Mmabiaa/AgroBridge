"""
Event subscriber for consuming events from message queue
"""
import json
import logging
from typing import Callable, Dict, Any

logger = logging.getLogger(__name__)


class EventSubscriber:
    """
    Subscribes to events from the message queue
    """
    
    def __init__(self, service_name: str):
        self.service_name = service_name
        self.handlers: Dict[str, Callable] = {}
        # TODO: Initialize RabbitMQ/Kafka connection
        self.connection = None
    
    def subscribe(self, event_type: str, handler: Callable[[Dict[str, Any]], None]):
        """
        Subscribe to an event type with a handler function
        
        Args:
            event_type: Type of event to subscribe to
            handler: Function to call when event is received
        """
        self.handlers[event_type] = handler
        logger.info(f"Subscribed to event: {event_type}")
        # TODO: Implement actual subscription
    
    def handle_event(self, event: Dict[str, Any]):
        """
        Handle an incoming event
        
        Args:
            event: Event data
        """
        event_type = event.get('event_type')
        handler = self.handlers.get(event_type)
        
        if handler:
            try:
                handler(event)
                logger.info(f"Handled event: {event_type}")
            except Exception as e:
                logger.error(f"Error handling event: {event_type}", exc_info=True)
        else:
            logger.warning(f"No handler for event type: {event_type}")
    
    def start(self):
        """Start listening for events"""
        logger.info(f"Starting event subscriber for {self.service_name}")
        # TODO: Implement actual event listening
    
    def stop(self):
        """Stop listening for events"""
        if self.connection:
            self.connection.close()
        logger.info(f"Stopped event subscriber for {self.service_name}")
