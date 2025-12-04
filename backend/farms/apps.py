from django.apps import AppConfig
import os

class FarmsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'farms'
    
    def ready(self):
        """Called when the app is ready"""
        # Only register service in production or when explicitly enabled
        if os.getenv('REGISTER_SERVICES', 'false').lower() == 'true':
            try:
                from .service_registration import register_farm_service
                register_farm_service()
            except Exception as e:
                print(f"Warning: Could not register farm service with Consul: {e}")
        
        # Import signal handlers if any
        try:
            from . import signals
        except ImportError:
            pass
