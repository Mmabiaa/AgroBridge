#!/usr/bin/env python3
"""
Get JWT token for testing WebSocket connections
"""
import os
import django
import sys

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agrobridge_backend.settings')
django.setup()

from rest_framework_simplejwt.tokens import AccessToken
from authentication.models import User

def get_test_token():
    try:
        # Get or create test user
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'test@example.com',
                'role': 'farmer'
            }
        )
        
        if created:
            user.set_password('testpass123')
            user.save()
            print(f"Created test user: {user.username}")
        else:
            print(f"Using existing test user: {user.username}")
        
        # Generate access token
        access_token = AccessToken.for_user(user)
        token_str = str(access_token)
        
        print(f"Access Token: {token_str}")
        return token_str
        
    except Exception as e:
        print(f"Error generating token: {e}")
        return None

if __name__ == "__main__":
    get_test_token()