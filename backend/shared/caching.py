"""
Caching Infrastructure for AgroBridge Microservices

This module provides comprehensive caching strategies including:
- Redis-based distributed caching
- Cache invalidation patterns
- TTL management
- Cache decorators
- Cache warming strategies
"""

import hashlib
import json
import logging
from functools import wraps
from typing import Any, Callable, Optional, Union
from datetime import timedelta

try:
    import redis
    from django.core.cache import cache
    from django.conf import settings
except ImportError:
    redis = None
    cache = None
    settings = None

logger = logging.getLogger(__name__)


class CacheConfig:
    """Cache configuration and TTL settings"""
    
    # Default TTLs (in seconds)
    TTL_SHORT = 60  # 1 minute
    TTL_MEDIUM = 300  # 5 minutes
    TTL_LONG = 1800  # 30 minutes
    TTL_VERY_LONG = 3600  # 1 hour
    TTL_DAY = 86400  # 24 hours
    
    # Cache key prefixes
    PREFIX_USER = "user"
    PREFIX_FARM = "farm"
    PREFIX_PRODUCT = "product"
    PREFIX_ORDER = "order"
    PREFIX_COURSE = "course"
    PREFIX_POST = "post"
    PREFIX_NOTIFICATION = "notification"
    PREFIX_ANALYTICS = "analytics"
    PREFIX_SEARCH = "search"
    PREFIX_API = "api"
    
    # Cache patterns
    PATTERN_LIST = "list"
    PATTERN_DETAIL = "detail"
    PATTERN_COUNT = "count"
    PATTERN_STATS = "stats"


class CacheKeyGenerator:
    """Generate consistent cache keys"""
    
    @staticmethod
    def generate_key(*args, **kwargs) -> str:
        """
        Generate a cache key from arguments
        
        Args:
            *args: Positional arguments
            **kwargs: Keyword arguments
            
        Returns:
            str: Generated cache key
        """
        # Combine all arguments into a string
        key_parts = [str(arg) for arg in args]
        key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
        key_string = ":".join(key_parts)
        
        # Hash if too long
        if len(key_string) > 200:
            key_hash = hashlib.md5(key_string.encode()).hexdigest()
            return f"hash:{key_hash}"
        
        return key_string
    
    @staticmethod
    def user_key(user_id: Union[int, str], pattern: str = "detail") -> str:
        """Generate user cache key"""
        return f"{CacheConfig.PREFIX_USER}:{pattern}:{user_id}"
    
    @staticmethod
    def farm_key(farm_id: Union[int, str], pattern: str = "detail") -> str:
        """Generate farm cache key"""
        return f"{CacheConfig.PREFIX_FARM}:{pattern}:{farm_id}"
    
    @staticmethod
    def product_key(product_id: Union[int, str], pattern: str = "detail") -> str:
        """Generate product cache key"""
        return f"{CacheConfig.PREFIX_PRODUCT}:{pattern}:{product_id}"
    
    @staticmethod
    def order_key(order_id: Union[int, str], pattern: str = "detail") -> str:
        """Generate order cache key"""
        return f"{CacheConfig.PREFIX_ORDER}:{pattern}:{order_id}"
    
    @staticmethod
    def list_key(prefix: str, **filters) -> str:
        """Generate list cache key with filters"""
        filter_str = CacheKeyGenerator.generate_key(**filters)
        return f"{prefix}:{CacheConfig.PATTERN_LIST}:{filter_str}"
    
    @staticmethod
    def stats_key(prefix: str, stat_type: str, **params) -> str:
        """Generate statistics cache key"""
        param_str = CacheKeyGenerator.generate_key(**params)
        return f"{prefix}:{CacheConfig.PATTERN_STATS}:{stat_type}:{param_str}"


