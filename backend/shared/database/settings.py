"""
Centralized database settings for all microservices
"""
import os
from .postgres import get_postgres_config, get_timescaledb_config, ServiceDatabaseRouter
from .redis_config import get_redis_cache_config, get_redis_channel_layer_config


def get_databases_config(use_postgres: bool = True) -> dict:
    """
    Get complete database configuration for Django
    
    Args:
        use_postgres: Whether to use PostgreSQL (True) or SQLite (False)
    
    Returns:
        DATABASES configuration dictionary
    """
    if not use_postgres or os.getenv('USE_SQLITE', 'false').lower() == 'true':
        # Development mode with SQLite
        from pathlib import Path
        BASE_DIR = Path(__file__).resolve().parent.parent.parent
        
        return {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }
    
    # Production mode with PostgreSQL per service
    databases = {
        'default': get_postgres_config('default'),
    }
    
    # Add service-specific databases
    services = [
        'authentication', 'users', 'farms', 'marketplace', 'ai_assistant',
        'crop_detection', 'financial', 'learning', 'community', 'iot',
        'notifications', 'analytics', 'scheduling', 'payments', 'blockchain',
        'export_docs', 'emergency', 'storage', 'admin'
    ]
    
    for service in services:
        databases[f'{service}_db'] = get_postgres_config(service)
    
    # Add TimescaleDB for time-series data
    databases['timescale_db'] = get_timescaledb_config('iot')
    
    return databases


def get_caches_config(use_redis: bool = True) -> dict:
    """
    Get cache configuration for Django
    
    Args:
        use_redis: Whether to use Redis (True) or in-memory cache (False)
    
    Returns:
        CACHES configuration dictionary
    """
    if not use_redis or os.getenv('USE_REDIS', 'false').lower() == 'false':
        # Development mode with in-memory cache
        return {
            'default': {
                'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
                'LOCATION': 'unique-snowflake',
            }
        }
    
    # Production mode with Redis
    return {
        'default': get_redis_cache_config('default'),
        'sessions': get_redis_cache_config('sessions'),
        'api_throttle': get_redis_cache_config('throttle'),
    }


def get_channel_layers_config(use_redis: bool = True) -> dict:
    """
    Get Django Channels layer configuration
    
    Args:
        use_redis: Whether to use Redis (True) or in-memory (False)
    
    Returns:
        CHANNEL_LAYERS configuration dictionary
    """
    if not use_redis or os.getenv('USE_REDIS', 'false').lower() == 'false':
        # Development mode with in-memory channel layer
        return {
            'default': {
                'BACKEND': 'channels.layers.InMemoryChannelLayer',
            }
        }
    
    # Production mode with Redis
    return {
        'default': get_redis_channel_layer_config(),
    }


# Database router configuration
DATABASE_ROUTERS = ['shared.database.postgres.ServiceDatabaseRouter']


# Connection pool settings
DATABASE_POOL_SETTINGS = {
    'CONN_MAX_AGE': int(os.getenv('DB_CONN_MAX_AGE', '600')),  # 10 minutes
    'CONN_HEALTH_CHECKS': True,
    'ATOMIC_REQUESTS': True,
}


# Database backup settings
BACKUP_SETTINGS = {
    'ENABLED': os.getenv('DB_BACKUP_ENABLED', 'true').lower() == 'true',
    'SCHEDULE': os.getenv('DB_BACKUP_SCHEDULE', '0 2 * * *'),  # Daily at 2 AM
    'RETENTION_DAYS': int(os.getenv('DB_BACKUP_RETENTION_DAYS', '30')),
    'BACKUP_DIR': os.getenv('DB_BACKUP_DIR', '/backups'),
    'COMPRESSION': os.getenv('DB_BACKUP_COMPRESSION', 'gzip'),
}


# Read replica configuration (for scaling reads)
def get_read_replica_config(service_name: str) -> dict:
    """
    Get read replica configuration for a service
    
    Args:
        service_name: Name of the service
    
    Returns:
        Read replica database configuration
    """
    config = get_postgres_config(service_name)
    config['HOST'] = os.getenv(f'{service_name.upper()}_READ_REPLICA_HOST', config['HOST'])
    config['PORT'] = os.getenv(f'{service_name.upper()}_READ_REPLICA_PORT', config['PORT'])
    return config
