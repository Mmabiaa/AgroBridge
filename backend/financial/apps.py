"""
Financial Management Service App Configuration
"""
from django.apps import AppConfig


class FinancialConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'financial'
    verbose_name = 'Financial Management'
    
    def ready(self):
        """
        Import signals when app is ready
        """
        try:
            import financial.signals  # noqa
        except ImportError:
            pass
