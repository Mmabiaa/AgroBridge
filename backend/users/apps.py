from django.apps import AppConfig
import os

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'
    
    def ready(self):
        """Called when the app is ready"""
        # Only register service in production or when explicitly enabled
        if os.getenv('REGISTER_SERVICES', 'false').lower() == 'true':
            try:
                from .service_registration import register_user_service
                register_user_service()
            except Exception as e:
                print(f"Warning: Could not register user service with Consul: {e}")
        
        # Import signal handlers
        try:
            from . import signals
        except ImportError:
            pass
