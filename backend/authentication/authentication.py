"""
Custom JWT authentication classes for AgroBridge
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework import exceptions
from django.contrib.auth import get_user_model
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class CustomJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication with additional security checks
    """
    
    def authenticate(self, request):
        """
        Authenticate request with additional security checks
        """
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)
        
        # Additional security checks
        if not self.is_user_valid(user, request):
            raise exceptions.AuthenticationFailed('User authentication failed')
        
        # Update last activity
        user.last_activity = timezone.now()
        user.save(update_fields=['last_activity'])
        
        return (user, validated_token)
    
    def is_user_valid(self, user, request):
        """
        Perform additional user validation checks
        """
        # Check if user is active
        if not user.is_active:
            logger.warning(f"Inactive user attempted access: {user.username}")
            return False
        
        # Check if account is locked
        if user.is_account_locked:
            logger.warning(f"Locked account attempted access: {user.username}")
            return False
        
        # Check IP restrictions (if implemented)
        # This could be expanded to include IP whitelisting/blacklisting
        
        return True
    
    def get_user(self, validated_token):
        """
        Get user from validated token with additional checks
        """
        try:
            user_id = validated_token['user_id']
        except KeyError:
            raise InvalidToken('Token contained no recognizable user identification')

        try:
            user = User.objects.get(**{'id': user_id})
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('User not found')

        return user


class TokenBlacklistMixin:
    """
    Mixin for handling token blacklisting
    """
    
    @staticmethod
    def blacklist_user_tokens(user):
        """
        Blacklist all outstanding tokens for a user
        """
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
        
        try:
            outstanding_tokens = OutstandingToken.objects.filter(user=user)
            for token in outstanding_tokens:
                try:
                    token.blacklist()
                except Exception as e:
                    logger.error(f"Failed to blacklist token: {e}")
        except Exception as e:
            logger.error(f"Failed to blacklist user tokens: {e}")
    
    @staticmethod
    def cleanup_expired_tokens():
        """
        Clean up expired tokens from the database
        """
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
        from django.utils import timezone
        
        try:
            expired_tokens = OutstandingToken.objects.filter(
                expires_at__lt=timezone.now()
            )
            count = expired_tokens.count()
            expired_tokens.delete()
            logger.info(f"Cleaned up {count} expired tokens")
        except Exception as e:
            logger.error(f"Failed to cleanup expired tokens: {e}")


class SecurityMiddleware:
    """
    Security middleware for additional JWT token checks
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Pre-process request
        self.process_request(request)
        
        response = self.get_response(request)
        
        # Post-process response
        self.process_response(request, response)
        
        return response
    
    def process_request(self, request):
        """
        Process incoming request for security checks
        """
        # Check for suspicious activity patterns
        # This could include rate limiting, IP checking, etc.
        pass
    
    def process_response(self, request, response):
        """
        Process outgoing response
        """
        # Add security headers specific to JWT
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Add user-specific security headers
            response['X-User-Role'] = request.user.role
            response['X-User-Verified'] = str(request.user.is_verified)
        
        return response