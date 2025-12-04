"""
Notification Service Celery Tasks

This module defines asynchronous tasks for notification processing.
"""

import logging
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from celery import shared_task
from .models import (
    Notification,
    NotificationDelivery,
    NotificationType,
    NotificationPriority,
    DeliveryStatus
)
from .services import NotificationService

User = get_user_model()
logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_notification_task(self, notification_id: str):
    """
    Asynchronous task to send notification
    
    Args:
        notification_id: ID of notification to send
    """
    try:
        notification = Notification.objects.get(id=notification_id)
        service = NotificationService()
        
        success = service.send_notification(notification)
        
        if success:
            logger.info(f"Successfully sent notification {notification_id}")
        else:
            logger.warning(f"Failed to send notification {notification_id}")
            
        return success
        
    except Notification.DoesNotExist:
        logger.error(f"Notification {notification_id} not found")
        return False
    except Exception as e:
        logger.error(f"Error sending notification {notification_id}: {e}")
        # Retry task
        raise self.retry(exc=e, countdown=60)


@shared_task
def send_scheduled_notifications():
    """
    Send all scheduled notifications that are due
    """
    try:
        now = timezone.now()
        
        # Get notifications scheduled for now or earlier
        scheduled_notifications = Notification.objects.filter(
            scheduled_at__lte=now,
            scheduled_at__isnull=False
        ).exclude(
            deliveries__status=DeliveryStatus.SENT
        )
        
        count = 0
        for notification in scheduled_notifications:
            if notification.should_send_now() and not notification.is_expired():
                send_notification_task.delay(str(notification.id))
                count += 1
        
        logger.info(f"Queued {count} scheduled notifications for sending")
        return count
        
    except Exception as e:
        logger.error(f"Error sending scheduled notifications: {e}")
        return 0


@shared_task
def cleanup_expired_notifications():
    """
    Clean up expired notifications
    """
    try:
        service = NotificationService()
        count = service.cleanup_expired_notifications()
        
        logger.info(f"Cleaned up {count} expired notifications")
        return count
        
    except Exception as e:
        logger.error(f"Error cleaning up expired notifications: {e}")
        return 0


@shared_task
def cleanup_old_notifications(days: int = 90):
    """
    Clean up old read notifications
    
    Args:
        days: Number of days to keep read notifications
    """
    try:
        cutoff_date = timezone.now() - timedelta(days=days)
        
        count = Notification.objects.filter(
            is_read=True,
            read_at__lt=cutoff_date
        ).delete()[0]
        
        logger.info(f"Cleaned up {count} old notifications (older than {days} days)")
        return count
        
    except Exception as e:
        logger.error(f"Error cleaning up old notifications: {e}")
        return 0


@shared_task(bind=True, max_retries=3)
def retry_failed_deliveries(self):
    """
    Retry failed notification deliveries
    """
    try:
        service = NotificationService()
        count = service.retry_failed_deliveries(max_retries=3)
        
        logger.info(f"Retried {count} failed deliveries")
        return count
        
    except Exception as e:
        logger.error(f"Error retrying failed deliveries: {e}")
        raise self.retry(exc=e, countdown=300)


@shared_task
def send_bulk_notification(
    user_ids: list,
    title: str,
    message: str,
    notification_type: str = NotificationType.SYSTEM,
    priority: int = NotificationPriority.NORMAL,
    channels: list = None,
    data: dict = None
):
    """
    Send notification to multiple users
    
    Args:
        user_ids: List of user IDs
        title: Notification title
        message: Notification message
        notification_type: Type of notification
        priority: Priority level
        channels: Delivery channels
        data: Additional data
    """
    try:
        service = NotificationService()
        count = 0
        
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                
                notification = service.create_notification(
                    user=user,
                    title=title,
                    message=message,
                    notification_type=notification_type,
                    priority=priority,
                    channels=channels,
                    data=data,
                    send_immediately=True
                )
                
                count += 1
                
            except User.DoesNotExist:
                logger.warning(f"User {user_id} not found for bulk notification")
            except Exception as e:
                logger.error(f"Error sending notification to user {user_id}: {e}")
        
        logger.info(f"Sent bulk notification to {count} users")
        return count
        
    except Exception as e:
        logger.error(f"Error sending bulk notification: {e}")
        return 0


