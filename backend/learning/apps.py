from django.apps import AppConfig


class LearningConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'learning'
    verbose_name = 'Learning Management'

    def ready(self):
        """Import signals when app is ready"""
        import learning.signals
        import learning.service_registration