class CacheManager:
    """Manage cache operations with Redis backend"""
    
    def __init__(self):
        self.cache = cache
        self.redis_client = None
        self._init_redis()
    
    def _init_redis(self):
        """Initialize Redis client if available"""
        if redis and hasattr(settings, 'REDIS_HOST'):
            try:
                self.redis_client = redis.Redis(
                    host=getattr(settings, 'REDIS_HOST', 'localhost'),
                    port=getattr(settings, 'REDIS_PORT', 6379),
                    db=getattr(settings, 'REDIS_DB', 0),
                    password=getattr(settings, 'REDIS_PASSWORD', None),
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
                # Test connection
                self.redis_client.ping()
                logger.info("Redis cache initialized successfully")
            except Exception as e:
                logger.warning(f"Redis initialization failed: {e}. Falling back to Django cache.")
                self.redis_client = None
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Get value from cache
        
        Args:
            key: Cache key
            default: Default value if key not found
            
        Returns:
            Cached value or default
        """
        try:
            if self.redis_client:
                value = self.redis_client.get(key)
                if value is not None:
                    return json.loads(value)
                return default
            else:
                return self.cache.get(key, default)
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return default
    
    def set(self, key: str, value: Any, ttl: int = CacheConfig.TTL_MEDIUM) -> bool:
        """
        Set value in cache
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
            
        Returns:
            bool: Success status
        """
        try:
            if self.redis_client:
                serialized = json.dumps(value, default=str)
                return self.redis_client.setex(key, ttl, serialized)
            else:
                return self.cache.set(key, value, ttl)
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """
        Delete key from cache
        
        Args:
            key: Cache key
            
        Returns:
            bool: Success status
        """
        try:
            if self.redis_client:
                return bool(self.redis_client.delete(key))
            else:
                return self.cache.delete(key)
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching pattern
        
        Args:
            pattern: Key pattern (e.g., "user:*")
            
        Returns:
            int: Number of keys deleted
        """
        try:
            if self.redis_client:
                keys = self.redis_client.keys(pattern)
                if keys:
                    return self.redis_client.delete(*keys)
                return 0
            else:
                # Django cache doesn't support pattern deletion
                logger.warning("Pattern deletion not supported with Django cache backend")
                return 0
        except Exception as e:
            logger.error(f"Cache delete pattern error for {pattern}: {e}")
            return 0
    
    def exists(self, key: str) -> bool:
        """
        Check if key exists in cache
        
        Args:
            key: Cache key
            
        Returns:
            bool: True if key exists
        """
        try:
            if self.redis_client:
                return bool(self.redis_client.exists(key))
            else:
                return self.cache.get(key) is not None
        except Exception as e:
            logger.error(f"Cache exists error for key {key}: {e}")
            return False
    
    def increment(self, key: str, amount: int = 1) -> int:
        """
        Increment counter in cache
        
        Args:
            key: Cache key
            amount: Amount to increment
            
        Returns:
            int: New value
        """
        try:
            if self.redis_client:
                return self.redis_client.incrby(key, amount)
            else:
                # Django cache doesn't have atomic increment
                value = self.cache.get(key, 0)
                new_value = value + amount
                self.cache.set(key, new_value)
                return new_value
        except Exception as e:
            logger.error(f"Cache increment error for key {key}: {e}")
            return 0
    
    def get_many(self, keys: list) -> dict:
        """
        Get multiple values from cache
        
        Args:
            keys: List of cache keys
            
        Returns:
            dict: Dictionary of key-value pairs
        """
        try:
            if self.redis_client:
                values = self.redis_client.mget(keys)
                result = {}
                for key, value in zip(keys, values):
                    if value is not None:
                        result[key] = json.loads(value)
                return result
            else:
                return self.cache.get_many(keys)
        except Exception as e:
            logger.error(f"Cache get_many error: {e}")
            return {}
    
    def set_many(self, data: dict, ttl: int = CacheConfig.TTL_MEDIUM) -> bool:
        """
        Set multiple values in cache
        
        Args:
            data: Dictionary of key-value pairs
            ttl: Time to live in seconds
            
        Returns:
            bool: Success status
        """
        try:
            if self.redis_client:
                pipe = self.redis_client.pipeline()
                for key, value in data.items():
                    serialized = json.dumps(value, default=str)
                    pipe.setex(key, ttl, serialized)
                pipe.execute()
                return True
            else:
                return self.cache.set_many(data, ttl)
        except Exception as e:
            logger.error(f"Cache set_many error: {e}")
            return False


# Global cache manager instance
cache_manager = CacheManager()


def cached(
    ttl: int = CacheConfig.TTL_MEDIUM,
    key_prefix: str = "",
    key_func: Optional[Callable] = None
):
    """
    Decorator to cache function results
    
    Args:
        ttl: Time to live in seconds
        key_prefix: Prefix for cache key
        key_func: Custom function to generate cache key
        
    Example:
        @cached(ttl=300, key_prefix="user")
        def get_user(user_id):
            return User.objects.get(id=user_id)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                cache_key = CacheKeyGenerator.generate_key(
                    key_prefix or func.__name__,
                    *args,
                    **kwargs
                )
            
            # Try to get from cache
            cached_value = cache_manager.get(cache_key)
            if cached_value is not None:
                logger.debug(f"Cache hit for key: {cache_key}")
                return cached_value
            
            # Execute function
            logger.debug(f"Cache miss for key: {cache_key}")
            result = func(*args, **kwargs)
            
            # Store in cache
            cache_manager.set(cache_key, result, ttl)
            
            return result
        
        return wrapper
    return decorator


def invalidate_cache(key_pattern: str):
    """
    Decorator to invalidate cache after function execution
    
    Args:
        key_pattern: Pattern of keys to invalidate
        
    Example:
        @invalidate_cache("user:*")
        def update_user(user_id, data):
            user = User.objects.get(id=user_id)
            user.update(data)
            return user
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            
            # Invalidate cache
            deleted = cache_manager.delete_pattern(key_pattern)
            logger.info(f"Invalidated {deleted} cache keys matching pattern: {key_pattern}")
            
            return result
        
        return wrapper
    return decorator


class CacheWarmer:
    """Warm up cache with frequently accessed data"""
    
    @staticmethod
    def warm_user_cache(user_ids: list, ttl: int = CacheConfig.TTL_LONG):
        """
        Warm cache with user data
        
        Args:
            user_ids: List of user IDs
            ttl: Time to live
        """
        from authentication.models import User
        
        users = User.objects.filter(id__in=user_ids).values()
        data = {}
        
        for user in users:
            key = CacheKeyGenerator.user_key(user['id'])
            data[key] = dict(user)
        
        cache_manager.set_many(data, ttl)
        logger.info(f"Warmed cache for {len(data)} users")
    
    @staticmethod
    def warm_product_cache(product_ids: list, ttl: int = CacheConfig.TTL_LONG):
        """
        Warm cache with product data
        
        Args:
            product_ids: List of product IDs
            ttl: Time to live
        """
        from marketplace.models import Product
        
        products = Product.objects.filter(id__in=product_ids).values()
        data = {}
        
        for product in products:
            key = CacheKeyGenerator.product_key(product['id'])
            data[key] = dict(product)
        
        cache_manager.set_many(data, ttl)
        logger.info(f"Warmed cache for {len(data)} products")


# Convenience functions
def get_cached(key: str, default: Any = None) -> Any:
    """Get value from cache"""
    return cache_manager.get(key, default)


def set_cached(key: str, value: Any, ttl: int = CacheConfig.TTL_MEDIUM) -> bool:
    """Set value in cache"""
    return cache_manager.set(key, value, ttl)


def delete_cached(key: str) -> bool:
    """Delete key from cache"""
    return cache_manager.delete(key)


def invalidate_pattern(pattern: str) -> int:
    """Invalidate all keys matching pattern"""
    return cache_manager.delete_pattern(pattern)
