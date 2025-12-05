from django.apps import AppConfig


class AdminServiceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'admin_service'
    verbose_name = 'Admin Service'

    def ready(self):
        """Import signals when app is ready"""
        try:
            import admin_service.signals
        except ImportError:
            pass
