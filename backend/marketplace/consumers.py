"""
WebSocket consumers for real-time notifications
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope.get("user")
        
        # Reject anonymous users
        if not self.user or not self.user.is_authenticated:
            logger.warning("Anonymous user attempted to connect to notifications WebSocket")
            await self.close()
            return
        
        # Create a unique group name for this user
        self.group_name = f"notifications_{self.user.id}"
        
        # Join user's notification group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        logger.info(f"User {self.user.username} connected to notifications WebSocket")
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to notification service',
            'user_id': self.user.id
        }))
        
        # Send unread count on connection
        unread_count = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'count': unread_count
        }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
            
            if hasattr(self, 'user'):
                logger.info(f"User {self.user.username} disconnected from notifications WebSocket")
    
    async def receive(self, text_data):
        """Handle messages from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                # Respond to ping with pong
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
            
            elif message_type == 'mark_read':
                # Mark notification as read
                notification_id = data.get('notification_id')
                if notification_id:
                    success = await self.mark_notification_read(notification_id)
                    if success:
                        unread_count = await self.get_unread_count()
                        await self.send(text_data=json.dumps({
                            'type': 'notification_marked_read',
                            'notification_id': notification_id,
                            'unread_count': unread_count
                        }))
            
            elif message_type == 'mark_all_read':
                # Mark all notifications as read
                count = await self.mark_all_notifications_read()
                await self.send(text_data=json.dumps({
                    'type': 'all_notifications_marked_read',
                    'count': count,
                    'unread_count': 0
                }))
            
            elif message_type == 'get_unread_count':
                # Get current unread count
                unread_count = await self.get_unread_count()
                await self.send(text_data=json.dumps({
                    'type': 'unread_count',
                    'count': unread_count
                }))
        
        except json.JSONDecodeError:
            logger.error("Invalid JSON received in WebSocket")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
        except Exception as e:
            logger.error(f"Error processing WebSocket message: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Internal server error'
            }))
    
    async def notification_message(self, event):
        """
        Handle notification messages sent to the group
        This is called when a notification is sent via channel layer
        """
        await self.send(text_data=json.dumps({
            'type': 'new_notification',
            'notification': event['notification']
        }))
    
    async def notification_update(self, event):
        """
        Handle notification update messages
        """
        await self.send(text_data=json.dumps({
            'type': 'notification_updated',
            'notification_id': event['notification_id'],
            'is_read': event['is_read']
        }))
    
    @database_sync_to_async
    def get_unread_count(self):
        """Get unread notification count for user"""
        from .models import Notification
        return Notification.objects.filter(
            recipient=self.user,
            is_read=False
        ).count()
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark a notification as read"""
        from .models import Notification
        try:
            notification = Notification.objects.get(
                id=notification_id,
                recipient=self.user
            )
            notification.is_read = True
            notification.save()
            return True
        except Notification.DoesNotExist:
            return False
    
    @database_sync_to_async
    def mark_all_notifications_read(self):
        """Mark all notifications as read for user"""
        from .models import Notification
        return Notification.objects.filter(
            recipient=self.user,
            is_read=False
        ).update(is_read=True)
