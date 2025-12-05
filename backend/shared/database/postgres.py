"""
PostgreSQL database configuration with connection pooling
"""
import os
from typing import Dict, Any


def get_postgres_config(service_name: str = 'default') -> Dict[str, Any]:
    """
    Get PostgreSQL configuration for a service
    
    Args:
        service_name: Name of the microservice (e.g., 'authentication', 'marketplace')
    
    Returns:
        Database configuration dictionary
    """
    # Each service can have its own database for isolation
    db_name = os.getenv(f'{service_name.upper()}_DB_NAME', f'agrobridge_{service_name}')
    
    return {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': db_name,
        'USER': os.getenv('POSTGRES_USER', 'agrobridge'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD', 'agrobridge_password'),
        'HOST': os.getenv('POSTGRES_HOST', 'localhost'),
        'PORT': os.getenv('POSTGRES_PORT', '5432'),
        'CONN_MAX_AGE': int(os.getenv('DB_CONN_MAX_AGE', '600')),  # Connection pooling
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000',  # 30 second query timeout
        },
        'ATOMIC_REQUESTS': True,  # Wrap each request in a transaction
        'AUTOCOMMIT': True,
        'CONN_HEALTH_CHECKS': True,  # Check connection health before each request
    }


def get_timescaledb_config(service_name: str = 'iot') -> Dict[str, Any]:
    """
    Get TimescaleDB configuration for time-series data
    
    Args:
        service_name: Name of the service using TimescaleDB
    
    Returns:
        Database configuration dictionary
    """
    db_name = os.getenv(f'{service_name.upper()}_TIMESCALE_DB_NAME', f'agrobridge_{service_name}_timeseries')
    
    return {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': db_name,
        'USER': os.getenv('TIMESCALE_USER', os.getenv('POSTGRES_USER', 'agrobridge')),
        'PASSWORD': os.getenv('TIMESCALE_PASSWORD', os.getenv('POSTGRES_PASSWORD', 'agrobridge_password')),
        'HOST': os.getenv('TIMESCALE_HOST', os.getenv('POSTGRES_HOST', 'localhost')),
        'PORT': os.getenv('TIMESCALE_PORT', os.getenv('POSTGRES_PORT', '5432')),
        'CONN_MAX_AGE': int(os.getenv('DB_CONN_MAX_AGE', '600')),
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=60000',  # 60 second timeout for analytics queries
        },
        'ATOMIC_REQUESTS': False,  # Time-series data doesn't need transactions
        'AUTOCOMMIT': True,
        'CONN_HEALTH_CHECKS': True,
    }


# Database router for directing queries to appropriate databases
class ServiceDatabaseRouter:
    """
    Database router to direct queries to service-specific databases
    """
    
    # Map apps to their database aliases
    SERVICE_DB_MAPPING = {
        'authentication': 'authentication_db',
        'users': 'users_db',
        'farms': 'farms_db',
        'marketplace': 'marketplace_db',
        'ai_assistant': 'ai_assistant_db',
        'crop_detection': 'crop_detection_db',
        'financial': 'financial_db',
        'learning': 'learning_db',
        'community': 'community_db',
        'iot': 'iot_db',
        'notifications': 'notifications_db',
        'analytics': 'analytics_db',
        'scheduling': 'scheduling_db',
        'payments': 'payments_db',
        'blockchain': 'blockchain_db',
        'export_docs': 'export_docs_db',
        'emergency': 'emergency_db',
        'storage': 'storage_db',
        'admin': 'admin_db',
    }
    
    def db_for_read(self, model, **hints):
        """Direct read operations to the appropriate database"""
        app_label = model._meta.app_label
        return self.SERVICE_DB_MAPPING.get(app_label, 'default')
    
    def db_for_write(self, model, **hints):
        """Direct write operations to the appropriate database"""
        app_label = model._meta.app_label
        return self.SERVICE_DB_MAPPING.get(app_label, 'default')
    
    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow relations only within the same database
        Cross-service relations should use service-to-service communication
        """
        db1 = self.SERVICE_DB_MAPPING.get(obj1._meta.app_label, 'default')
        db2 = self.SERVICE_DB_MAPPING.get(obj2._meta.app_label, 'default')
        return db1 == db2
    
    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """Ensure migrations run on the correct database"""
        target_db = self.SERVICE_DB_MAPPING.get(app_label, 'default')
        return db == target_db
