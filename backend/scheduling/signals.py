"""
Signals for scheduling service
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
import logging

from .models import Task

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Task)
def update_task_status(sender, instance, **kwargs):
    """
    Log when tasks become overdue (but don't change status automatically)
    The is_overdue property handles the logic without changing the database
    """
    # Just log overdue tasks, don't change status
    if instance.status in ['pending', 'in_progress']:
        if instance.due_date < timezone.now():
            logger.info(f"Task {instance.id} is now overdue")


@receiver(post_save, sender=Task)
def handle_task_completion(sender, instance, created, **kwargs):
    """
    Handle task completion events
    Note: The mark_complete() method already generates the next instance,
    so we don't need to do it here to avoid duplicates
    """
    if not created and instance.status == 'completed':
        # Task was just completed - log it
        if instance.is_recurring and not instance.parent_task:
            logger.info(f"Recurring task {instance.id} completed")


@receiver(post_save, sender=Task)
def send_task_notifications(sender, instance, created, **kwargs):
    """
    Send notifications for task events
    """
    try:
        from notifications.services import NotificationService
        
        if created:
            # Notify user about new task
            NotificationService.create_notification(
                recipient=instance.user,
                title="New Task Created",
                message=f"Task '{instance.title}' is due on {instance.due_date.strftime('%Y-%m-%d %H:%M')}",
                notification_type='task_created',
                priority=instance.priority,
                data={
                    'task_id': str(instance.id),
                    'due_date': instance.due_date.isoformat(),
                    'category': instance.category
                }
            )
            
            # Notify assigned users
            for user in instance.assigned_to.all():
                if user != instance.user:
                    NotificationService.create_notification(
                        recipient=user,
                        title="Task Assigned to You",
                        message=f"You have been assigned to task '{instance.title}'",
                        notification_type='task_assigned',
                        priority=instance.priority,
                        data={
                            'task_id': str(instance.id),
                            'due_date': instance.due_date.isoformat(),
                            'assigned_by': instance.user.username
                        }
                    )
        
        elif instance.status == 'completed':
            # Notify about task completion
            NotificationService.create_notification(
                recipient=instance.user,
                title="Task Completed",
                message=f"Task '{instance.title}' has been completed",
                notification_type='task_completed',
                priority='low',
                data={
                    'task_id': str(instance.id),
                    'completed_at': instance.completed_at.isoformat() if instance.completed_at else None,
                    'completed_by': instance.completed_by.username if instance.completed_by else None
                }
            )
    
    except Exception as e:
        logger.error(f"Failed to send task notification: {str(e)}")
        # Don't raise - notification failure shouldn't break task creation
