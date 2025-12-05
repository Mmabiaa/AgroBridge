"""Management command to check and mark expired documents."""

from django.core.management.base import BaseCommand
from django.utils import timezone
from export_docs.models import ExportDocument


class Command(BaseCommand):
    """Check and mark expired export documents."""
    
    help = 'Check and mark expired export documents'
    
    def handle(self, *args, **options):
        """Execute the command."""
        self.stdout.write('Checking for expired documents...')
        
        # Find documents that have expired
        expired_documents = ExportDocument.objects.filter(
            expires_at__lte=timezone.now(),
            status__in=['DRAFT', 'PENDING_REVIEW', 'APPROVED']
        )
        
        count = expired_documents.count()
        
        if count > 0:
            # Mark as expired
            expired_documents.update(status='EXPIRED')
            
            self.stdout.write(
                self.style.SUCCESS(f'Marked {count} document(s) as expired')
            )
            
            # Send notifications
            from notifications.services import NotificationService
            
            for document in expired_documents:
                NotificationService.create_notification(
                    user=document.user,
                    notification_type='DOCUMENT_EXPIRED',
                    title='Export Document Expired',
                    message=f'Document {document.document_number} has expired',
                    priority='MEDIUM',
                    data={
                        'document_id': str(document.id),
                        'document_number': document.document_number
                    }
                )
        else:
            self.stdout.write('No expired documents found')
