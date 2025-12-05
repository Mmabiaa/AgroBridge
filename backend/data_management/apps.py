from django.apps import AppConfig


class DataManagementConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'data_management'
    verbose_name = 'Data Management Service'

    def ready(self):
        """Import signal handlers when app is ready."""
        import data_management.signals  # noqa
