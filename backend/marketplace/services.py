"""
Marketplace services for business logic
"""
from django.utils import timezone
from .models import Notification, Order


class NotificationService:
    """
    Centralized service for creating and delivering notifications
    """
    
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
        
        return notification
