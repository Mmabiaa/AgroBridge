#!/usr/bin/env python3
"""
Discover available authentication endpoints
"""
import requests

def discover_endpoints():
    base_url = 'http://localhost:8000'
    endpoints = [
        '/api/v1/auth/login/',
        '/api/v1/auth/token/',
        '/api/v1/auth/token/obtain/',
        '/api/v1/auth/jwt/create/',
        '/api/v1/auth/',
        '/auth/login/',
        '/auth/token/',
    ]
    
    print("🔍 Discovering authentication endpoints...")
    
    for endpoint in endpoints:
        url = base_url + endpoint
        try:
            # Try GET first to see if endpoint exists
            response = requests.get(url, timeout=5)
            print(f"🔍 {endpoint}: GET {response.status_code}")
            
            # If it exists, try POST with test data
            if response.status_code != 404:
                test_data = {'username': 'testuser', 'password': 'testpass123'}
                post_response = requests.post(url, json=test_data, timeout=5)
                print(f"   POST {post_response.status_code}: {post_response.text[:100]}")
                
        except requests.exceptions.RequestException as e:
            print(f"🔍 {endpoint}: Error - {e}")

if __name__ == "__main__":
    discover_endpoints()