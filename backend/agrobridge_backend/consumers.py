"""
Base WebSocket consumers and utilities
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone

logger = logging.getLogger(__name__)


class BaseAuthenticatedConsumer(AsyncWebsocketConsumer):
    """
    Base consumer class that relies on middleware authentication
    """
    
    async def connect(self):
        """Handle WebSocket connection with authentication"""
        logger.info(f"BaseAuthenticatedConsumer.connect() called for path: {self.scope['path']}")
        logger.info(f"Query string: {self.scope.get('query_string', b'').decode()}")
        
        # User should already be authenticated by middleware
        user = self.scope.get('user')
        
        logger.info(f"User in scope: {user} (Anonymous: {user.is_anonymous if user else 'No user'})")
        
        if not user or user.is_anonymous:
            logger.warning("WebSocket connection rejected: No authenticated user")
            await self.close(code=4001)  # Custom code for unauthorized
            return
        
        # Store user reference
        self.user = user
        
        # Accept connection
        await self.accept()
        logger.info(f"WebSocket connection accepted for user: {user.username}")
        
        # Call custom connection handler
        await self.on_connected()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        username = self.user.username if hasattr(self, 'user') and self.user else 'unknown'
        logger.info(f"WebSocket disconnected for user: {username}, code: {close_code}")
        await self.on_disconnected(close_code)
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            logger.debug(f"Received WebSocket message: {data}")
            await self.on_message(data)
        except json.JSONDecodeError:
            logger.warning("Invalid JSON received in WebSocket message")
            await self.send_error("Invalid JSON format")
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {str(e)}")
            await self.send_error("Internal server error")
    
    async def send_message(self, message_type, data):
        """Send structured message to WebSocket"""
        message = {
            'type': message_type,
            'data': data,
            'timestamp': self.get_timestamp()
        }
        await self.send(text_data=json.dumps(message))
        logger.debug(f"Sent WebSocket message: {message_type}")
    
    async def send_error(self, error_message):
        """Send error message to WebSocket"""
        await self.send_message('error', {'message': error_message})
        logger.warning(f"Sent WebSocket error: {error_message}")
    
    def get_timestamp(self):
        """Get current timestamp"""
        return timezone.now().isoformat()
    
    # Override these methods in subclasses
    async def on_connected(self):
        """Called after successful connection and authentication"""
        pass
    
    async def on_disconnected(self, close_code):
        """Called when WebSocket disconnects"""
        pass
    
    async def on_message(self, data):
        """Called when a message is received"""
        pass


class TestConsumer(BaseAuthenticatedConsumer):
    """
    Test WebSocket consumer for development and testing
    """
    
    async def on_connected(self):
        """Handle successful connection"""
        await self.send_message('connected', {
            'message': 'Successfully connected to WebSocket',
            'user': self.user.username,
            'user_id': self.user.id,
            'status': 'authenticated'
        })
        logger.info(f"TestConsumer connected for user: {self.user.username}")
    
    async def on_disconnected(self, close_code):
        """Handle disconnection"""
        username = self.user.username if hasattr(self, 'user') and self.user else 'unknown'
        logger.info(f"TestConsumer disconnected for user: {username}, code: {close_code}")
    
    async def on_message(self, data):
        """Handle incoming messages"""
        message_type = data.get('type', 'unknown')
        logger.info(f"TestConsumer received message type: {message_type}")
        
        if message_type == 'ping':
            await self.send_message('pong', {
                'message': 'Pong response from server',
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
                'is_authenticated': True
            })
        
        else:
            await self.send_error(f"Unknown message type: {message_type}")


class SimpleTestConsumer(AsyncWebsocketConsumer):
    """
    Simple WebSocket consumer for testing without authentication
    """
    
    async def connect(self):
        """Accept connection without authentication"""
        logger.info("SimpleTestConsumer connection attempt")
        await self.accept()
        await self.send(text_data=json.dumps({
            'type': 'connected',
            'message': 'Simple WebSocket connected successfully (no auth)',
            'timestamp': self.get_timestamp(),
            'status': 'connected'
        }))
        logger.info("Simple WebSocket connected (no auth)")
    
    async def disconnect(self, close_code):
        """Handle disconnection"""
        logger.info(f"Simple WebSocket disconnected, code: {close_code}")
    
    async def receive(self, text_data):
        """Handle incoming messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'unknown')
            logger.info(f"SimpleTestConsumer received message type: {message_type}")
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'message': 'Pong response from simple WebSocket',
                    'original_data': data,
                    'timestamp': self.get_timestamp()
                }))
            
            elif message_type == 'echo':
                await self.send(text_data=json.dumps({
                    'type': 'echo_response',
                    'message': 'Echo response from simple WebSocket',
                    'echoed_data': data.get('data', {}),
                    'timestamp': self.get_timestamp()
                }))
            
            elif message_type == 'info':
                await self.send(text_data=json.dumps({
                    'type': 'info_response',
                    'message': 'This is a simple WebSocket without authentication',
                    'timestamp': self.get_timestamp()
                }))
            
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Unknown message type: {message_type}',
                    'timestamp': self.get_timestamp()
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format',
                'timestamp': self.get_timestamp()
            }))
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Internal server error',
                'timestamp': self.get_timestamp()
            }))
    
    def get_timestamp(self):
        """Get current timestamp"""
        return timezone.now().isoformat()