@shared_task
def send_digest_notifications():
    """
    Send daily digest notifications to users
    """
    try:
        # Get users who have unread notifications
        users_with_unread = User.objects.filter(
            notifications__is_read=False
        ).distinct()
        
        service = NotificationService()
        count = 0
        
        for user in users_with_unread:
            # Get user preferences
            preferences = service.get_user_preferences(user)
            
            # Check if user wants digest notifications
            digest_prefs = preferences.notification_types.get('digest', {})
            if not digest_prefs.get('enabled', False):
                continue
            
            # Count unread notifications
            unread_count = Notification.objects.filter(
                user=user,
                is_read=False
            ).count()
            
            if unread_count > 0:
                # Send digest notification
                service.create_notification(
                    user=user,
                    title=f"You have {unread_count} unread notifications",
                    message=f"Check your notifications to stay updated on your farm activities.",
                    notification_type=NotificationType.SYSTEM,
                    priority=NotificationPriority.LOW,
                    channels=['email'],
                    data={'unread_count': unread_count, 'digest': True}
                )
                
                count += 1
        
        logger.info(f"Sent digest notifications to {count} users")
        return count
        
    except Exception as e:
        logger.error(f"Error sending digest notifications: {e}")
        return 0


@shared_task
def update_delivery_status(delivery_id: str, status: str, external_id: str = None):
    """
    Update notification delivery status
    
    Args:
        delivery_id: Delivery ID
        status: New status
        external_id: External service message ID
    """
    try:
        delivery = NotificationDelivery.objects.get(id=delivery_id)
        
        delivery.status = status
        if external_id:
            delivery.external_id = external_id
        
        if status == DeliveryStatus.SENT:
            delivery.sent_at = timezone.now()
        elif status == DeliveryStatus.DELIVERED:
            delivery.delivered_at = timezone.now()
        
        delivery.save()
        
        logger.info(f"Updated delivery {delivery_id} status to {status}")
        return True
        
    except NotificationDelivery.DoesNotExist:
        logger.error(f"Delivery {delivery_id} not found")
        return False
    except Exception as e:
        logger.error(f"Error updating delivery status: {e}")
        return False


@shared_task
def process_notification_queue():
    """
    Process pending notifications in queue
    """
    try:
        # Get pending deliveries
        pending_deliveries = NotificationDelivery.objects.filter(
            status=DeliveryStatus.PENDING
        ).select_related('notification')[:100]
        
        service = NotificationService()
        count = 0
        
        for delivery in pending_deliveries:
            try:
                success = service._send_via_channel(
                    delivery.notification,
                    delivery.channel
                )
                
                if success:
                    count += 1
                    
            except Exception as e:
                logger.error(f"Error processing delivery {delivery.id}: {e}")
        
        logger.info(f"Processed {count} pending deliveries")
        return count
        
    except Exception as e:
        logger.error(f"Error processing notification queue: {e}")
        return 0


@shared_task
def generate_notification_report(start_date: str, end_date: str):
    """
    Generate notification statistics report
    
    Args:
        start_date: Start date (ISO format)
        end_date: End date (ISO format)
    """
    try:
        from django.db.models import Count
        from datetime import datetime
        
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        
        # Get notifications in date range
        notifications = Notification.objects.filter(
            created_at__gte=start,
            created_at__lte=end
        )
        
        report = {
            'period': {
                'start': start_date,
                'end': end_date,
            },
            'total_notifications': notifications.count(),
            'by_type': dict(
                notifications.values('notification_type')
                .annotate(count=Count('id'))
                .values_list('notification_type', 'count')
            ),
            'by_priority': dict(
                notifications.values('priority')
                .annotate(count=Count('id'))
                .values_list('priority', 'count')
            ),
            'read_rate': notifications.filter(is_read=True).count() / max(notifications.count(), 1),
        }
        
        # Get delivery stats
        deliveries = NotificationDelivery.objects.filter(
            notification__created_at__gte=start,
            notification__created_at__lte=end
        )
        
        report['delivery_stats'] = {
            'total_deliveries': deliveries.count(),
            'by_channel': dict(
                deliveries.values('channel')
                .annotate(count=Count('id'))
                .values_list('channel', 'count')
            ),
            'by_status': dict(
                deliveries.values('status')
                .annotate(count=Count('id'))
                .values_list('status', 'count')
            ),
            'success_rate': deliveries.filter(
                status__in=[DeliveryStatus.SENT, DeliveryStatus.DELIVERED]
            ).count() / max(deliveries.count(), 1),
        }
        
        logger.info(f"Generated notification report for {start_date} to {end_date}")
        return report
        
    except Exception as e:
        logger.error(f"Error generating notification report: {e}")
        return None
