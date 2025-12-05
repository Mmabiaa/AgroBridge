from django.apps import AppConfig


class IotServiceConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "iot_service"
    verbose_name = 'IoT Service'
    
    def ready(self):
        """Import signal handlers when app is ready"""
        try:
            import iot_service.signals  # noqa
        except ImportError:
            pass
