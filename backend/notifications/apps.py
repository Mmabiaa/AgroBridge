"""
Notification Service Django App Configuration
"""

from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    """Configuration for the Notifications service"""
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'
    verbose_name = 'Notification Service'
    
    def ready(self):
        """Initialize service when Django starts"""
        # Import signal handlers
        from . import signals
        
        # Register service with Consul
        from .service_registration import register_service
        register_service()