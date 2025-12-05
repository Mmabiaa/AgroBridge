from django.apps import AppConfig


class PaymentConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "payment"
    
    def ready(self):
        """
        Initialize payment service on startup
        """
        import os
        
        # Only register service in production/development, not during migrations
        if os.environ.get('RUN_MAIN') == 'true' or os.environ.get('REGISTER_SERVICE') == 'true':
            try:
                from .service_registration import register_service
                register_service()
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Could not register payment service: {e}")
