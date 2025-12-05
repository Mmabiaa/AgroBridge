from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from admin_service.models import AuditLog, UserActivity, PlatformMetrics


class Command(BaseCommand):
    help = 'Clean up old logs and metrics'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=90,
            help='Number of days to keep logs (default: 90)'
        )
        parser.add_argument(
            '--metrics-days',
            type=int,
            default=365,
            help='Number of days to keep metrics (default: 365)'
        )

    def handle(self, *args, **options):
        """Clean up old logs"""
        days = options['days']
        metrics_days = options['metrics_days']
        
        cutoff_date = timezone.now() - timedelta(days=days)
        metrics_cutoff = timezone.now() - timedelta(days=metrics_days)
        
        self.stdout.write(f'Cleaning up logs older than {days} days...')
        
        # Clean up audit logs
        audit_count = AuditLog.objects.filter(
            timestamp__lt=cutoff_date
        ).count()
        
        if audit_count > 0:
            AuditLog.objects.filter(timestamp__lt=cutoff_date).delete()
            self.stdout.write(
                self.style.SUCCESS(
                    f'Deleted {audit_count} old audit logs'
                )
            )
        
        # Clean up user activity
        activity_count = UserActivity.objects.filter(
            timestamp__lt=cutoff_date
        ).count()
        
        if activity_count > 0:
            UserActivity.objects.filter(timestamp__lt=cutoff_date).delete()
            self.stdout.write(
                self.style.SUCCESS(
                    f'Deleted {activity_count} old activity records'
                )
            )
        
        # Clean up old metrics
        metrics_count = PlatformMetrics.objects.filter(
            timestamp__lt=metrics_cutoff
        ).count()
        
        if metrics_count > 0:
            PlatformMetrics.objects.filter(timestamp__lt=metrics_cutoff).delete()
            self.stdout.write(
                self.style.SUCCESS(
                    f'Deleted {metrics_count} old metrics'
                )
            )
        
        if audit_count == 0 and activity_count == 0 and metrics_count == 0:
            self.stdout.write(
                self.style.SUCCESS('No old logs to clean up')
            )
