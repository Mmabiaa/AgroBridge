"""Signal handlers for file storage service."""

from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver
from .models import StoredFile, StorageQuota


@receiver(post_delete, sender=StoredFile)
def cleanup_file_on_delete(sender, instance, **kwargs):
    """Clean up file from storage when deleted from database."""
    # Note: In production, this should be handled by a background task
    # to avoid blocking the request
    pass


@receiver(pre_save, sender=StoredFile)
def update_quota_on_status_change(sender, instance, **kwargs):
    """Update quota when file status changes."""
    if instance.pk:
        try:
            old_instance = StoredFile.objects.get(pk=instance.pk)
            
            # If file is being deleted or archived, update quota
            if old_instance.status in ['AVAILABLE', 'PROCESSING'] and \
               instance.status in ['DELETED', 'ARCHIVED']:
                
                try:
                    quota = StorageQuota.objects.get(user=instance.uploaded_by)
                    quota.used_storage -= instance.file_size
                    quota.file_count -= 1
                    quota.save()
                except StorageQuota.DoesNotExist:
                    pass
        
        except StoredFile.DoesNotExist:
            pass
