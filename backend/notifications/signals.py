"""
Notification Service Signal Handlers

This module defines signal handlers for automatic notification creation
based on various events in the system.
"""

import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Notification, NotificationType, NotificationPriority
from .services import NotificationService

User = get_user_model()
logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def create_welcome_notification(sender, instance, created, **kwargs):
    """
    Create welcome notification for new users
    """
    if created:
        try:
            service = NotificationService()
            service.create_notification(
                user=instance,
                title="Welcome to AgroBridge!",
                message="Thank you for joining AgroBridge. Explore our features to enhance your farming experience.",
                notification_type=NotificationType.SYSTEM,
                priority=NotificationPriority.NORMAL,
                channels=['websocket', 'push', 'email'],
                data={
                    'welcome': True,
                    'user_id': str(instance.id),
                }
            )
            
            logger.info(f"Created welcome notification for user {instance.email}")
            
        except Exception as e:
            logger.error(f"Failed to create welcome notification for user {instance.email}: {e}")


# Event handlers for other services
def handle_user_registered(event_data):
    """Handle user registration event"""
    try:
        user_id = event_data.get('data', {}).get('user_id')
        if not user_id:
            return
        
        user = User.objects.get(id=user_id)
        service = NotificationService()
        
        # Create welcome notification
        service.create_notification(
            user=user,
            title="Welcome to AgroBridge!",
            message="Your account has been successfully created. Start exploring our agricultural platform.",
            notification_type=NotificationType.SYSTEM,
            priority=NotificationPriority.NORMAL,
            channels=['websocket', 'push', 'email']
        )
        
        logger.info(f"Handled user registration event for {user.email}")
        
    except Exception as e:
        logger.error(f"Error handling user registration event: {e}")


def handle_order_placed(event_data):
    """Handle order placement event"""
    try:
        order_data = event_data.get('data', {})
        user_id = order_data.get('user_id')
        order_id = order_data.get('order_id')
        
        if not user_id or not order_id:
            return
        
        user = User.objects.get(id=user_id)
        service = NotificationService()
        
        # Notify buyer
        service.create_notification(
            user=user,
            title="Order Placed Successfully",
            message=f"Your order #{order_id} has been placed and is being processed.",
            notification_type=NotificationType.MARKETPLACE,
            priority=NotificationPriority.NORMAL,
            channels=['websocket', 'push', 'email'],
            data={'order_id': order_id}
        )
        
        logger.info(f"Handled order placement event for order {order_id}")
        
    except Exception as e:
        logger.error(f"Error handling order placement event: {e}")


def handle_payment_completed(event_data):
    """Handle payment completion event"""
    try:
        payment_data = event_data.get('data', {})
        user_id = payment_data.get('user_id')
        payment_id = payment_data.get('payment_id')
        amount = payment_data.get('amount')
        
        if not user_id or not payment_id:
            return
        
        user = User.objects.get(id=user_id)
        service = NotificationService()
        
        service.create_notification(
            user=user,
            title="Payment Successful",
            message=f"Your payment of {amount} has been processed successfully.",
            notification_type=NotificationType.PAYMENT,
            priority=NotificationPriority.HIGH,
            channels=['websocket', 'push', 'email'],
            data={'payment_id': payment_id, 'amount': amount}
        )
        
        logger.info(f"Handled payment completion event for payment {payment_id}")
        
    except Exception as e:
        logger.error(f"Error handling payment completion event: {e}")


