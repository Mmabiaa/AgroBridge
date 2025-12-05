import redis
import json
import hashlib
from django.conf import settings
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

class AgriculturalCache:
    """
    Caching service for frequent agricultural queries with fallback
    """
    
    def __init__(self):
        self.redis_available = False
        self.redis_client = None
        
        try:
            # Get Redis settings with defaults
            redis_host = getattr(settings, 'REDIS_HOST', 'localhost')
            redis_port = getattr(settings, 'REDIS_PORT', 6379)
            redis_db = getattr(settings, 'REDIS_DB', 0)
            redis_password = getattr(settings, 'REDIS_PASSWORD', None)
            
            self.redis_client = redis.Redis(
                host=redis_host,
                port=redis_port,
                db=redis_db,
                password=redis_password,
                decode_responses=True,
                socket_connect_timeout=5,  # 5 second timeout
                socket_timeout=5
            )
            
            # Test connection
            self.redis_client.ping()
            self.redis_available = True
            logger.info("Redis cache initialized successfully")
            
        except Exception as e:
            logger.warning(f"Redis not available, using Django cache fallback: {str(e)}")
            self.redis_available = False
        
        self.default_timeout = getattr(settings, 'AI_CACHE_TIMEOUT', 3600)  # 1 hour
    
    def _generate_cache_key(self, query: str, context: dict = None) -> str:
        """Generate unique cache key for agricultural query"""
        key_data = f"agrigpt:{query}"
        if context:
            key_data += f":{json.dumps(context, sort_keys=True)}"
        
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get_cached_response(self, query: str, context: dict = None):
        """Get cached AI response for agricultural query"""
        try:
            cache_key = self._generate_cache_key(query, context)
            
            if self.redis_available:
                cached_data = self.redis_client.get(cache_key)
            else:
                # Fallback to Django cache
                cached_data = cache.get(cache_key)
            
            if cached_data:
                logger.info(f"Cache HIT for query: {query[:50]}...")
                if isinstance(cached_data, str):
                    return json.loads(cached_data)
                return cached_data
            
            logger.info(f"Cache MISS for query: {query[:50]}...")
            return None
            
        except Exception as e:
            logger.error(f"Cache get error: {str(e)}")
            return None
    
    def set_cached_response(self, query: str, response: dict, context: dict = None, timeout: int = None):
        """Cache AI response for agricultural query"""
        try:
            cache_key = self._generate_cache_key(query, context)
            timeout = timeout or self.default_timeout
            
            if self.redis_available:
                self.redis_client.setex(
                    cache_key,
                    timeout,
                    json.dumps(response)
                )
            else:
                # Fallback to Django cache
                cache.set(cache_key, response, timeout)
            
            logger.info(f"Cached response for query: {query[:50]}...")
            
        except Exception as e:
            logger.error(f"Cache set error: {str(e)}")
    
    def get_popular_queries(self, limit: int = 10):
        """Get most frequently cached queries"""
        try:
            if not self.redis_available:
                logger.warning("Popular queries tracking requires Redis")
                return {}
                
            popular_pattern = "agrigpt:*"
            keys = self.redis_client.keys(popular_pattern)
            
            # Count frequency
            query_counts = {}
            for key in keys[:100]:  # Limit for performance
                try:
                    query_part = key.split(':')[1] if ':' in key else key
                    query_counts[query_part] = query_counts.get(query_part, 0) + 1
                except (IndexError, AttributeError):
                    continue
            
            return dict(sorted(query_counts.items(), key=lambda x: x[1], reverse=True)[:limit])
            
        except Exception as e:
            logger.error(f"Error getting popular queries: {str(e)}")
            return {}
    
    def invalidate_pattern(self, pattern: str):
        """Invalidate cache entries matching pattern"""
        try:
            if self.redis_available:
                keys = self.redis_client.keys(pattern)
                if keys:
                    self.redis_client.delete(*keys)
                    logger.info(f"Invalidated {len(keys)} cache entries for pattern: {pattern}")
            else:
                logger.warning("Cache invalidation requires Redis")
        except Exception as e:
            logger.error(f"Cache invalidation error: {str(e)}")

# Global cache instance with safe initialization
try:
    ag_cache = AgriculturalCache()
except Exception as e:
    logger.error(f"Failed to initialize AgriculturalCache: {str(e)}")
    # Create a dummy cache that does nothing
    class DummyCache:
        def get_cached_response(self, *args, **kwargs): return None
        def set_cached_response(self, *args, **kwargs): pass
        def get_popular_queries(self, *args, **kwargs): return {}
        def invalidate_pattern(self, *args, **kwargs): pass
    ag_cache = DummyCache()