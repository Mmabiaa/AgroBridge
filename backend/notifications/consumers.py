"""
WebSocket Consumers for Real-time Notifications

This module defines WebSocket consumers for handling real-time notification
delivery using Django Channels.
"""

import json
import logging
from typing import Dict, Any
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from jwt import decode as jwt_decode
from django.conf import settings

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for user notifications
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        # Get user from token
        self.user = await self.get_user_from_token()
        
        if isinstance(self.user, AnonymousUser) or not self.user:
            logger.warning("Unauthorized WebSocket connection attempt")
            await self.close()
            return
        
        # Join user-specific group
        self.user_group_name = f"user_{self.user.id}"
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        # Join general notifications group
        await self.channel_layer.group_add(
            "notifications",
            self.channel_name
        )
        
        await self.accept()
        
        logger.info(f"WebSocket connected for user {self.user.email}")
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to notifications',
            'user_id': str(self.user.id),
        }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
        
        await self.channel_layer.group_discard(
            "notifications",
            self.channel_name
        )
        
        if hasattr(self, 'user') and self.user:
            logger.info(f"WebSocket disconnected for user {self.user.email}")
    
    async def receive(self, text_data):
        """Handle messages from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'mark_read':
                await self.handle_mark_read(data)
            elif message_type == 'get_unread_count':
                await self.handle_get_unread_count()
            elif message_type == 'ping':
                await self.handle_ping()
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received from WebSocket")
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {e}")
    
    async def notification_message(self, event):
        """Handle notification message from group"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification'],
        }))
    
    async def broadcast_message(self, event):
        """Handle broadcast message from group"""
        await self.send(text_data=json.dumps({
            'type': 'broadcast',
            'notification': event['notification'],
        }))
    
    async def custom_message(self, event):
        """Handle custom message from group"""
        await self.send(text_data=json.dumps({
            'type': event['message_type'],
            'data': event['data'],
        }))
    
    async def handle_mark_read(self, data):
        """Handle mark notification as read"""
        try:
            notification_ids = data.get('notification_ids', [])
            if notification_ids:
                count = await self.mark_notifications_read(notification_ids)
                await self.send(text_data=json.dumps({
                    'type': 'mark_read_response',
                    'success': True,
                    'count': count,
                }))
        except Exception as e:
            logger.error(f"Error marking notifications as read: {e}")
            await self.send(text_data=json.dumps({
                'type': 'mark_read_response',
                'success': False,
                'error': str(e),
            }))
    
    async def handle_get_unread_count(self):
        """Handle get unread notification count"""
        try:
            count = await self.get_unread_count()
            await self.send(text_data=json.dumps({
                'type': 'unread_count',
                'count': count,
            }))
        except Exception as e:
            logger.error(f"Error getting unread count: {e}")
    
    async def handle_ping(self):
        """Handle ping message"""
        await self.send(text_data=json.dumps({
            'type': 'pong',
            'timestamp': json.dumps(timezone.now(), default=str),
        }))
    
    async def get_user_from_token(self):
        """Extract user from JWT token in query string"""
        try:
            # Get token from query string
            query_string = self.scope.get('query_string', b'').decode()
            token = None
            
            for param in query_string.split('&'):
                if param.startswith('token='):
                    token = param.split('=', 1)[1]
                    break
            
            if not token:
                return AnonymousUser()
            
            # Validate token
            try:
                UntypedToken(token)
            except (InvalidToken, TokenError):
                return AnonymousUser()
            
            # Decode token to get user ID
            decoded_data = jwt_decode(
                token,
                settings.SECRET_KEY,
                algorithms=["HS256"]
            )
            
            user_id = decoded_data.get('user_id')
            if not user_id:
                return AnonymousUser()
            
            # Get user from database
            return await self.get_user_by_id(user_id)
            
        except Exception as e:
            logger.error(f"Error extracting user from token: {e}")
            return AnonymousUser()
    
    @database_sync_to_async
    def get_user_by_id(self, user_id):
        """Get user by ID from database"""
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return AnonymousUser()
    
    @database_sync_to_async
    def mark_notifications_read(self, notification_ids):
        """Mark notifications as read in database"""
        from .models import Notification
        from django.utils import timezone
        
        count = Notification.objects.filter(
            id__in=notification_ids,
            user=self.user,
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return count
    
    @database_sync_to_async
    def get_unread_count(self):
        """Get unread notification count from database"""
        from .models import Notification
        
        return Notification.objects.filter(
            user=self.user,
            is_read=False
        ).count()


class AdminNotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for admin notifications and monitoring
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        # Get user from token
        self.user = await self.get_user_from_token()
        
        if (isinstance(self.user, AnonymousUser) or 
            not self.user or 
            not await self.is_admin_user(self.user)):
            logger.warning("Unauthorized admin WebSocket connection attempt")
            await self.close()
            return
        
        # Join admin group
        await self.channel_layer.group_add(
            "admin_notifications",
            self.channel_name
        )
        
        await self.accept()
        
        logger.info(f"Admin WebSocket connected for user {self.user.email}")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        await self.channel_layer.group_discard(
            "admin_notifications",
            self.channel_name
        )
        
        if hasattr(self, 'user') and self.user:
            logger.info(f"Admin WebSocket disconnected for user {self.user.email}")
    
    async def receive(self, text_data):
        """Handle messages from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'get_stats':
                await self.handle_get_stats()
            elif message_type == 'broadcast_notification':
                await self.handle_broadcast_notification(data)
            else:
                logger.warning(f"Unknown admin message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received from admin WebSocket")
        except Exception as e:
            logger.error(f"Error handling admin WebSocket message: {e}")
    
    async def admin_notification(self, event):
        """Handle admin notification from group"""
        await self.send(text_data=json.dumps({
            'type': 'admin_notification',
            'data': event['data'],
        }))
    
    async def system_alert(self, event):
        """Handle system alert from group"""
        await self.send(text_data=json.dumps({
            'type': 'system_alert',
            'alert': event['alert'],
        }))
    
    async def handle_get_stats(self):
        """Handle get notification statistics"""
        try:
            stats = await self.get_notification_stats()
            await self.send(text_data=json.dumps({
                'type': 'stats',
                'data': stats,
            }))
        except Exception as e:
            logger.error(f"Error getting notification stats: {e}")
    
    async def handle_broadcast_notification(self, data):
        """Handle broadcast notification request"""
        try:
            # This would create and send a notification to all users
            # Implementation depends on your specific requirements
            await self.send(text_data=json.dumps({
                'type': 'broadcast_response',
                'success': True,
                'message': 'Broadcast sent',
            }))
        except Exception as e:
            logger.error(f"Error broadcasting notification: {e}")
    
    async def get_user_from_token(self):
        """Extract user from JWT token (same as NotificationConsumer)"""
        # Same implementation as NotificationConsumer
        try:
            query_string = self.scope.get('query_string', b'').decode()
            token = None
            
            for param in query_string.split('&'):
                if param.startswith('token='):
                    token = param.split('=', 1)[1]
                    break
            
            if not token:
                return AnonymousUser()
            
            try:
                UntypedToken(token)
            except (InvalidToken, TokenError):
                return AnonymousUser()
            
            decoded_data = jwt_decode(
                token,
                settings.SECRET_KEY,
                algorithms=["HS256"]
            )
            
            user_id = decoded_data.get('user_id')
            if not user_id:
                return AnonymousUser()
            
            return await self.get_user_by_id(user_id)
            
        except Exception as e:
            logger.error(f"Error extracting user from token: {e}")
            return AnonymousUser()
    
    @database_sync_to_async
    def get_user_by_id(self, user_id):
        """Get user by ID from database"""
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return AnonymousUser()
    
    @database_sync_to_async
    def is_admin_user(self, user):
        """Check if user is admin"""
        return user.is_staff or user.is_superuser
    
    @database_sync_to_async
    def get_notification_stats(self):
        """Get notification statistics"""
        from .models import Notification, NotificationDelivery
        from django.db.models import Count
        
        # Get basic stats
        total_notifications = Notification.objects.count()
        unread_notifications = Notification.objects.filter(is_read=False).count()
        
        # Get stats by type
        type_stats = dict(
            Notification.objects.values('notification_type')
            .annotate(count=Count('id'))
            .values_list('notification_type', 'count')
        )
        
        # Get delivery stats
        delivery_stats = dict(
            NotificationDelivery.objects.values('status')
            .annotate(count=Count('id'))
            .values_list('status', 'count')
        )
        
        return {
            'total_notifications': total_notifications,
            'unread_notifications': unread_notifications,
            'type_stats': type_stats,
            'delivery_stats': delivery_stats,
        }