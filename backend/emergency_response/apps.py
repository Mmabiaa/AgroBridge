"""Django app configuration for emergency response service."""

from django.apps import AppConfig


class EmergencyResponseConfig(AppConfig):
    """Configuration for emergency response service."""
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'emergency_response'
    verbose_name = 'Emergency Response Service'
    
    def ready(self):
        """Import signals when app is ready."""
        try:
            import emergency_response.signals  # noqa
        except ImportError:
            pass  # Signals not yet available
