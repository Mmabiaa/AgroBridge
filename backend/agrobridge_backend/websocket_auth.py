"""
WebSocket authentication middleware for Django Channels
"""
import logging
from urllib.parse import parse_qs
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import UntypedToken, AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

logger = logging.getLogger(__name__)
User = get_user_model()


class JWTAuthMiddleware(BaseMiddleware):
    """
    JWT authentication middleware for WebSocket connections
    """
    
    def __init__(self, inner):
        super().__init__(inner)
    
    async def __call__(self, scope, receive, send):
        # Only process WebSocket connections
        if scope['type'] != 'websocket':
            return await super().__call__(scope, receive, send)
        
        # Get token from query parameters
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        # Authenticate user
        scope['user'] = await self.get_user_from_token(token)
        
        return await super().__call__(scope, receive, send)
    
    @database_sync_to_async
    def get_user_from_token(self, token):
        """Get user from JWT token"""
        if not token:
            return AnonymousUser()
        
        try:
            # Validate token
            UntypedToken(token)
            
            # Decode token to get user
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            
            # Get user
            user = User.objects.get(id=user_id)
            return user
            
        except (InvalidToken, TokenError, User.DoesNotExist) as e:
            logger.warning(f"WebSocket authentication failed: {str(e)}")
            return AnonymousUser()


class TokenAuthMiddleware(BaseMiddleware):
    """
    Alternative token-based authentication middleware
    """
    
    def __init__(self, inner):
        super().__init__(inner)
    
    async def __call__(self, scope, receive, send):
        # Only process WebSocket connections
        if scope['type'] != 'websocket':
            return await super().__call__(scope, receive, send)
        
        # Try multiple token sources
        token = self.get_token_from_scope(scope)
        
        # Authenticate user
        scope['user'] = await self.authenticate_token(token)
        
        return await super().__call__(scope, receive, send)
    
    def get_token_from_scope(self, scope):
        """Extract token from various sources in the scope"""
        # Try query parameters first
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        if token:
            return token
        
        # Try headers
        headers = dict(scope.get('headers', []))
        
        # Check Authorization header
        auth_header = headers.get(b'authorization', b'').decode()
        if auth_header.startswith('Bearer '):
            return auth_header[7:]  # Remove 'Bearer ' prefix
        
        # Check custom token header
        token_header = headers.get(b'x-auth-token', b'').decode()
        if token_header:
            return token_header
        
        return None
    
    @database_sync_to_async
    def authenticate_token(self, token):
        """Authenticate token and return user"""
        if not token:
            return AnonymousUser()
        
        try:
            # Validate JWT token
            UntypedToken(token)
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            
            # Get user
            user = User.objects.select_related().get(id=user_id)
            
            # Check if user is active
            if not user.is_active:
                logger.warning(f"Inactive user attempted WebSocket connection: {user.username}")
                return AnonymousUser()
            
            return user
            
        except (InvalidToken, TokenError) as e:
            logger.warning(f"Invalid JWT token in WebSocket connection: {str(e)}")
            return AnonymousUser()
        except User.DoesNotExist:
            logger.warning("User not found for JWT token in WebSocket connection")
            return AnonymousUser()
        except Exception as e:
            logger.error(f"Unexpected error in WebSocket authentication: {str(e)}")
            return AnonymousUser()


def JWTAuthMiddlewareStack(inner):
    """
    Convenience function to create JWT auth middleware stack
    """
    return JWTAuthMiddleware(inner)


def TokenAuthMiddlewareStack(inner):
    """
    Convenience function to create token auth middleware stack
    """
    return TokenAuthMiddleware(inner)