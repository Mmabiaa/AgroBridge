"""
Scheduling app configuration
"""
from django.apps import AppConfig


class SchedulingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'scheduling'
    verbose_name = 'Scheduling Service'
    
    def ready(self):
        """Import signals when app is ready"""
        import scheduling.signals
