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
    
    async def __call__(self, scope, receive, send):
        # Only process WebSocket connections
        if scope['type'] == 'websocket':
            logger.info(f"WebSocket authentication for: {scope['path']}")
            
            # Get token from query parameters
            query_string = scope.get('query_string', b'').decode()
            query_params = parse_qs(query_string)
            token = query_params.get('token', [None])[0]
            
            if token:
                logger.info(f"Token found: {token[:50]}...")
                # Authenticate user
                user = await self.get_user_from_token(token)
                scope['user'] = user
                
                if user.is_anonymous:
                    logger.warning("Authentication FAILED - anonymous user")
                    # Don't reject immediately - let consumer handle it
                else:
                    logger.info(f"Authentication SUCCESS - User: {user.username}")
            else:
                logger.warning("No JWT token found in WebSocket connection")
                scope['user'] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)
    
    @database_sync_to_async
    def get_user_from_token(self, token):
        """Get user from JWT token"""
        try:
            # Validate token
            logger.debug("Validating JWT token...")
            UntypedToken(token)
            
            # Decode token to get user
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            logger.debug(f"Token decoded - User ID: {user_id}")
            
            # Get user
            user = User.objects.get(id=user_id)
            logger.info(f"WebSocket user authenticated: {user.username} (ID: {user.id})")
            return user
            
        except (InvalidToken, TokenError) as e:
            logger.warning(f"Invalid JWT token: {str(e)}")
            return AnonymousUser()
        except User.DoesNotExist:
            logger.warning(f"User not found for token")
            return AnonymousUser()
        except Exception as e:
            logger.error(f"Unexpected error during authentication: {str(e)}")
            return AnonymousUser()


def JWTAuthMiddlewareStack(inner):
    """
    Convenience function to create JWT auth middleware stack
    """
    return JWTAuthMiddleware(inner)