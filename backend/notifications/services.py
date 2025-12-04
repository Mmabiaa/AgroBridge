"""
Notification Service Business Logic

This module contains the core business logic for notification creation,
delivery, and management.
"""

import logging
from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import transaction
from django.conf import settings
from .models import (
    Notification,
    NotificationDelivery,
    UserNotificationPreferences,
    NotificationTemplate,
    NotificationType,
    NotificationPriority,
    DeliveryChannel,
    DeliveryStatus
)

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationService:
    """
    Core service for notification management
    """
    
    def create_notification(
        self,
        user: User,
        title: str,
        message: str,
        notification_type: str = NotificationType.SYSTEM,
        priority: int = NotificationPriority.NORMAL,
        channels: Optional[List[str]] = None,
        data: Optional[Dict[str, Any]] = None,
        action_url: Optional[str] = None,
        scheduled_at: Optional[datetime] = None,
        expires_at: Optional[datetime] = None,
        send_immediately: bool = True,
    ) -> Notification:
        """
        Create a new notification
        
        Args:
            user: Target user
            title: Notification title
            message: Notification message
            notification_type: Type of notification
            priority: Priority level (1-10)
            channels: List of delivery channels
            data: Additional data
            action_url: URL to navigate to when clicked
            scheduled_at: When to send (None for immediate)
            expires_at: When notification expires
            send_immediately: Whether to send immediately
            
        Returns:
            Created notification
        """
        # Get user preferences
        preferences = self.get_user_preferences(user)
        
        # Determine channels if not specified
        if channels is None:
            channels = self._get_default_channels(notification_type, preferences)
        
        # Filter channels based on user preferences
        channels = self._filter_channels_by_preferences(
            channels, notification_type, preferences
        )
        
        # Create notification
        notification = Notification.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority,
            channels=channels,
            data=data or {},
            action_url=action_url,
            scheduled_at=scheduled_at,
            expires_at=expires_at,
        )
        
        logger.info(f"Created notification {notification.id} for user {user.email}")
        
        # Send immediately if requested and not scheduled
        if send_immediately and notification.should_send_now():
            self.send_notification(notification)
        
        return notification
    
    def create_from_template(
        self,
        template_name: str,
        user: User,
        context: Dict[str, Any],
        **kwargs
    ) -> Notification:
        """
        Create notification from template
        
        Args:
            template_name: Name of the template to use
            user: Target user
            context: Template context variables
            **kwargs: Additional notification parameters
            
        Returns:
            Created notification
        """
        try:
            template = NotificationTemplate.objects.get(
                name=template_name,
                is_active=True
            )
        except NotificationTemplate.DoesNotExist:
            raise ValueError(f"Template '{template_name}' not found or inactive")
        
        # Render template
        rendered = template.render(context)
        
        # Use template defaults if not overridden
        notification_data = {
            'title': rendered['title'],
            'message': rendered['message'],
            'notification_type': template.notification_type,
            'priority': template.default_priority,
            'channels': template.default_channels,
        }
        
        # Override with provided kwargs
        notification_data.update(kwargs)
        
        return self.create_notification(user=user, **notification_data)
    
    def send_notification(self, notification: Notification) -> bool:
        """
        Send notification via all configured channels
        
        Args:
            notification: Notification to send
            
        Returns:
            True if at least one channel succeeded
        """
        if notification.is_expired():
            logger.warning(f"Notification {notification.id} has expired, not sending")
            return False
        
        success_count = 0
        
        for channel in notification.channels:
            try:
                success = self._send_via_channel(notification, channel)
                if success:
                    success_count += 1
            except Exception as e:
                logger.error(f"Error sending notification {notification.id} via {channel}: {e}")
        
        return success_count > 0
    
    def _send_via_channel(self, notification: Notification, channel: str) -> bool:
        """
        Send notification via specific channel
        
        Args:
            notification: Notification to send
            channel: Delivery channel
            
        Returns:
            True if successful
        """
        # Get or create delivery record
        delivery, created = NotificationDelivery.objects.get_or_create(
            notification=notification,
            channel=channel,
            defaults={'status': DeliveryStatus.PENDING}
        )
        
        if not created and delivery.status == DeliveryStatus.DELIVERED:
            logger.info(f"Notification {notification.id} already delivered via {channel}")
            return True
        
        try:
            # Send via appropriate channel
            if channel == DeliveryChannel.WEBSOCKET:
                success = self._send_websocket(notification, delivery)
            elif channel == DeliveryChannel.PUSH:
                success = self._send_push(notification, delivery)
            elif channel == DeliveryChannel.EMAIL:
                success = self._send_email(notification, delivery)
            elif channel == DeliveryChannel.SMS:
                success = self._send_sms(notification, delivery)
            elif channel == DeliveryChannel.IN_APP:
                success = self._send_in_app(notification, delivery)
            else:
                logger.error(f"Unknown channel: {channel}")
                success = False
            
            # Update delivery status
            if success:
                delivery.status = DeliveryStatus.SENT
                delivery.sent_at = timezone.now()
            else:
                delivery.status = DeliveryStatus.FAILED
                delivery.retry_count += 1
            
            delivery.save()
            
            return success
            
        except Exception as e:
            logger.error(f"Error sending via {channel}: {e}")
            delivery.status = DeliveryStatus.FAILED
            delivery.error_message = str(e)
            delivery.retry_count += 1
            delivery.save()
            return False
    
    def _send_websocket(self, notification: Notification, delivery: NotificationDelivery) -> bool:
        """Send notification via WebSocket"""
        from .websocket import send_websocket_notification
        
        try:
            send_websocket_notification(notification)
            return True
        except Exception as e:
            logger.error(f"WebSocket send failed: {e}")
            return False
    
    def _send_push(self, notification: Notification, delivery: NotificationDelivery) -> bool:
        """Send push notification"""
        from .push_service import send_push_notification
        
        try:
            preferences = self.get_user_preferences(notification.user)
            if not preferences.fcm_tokens:
                logger.warning(f"No FCM tokens for user {notification.user.email}")
                return False
            
            return send_push_notification(notification, preferences.fcm_tokens)
        except Exception as e:
            logger.error(f"Push notification send failed: {e}")
            return False
    
    def _send_email(self, notification: Notification, delivery: NotificationDelivery) -> bool:
        """Send email notification"""
        from .email_service import send_email_notification
        
        try:
            return send_email_notification(notification)
        except Exception as e:
            logger.error(f"Email send failed: {e}")
            return False
    
    def _send_sms(self, notification: Notification, delivery: NotificationDelivery) -> bool:
        """Send SMS notification"""
        from .sms_service import send_sms_notification
        
        try:
            preferences = self.get_user_preferences(notification.user)
            if not preferences.phone_number:
                logger.warning(f"No phone number for user {notification.user.email}")
                return False
            
            return send_sms_notification(notification, preferences.phone_number)
        except Exception as e:
            logger.error(f"SMS send failed: {e}")
            return False
    
    def _send_in_app(self, notification: Notification, delivery: NotificationDelivery) -> bool:
        """Mark as in-app notification (already stored in database)"""
        return True
    
    def get_user_preferences(self, user: User) -> UserNotificationPreferences:
        """
        Get or create user notification preferences
        
        Args:
            user: User to get preferences for
            
        Returns:
            User notification preferences
        """
        preferences, created = UserNotificationPreferences.objects.get_or_create(
            user=user,
            defaults={
                'enable_websocket': True,
                'enable_push': True,
                'enable_email': True,
                'enable_sms': False,
                'notification_types': self._get_default_type_preferences(),
            }
        )
        
        if created:
            logger.info(f"Created default preferences for user {user.email}")
        
        return preferences
    
    def _get_default_channels(
        self,
        notification_type: str,
        preferences: UserNotificationPreferences
    ) -> List[str]:
        """Get default channels for notification type"""
        channels = []
        
        # Always include in-app
        channels.append(DeliveryChannel.IN_APP)
        
        # Add WebSocket for real-time
        if preferences.enable_websocket:
            channels.append(DeliveryChannel.WEBSOCKET)
        
        # Add push for mobile
        if preferences.enable_push:
            channels.append(DeliveryChannel.PUSH)
        
        # Add email for important notifications
        if notification_type in [
            NotificationType.EMERGENCY,
            NotificationType.IOT_ALERT,
            NotificationType.PAYMENT,
        ] and preferences.enable_email:
            channels.append(DeliveryChannel.EMAIL)
        
        # Add SMS for critical notifications
        if notification_type == NotificationType.EMERGENCY and preferences.enable_sms:
            channels.append(DeliveryChannel.SMS)
        
        return channels
    
    def _filter_channels_by_preferences(
        self,
        channels: List[str],
        notification_type: str,
        preferences: UserNotificationPreferences
    ) -> List[str]:
        """Filter channels based on user preferences"""
        filtered = []
        
        for channel in channels:
            if preferences.should_receive_notification(notification_type, channel):
                filtered.append(channel)
        
        return filtered
    
    def _get_default_type_preferences(self) -> Dict[str, Any]:
        """Get default notification type preferences"""
        return {
            NotificationType.SYSTEM: {
                'enabled': True,
                'channels': {
                    'websocket': True,
                    'push': True,
                    'email': False,
                    'sms': False,
                }
            },
            NotificationType.ALERT: {
                'enabled': True,
                'channels': {
                    'websocket': True,
                    'push': True,
                    'email': True,
                    'sms': False,
                }
            },
            NotificationType.EMERGENCY: {
                'enabled': True,
                'channels': {
                    'websocket': True,
                    'push': True,
                    'email': True,
                    'sms': True,
                }
            },
            NotificationType.IOT_ALERT: {
                'enabled': True,
                'channels': {
                    'websocket': True,
                    'push': True,
                    'email': True,
                    'sms': False,
                }
            },
            NotificationType.CROP_DISEASE: {
                'enabled': True,
                'channels': {
                    'websocket': True,
                    'push': True,
                    'email': True,
                    'sms': False,
                }
            },
            NotificationType.WEATHER: {
                'enabled': True,
                'channels': {
                    'websocket': True,
                    'push': True,
                    'email': False,
                    'sms': False,
                }
            },
            NotificationType.MARKETPLACE: {
                'enabled': True,
                'channels': {
                    'websocket': True,
                    'push': True,
                    'email': False,
                    'sms': False,
                }
            },
            NotificationType.PAYMENT: {
                'enabled': True,
                'channels': {
                    'websocket': True,
                    'push': True,
                    'email': True,
                    'sms': False,
                }
            },
            NotificationType.SOCIAL: {
                'enabled': True,
                'channels': {
                    'websocket': True,
                    'push': True,
                    'email': False,
                    'sms': False,
                }
            },
            NotificationType.MARKETING: {
                'enabled': False,
                'channels': {
                    'websocket': False,
                    'push': False,
                    'email': True,
                    'sms': False,
                }
            },
        }
    
    def mark_as_read(self, notification_ids: List[str], user: User) -> int:
        """
        Mark notifications as read
        
        Args:
            notification_ids: List of notification IDs
            user: User who read the notifications
            
        Returns:
            Number of notifications marked as read
        """
        count = Notification.objects.filter(
            id__in=notification_ids,
            user=user,
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )
        
        logger.info(f"Marked {count} notifications as read for user {user.email}")
        return count
    
    def get_user_stats(self, user: User) -> Dict[str, Any]:
        """
        Get notification statistics for user
        
        Args:
            user: User to get stats for
            
        Returns:
            Dictionary with statistics
        """
        notifications = Notification.objects.filter(user=user)
        
        stats = {
            'total_notifications': notifications.count(),
            'unread_notifications': notifications.filter(is_read=False).count(),
            'notifications_by_type': {},
            'notifications_by_priority': {},
            'delivery_stats': {},
        }
        
        # Group by type
        for notification_type in NotificationType.choices:
            count = notifications.filter(notification_type=notification_type[0]).count()
            stats['notifications_by_type'][notification_type[1]] = count
        
        # Group by priority
        for priority in NotificationPriority.choices:
            count = notifications.filter(priority=priority[0]).count()
            stats['notifications_by_priority'][priority[1]] = count
        
        # Delivery stats
        deliveries = NotificationDelivery.objects.filter(
            notification__user=user
        )
        
        for status in DeliveryStatus.choices:
            count = deliveries.filter(status=status[0]).count()
            stats['delivery_stats'][status[1]] = count
        
        return stats
    
    def cleanup_expired_notifications(self) -> int:
        """
        Clean up expired notifications
        
        Returns:
            Number of notifications deleted
        """
        count = Notification.objects.filter(
            expires_at__lt=timezone.now()
        ).delete()[0]
        
        logger.info(f"Cleaned up {count} expired notifications")
        return count
    
    def retry_failed_deliveries(self, max_retries: int = 3) -> int:
        """
        Retry failed notification deliveries
        
        Args:
            max_retries: Maximum number of retry attempts
            
        Returns:
            Number of deliveries retried
        """
        failed_deliveries = NotificationDelivery.objects.filter(
            status=DeliveryStatus.FAILED,
            retry_count__lt=max_retries,
            notification__expires_at__gt=timezone.now()
        )
        
        count = 0
        for delivery in failed_deliveries:
            try:
                success = self._send_via_channel(delivery.notification, delivery.channel)
                if success:
                    count += 1
            except Exception as e:
                logger.error(f"Retry failed for delivery {delivery.id}: {e}")
        
        logger.info(f"Retried {count} failed deliveries")
        return count