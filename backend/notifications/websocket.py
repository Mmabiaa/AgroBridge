"""
WebSocket Notification Delivery

This module handles real-time notification delivery via WebSocket connections
using Django Channels.
"""

import json
import logging
from typing import Dict, Any
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
from .models import Notification

User = get_user_model()
logger = logging.getLogger(__name__)


def send_websocket_notification(notification: Notification) -> bool:
    """
    Send notification via WebSocket to user
    
    Args:
        notification: Notification to send
        
    Returns:
        True if sent successfully
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.error("No channel layer configured")
            return False
        
        # Create notification payload
        payload = {
            'type': 'notification_message',
            'notification': {
                'id': str(notification.id),
                'title': notification.title,
                'message': notification.message,
                'notification_type': notification.notification_type,
                'priority': notification.priority,
                'data': notification.data,
                'action_url': notification.action_url,
                'created_at': notification.created_at.isoformat(),
            }
        }
        
        # Send to user's group
        group_name = f"user_{notification.user.id}"
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            payload
        )
        
        logger.info(f"Sent WebSocket notification {notification.id} to user {notification.user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send WebSocket notification {notification.id}: {e}")
        return False


def send_websocket_message(user_id: str, message_type: str, data: Dict[str, Any]) -> bool:
    """
    Send custom WebSocket message to user
    
    Args:
        user_id: Target user ID
        message_type: Type of message
        data: Message data
        
    Returns:
        True if sent successfully
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.error("No channel layer configured")
            return False
        
        payload = {
            'type': 'custom_message',
            'message_type': message_type,
            'data': data
        }
        
        group_name = f"user_{user_id}"
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            payload
        )
        
        logger.info(f"Sent WebSocket message {message_type} to user {user_id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send WebSocket message to user {user_id}: {e}")
        return False


def broadcast_notification(notification_data: Dict[str, Any], user_ids: list = None) -> bool:
    """
    Broadcast notification to multiple users or all connected users
    
    Args:
        notification_data: Notification data to broadcast
        user_ids: List of user IDs (None for all users)
        
    Returns:
        True if broadcast successfully
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.error("No channel layer configured")
            return False
        
        payload = {
            'type': 'broadcast_message',
            'notification': notification_data
        }
        
        if user_ids:
            # Send to specific users
            for user_id in user_ids:
                group_name = f"user_{user_id}"
                async_to_sync(channel_layer.group_send)(group_name, payload)
        else:
            # Broadcast to all users
            async_to_sync(channel_layer.group_send)("notifications", payload)
        
        logger.info(f"Broadcast notification to {len(user_ids) if user_ids else 'all'} users")
        return True
        
    except Exception as e:
        logger.error(f"Failed to broadcast notification: {e}")
        return False