"""Signal handlers for emergency response service."""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import EmergencyAlert, IncidentReport


@receiver(pre_save, sender=EmergencyAlert)
def set_alert_defaults(sender, instance, **kwargs):
    """Set default values for alert."""
    # Set default expiry if not provided
    if not instance.expires_at and instance.status == 'ACTIVE':
        # Default expiry based on alert type
        expiry_days = {
            'WEATHER': 3,
            'PEST': 14,
            'DISEASE': 14,
            'FLOOD': 7,
            'DROUGHT': 30,
            'FIRE': 1,
            'SECURITY': 7,
            'MARKET': 7,
            'OTHER': 7,
        }
        
        days = expiry_days.get(instance.alert_type, 7)
        instance.expires_at = timezone.now() + timedelta(days=days)


@receiver(post_save, sender=EmergencyAlert)
def notify_alert_status_change(sender, instance, created, **kwargs):
    """Send notifications when alert status changes."""
    if created and instance.status == 'ACTIVE':
        # Alert was created and is active - already broadcasted in view
        pass
    elif not created:
        # Check if status changed to resolved
        if instance.status == 'RESOLVED':
            try:
                from notifications.services import NotificationService
                from .services import AlertService
                
                # Notify users who acknowledged the alert
                users = [ack.user for ack in instance.acknowledgments.all()]
                
                for user in users:
                    NotificationService.create_notification(
                        user=user,
                        notification_type='ALERT_RESOLVED',
                        title=f"Alert Resolved: {instance.title}",
                        message=f"The {instance.get_alert_type_display()} alert has been resolved.",
                        data={
                            'alert_id': str(instance.id),
                            'alert_number': instance.alert_number
                        }
                    )
            except ImportError:
                pass


@receiver(post_save, sender=IncidentReport)
def notify_incident_status_change(sender, instance, created, **kwargs):
    """Send notifications when incident status changes."""
    if created:
        # Notify admins of new incident report
        try:
            from notifications.services import NotificationService
            from django.contrib.auth import get_user_model
            
            User = get_user_model()
            admins = User.objects.filter(is_staff=True)
            
            for admin in admins:
                NotificationService.create_notification(
                    user=admin,
                    notification_type='NEW_INCIDENT',
                    title='New Incident Report',
                    message=f"New {instance.get_incident_type_display()} report from {instance.region}",
                    priority='MEDIUM',
                    data={
                        'incident_id': str(instance.id),
                        'report_number': instance.report_number
                    }
                )
        except ImportError:
            pass
    
    elif not created:
        # Notify reporter of status changes
        if instance.status in ['VERIFIED', 'RESOLVED', 'REJECTED']:
            try:
                from notifications.services import NotificationService
                
                status_messages = {
                    'VERIFIED': 'Your incident report has been verified',
                    'RESOLVED': 'Your incident report has been resolved',
                    'REJECTED': 'Your incident report was not verified'
                }
                
                message = status_messages.get(instance.status)
                if message:
                    NotificationService.create_notification(
                        user=instance.reporter,
                        notification_type='INCIDENT_STATUS',
                        title='Incident Report Update',
                        message=f"{message}: {instance.title}",
                        data={
                            'incident_id': str(instance.id),
                            'report_number': instance.report_number,
                            'status': instance.status
                        }
                    )
            except ImportError:
                pass
