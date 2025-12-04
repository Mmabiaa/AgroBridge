"""
Analytics Service App Configuration
"""
from django.apps import AppConfig


class AnalyticsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'analytics'
    verbose_name = 'Analytics Service'
    
    def ready(self):
        """Import signals when app is ready"""
        try:
            import analytics.signals
        except ImportError:
            pass
