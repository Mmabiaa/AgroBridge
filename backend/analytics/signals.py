"""
Analytics Service Signals
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender='analytics.Prediction')
def update_model_performance_on_verification(sender, instance, created, **kwargs):
    """
    Update model performance when a prediction is verified
    """
    if not created and instance.actual_value and instance.is_accurate is not None:
        from .tasks import update_model_performance_task
        
        try:
            update_model_performance_task.delay(str(instance.model.id))
            logger.info(f"Queued model performance update for {instance.model.name}")
        except Exception as e:
            logger.error(f"Failed to queue model performance update: {e}")


@receiver(post_save, sender='analytics.Insight')
def notify_user_of_new_insight(sender, instance, created, **kwargs):
    """
    Notify user when a new insight is created
    """
    if created and instance.priority in ['high', 'critical']:
        # Send notification to user
        try:
            from notifications.services import NotificationService
            
            notification_service = NotificationService()
            notification_service.create_notification(
                user=instance.user,
                notification_type='insight_generated',
                title=f'New {instance.get_priority_display()} Priority Insight',
                message=instance.title,
                data={
                    'insight_id': str(instance.id),
                    'insight_type': instance.insight_type,
                    'priority': instance.priority
                }
            )
            
            logger.info(f"Notification sent for insight {instance.id}")
            
        except Exception as e:
            logger.error(f"Failed to send notification for insight: {e}")
