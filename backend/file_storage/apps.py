"""Django app configuration for file storage service."""

from django.apps import AppConfig


class FileStorageConfig(AppConfig):
    """Configuration for file storage service."""
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'file_storage'
    verbose_name = 'File Storage Service'
    
    def ready(self):
        """Import signals when app is ready."""
        try:
            import file_storage.signals  # noqa
        except ImportError:
            pass  # Signals not yet available
