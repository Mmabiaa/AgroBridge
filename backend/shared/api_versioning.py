"""
API Versioning Implementation
Supports multiple API versions with backward compatibility
"""

import logging
from typing import Optional, Callable, Dict, Any
from functools import wraps
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.versioning import BaseVersioning
from django.urls import path, include
from django.conf import settings

logger = logging.getLogger(__name__)


class APIVersion:
    """API version representation"""
    
    def __init__(self, major: int, minor: int = 0, patch: int = 0):
        self.major = major
        self.minor = minor
        self.patch = patch
    
    def __str__(self) -> str:
        return f"v{self.major}.{self.minor}.{self.patch}"
    
    def __repr__(self) -> str:
        return f"APIVersion({self.major}, {self.minor}, {self.patch})"
    
    def __eq__(self, other) -> bool:
        if not isinstance(other, APIVersion):
            return False
        return (self.major == other.major and 
                self.minor == other.minor and 
                self.patch == other.patch)
    
    def __lt__(self, other) -> bool:
        if not isinstance(other, APIVersion):
            return NotImplemented
        return (self.major, self.minor, self.patch) < (other.major, other.minor, other.patch)
    
    def __le__(self, other) -> bool:
        return self == other or self < other
    
    def __gt__(self, other) -> bool:
        if not isinstance(other, APIVersion):
            return NotImplemented
        return (self.major, self.minor, self.patch) > (other.major, other.minor, other.patch)
    
    def __ge__(self, other) -> bool:
        return self == other or self > other
    
    @classmethod
    def from_string(cls, version_str: str) -> 'APIVersion':
        """
        Parse version string (e.g., 'v1.2.3' or '1.2.3')
        """
        version_str = version_str.lstrip('v')
        parts = version_str.split('.')
        
        major = int(parts[0]) if len(parts) > 0 else 1
        minor = int(parts[1]) if len(parts) > 1 else 0
        patch = int(parts[2]) if len(parts) > 2 else 0
        
        return cls(major, minor, patch)


class URLPathVersioning(BaseVersioning):
    """
    Versioning based on URL path (e.g., /api/v1/users/)
    """
    
    default_version = 'v1'
    allowed_versions = ['v1', 'v2']
    version_param = 'version'
    
    def determine_version(self, request, *args, **kwargs):
        """Extract version from URL path"""
        version = kwargs.get(self.version_param, self.default_version)
        
        if version not in self.allowed_versions:
            raise ValueError(f"Invalid API version: {version}")
        
        return version


class HeaderVersioning(BaseVersioning):
    """
    Versioning based on custom header (e.g., X-API-Version: v1)
    """
    
    default_version = 'v1'
    allowed_versions = ['v1', 'v2']
    header_name = 'X-API-Version'
    
    def determine_version(self, request, *args, **kwargs):
        """Extract version from header"""
        version = request.META.get(f'HTTP_{self.header_name.upper().replace("-", "_")}')
        
        if not version:
            version = self.default_version
        
        if version not in self.allowed_versions:
            raise ValueError(f"Invalid API version: {version}")
        
        return version


class AcceptHeaderVersioning(BaseVersioning):
    """
    Versioning based on Accept header (e.g., Accept: application/vnd.agrobridge.v1+json)
    """
    
    default_version = 'v1'
    allowed_versions = ['v1', 'v2']
    vendor_name = 'agrobridge'
    
    def determine_version(self, request, *args, **kwargs):
        """Extract version from Accept header"""
        accept = request.META.get('HTTP_ACCEPT', '')
        
        # Parse Accept header for version
        if f'vnd.{self.vendor_name}' in accept:
            for allowed_version in self.allowed_versions:
                if f'.{allowed_version}+' in accept:
                    return allowed_version
        
        return self.default_version


class VersionedAPIView(APIView):
    """
    Base class for versioned API views
    """
    
    versioning_class = URLPathVersioning
    
    def get_version_handler(self, version: str) -> Optional[Callable]:
        """
        Get handler method for specific version
        
        Example:
            def get_v1(self, request):
                # Version 1 implementation
                pass
            
            def get_v2(self, request):
                # Version 2 implementation
                pass
        """
        method = request.method.lower()
        handler_name = f"{method}_{version}"
        return getattr(self, handler_name, None)
    
    def dispatch(self, request, *args, **kwargs):
        """Route request to version-specific handler"""
        version = self.determine_version(request, *args, **kwargs)
        handler = self.get_version_handler(version)
        
        if handler:
            return handler(request, *args, **kwargs)
        else:
            # Fall back to default handler
            return super().dispatch(request, *args, **kwargs)


