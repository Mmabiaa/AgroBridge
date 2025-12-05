"""
Redis configuration for caching and session management
"""
import os
import redis
from redis.sentinel import Sentinel
from redis.cluster import RedisCluster
import logging

logger = logging.getLogger(__name__)


class RedisConnectionManager:
    """Redis connection manager with support for standalone, sentinel, and cluster modes"""
    
    _instances = {}
    
    def __init__(self, service_name: str = 'default'):
        """
        Initialize Redis connection
        
        Args:
            service_name: Name of the service using Redis
        """
        self.service_name = service_name
        self.client = None
        self.mode = os.getenv('REDIS_MODE', 'standalone')  # standalone, sentinel, cluster
        self._connect()
    
    def _connect(self):
        """Establish Redis connection based on mode"""
        try:
            if self.mode == 'cluster':
                self._connect_cluster()
            elif self.mode == 'sentinel':
                self._connect_sentinel()
            else:
                self._connect_standalone()
            
            # Test connection
            self.client.ping()
            logger.info(f"Redis connected successfully in {self.mode} mode for service: {self.service_name}")
            
        except Exception as e:
            logger.error(f"Redis connection failed for service {self.service_name}: {e}")
            raise
    
    def _connect_standalone(self):
        """Connect to standalone Redis instance"""
        self.client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', '6379')),
            db=int(os.getenv(f'{self.service_name.upper()}_REDIS_DB', '0')),
            password=os.getenv('REDIS_PASSWORD', None),
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
            health_check_interval=30,
            max_connections=int(os.getenv('REDIS_MAX_CONNECTIONS', '50')),
        )
    
    def _connect_sentinel(self):
        """Connect to Redis Sentinel for high availability"""
        sentinel_hosts = os.getenv('REDIS_SENTINEL_HOSTS', 'localhost:26379').split(',')
        sentinel_list = [tuple(host.split(':')) for host in sentinel_hosts]
        
        sentinel = Sentinel(
            sentinel_list,
            socket_timeout=5,
            password=os.getenv('REDIS_PASSWORD', None),
        )
        
        master_name = os.getenv('REDIS_MASTER_NAME', 'mymaster')
        self.client = sentinel.master_for(
            master_name,
            socket_timeout=5,
            decode_responses=True,
            db=int(os.getenv(f'{self.service_name.upper()}_REDIS_DB', '0')),
        )
    
    def _connect_cluster(self):
        """Connect to Redis Cluster"""
        startup_nodes = []
        cluster_hosts = os.getenv('REDIS_CLUSTER_HOSTS', 'localhost:7000,localhost:7001,localhost:7002').split(',')
        
        for host in cluster_hosts:
            host_parts = host.split(':')
            startup_nodes.append({
                'host': host_parts[0],
                'port': int(host_parts[1]) if len(host_parts) > 1 else 7000
            })
        
        self.client = RedisCluster(
            startup_nodes=startup_nodes,
            decode_responses=True,
            skip_full_coverage_check=True,
            password=os.getenv('REDIS_PASSWORD', None),
            socket_timeout=5,
            socket_connect_timeout=5,
            max_connections=int(os.getenv('REDIS_MAX_CONNECTIONS', '50')),
        )
    
    @classmethod
    def get_instance(cls, service_name: str = 'default'):
        """
        Get or create Redis connection instance (singleton per service)
        
        Args:
            service_name: Name of the service
        
        Returns:
            RedisConnectionManager instance
        """
        if service_name not in cls._instances:
            cls._instances[service_name] = cls(service_name)
        return cls._instances[service_name]
    
    def get_client(self):
        """Get Redis client"""
        return self.client
    
    def close(self):
        """Close Redis connection"""
        if self.client:
            self.client.close()
            logger.info(f"Redis connection closed for service: {self.service_name}")


