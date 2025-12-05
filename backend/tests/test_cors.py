#!/usr/bin/env python
"""
Quick script to test CORS configuration
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agrobridge_backend.settings')
django.setup()

from django.conf import settings
from corsheaders.middleware import CorsMiddleware
from django.http import HttpRequest, HttpResponse

print("=" * 60)
print("CORS Configuration Test")
print("=" * 60)
print(f"DEBUG: {settings.DEBUG}")
print(f"CORS_ALLOW_ALL_ORIGINS: {settings.CORS_ALLOW_ALL_ORIGINS}")
print(f"CORS_ALLOWED_ORIGINS: {settings.CORS_ALLOWED_ORIGINS}")
print(f"CORS_ALLOW_CREDENTIALS: {settings.CORS_ALLOW_CREDENTIALS}")
print(f"ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
print("=" * 60)

# Test CORS middleware
middleware = CorsMiddleware(lambda request: HttpResponse("OK"))
request = HttpRequest()
request.method = 'OPTIONS'
request.META['HTTP_ORIGIN'] = 'https://xt7lct5c-8080.uks1.devtunnels.ms'
request.META['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] = 'POST'
request.META['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] = 'content-type,authorization'

response = middleware(request)
print(f"\nCORS Headers in Response:")
for header, value in response.items():
    if 'access-control' in header.lower():
        print(f"  {header}: {value}")

if 'Access-Control-Allow-Origin' in response:
    print("\n✅ CORS is working correctly!")
else:
    print("\n❌ CORS headers are missing!")

