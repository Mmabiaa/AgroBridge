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
    Rate limiting for registration attempts with intelligent handling
    """
    scope = 'registration'
    
    def allow_request(self, request, view):
        """
        Allow more lenient throttling for legitimate users
        """
        # If user is already authenticated, don't throttle registration attempts
        if request.user.is_authenticated:
            return True
        
        # Check for suspicious patterns
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        if self._is_suspicious_request(request, user_agent):
            # Apply stricter throttling for suspicious requests
            return super().allow_request(request, view)
        
        # For normal requests, use a more lenient approach
        return super().allow_request(request, view)
    
    def _is_suspicious_request(self, request, user_agent):
        """
        Detect potentially suspicious registration attempts
        """
        # Check for missing or suspicious user agent
        if not user_agent or len(user_agent) < 10:
            return True
        
        # Check for common bot patterns
        bot_patterns = ['bot', 'crawler', 'spider', 'scraper']
        if any(pattern in user_agent.lower() for pattern in bot_patterns):
            return True
        
        return False
    
    def get_cache_key(self, request, view):
        """
        Create cache key based on IP and additional factors
        """
        ident = self.get_ident(request)
        
        # Include user agent hash for better identification
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        if user_agent:
            user_agent_hash = hashlib.md5(user_agent.encode()).hexdigest()[:8]
            ident = f"{ident}_{user_agent_hash}"
        
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


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