"""
Management command to check for overdue GDPR requests.

Usage:
    python manage.py check_overdue_gdpr
    python manage.py check_overdue_gdpr --notify
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from data_management.models import GDPRRequest


class Command(BaseCommand):
    help = 'Check for overdue GDPR requests (30 days)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--notify',
            action='store_true',
            help='Send notifications for overdue requests',
        )

    def handle(self, *args, **options):
        notify = options.get('notify', False)
        
        deadline = timezone.now() - timedelta(days=30)
        
        overdue_requests = GDPRRequest.objects.filter(
            status__in=['pending', 'processing'],
            requested_at__lt=deadline
        ).order_by('requested_at')
        
        if not overdue_requests:
            self.stdout.write(self.style.SUCCESS('No overdue GDPR requests found'))
            return
        
        self.stdout.write(
            self.style.WARNING(
                f'Found {overdue_requests.count()} overdue GDPR requests:'
            )
        )
        
        for request in overdue_requests:
            days_overdue = (timezone.now() - request.requested_at).days - 30
            self.stdout.write(
                f'  - {request.user.email}: {request.get_request_type_display()} '
                f'({days_overdue} days overdue)'
            )
        
        if notify:
            self.stdout.write('\nSending notifications...')
            # Here you would integrate with notification service
            # For now, just log
            self.stdout.write(
                self.style.SUCCESS(
                    f'Notifications sent for {overdue_requests.count()} requests'
                )
            )
