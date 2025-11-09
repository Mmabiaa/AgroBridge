#!/usr/bin/env python3
"""
Debug JWT authentication
"""
import os
import django
from django.contrib.auth import get_user_model

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agrobridge_backend.settings')
django.setup()

def debug_auth():
    from rest_framework_simplejwt.tokens import AccessToken
    from agrobridge_backend.websocket_auth import JWTAuthMiddleware
    
    # Create a test token
    User = get_user_model()
    user = User.objects.get(username='testuser')
    
    token = AccessToken.for_user(user)
    print(f"Test Token: {token}")
    
    # Test the middleware
    middleware = JWTAuthMiddleware(None)
    
    # Create a mock scope
    scope = {
        'type': 'websocket',
        'path': '/ws/',
        'query_string': f'token={token}'.encode()
    }
    
    print("Testing middleware authentication...")

if __name__ == "__main__":
    debug_auth()