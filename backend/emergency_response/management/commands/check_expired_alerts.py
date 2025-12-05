"""Management command to check and expire old alerts."""

from django.core.management.base import BaseCommand
from django.utils import timezone
from emergency_response.models import EmergencyAlert


class Command(BaseCommand):
    """Check and expire old emergency alerts."""
    
    help = 'Check and expire old emergency alerts'
    
    def handle(self, *args, **options):
        """Execute the command."""
        self.stdout.write('Checking for expired alerts...')
        
        # Find alerts that have expired
        expired_alerts = EmergencyAlert.objects.filter(
            status='ACTIVE',
            expires_at__lte=timezone.now()
        )
        
        count = expired_alerts.count()
        
        if count > 0:
            # Mark as expired
            expired_alerts.update(status='EXPIRED')
            
            self.stdout.write(
                self.style.SUCCESS(f'Marked {count} alert(s) as expired')
            )
            
            # Send notifications
            try:
                from notifications.services import NotificationService
                
                for alert in expired_alerts:
                    # Notify users who acknowledged the alert
                    for ack in alert.acknowledgments.all():
                        NotificationService.create_notification(
                            user=ack.user,
                            notification_type='ALERT_EXPIRED',
                            title='Alert Expired',
                            message=f'The alert "{alert.title}" has expired',
                            data={
                                'alert_id': str(alert.id),
                                'alert_number': alert.alert_number
                            }
                        )
            except ImportError:
                pass
        else:
            self.stdout.write('No expired alerts found')
