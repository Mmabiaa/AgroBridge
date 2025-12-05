"""
CDN Integration for AgroBridge

This module provides:
- CDN configuration for static assets
- Image delivery optimization
- Cache header management
- Asset versioning
- CloudFront/CloudFlare integration
"""

import hashlib
import logging
import mimetypes
from typing import Optional, Dict
from urllib.parse import urljoin

try:
    from django.conf import settings
    from django.core.files.storage import Storage
    from django.utils.encoding import filepath_to_uri
except ImportError:
    settings = None
    Storage = None
    filepath_to_uri = None

logger = logging.getLogger(__name__)


class CDNConfig:
    """CDN configuration settings"""
    
    # Cache durations (in seconds)
    CACHE_FOREVER = 31536000  # 1 year
    CACHE_LONG = 2592000  # 30 days
    CACHE_MEDIUM = 86400  # 1 day
    CACHE_SHORT = 3600  # 1 hour
    CACHE_NONE = 0
    
    # Asset types and their cache durations
    ASSET_CACHE_DURATIONS = {
        # Static assets (versioned)
        '.js': CACHE_FOREVER,
        '.css': CACHE_FOREVER,
        '.woff': CACHE_FOREVER,
        '.woff2': CACHE_FOREVER,
        '.ttf': CACHE_FOREVER,
        '.eot': CACHE_FOREVER,
        
        # Images (versioned)
        '.jpg': CACHE_LONG,
        '.jpeg': CACHE_LONG,
        '.png': CACHE_LONG,
        '.gif': CACHE_LONG,
        '.svg': CACHE_LONG,
        '.webp': CACHE_LONG,
        '.ico': CACHE_LONG,
        
        # Documents
        '.pdf': CACHE_MEDIUM,
        '.doc': CACHE_MEDIUM,
        '.docx': CACHE_MEDIUM,
        
        # Videos
        '.mp4': CACHE_LONG,
        '.webm': CACHE_LONG,
        
        # Default
        'default': CACHE_SHORT,
    }
    
    # Content types that should be compressed
    COMPRESSIBLE_TYPES = {
        'text/html',
        'text/css',
        'text/javascript',
        'application/javascript',
        'application/json',
        'application/xml',
        'text/xml',
        'image/svg+xml',
    }


class CDNManager:
    """Manage CDN operations"""
    
    def __init__(self):
        self.cdn_domain = getattr(settings, 'CDN_DOMAIN', None)
        self.cdn_enabled = getattr(settings, 'CDN_ENABLED', False)
        self.static_url = getattr(settings, 'STATIC_URL', '/static/')
        self.media_url = getattr(settings, 'MEDIA_URL', '/media/')
    
    def get_cdn_url(self, path: str, asset_type: str = 'static') -> str:
        """
        Get CDN URL for an asset
        
        Args:
            path: Asset path
            asset_type: Type of asset ('static' or 'media')
            
        Returns:
            str: Full CDN URL
        """
        if not self.cdn_enabled or not self.cdn_domain:
            # Return local URL
            base_url = self.static_url if asset_type == 'static' else self.media_url
            return urljoin(base_url, path)
        
        # Return CDN URL
        cdn_base = f"https://{self.cdn_domain}/{asset_type}/"
        return urljoin(cdn_base, path)
    
    def get_static_url(self, path: str) -> str:
        """Get CDN URL for static asset"""
        return self.get_cdn_url(path, 'static')
    
    def get_media_url(self, path: str) -> str:
        """Get CDN URL for media asset"""
        return self.get_cdn_url(path, 'media')
    
    def get_cache_headers(self, file_path: str) -> Dict[str, str]:
        """
        Get appropriate cache headers for a file
        
        Args:
            file_path: Path to file
            
        Returns:
            dict: Cache headers
        """
        # Get file extension
        ext = self._get_extension(file_path)
        
        # Get cache duration
        cache_duration = CDNConfig.ASSET_CACHE_DURATIONS.get(
            ext,
            CDNConfig.ASSET_CACHE_DURATIONS['default']
        )
        
        # Build headers
        headers = {
            'Cache-Control': f'public, max-age={cache_duration}',
        }
        
        # Add immutable flag for long-cached assets
        if cache_duration >= CDNConfig.CACHE_LONG:
            headers['Cache-Control'] += ', immutable'
        
        # Add content type
        content_type = mimetypes.guess_type(file_path)[0]
        if content_type:
            headers['Content-Type'] = content_type
        
        # Add compression hint
        if content_type in CDNConfig.COMPRESSIBLE_TYPES:
            headers['Content-Encoding'] = 'gzip'
        
        return headers
    
    def _get_extension(self, file_path: str) -> str:
        """Get file extension"""
        return '.' + file_path.rsplit('.', 1)[-1].lower() if '.' in file_path else ''
    
    def generate_asset_version(self, content: bytes) -> str:
        """
        Generate version hash for asset
        
        Args:
            content: Asset content
            
        Returns:
            str: Version hash
        """
        return hashlib.md5(content).hexdigest()[:8]
    
    def get_versioned_url(self, path: str, version: Optional[str] = None) -> str:
        """
        Get versioned URL for cache busting
        
        Args:
            path: Asset path
            version: Version string (optional)
            
        Returns:
            str: Versioned URL
        """
        if not version:
            version = getattr(settings, 'ASSET_VERSION', 'v1')
        
        if '?' in path:
            return f"{path}&v={version}"
        return f"{path}?v={version}"


