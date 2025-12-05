"""Django app configuration for blockchain service."""

from django.apps import AppConfig


class BlockchainConfig(AppConfig):
    """Configuration for blockchain service."""
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'blockchain'
    verbose_name = 'Blockchain Service'
    
    def ready(self):
        """Import signals when app is ready."""
        import blockchain.signals  # noqa
