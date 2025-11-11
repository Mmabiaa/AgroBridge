#!/usr/bin/env python
"""
Quick script to check if backend is running and accessible
"""
import requests
import sys

BACKEND_URL = "https://xt7lct5c-8000.uks1.devtunnels.ms"

def check_backend():
    print("=" * 60)
    print("Backend Health Check")
    print("=" * 60)
    
    # Test 1: Health endpoint
    print("\n1. Testing health endpoint...")
    try:
        response = requests.get(f"{BACKEND_URL}/health/", timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}")
        if response.status_code == 200:
            print("   ✅ Health endpoint is accessible")
        else:
            print(f"   ⚠️  Health endpoint returned {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Health endpoint is NOT accessible: {e}")
        return False
    
    # Test 2: CORS preflight (OPTIONS request)
    print("\n2. Testing CORS preflight (OPTIONS)...")
    try:
        response = requests.options(
            f"{BACKEND_URL}/api/v1/auth/login/",
            headers={
                'Origin': 'https://xt7lct5c-8080.uks1.devtunnels.ms',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'content-type,authorization'
            },
            timeout=5
        )
        print(f"   Status: {response.status_code}")
        print(f"   Headers:")
        cors_headers = {k: v for k, v in response.headers.items() if 'access-control' in k.lower()}
        if cors_headers:
            for header, value in cors_headers.items():
                print(f"     {header}: {value}")
            print("   ✅ CORS headers are present")
        else:
            print("   ❌ No CORS headers found!")
            print(f"   All headers: {list(response.headers.keys())}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"   ❌ OPTIONS request failed: {e}")
        return False
    
    # Test 3: Actual API endpoint
    print("\n3. Testing API endpoint (GET)...")
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/v1/auth/login/",
            headers={'Origin': 'https://xt7lct5c-8080.uks1.devtunnels.ms'},
            timeout=5
        )
        print(f"   Status: {response.status_code}")
        cors_origin = response.headers.get('Access-Control-Allow-Origin')
        if cors_origin:
            print(f"   ✅ CORS header present: {cors_origin}")
        else:
            print("   ⚠️  No Access-Control-Allow-Origin header")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ API endpoint test failed: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("✅ Backend appears to be running and accessible!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = check_backend()
    sys.exit(0 if success else 1)

