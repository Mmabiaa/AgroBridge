#!/usr/bin/env python3
"""
Debug WebSocket routing
"""
import os
import django
from django.test import RequestFactory
from django.urls import get_resolver

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agrobridge_backend.settings')
django.setup()

def debug_urls():
    """Print all registered URLs"""
    resolver = get_resolver()
    
    print("=== ALL REGISTERED URL PATTERNS ===")
    for pattern in resolver.url_patterns:
        print(f"{pattern.pattern} -> {pattern.callback}")
        
    print("\n=== CHECKING FOR WebSocket PATTERNS ===")
    
    # Check if we can import the WebSocket routing
    try:
        from agrobridge_backend.routing import websocket_urlpatterns
        print("✅ WebSocket URL patterns imported successfully")
        print(f"Number of WebSocket routes: {len(websocket_urlpatterns)}")
        
        for pattern in websocket_urlpatterns:
            print(f"WebSocket: {pattern.pattern} -> {pattern.callback}")
            
    except ImportError as e:
        print(f"❌ Could not import WebSocket routing: {e}")
    except Exception as e:
        print(f"❌ Error with WebSocket routing: {e}")

if __name__ == "__main__":
    debug_urls()