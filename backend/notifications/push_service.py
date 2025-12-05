"""
Push Notification Service

This module handles push notification delivery via Firebase Cloud Messaging (FCM).
"""

import json
import logging
from typing import List, Dict, Any, Optional
import requests
from django.conf import settings
from .models import Notification

logger = logging.getLogger(__name__)

# FCM configuration
FCM_SERVER_KEY = getattr(settings, 'FCM_SERVER_KEY', None)
FCM_URL = 'https://fcm.googleapis.com/fcm/send'


class FCMService:
    """Firebase Cloud Messaging service"""
    
    def __init__(self):
        self.server_key = FCM_SERVER_KEY
        if not self.server_key:
            logger.warning("FCM_SERVER_KEY not configured")
    
    def send_to_tokens(
        self,
        tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        priority: str = 'normal',
        sound: str = 'default',
        badge: Optional[int] = None,
        click_action: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Send push notification to multiple FCM tokens
        
        Args:
            tokens: List of FCM tokens
            title: Notification title
            body: Notification body
            data: Custom data payload
            priority: Message priority ('normal' or 'high')
            sound: Notification sound
            badge: Badge count for iOS
            click_action: Action when notification is clicked
            
        Returns:
            FCM response data
        """
        if not self.server_key:
            raise ValueError("FCM server key not configured")
        
        if not tokens:
            raise ValueError("No FCM tokens provided")
        
        # Prepare notification payload
        notification_payload = {
            'title': title,
            'body': body,
            'sound': sound,
        }
        
        if click_action:
            notification_payload['click_action'] = click_action
        
        # Prepare message payload
        message = {
            'registration_ids': tokens,
            'notification': notification_payload,
            'priority': priority,
        }
        
        # Add custom data if provided
        if data:
            message['data'] = {k: str(v) for k, v in data.items()}
        
        # Add iOS-specific settings
        message['apns'] = {
            'payload': {
                'aps': {
                    'sound': sound,
                }
            }
        }
        
        if badge is not None:
            message['apns']['payload']['aps']['badge'] = badge
        
        # Add Android-specific settings
        message['android'] = {
            'priority': priority,
            'notification': {
                'sound': sound,
                'click_action': click_action or 'FLUTTER_NOTIFICATION_CLICK',
            }
        }
        
        # Send request to FCM
        headers = {
            'Authorization': f'key={self.server_key}',
            'Content-Type': 'application/json',
        }
        
        try:
            response = requests.post(
                FCM_URL,
                headers=headers,
                data=json.dumps(message),
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            logger.info(f"FCM response: {result}")
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"FCM request failed: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"FCM response parsing failed: {e}")
            raise
    
    def send_to_topic(
        self,
        topic: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        priority: str = 'normal',
    ) -> Dict[str, Any]:
        """
        Send push notification to FCM topic
        
        Args:
            topic: FCM topic name
            title: Notification title
            body: Notification body
            data: Custom data payload
            priority: Message priority
            
        Returns:
            FCM response data
        """
        if not self.server_key:
            raise ValueError("FCM server key not configured")
        
        message = {
            'to': f'/topics/{topic}',
            'notification': {
                'title': title,
                'body': body,
            },
            'priority': priority,
        }
        
        if data:
            message['data'] = {k: str(v) for k, v in data.items()}
        
        headers = {
            'Authorization': f'key={self.server_key}',
            'Content-Type': 'application/json',
        }
        
        try:
            response = requests.post(
                FCM_URL,
                headers=headers,
                data=json.dumps(message),
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            logger.info(f"FCM topic response: {result}")
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"FCM topic request failed: {e}")
            raise


def send_push_notification(notification: Notification, fcm_tokens: List[str]) -> bool:
    """
    Send push notification for a Notification instance
    
    Args:
        notification: Notification to send
        fcm_tokens: List of FCM tokens for the user
        
    Returns:
        True if sent successfully
    """
    if not fcm_tokens:
        logger.warning(f"No FCM tokens for notification {notification.id}")
        return False
    
    try:
        fcm_service = FCMService()
        
        # Determine priority
        priority = 'high' if notification.priority >= 8 else 'normal'
        
        # Prepare data payload
        data = {
            'notification_id': str(notification.id),
            'notification_type': notification.notification_type,
            'priority': str(notification.priority),
            'created_at': notification.created_at.isoformat(),
        }
        
        # Add custom data
        if notification.data:
            data.update(notification.data)
        
        # Add action URL if present
        click_action = None
        if notification.action_url:
            data['action_url'] = notification.action_url
            click_action = 'FLUTTER_NOTIFICATION_CLICK'
        
        # Send notification
        result = fcm_service.send_to_tokens(
            tokens=fcm_tokens,
            title=notification.title,
            body=notification.message,
            data=data,
            priority=priority,
            click_action=click_action,
        )
        
        # Check for success
        success_count = result.get('success', 0)
        failure_count = result.get('failure', 0)
        
        if success_count > 0:
            logger.info(f"Push notification {notification.id} sent to {success_count} devices")
            return True
        else:
            logger.error(f"Push notification {notification.id} failed for all {failure_count} devices")
            return False
            
    except Exception as e:
        logger.error(f"Failed to send push notification {notification.id}: {e}")
        return False


def send_topic_notification(
    topic: str,
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
    priority: str = 'normal'
) -> bool:
    """
    Send push notification to FCM topic
    
    Args:
        topic: FCM topic name
        title: Notification title
        body: Notification body
        data: Custom data payload
        priority: Message priority
        
    Returns:
        True if sent successfully
    """
    try:
        fcm_service = FCMService()
        
        result = fcm_service.send_to_topic(
            topic=topic,
            title=title,
            body=body,
            data=data,
            priority=priority,
        )
        
        # Check for success
        message_id = result.get('message_id')
        if message_id:
            logger.info(f"Topic notification sent to {topic}: {message_id}")
            return True
        else:
            logger.error(f"Topic notification failed for {topic}")
            return False
            
    except Exception as e:
        logger.error(f"Failed to send topic notification to {topic}: {e}")
        return False


def validate_fcm_token(token: str) -> bool:
    """
    Validate FCM token format
    
    Args:
        token: FCM token to validate
        
    Returns:
        True if token appears valid
    """
    if not token or not isinstance(token, str):
        return False
    
    # Basic validation - FCM tokens are typically 152+ characters
    if len(token) < 100:
        return False
    
    # Should contain only alphanumeric characters, hyphens, underscores, and colons
    allowed_chars = set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_:')
    if not all(c in allowed_chars for c in token):
        return False
    
    return True


def clean_invalid_tokens(tokens: List[str]) -> List[str]:
    """
    Remove invalid FCM tokens from list
    
    Args:
        tokens: List of FCM tokens
        
    Returns:
        List of valid tokens
    """
    valid_tokens = []
    
    for token in tokens:
        if validate_fcm_token(token):
            valid_tokens.append(token)
        else:
            logger.warning(f"Invalid FCM token removed: {token[:20]}...")
    
    return valid_tokens