def handle_iot_alert(event_data):
    """Handle IoT sensor alert event"""
    try:
        alert_data = event_data.get('data', {})
        user_id = alert_data.get('user_id')
        device_id = alert_data.get('device_id')
        alert_type = alert_data.get('alert_type')
        message = alert_data.get('message')
        
        if not user_id or not message:
            return
        
        user = User.objects.get(id=user_id)
        service = NotificationService()
        
        # Determine priority based on alert type
        priority = NotificationPriority.HIGH
        if alert_type in ['critical', 'emergency']:
            priority = NotificationPriority.CRITICAL
        
        service.create_notification(
            user=user,
            title=f"IoT Alert: {alert_type.title()}",
            message=message,
            notification_type=NotificationType.IOT_ALERT,
            priority=priority,
            channels=['websocket', 'push', 'email', 'sms'],
            data={
                'device_id': device_id,
                'alert_type': alert_type,
            }
        )
        
        logger.info(f"Handled IoT alert event for device {device_id}")
        
    except Exception as e:
        logger.error(f"Error handling IoT alert event: {e}")


def handle_crop_disease_detected(event_data):
    """Handle crop disease detection event"""
    try:
        detection_data = event_data.get('data', {})
        user_id = detection_data.get('user_id')
        disease_name = detection_data.get('disease_name')
        confidence = detection_data.get('confidence')
        field_id = detection_data.get('field_id')
        
        if not user_id or not disease_name:
            return
        
        user = User.objects.get(id=user_id)
        service = NotificationService()
        
        service.create_notification(
            user=user,
            title="Crop Disease Detected",
            message=f"Disease '{disease_name}' detected with {confidence}% confidence. Check your crops immediately.",
            notification_type=NotificationType.CROP_DISEASE,
            priority=NotificationPriority.HIGH,
            channels=['websocket', 'push', 'email'],
            data={
                'disease_name': disease_name,
                'confidence': confidence,
                'field_id': field_id,
            }
        )
        
        logger.info(f"Handled crop disease detection event for user {user_id}")
        
    except Exception as e:
        logger.error(f"Error handling crop disease detection event: {e}")


def handle_weather_alert(event_data):
    """Handle weather alert event"""
    try:
        weather_data = event_data.get('data', {})
        user_ids = weather_data.get('user_ids', [])
        alert_type = weather_data.get('alert_type')
        message = weather_data.get('message')
        
        if not user_ids or not message:
            return
        
        service = NotificationService()
        
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                
                service.create_notification(
                    user=user,
                    title=f"Weather Alert: {alert_type.title()}",
                    message=message,
                    notification_type=NotificationType.WEATHER,
                    priority=NotificationPriority.HIGH,
                    channels=['websocket', 'push'],
                    data={'alert_type': alert_type}
                )
                
            except User.DoesNotExist:
                logger.warning(f"User {user_id} not found for weather alert")
        
        logger.info(f"Handled weather alert event for {len(user_ids)} users")
        
    except Exception as e:
        logger.error(f"Error handling weather alert event: {e}")


def handle_emergency_alert(event_data):
    """Handle emergency alert event"""
    try:
        alert_data = event_data.get('data', {})
        user_ids = alert_data.get('user_ids', [])
        title = alert_data.get('title', 'Emergency Alert')
        message = alert_data.get('message')
        location = alert_data.get('location')
        
        if not user_ids or not message:
            return
        
        service = NotificationService()
        
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                
                service.create_notification(
                    user=user,
                    title=title,
                    message=message,
                    notification_type=NotificationType.EMERGENCY,
                    priority=NotificationPriority.CRITICAL,
                    channels=['websocket', 'push', 'email', 'sms'],
                    data={'location': location, 'emergency': True}
                )
                
            except User.DoesNotExist:
                logger.warning(f"User {user_id} not found for emergency alert")
        
        logger.info(f"Handled emergency alert event for {len(user_ids)} users")
        
    except Exception as e:
        logger.error(f"Error handling emergency alert event: {e}")


# Event handler mapping
EVENT_HANDLERS = {
    'user.registered': handle_user_registered,
    'order.placed': handle_order_placed,
    'payment.completed': handle_payment_completed,
    'iot.alert': handle_iot_alert,
    'crop.disease_detected': handle_crop_disease_detected,
    'weather.alert': handle_weather_alert,
    'emergency.alert': handle_emergency_alert,
}