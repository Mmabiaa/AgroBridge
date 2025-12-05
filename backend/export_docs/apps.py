"""Django app configuration for export documentation service."""

from django.apps import AppConfig


class ExportDocsConfig(AppConfig):
    """Configuration for export documentation service."""
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'export_docs'
    verbose_name = 'Export Documentation Service'
    
    def ready(self):
        """Import signals when app is ready."""
        try:
            import export_docs.signals  # noqa
        except ImportError:
            pass  # Signals not yet available
