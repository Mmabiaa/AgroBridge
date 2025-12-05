"""
Management command to clean up expired JWT tokens
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Clean up expired JWT tokens from the database'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Remove tokens expired more than N days ago (default: 7)'
        )
        
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )
    
    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        
        cutoff_date = timezone.now() - timezone.timedelta(days=days)
        
        # Find expired outstanding tokens
        expired_outstanding = OutstandingToken.objects.filter(
            expires_at__lt=cutoff_date
        )
        
        # Find old blacklisted tokens
        expired_blacklisted = BlacklistedToken.objects.filter(
            token__expires_at__lt=cutoff_date
        )
        
        outstanding_count = expired_outstanding.count()
        blacklisted_count = expired_blacklisted.count()
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would delete {outstanding_count} outstanding tokens '
                    f'and {blacklisted_count} blacklisted tokens expired before {cutoff_date}'
                )
            )
        else:
            # Delete expired tokens
            expired_outstanding.delete()
            expired_blacklisted.delete()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully deleted {outstanding_count} outstanding tokens '
                    f'and {blacklisted_count} blacklisted tokens'
                )
            )
            
            logger.info(
                f'Token cleanup completed: {outstanding_count} outstanding, '
                f'{blacklisted_count} blacklisted tokens removed'
            )