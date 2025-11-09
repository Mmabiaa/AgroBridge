#!/usr/bin/env python3
"""
Test ASGI configuration
"""
import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agrobridge_backend.settings')
django.setup()

def test_asgi():
    print("Testing ASGI configuration...")
    
    # Import your ASGI application
    from agrobridge_backend.asgi import application
    
    print("✅ ASGI application loaded successfully")
    print(f"ASGI application type: {type(application)}")
    
    # Check if it's a ProtocolTypeRouter
    from channels.routing import ProtocolTypeRouter
    if isinstance(application, ProtocolTypeRouter):
        print("✅ Application is ProtocolTypeRouter")
        print(f"Protocols: {list(application.application_mapping.keys())}")
    else:
        print("❌ Application is NOT ProtocolTypeRouter")
    
    # Check WebSocket patterns
    try:
        from agrobridge_backend.routing import websocket_urlpatterns
        print(f"✅ WebSocket URL patterns: {len(websocket_urlpatterns)} routes")
        for pattern in websocket_urlpatterns:
            print(f"  - {pattern.pattern}")
    except Exception as e:
        print(f"❌ Error loading WebSocket patterns: {e}")

if __name__ == "__main__":
    test_asgi()