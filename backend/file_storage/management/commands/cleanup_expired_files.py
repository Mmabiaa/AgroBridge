"""Management command to clean up expired files."""

from django.core.management.base import BaseCommand
from django.utils import timezone
from file_storage.models import StoredFile, ChunkedUpload


class Command(BaseCommand):
    """Clean up expired files and uploads."""
    
    help = 'Clean up expired files and chunked uploads'
    
    def add_arguments(self, parser):
        """Add command arguments."""
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )
    
    def handle(self, *args, **options):
        """Execute command."""
        dry_run = options['dry_run']
        now = timezone.now()
        
        # Find expired files
        expired_files = StoredFile.objects.filter(
            expires_at__lte=now,
            status='AVAILABLE'
        )
        
        file_count = expired_files.count()
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'Would delete {file_count} expired files'
                )
            )
        else:
            # Mark as deleted
            expired_files.update(status='DELETED')
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully marked {file_count} files as deleted'
                )
            )
        
        # Find expired chunked uploads
        expired_uploads = ChunkedUpload.objects.filter(
            expires_at__lte=now,
            status__in=['INITIATED', 'IN_PROGRESS']
        )
        
        upload_count = expired_uploads.count()
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'Would expire {upload_count} chunked uploads'
                )
            )
        else:
            # Mark as expired
            expired_uploads.update(status='EXPIRED')
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully expired {upload_count} chunked uploads'
                )
            )
        
        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS('Cleanup completed successfully')
            )
