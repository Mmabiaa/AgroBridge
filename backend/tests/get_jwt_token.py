#!/usr/bin/env python3
"""
Script to get a JWT token for testing WebSocket authentication
"""
import os
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agrobridge_backend.settings')
django.setup()

def get_jwt_token():
    """Get JWT token by creating a test user or using existing credentials"""
    
    # Try to login with existing user or create one
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # Check if test user exists
    try:
        test_user = User.objects.get(username='testuser')
        print("✅ Found existing test user")
    except User.DoesNotExist:
        # Create test user
        print("Creating test user...")
        test_user = User.objects.create_user(
            username='testuser',
            email='test@agrobridge.com',
            password='testpass123'
        )
        test_user.is_active = True
        test_user.save()
        print("✅ Created test user: testuser / testpass123")
    
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
        print(f"📊 Response text: {response.text}")
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get('access')
            refresh_token = token_data.get('refresh')
            
            if access_token:
                print(f"✅ Successfully obtained JWT token")
                print(f"Access Token: {access_token}")
                print(f"Refresh Token: {refresh_token}")
                
                # Save token to file for testing
                with open('test_token.txt', 'w') as f:
                    f.write(access_token)
                print("✅ Token saved to test_token.txt")
                
                return access_token
            else:
                print("❌ No access token in response")
                print(f"Full response: {token_data}")
                return None
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            
            # Try alternative login endpoint
            print("🔄 Trying alternative endpoint...")
            login_url_alt = 'http://localhost:8000/api/v1/auth/token/'
            response_alt = requests.post(login_url_alt, json=login_data)
            print(f"📊 Alternative response status: {response_alt.status_code}")
            print(f"📊 Alternative response text: {response_alt.text}")
            
            if response_alt.status_code == 200:
                token_data = response_alt.json()
                access_token = token_data.get('access')
                if access_token:
                    print(f"✅ Successfully obtained JWT token from alternative endpoint")
                    with open('test_token.txt', 'w') as f:
                        f.write(access_token)
                    return access_token
            
            return None
            
    except Exception as e:
        print(f"❌ Error getting token: {e}")
        import traceback
        traceback.print_exc()
        return None

def create_token_manually():
    """Create a JWT token manually for testing"""
    from rest_framework_simplejwt.tokens import AccessToken
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    try:
        user = User.objects.get(username='testuser')
        token = AccessToken.for_user(user)
        print(f"🔑 Manually created token: {token}")
        
        # Save token to file
        with open('test_token.txt', 'w') as f:
            f.write(str(token))
        print("✅ Manual token saved to test_token.txt")
        return str(token)
    except Exception as e:
        print(f"❌ Error creating manual token: {e}")
        return None

def test_token_validity(token):
    """Test if the token is valid"""
    from rest_framework_simplejwt.tokens import AccessToken
    try:
        access_token = AccessToken(token)
        user_id = access_token['user_id']
        print(f"✅ Token is valid - User ID: {user_id}")
        return True
    except Exception as e:
        print(f"❌ Token is invalid: {e}")
        return False

if __name__ == "__main__":
    print("🔐 Getting JWT token for WebSocket testing...")
    
    # First try to get token via API
    token = get_jwt_token()
    
    # If that fails, create one manually
    if not token:
        print("\n🔄 API login failed, creating token manually...")
        token = create_token_manually()
    
    if token:
        print("\n🔍 Testing token validity...")
        test_token_validity(token)
        
        print(f"\n💡 Use this token to test authenticated WebSocket:")
        print(f"python test_websocket_with_auth.py \"{token}\"")
    else:
        print("\n❌ Failed to get JWT token")