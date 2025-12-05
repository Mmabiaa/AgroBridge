"""Management command to check and update expired certificates."""

from django.core.management.base import BaseCommand
from django.utils import timezone
from blockchain.models import Certificate


class Command(BaseCommand):
    """Check and update expired certificates."""
    
    help = 'Check for expired certificates and update their status'
    
    def handle(self, *args, **options):
        """Execute command."""
        self.stdout.write('Checking for expired certificates...')
        
        # Find certificates that are expired but not marked as such
        expired_certs = Certificate.objects.filter(
            expiry_date__lt=timezone.now(),
            status__in=['issued', 'verified', 'pending']
        )
        
        count = expired_certs.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('✓ No expired certificates found'))
            return
        
        # Update status
        expired_certs.update(status='expired')
        
        self.stdout.write(self.style.SUCCESS(f'✓ Updated {count} expired certificates'))
        
        # List expired certificates
        for cert in expired_certs[:10]:  # Show first 10
            self.stdout.write(
                f"  - {cert.certificate_number}: {cert.title} (expired {cert.expiry_date})"
            )
        
        if count > 10:
            self.stdout.write(f"  ... and {count - 10} more")
