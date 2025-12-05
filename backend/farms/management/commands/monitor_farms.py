"""
Management command to monitor farms and send alerts
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from farms.models import Farm, FarmActivity
from farms.analytics import FarmPerformanceMonitor
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Monitor farms and send alerts for important events'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--send-emails',
            action='store_true',
            help='Send email notifications to farm owners'
        )
        
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually doing it'
        )
    
    def handle(self, *args, **options):
        send_emails = options['send_emails']
        dry_run = options['dry_run']
        
        self.stdout.write("Starting farm monitoring...")
        
        # Update overdue activities
        self.update_overdue_activities(dry_run)
        
        # Check all farms for alerts
        farms_with_alerts = 0
        total_alerts = 0
        
        for farm in Farm.objects.filter(is_active=True):
            monitor = FarmPerformanceMonitor(farm)
            alerts = monitor.get_performance_alerts()
            
            if alerts:
                farms_with_alerts += 1
                total_alerts += len(alerts)
                
                self.stdout.write(
                    f"Farm '{farm.name}' has {len(alerts)} alerts:"
                )
                
                for alert in alerts:
                    self.stdout.write(f"  - {alert['type'].upper()}: {alert['message']}")
                
                # Send email notification if requested
                if send_emails and not dry_run:
                    self.send_alert_email(farm, alerts)
        
        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f"Monitoring complete: {farms_with_alerts} farms with {total_alerts} total alerts"
            )
        )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING("DRY RUN: No actual changes were made")
            )
    
    def update_overdue_activities(self, dry_run):
        """Update status of overdue activities"""
        overdue_activities = FarmActivity.objects.filter(
            status__in=['planned', 'in_progress'],
            scheduled_date__lt=timezone.now()
        )
        
        count = overdue_activities.count()
        
        if count > 0:
            self.stdout.write(f"Found {count} overdue activities")
            
            if not dry_run:
                overdue_activities.update(status='overdue')
                self.stdout.write(f"Updated {count} activities to overdue status")
        else:
            self.stdout.write("No overdue activities found")
    
    def send_alert_email(self, farm, alerts):
        """Send email alert to farm owner"""
        try:
            owner = farm.owner
            
            # Prepare email content
            subject = f"AgroBridge Alert: {farm.name} needs attention"
            
            message_lines = [
                f"Hello {owner.first_name or owner.username},",
                "",
                f"Your farm '{farm.name}' has the following alerts:",
                ""
            ]
            
            for alert in alerts:
                message_lines.append(f"• {alert['message']}")
            
            message_lines.extend([
                "",
                "Please log in to your AgroBridge account to take action.",
                "",
                "Best regards,",
                "The AgroBridge Team"
            ])
            
            message = "\n".join(message_lines)
            
            # Send email
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [owner.email],
                fail_silently=False
            )
            
            logger.info(f"Alert email sent to {owner.email} for farm {farm.name}")
            
        except Exception as e:
            logger.error(f"Failed to send alert email for farm {farm.name}: {e}")
            self.stdout.write(
                self.style.ERROR(f"Failed to send email for {farm.name}: {e}")
            )