#!/usr/bin/env python3
"""
Fixed script to get JWT token from your API
"""
import os
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agrobridge_backend.settings')
django.setup()

def get_jwt_token_fixed():
    """Get JWT token from the correct API structure"""
    
    # Get JWT token
    login_url = 'http://localhost:8000/api/v1/auth/login/'
    login_data = {
        'username': 'testuser',
        'password': 'testpass123'
    }
    
    try:
        print(f"🔐 Attempting login to: {login_url}")
        response = requests.post(login_url, json=login_data)
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            
            # Extract token from the nested structure
            access_token = token_data.get('tokens', {}).get('access')
            
            if access_token:
                print(f"✅ Successfully obtained JWT token")
                print(f"Access Token: {access_token}")
                
                # Save token to file for testing
                with open('test_token.txt', 'w') as f:
                    f.write(access_token)
                print("✅ Token saved to test_token.txt")
                return access_token
            else:
                print("❌ No access token in response")
                print("Token structure:", json.dumps(token_data, indent=2))
                return None
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting token: {e}")
        return None

if __name__ == "__main__":
    token = get_jwt_token_fixed()
    if token:
        print(f"\n💡 Use this token:")
        print(f'python test_websocket_with_auth.py "{token}"')