class ImageOptimizer:
    """Optimize images for CDN delivery"""
    
    # Image quality settings
    QUALITY_HIGH = 90
    QUALITY_MEDIUM = 75
    QUALITY_LOW = 60
    
    # Image size presets
    SIZE_THUMBNAIL = (150, 150)
    SIZE_SMALL = (300, 300)
    SIZE_MEDIUM = (600, 600)
    SIZE_LARGE = (1200, 1200)
    SIZE_XLARGE = (2400, 2400)
    
    @staticmethod
    def get_responsive_urls(image_path: str, cdn_manager: CDNManager) -> Dict[str, str]:
        """
        Get responsive image URLs for different sizes
        
        Args:
            image_path: Original image path
            cdn_manager: CDN manager instance
            
        Returns:
            dict: Dictionary of size -> URL
        """
        base_path = image_path.rsplit('.', 1)[0]
        ext = image_path.rsplit('.', 1)[1] if '.' in image_path else 'jpg'
        
        return {
            'thumbnail': cdn_manager.get_media_url(f"{base_path}_thumb.{ext}"),
            'small': cdn_manager.get_media_url(f"{base_path}_small.{ext}"),
            'medium': cdn_manager.get_media_url(f"{base_path}_medium.{ext}"),
            'large': cdn_manager.get_media_url(f"{base_path}_large.{ext}"),
            'original': cdn_manager.get_media_url(image_path),
        }
    
    @staticmethod
    def get_srcset(image_path: str, cdn_manager: CDNManager) -> str:
        """
        Generate srcset attribute for responsive images
        
        Args:
            image_path: Original image path
            cdn_manager: CDN manager instance
            
        Returns:
            str: srcset attribute value
        """
        urls = ImageOptimizer.get_responsive_urls(image_path, cdn_manager)
        
        return (
            f"{urls['small']} 300w, "
            f"{urls['medium']} 600w, "
            f"{urls['large']} 1200w, "
            f"{urls['original']} 2400w"
        )


class CompressionManager:
    """Manage response compression"""
    
    @staticmethod
    def should_compress(content_type: str, size: int) -> bool:
        """
        Determine if response should be compressed
        
        Args:
            content_type: Response content type
            size: Response size in bytes
            
        Returns:
            bool: True if should compress
        """
        # Don't compress small responses
        if size < 1024:  # 1KB
            return False
        
        # Check if content type is compressible
        return content_type in CDNConfig.COMPRESSIBLE_TYPES
    
    @staticmethod
    def get_compression_level(size: int) -> int:
        """
        Get appropriate compression level based on size
        
        Args:
            size: Content size in bytes
            
        Returns:
            int: Compression level (1-9)
        """
        if size < 10240:  # 10KB
            return 6  # Medium compression
        elif size < 102400:  # 100KB
            return 5  # Balanced
        else:
            return 4  # Faster compression for large files


class CacheInvalidator:
    """Invalidate CDN cache"""
    
    def __init__(self):
        self.cdn_provider = getattr(settings, 'CDN_PROVIDER', None)
        self.cdn_api_key = getattr(settings, 'CDN_API_KEY', None)
    
    def invalidate_path(self, path: str) -> bool:
        """
        Invalidate CDN cache for a path
        
        Args:
            path: Path to invalidate
            
        Returns:
            bool: Success status
        """
        if not self.cdn_provider:
            logger.warning("CDN provider not configured")
            return False
        
        try:
            if self.cdn_provider == 'cloudfront':
                return self._invalidate_cloudfront(path)
            elif self.cdn_provider == 'cloudflare':
                return self._invalidate_cloudflare(path)
            else:
                logger.warning(f"Unsupported CDN provider: {self.cdn_provider}")
                return False
        except Exception as e:
            logger.error(f"CDN invalidation failed: {e}")
            return False
    
    def _invalidate_cloudfront(self, path: str) -> bool:
        """Invalidate CloudFront cache"""
        # Implementation would use boto3
        logger.info(f"CloudFront invalidation: {path}")
        return True
    
    def _invalidate_cloudflare(self, path: str) -> bool:
        """Invalidate CloudFlare cache"""
        # Implementation would use CloudFlare API
        logger.info(f"CloudFlare invalidation: {path}")
        return True
    
    def invalidate_pattern(self, pattern: str) -> bool:
        """
        Invalidate CDN cache for a pattern
        
        Args:
            pattern: Path pattern (e.g., "/images/*")
            
        Returns:
            bool: Success status
        """
        logger.info(f"Invalidating CDN pattern: {pattern}")
        return self.invalidate_path(pattern)


# Global instances
cdn_manager = CDNManager()
cache_invalidator = CacheInvalidator()


# Convenience functions
def get_static_url(path: str) -> str:
    """Get CDN URL for static asset"""
    return cdn_manager.get_static_url(path)


def get_media_url(path: str) -> str:
    """Get CDN URL for media asset"""
    return cdn_manager.get_media_url(path)


def get_versioned_url(path: str, version: Optional[str] = None) -> str:
    """Get versioned URL for cache busting"""
    return cdn_manager.get_versioned_url(path, version)


def get_responsive_image_urls(image_path: str) -> Dict[str, str]:
    """Get responsive image URLs"""
    return ImageOptimizer.get_responsive_urls(image_path, cdn_manager)


def invalidate_cdn_cache(path: str) -> bool:
    """Invalidate CDN cache for a path"""
    return cache_invalidator.invalidate_path(path)