# Django cache configuration for Redis
def get_redis_cache_config(service_name: str = 'default') -> dict:
    """
    Get Django cache configuration for Redis
    
    Args:
        service_name: Name of the service
    
    Returns:
        Cache configuration dictionary
    """
    mode = os.getenv('REDIS_MODE', 'standalone')
    
    if mode == 'cluster':
        # Redis Cluster configuration
        return {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': os.getenv('REDIS_CLUSTER_HOSTS', 'redis://localhost:7000,redis://localhost:7001').split(','),
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'CONNECTION_POOL_KWARGS': {
                    'max_connections': int(os.getenv('REDIS_MAX_CONNECTIONS', '50')),
                    'retry_on_timeout': True,
                },
                'SOCKET_CONNECT_TIMEOUT': 5,
                'SOCKET_TIMEOUT': 5,
                'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
                'IGNORE_EXCEPTIONS': True,  # Don't crash if Redis is down
            },
            'KEY_PREFIX': f'{service_name}',
            'TIMEOUT': int(os.getenv('CACHE_TIMEOUT', '300')),  # 5 minutes default
        }
    else:
        # Standalone or Sentinel configuration
        redis_url = os.getenv(
            'REDIS_URL',
            f"redis://{os.getenv('REDIS_HOST', 'localhost')}:{os.getenv('REDIS_PORT', '6379')}/{os.getenv(f'{service_name.upper()}_REDIS_DB', '0')}"
        )
        
        return {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': redis_url,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'PASSWORD': os.getenv('REDIS_PASSWORD', None),
                'CONNECTION_POOL_KWARGS': {
                    'max_connections': int(os.getenv('REDIS_MAX_CONNECTIONS', '50')),
                    'retry_on_timeout': True,
                },
                'SOCKET_CONNECT_TIMEOUT': 5,
                'SOCKET_TIMEOUT': 5,
                'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
                'IGNORE_EXCEPTIONS': True,
            },
            'KEY_PREFIX': f'{service_name}',
            'TIMEOUT': int(os.getenv('CACHE_TIMEOUT', '300')),
        }


# Django Channels layer configuration for Redis
def get_redis_channel_layer_config() -> dict:
    """
    Get Django Channels layer configuration for Redis
    
    Returns:
        Channel layer configuration dictionary
    """
    mode = os.getenv('REDIS_MODE', 'standalone')
    
    if mode == 'cluster':
        # For cluster mode, use the first node as the primary
        hosts = os.getenv('REDIS_CLUSTER_HOSTS', 'localhost:7000').split(',')
        host_parts = hosts[0].split(':')
        host = host_parts[0]
        port = int(host_parts[1]) if len(host_parts) > 1 else 7000
    else:
        host = os.getenv('REDIS_HOST', 'localhost')
        port = int(os.getenv('REDIS_PORT', '6379'))
    
    return {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [(host, port)],
            'capacity': int(os.getenv('CHANNELS_CAPACITY', '1000')),
            'expiry': int(os.getenv('CHANNELS_EXPIRY', '60')),
        },
    }


# Cache key patterns for different services
CACHE_KEY_PATTERNS = {
    'user_profile': 'user:profile:{user_id}',
    'user_preferences': 'user:preferences:{user_id}',
    'farm_data': 'farm:{farm_id}',
    'product_listing': 'product:{product_id}',
    'marketplace_search': 'marketplace:search:{query_hash}',
    'sensor_data': 'sensor:{device_id}:latest',
    'analytics_dashboard': 'analytics:dashboard:{user_id}',
    'notification_count': 'notifications:count:{user_id}',
    'rate_limit': 'ratelimit:{identifier}:{endpoint}',
    'session': 'session:{session_id}',
}


def get_cache_key(pattern_name: str, **kwargs) -> str:
    """
    Generate cache key from pattern
    
    Args:
        pattern_name: Name of the cache key pattern
        **kwargs: Values to format into the pattern
    
    Returns:
        Formatted cache key
    """
    pattern = CACHE_KEY_PATTERNS.get(pattern_name)
    if not pattern:
        raise ValueError(f"Unknown cache key pattern: {pattern_name}")
    
    return pattern.format(**kwargs)
