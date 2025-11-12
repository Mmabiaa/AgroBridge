"""
Marketplace services for business logic
"""
from django.utils import timezone
from .models import Notification, Order
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Centralized service for creating and delivering notifications
    """
    
    @staticmethod
    def _send_realtime_notification(notification):
        """
        Send notification via WebSocket to user's channel group
        
        Args:
            notification: Notification instance
        """
        try:
            channel_layer = get_channel_layer()
            group_name = f"notifications_{notification.recipient.id}"
            
            # Serialize notification data
            notification_data = {
                'id': notification.id,
                'message': notification.message,
                'type': notification.type,
                'is_read': notification.is_read,
                'timestamp': notification.timestamp.isoformat(),
                'related_order': str(notification.related_order.id) if notification.related_order else None,
                'order_number': notification.related_order.order_number if notification.related_order else None,
            }
            
            # Send to user's WebSocket group
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'notification_message',
                    'notification': notification_data
                }
            )
            
            logger.info(f"Real-time notification sent to user {notification.recipient.username}")
        except Exception as e:
            logger.error(f"Failed to send real-time notification: {str(e)}")
            # Don't raise - notification is still saved in database
    
    @staticmethod
    def notify_order_created(order):
        """
        Notify seller when customer places order
        
        Args:
            order: Order instance
            
        Returns:
            Notification instance
        """
        message = (
            f"New order received for {order.items.first().product_name if order.items.exists() else 'product'} "
            f"({order.items.first().quantity if order.items.exists() else 0} units) "
            f"from {order.buyer.username}"
        )
        
        notification = Notification.objects.create(
            recipient=order.seller,
            message=message,
            type='order_created',
            related_order=order,
            is_read=False
        )
        
        # Send real-time notification
        NotificationService._send_realtime_notification(notification)
        
        return notification
    
    @staticmethod
    def notify_order_placed(order):
        """
        Notify customer when they place an order
        
        Args:
            order: Order instance
            
        Returns:
            Notification instance
        """
        message = (
            f"Your order #{order.order_number} for "
            f"{order.items.first().product_name if order.items.exists() else 'product'} "
            f"has been placed successfully"
        )
        
        notification = Notification.objects.create(
            recipient=order.buyer,
            message=message,
            type='order_placed',
            related_order=order,
            is_read=False
        )
        
        # Send real-time notification
        NotificationService._send_realtime_notification(notification)
        
        return notification
    
    @staticmethod
    def notify_order_approved(order):
        """
        Notify customer when seller approves order
        
        Args:
            order: Order instance
            
        Returns:
            Notification instance
        """
        message = f"Your order #{order.order_number} has been approved by {order.seller.username}"
        
        notification = Notification.objects.create(
            recipient=order.buyer,
            message=message,
            type='order_approved',
            related_order=order,
            is_read=False
        )
        
        # Send real-time notification
        NotificationService._send_realtime_notification(notification)
        
        return notification
    
    @staticmethod
    def notify_order_rejected(order, reason=''):
        """
        Notify customer when seller rejects order
        
        Args:
            order: Order instance
            reason: Rejection reason
            
        Returns:
            Notification instance
        """
        message = f"Your order #{order.order_number} has been rejected by {order.seller.username}"
        if reason:
            message += f". Reason: {reason}"
        
        notification = Notification.objects.create(
            recipient=order.buyer,
            message=message,
            type='order_rejected',
            related_order=order,
            is_read=False
        )
        
        # Send real-time notification
        NotificationService._send_realtime_notification(notification)
        
        return notification
    
    @staticmethod
    def notify_order_cancelled(order):
        """
        Notify seller when customer cancels order
        
        Args:
            order: Order instance
            
        Returns:
            Notification instance
        """
        message = f"Order #{order.order_number} has been cancelled by {order.buyer.username}"
        
        notification = Notification.objects.create(
            recipient=order.seller,
            message=message,
            type='order_cancelled',
            related_order=order,
            is_read=False
        )
        
        # Send real-time notification
        NotificationService._send_realtime_notification(notification)
        
        return notification
