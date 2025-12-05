"""
Community Service App Configuration
"""
from django.apps import AppConfig


class CommunityConfig(AppConfig):
    """Configuration for the Community service."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'community'
    verbose_name = 'Community Service'

    def ready(self):
        """Import signals when the app is ready."""
        import community.signals  # noqa
        # Register service with Consul
        try:
            from community.service_registration import register_service
            register_service()
        except Exception as e:
            print(f"Failed to register community service: {e}")