class NotificationConsumer(BaseAuthenticatedConsumer):
    """
    Consumer for real-time notifications
    """
    
    async def on_connected(self):
        """Handle successful connection"""
        # Add user to notification group
        await self.channel_layer.group_add(
            f"user_{self.user.id}",
            self.channel_name
        )
        
        await self.send_message('connected', {
            'message': 'Connected to notifications',
            'user_id': self.user.id,
            'channel': 'notifications'
        })
        logger.info(f"NotificationConsumer connected for user: {self.user.username}")
    
    async def on_disconnected(self, close_code):
        """Handle disconnection"""
        # Remove user from notification group
        await self.channel_layer.group_discard(
            f"user_{self.user.id}",
            self.channel_name
        )
        logger.info(f"NotificationConsumer disconnected for user: {self.user.username}")
    
    async def on_message(self, data):
        """Handle incoming messages"""
        message_type = data.get('type', 'unknown')
        
        if message_type == 'subscribe':
            # Subscribe to specific notification types
            notification_types = data.get('types', [])
            for nt in notification_types:
                await self.channel_layer.group_add(
                    f"notifications_{nt}",
                    self.channel_name
                )
            await self.send_message('subscribed', {
                'types': notification_types,
                'message': 'Subscribed to notification types'
            })
        
        elif message_type == 'unsubscribe':
            # Unsubscribe from specific notification types
            notification_types = data.get('types', [])
            for nt in notification_types:
                await self.channel_layer.group_discard(
                    f"notifications_{nt}",
                    self.channel_name
                )
            await self.send_message('unsubscribed', {
                'types': notification_types,
                'message': 'Unsubscribed from notification types'
            })
        
        else:
            await self.send_error(f"Unknown message type: {message_type}")
    
    async def notification_message(self, event):
        """Handle notification messages from channel layer"""
        await self.send_message('notification', event['data'])


class ChatConsumer(BaseAuthenticatedConsumer):
    """
    Consumer for real-time chat functionality
    """
    
    async def on_connected(self):
        """Handle successful connection"""
        await self.send_message('connected', {
            'message': 'Connected to chat service',
            'user_id': self.user.id,
            'channel': 'chat'
        })
        logger.info(f"ChatConsumer connected for user: {self.user.username}")
    
    async def on_message(self, data):
        """Handle incoming chat messages"""
        message_type = data.get('type', 'unknown')
        
        if message_type == 'join_room':
            room_name = data.get('room_name')
            if room_name:
                # Join room group
                await self.channel_layer.group_add(
                    room_name,
                    self.channel_name
                )
                await self.send_message('room_joined', {
                    'room_name': room_name,
                    'message': f'Joined room: {room_name}'
                })
        
        elif message_type == 'leave_room':
            room_name = data.get('room_name')
            if room_name:
                # Leave room group
                await self.channel_layer.group_discard(
                    room_name,
                    self.channel_name
                )
                await self.send_message('room_left', {
                    'room_name': room_name,
                    'message': f'Left room: {room_name}'
                })
        
        elif message_type == 'chat_message':
            room_name = data.get('room_name')
            message = data.get('message')
            
            if room_name and message:
                # Send message to room group
                await self.channel_layer.group_send(
                    room_name,
                    {
                        'type': 'chat_message',
                        'data': {
                            'room_name': room_name,
                            'message': message,
                            'sender': self.user.username,
                            'sender_id': self.user.id,
                            'timestamp': self.get_timestamp()
                        }
                    }
                )
        
        else:
            await self.send_error(f"Unknown message type: {message_type}")
    
    async def chat_message(self, event):
        """Handle chat messages from channel layer"""
        await self.send_message('chat_message', event['data'])