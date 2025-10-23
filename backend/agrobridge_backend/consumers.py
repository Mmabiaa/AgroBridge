"""
Base WebSocket consumers and utilities
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from urllib.parse import parse_qs

logger = logging.getLogger(__name__)
User = get_user_model()


class BaseAuthenticatedConsumer(AsyncWebsocketConsumer):
    """
    Base consumer class with JWT authentication support
    """
    
    async def connect(self):
        """Handle WebSocket connection with authentication"""
        # Get token from query parameters
        query_string = self.scope['query_string'].decode()
        query_params = parse_qs(query_string)
        
        token = query_params.get('token', [None])[0]
        
        if not token:
            logger.warning("WebSocket connection rejected: No token provided")
            await self.close(code=4001)  # Unauthorized
            return
        
        # Authenticate user
        user = await self.authenticate_user(token)
        if not user:
            logger.warning("WebSocket connection rejected: Invalid token")
            await self.close(code=4001)  # Unauthorized
            return
        
        # Store user in scope
        self.scope['user'] = user
        self.user = user
        
        # Accept connection
        await self.accept()
        
        # Call custom connection handler
        await self.on_connect()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        await self.on_disconnect(close_code)
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            await self.on_message(data)
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format")
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {str(e)}")
            await self.send_error("Internal server error")
    
    @database_sync_to_async
    def authenticate_user(self, token):
        """Authenticate user using JWT token"""
        try:
            # Validate token
            UntypedToken(token)
            
            # Decode token to get user
            from rest_framework_simplejwt.tokens import AccessToken
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            
            # Get user
            user = User.objects.get(id=user_id)
            return user
            
        except (InvalidToken, TokenError, User.DoesNotExist) as e:
            logger.warning(f"Authentication failed: {str(e)}")
            return None
    
    async def send_message(self, message_type, data):
        """Send structured message to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': message_type,
            'data': data,
            'timestamp': self.get_timestamp()
        }))
    
    async def send_error(self, error_message):
        """Send error message to WebSocket"""
        await self.send_message('error', {'message': error_message})
    
    def get_timestamp(self):
        """Get current timestamp"""
        from django.utils import timezone
        return timezone.now().isoformat()
    
    # Override these methods in subclasses
    async def on_connect(self):
        """Called after successful connection and authentication"""
        pass
    
    async def on_disconnect(self, close_code):
        """Called when WebSocket disconnects"""
        pass
    
    async def on_message(self, data):
        """Called when a message is received"""
        pass


class TestConsumer(BaseAuthenticatedConsumer):
    """
    Test WebSocket consumer for development and testing
    """
    
    async def on_connect(self):
        """Handle successful connection"""
        await self.send_message('connected', {
            'message': 'Successfully connected to test WebSocket',
            'user': self.user.username
        })
        logger.info(f"Test WebSocket connected for user: {self.user.username}")
    
    async def on_disconnect(self, close_code):
        """Handle disconnection"""
        logger.info(f"Test WebSocket disconnected for user: {self.user.username}, code: {close_code}")
    
    async def on_message(self, data):
        """Handle incoming messages"""
        message_type = data.get('type', 'unknown')
        
        if message_type == 'ping':
            await self.send_message('pong', {
                'message': 'Pong response',
                'original_data': data
            })
        
        elif message_type == 'echo':
            await self.send_message('echo_response', {
                'message': 'Echo response',
                'echoed_data': data.get('data', {})
            })
        
        elif message_type == 'user_info':
            await self.send_message('user_info_response', {
                'user_id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'role': self.user.role
            })
        
        else:
            await self.send_error(f"Unknown message type: {message_type}")


class NotificationMixin:
    """
    Mixin for consumers that need to send notifications
    """
    
    async def send_notification(self, notification_type, title, message, data=None):
        """Send notification to user"""
        await self.send_message('notification', {
            'notification_type': notification_type,
            'title': title,
            'message': message,
            'data': data or {}
        })
    
    async def send_system_notification(self, message):
        """Send system notification"""
        await self.send_notification('system', 'System Notification', message)
    
    async def send_farm_alert(self, farm_name, alert_message):
        """Send farm-related alert"""
        await self.send_notification(
            'farm_alert', 
            f'Farm Alert: {farm_name}', 
            alert_message
        )
    
    async def send_marketplace_update(self, update_message):
        """Send marketplace update"""
        await self.send_notification(
            'marketplace', 
            'Marketplace Update', 
            update_message
        )


class BroadcastMixin:
    """
    Mixin for consumers that need to broadcast to groups
    """
    
    async def join_group(self, group_name):
        """Join a WebSocket group"""
        await self.channel_layer.group_add(group_name, self.channel_name)
    
    async def leave_group(self, group_name):
        """Leave a WebSocket group"""
        await self.channel_layer.group_discard(group_name, self.channel_name)
    
    async def broadcast_to_group(self, group_name, message_type, data):
        """Broadcast message to all consumers in a group"""
        await self.channel_layer.group_send(
            group_name,
            {
                'type': 'group_message',
                'message_type': message_type,
                'data': data
            }
        )
    
    async def group_message(self, event):
        """Handle group broadcast messages"""
        await self.send_message(
            event['message_type'],
            event['data']
        )