"""
Custom throttle classes for authentication endpoints
"""
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from django.core.cache import cache
from django.utils import timezone
import hashlib


class LoginRateThrottle(AnonRateThrottle):
    """
    Rate limiting for login attempts
    """
    scope = 'login'
    
    def get_cache_key(self, request, view):
        """
        Create cache key based on IP and username/email
        """
        if request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        
        # Include username/email in the key for more specific rate limiting
        username = request.data.get('username', '')
        if username:
            username_hash = hashlib.md5(username.encode()).hexdigest()
            ident = f"{ident}_{username_hash}"
        
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class RegistrationRateThrottle(AnonRateThrottle):
    """
    Rate limiting for registration attempts
    """
    scope = 'registration'


class PasswordResetRateThrottle(AnonRateThrottle):
    """
    Rate limiting for password reset requests
    """
    scope = 'password_reset'
    
    def get_cache_key(self, request, view):
        """
        Create cache key based on IP and email
        """
        ident = self.get_ident(request)
        
        # Include email in the key for more specific rate limiting
        email = request.data.get('email', '')
        if email:
            email_hash = hashlib.md5(email.lower().encode()).hexdigest()
            ident = f"{ident}_{email_hash}"
        
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class EmailVerificationRateThrottle(AnonRateThrottle):
    """
    Rate limiting for email verification attempts
    """
    scope = 'email_verification'


class UserActionRateThrottle(UserRateThrottle):
    """
    Rate limiting for authenticated user actions
    """
    scope = 'user_actions'


class SecurityEventTracker:
    """
    Track security events for monitoring and alerting
    """
    
    @staticmethod
    def track_failed_login(request, username):
        """
        Track failed login attempts
        """
        ip = SecurityEventTracker.get_client_ip(request)
        cache_key = f"failed_login_{ip}_{username}"
        
        # Get current count
        count = cache.get(cache_key, 0)
        count += 1
        
        # Store for 1 hour
        cache.set(cache_key, count, 3600)
        
        # Log security event
        if count >= 5:
            # Could trigger alert here
            pass
    
    @staticmethod
    def track_suspicious_activity(request, activity_type, details=None):
        """
        Track suspicious activities
        """
        ip = SecurityEventTracker.get_client_ip(request)
        timestamp = timezone.now().isoformat()
        
        # Log to security log
        import logging
        security_logger = logging.getLogger('security')
        security_logger.warning(
            f"Suspicious activity: {activity_type} from {ip} at {timestamp}. "
            f"Details: {details}"
        )
    
    @staticmethod
    def get_client_ip(request):
        """
        Get client IP address
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip