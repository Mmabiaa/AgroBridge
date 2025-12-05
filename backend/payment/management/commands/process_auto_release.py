"""
Management command to process automatic escrow releases
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import logging

from payment.models import Escrow
from payment.services import PaymentService

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Process automatic escrow releases for held funds past release date'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be released without actually releasing'
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        self.stdout.write('Processing automatic escrow releases...')
        
        # Find escrows that are held and past their release date
        now = timezone.now()
        
        escrows_to_release = Escrow.objects.filter(
            status='held',
            release_date__lte=now
        )
        
        if not escrows_to_release.exists():
            self.stdout.write('No escrows ready for auto-release')
            return
        
        self.stdout.write(
            f'Found {escrows_to_release.count()} escrows ready for release'
        )
        
        service = PaymentService()
        released_count = 0
        failed_count = 0
        
        for escrow in escrows_to_release:
            if dry_run:
                self.stdout.write(
                    f'[DRY RUN] Would release: {escrow.reference} - '
                    f'{escrow.amount} {escrow.currency}'
                )
                continue
            
            try:
                service.release_escrow(escrow)
                released_count += 1
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Released: {escrow.reference} - '
                        f'{escrow.amount} {escrow.currency}'
                    )
                )
                
                logger.info(f'Auto-released escrow: {escrow.reference}')
                
            except Exception as e:
                failed_count += 1
                
                self.stdout.write(
                    self.style.ERROR(
                        f'Failed to release {escrow.reference}: {e}'
                    )
                )
                
                logger.error(
                    f'Failed to auto-release escrow {escrow.reference}: {e}'
                )
        
        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nProcessed: {released_count} released, {failed_count} failed'
                )
            )
