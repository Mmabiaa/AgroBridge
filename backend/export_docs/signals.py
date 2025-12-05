"""Signal handlers for export documentation service."""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import ExportDocument, CustomsSubmission


@receiver(pre_save, sender=ExportDocument)
def set_document_expiry(sender, instance, **kwargs):
    """Set document expiry date based on document type."""
    if not instance.expires_at and instance.template:
        # Set expiry based on document type
        expiry_days = {
            'INVOICE': 90,
            'CERTIFICATE_ORIGIN': 180,
            'PHYTOSANITARY': 30,
            'PACKING_LIST': 90,
            'BILL_LADING': 365,
            'EXPORT_LICENSE': 365,
            'CUSTOMS_DECLARATION': 180,
        }
        
        days = expiry_days.get(instance.template.document_type, 90)
        instance.expires_at = timezone.now() + timedelta(days=days)


@receiver(post_save, sender=ExportDocument)
def notify_document_status_change(sender, instance, created, **kwargs):
    """Send notification when document status changes."""
    if not created:
        # For simplicity, send notification on specific statuses
        # In production, use django-model-utils FieldTracker
        if instance.status in ['APPROVED', 'REJECTED', 'SUBMITTED', 'ACCEPTED']:
            try:
                from notifications.services import NotificationService
                
                status_messages = {
                    'APPROVED': 'Your export document has been approved',
                    'REJECTED': 'Your export document has been rejected',
                    'SUBMITTED': 'Your export document has been submitted to customs',
                    'ACCEPTED': 'Your export document has been accepted by customs',
                }
                
                message = status_messages.get(instance.status)
                if message:
                    NotificationService.create_notification(
                        user=instance.user,
                        notification_type='DOCUMENT_STATUS',
                        title='Export Document Update',
                        message=f"{message}: {instance.document_number}",
                        data={
                            'document_id': str(instance.id),
                            'document_number': instance.document_number,
                            'status': instance.status
                        }
                    )
            except ImportError:
                pass  # Notification service not available


@receiver(post_save, sender=CustomsSubmission)
def notify_submission_status(sender, instance, created, **kwargs):
    """Send notification when submission status changes."""
    if not created:
        try:
            from notifications.services import NotificationService
            
            if instance.status == 'SUCCESS':
                NotificationService.create_notification(
                    user=instance.document.user,
                    notification_type='CUSTOMS_SUBMISSION',
                    title='Customs Submission Successful',
                    message=f"Document {instance.document.document_number} successfully submitted to customs",
                    data={
                        'submission_id': str(instance.id),
                        'submission_reference': instance.submission_reference
                    }
                )
            elif instance.status == 'FAILED':
                NotificationService.create_notification(
                    user=instance.document.user,
                    notification_type='CUSTOMS_SUBMISSION',
                    title='Customs Submission Failed',
                    message=f"Failed to submit document {instance.document.document_number} to customs",
                    priority='HIGH',
                    data={
                        'submission_id': str(instance.id),
                        'error': instance.error_message
                    }
                )
        except ImportError:
            pass  # Notification service not available