def api_version(min_version: str, max_version: Optional[str] = None, deprecated: bool = False):
    """
    Decorator to specify API version requirements
    
    Args:
        min_version: Minimum supported version
        max_version: Maximum supported version (optional)
        deprecated: Mark endpoint as deprecated
        
    Usage:
        @api_version(min_version='v1', max_version='v2')
        def my_endpoint(request):
            # Endpoint implementation
            pass
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            # Get requested version
            requested_version = getattr(request, 'version', 'v1')
            requested = APIVersion.from_string(requested_version)
            
            # Check version compatibility
            min_ver = APIVersion.from_string(min_version)
            
            if requested < min_ver:
                return JsonResponse({
                    'error': 'API version not supported',
                    'min_version': str(min_ver),
                    'requested_version': str(requested)
                }, status=400)
            
            if max_version:
                max_ver = APIVersion.from_string(max_version)
                if requested > max_ver:
                    return JsonResponse({
                        'error': 'API version not supported',
                        'max_version': str(max_ver),
                        'requested_version': str(requested)
                    }, status=400)
            
            # Add deprecation warning if applicable
            response = func(request, *args, **kwargs)
            
            if deprecated and hasattr(response, '__setitem__'):
                response['X-API-Deprecated'] = 'true'
                response['X-API-Deprecation-Info'] = 'This endpoint is deprecated and will be removed in a future version'
            
            return response
        
        return wrapper
    return decorator


class APIVersionRouter:
    """
    Router for managing versioned API endpoints
    """
    
    def __init__(self):
        self.routes: Dict[str, Dict[str, Any]] = {}
    
    def register(
        self,
        version: str,
        path_pattern: str,
        view: Callable,
        name: Optional[str] = None,
        deprecated: bool = False
    ):
        """
        Register a versioned endpoint
        
        Args:
            version: API version (e.g., 'v1')
            path_pattern: URL pattern
            view: View function or class
            name: URL name
            deprecated: Mark as deprecated
        """
        if version not in self.routes:
            self.routes[version] = {}
        
        self.routes[version][path_pattern] = {
            'view': view,
            'name': name,
            'deprecated': deprecated
        }
        
        logger.info(f"Registered {version} endpoint: {path_pattern}")
    
    def get_urls(self, version: str) -> list:
        """
        Get URL patterns for a specific version
        
        Args:
            version: API version
            
        Returns:
            List of URL patterns
        """
        if version not in self.routes:
            return []
        
        patterns = []
        for path_pattern, config in self.routes[version].items():
            patterns.append(
                path(path_pattern, config['view'], name=config['name'])
            )
        
        return patterns
    
    def get_all_urls(self) -> list:
        """
        Get all versioned URL patterns
        
        Returns:
            List of URL patterns with version prefixes
        """
        patterns = []
        
        for version in self.routes.keys():
            version_patterns = self.get_urls(version)
            patterns.append(
                path(f'api/{version}/', include(version_patterns))
            )
        
        return patterns


# Singleton router
_router = None


def get_api_router() -> APIVersionRouter:
    """Get singleton API version router"""
    global _router
    if _router is None:
        _router = APIVersionRouter()
    return _router


# Deprecation policy
class DeprecationPolicy:
    """
    Manages API deprecation lifecycle
    """
    
    def __init__(self):
        self.deprecated_endpoints: Dict[str, Dict[str, Any]] = {}
    
    def deprecate(
        self,
        endpoint: str,
        version: str,
        removal_version: str,
        alternative: Optional[str] = None,
        reason: Optional[str] = None
    ):
        """
        Mark an endpoint as deprecated
        
        Args:
            endpoint: Endpoint path
            version: Version where deprecation starts
            removal_version: Version where endpoint will be removed
            alternative: Alternative endpoint to use
            reason: Reason for deprecation
        """
        self.deprecated_endpoints[endpoint] = {
            'version': version,
            'removal_version': removal_version,
            'alternative': alternative,
            'reason': reason,
            'deprecated_at': str(datetime.now())
        }
        
        logger.warning(f"Deprecated endpoint: {endpoint} (removal in {removal_version})")
    
    def is_deprecated(self, endpoint: str) -> bool:
        """Check if endpoint is deprecated"""
        return endpoint in self.deprecated_endpoints
    
    def get_deprecation_info(self, endpoint: str) -> Optional[Dict[str, Any]]:
        """Get deprecation information for endpoint"""
        return self.deprecated_endpoints.get(endpoint)
    
    def get_all_deprecated(self) -> Dict[str, Dict[str, Any]]:
        """Get all deprecated endpoints"""
        return self.deprecated_endpoints


# Singleton deprecation policy
_deprecation_policy = None


def get_deprecation_policy() -> DeprecationPolicy:
    """Get singleton deprecation policy"""
    global _deprecation_policy
    if _deprecation_policy is None:
        _deprecation_policy = DeprecationPolicy()
    return _deprecation_policy


# Example usage

# Version 1 endpoint
@api_version(min_version='v1', max_version='v1', deprecated=True)
def get_users_v1(request):
    """Legacy user list endpoint"""
    return JsonResponse({
        'users': [
            {'id': 1, 'name': 'John Doe'},
            {'id': 2, 'name': 'Jane Smith'}
        ]
    })


# Version 2 endpoint with enhanced features
@api_version(min_version='v2')
def get_users_v2(request):
    """Enhanced user list endpoint with pagination"""
    return JsonResponse({
        'users': [
            {'id': 1, 'name': 'John Doe', 'email': 'john@example.com'},
            {'id': 2, 'name': 'Jane Smith', 'email': 'jane@example.com'}
        ],
        'pagination': {
            'page': 1,
            'per_page': 10,
            'total': 2
        }
    })


# API version info endpoint
def api_version_info(request):
    """
    Get API version information
    """
    return JsonResponse({
        'current_version': 'v2',
        'supported_versions': ['v1', 'v2'],
        'deprecated_versions': ['v1'],
        'deprecation_policy': {
            'v1': {
                'deprecated_since': '2025-01-01',
                'removal_date': '2026-01-01',
                'migration_guide': '/docs/migration/v1-to-v2'
            }
        }
    })
