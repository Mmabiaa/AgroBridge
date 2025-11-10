"""
Run this script to diagnose WebSocket configuration issues
Place in your project root and run: python diagnose_websocket.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agrobridge_backend.settings')
sys.path.insert(0, os.getcwd())
django.setup()

from django.conf import settings

print("=" * 60)
print("DJANGO WEBSOCKET CONFIGURATION DIAGNOSTICS")
print("=" * 60)

# Check 1: ASGI_APPLICATION setting
print("\n1. ASGI_APPLICATION Setting:")
asgi_app = getattr(settings, 'ASGI_APPLICATION', None)
if asgi_app:
    print(f"   ✓ ASGI_APPLICATION = '{asgi_app}'")
else:
    print("   ✗ ASGI_APPLICATION is NOT set in settings.py")
    print("   → Add: ASGI_APPLICATION = 'agrobridge_backend.asgi.application'")

# Check 2: Channels in INSTALLED_APPS
print("\n2. Channels Installation:")
if 'channels' in settings.INSTALLED_APPS:
    print("   ✓ 'channels' is in INSTALLED_APPS")
else:
    print("   ✗ 'channels' is NOT in INSTALLED_APPS")
    print("   → Add 'channels' to INSTALLED_APPS")

# Check 3: CHANNEL_LAYERS setting
print("\n3. CHANNEL_LAYERS Setting:")
channel_layers = getattr(settings, 'CHANNEL_LAYERS', None)
if channel_layers:
    print(f"   ✓ CHANNEL_LAYERS is configured")
    print(f"   Backend: {channel_layers.get('default', {}).get('BACKEND', 'Not set')}")
else:
    print("   ✗ CHANNEL_LAYERS is NOT set")
    print("   → Add CHANNEL_LAYERS configuration")

# Check 4: Check if asgi.py exists
print("\n4. ASGI File Check:")
asgi_file = os.path.join('agrobridge_backend', 'asgi.py')
if os.path.exists(asgi_file):
    print(f"   ✓ {asgi_file} exists")
    
    # Try to import it
    try:
        from agrobridge_backend import asgi
        print("   ✓ asgi.py can be imported")
        
        # Check if application is defined
        if hasattr(asgi, 'application'):
            print("   ✓ 'application' is defined in asgi.py")
        else:
            print("   ✗ 'application' is NOT defined in asgi.py")
    except Exception as e:
        print(f"   ✗ Error importing asgi.py: {e}")
else:
    print(f"   ✗ {asgi_file} does NOT exist")

# Check 5: Check if routing exists
print("\n5. Routing Configuration:")
routing_file = os.path.join('ai_assistant', 'routing.py')
if os.path.exists(routing_file):
    print(f"   ✓ {routing_file} exists")
    
    try:
        from ai_assistant import routing
        if hasattr(routing, 'websocket_urlpatterns'):
            patterns = routing.websocket_urlpatterns
            print(f"   ✓ websocket_urlpatterns defined with {len(patterns)} pattern(s)")
            for pattern in patterns:
                print(f"      - {pattern.pattern}")
        else:
            print("   ✗ websocket_urlpatterns NOT defined in routing.py")
    except Exception as e:
        print(f"   ✗ Error importing routing.py: {e}")
else:
    print(f"   ✗ {routing_file} does NOT exist")

# Check 6: Check if consumers exist
print("\n6. WebSocket Consumer:")
consumers_file = os.path.join('ai_assistant', 'consumers.py')
if os.path.exists(consumers_file):
    print(f"   ✓ {consumers_file} exists")
    
    try:
        from ai_assistant import consumers
        if hasattr(consumers, 'ChatConsumer'):
            print("   ✓ ChatConsumer class is defined")
        else:
            print("   ✗ ChatConsumer class NOT found")
    except Exception as e:
        print(f"   ✗ Error importing consumers.py: {e}")
else:
    print(f"   ✗ {consumers_file} does NOT exist")

# Check 7: Check if websocket_auth exists
print("\n7. WebSocket Authentication:")
auth_file = os.path.join('ai_assistant', 'websocket_auth.py')
if os.path.exists(auth_file):
    print(f"   ✓ {auth_file} exists")
    
    try:
        from ai_assistant import websocket_auth
        if hasattr(websocket_auth, 'JWTAuthMiddlewareStack'):
            print("   ✓ JWTAuthMiddlewareStack is defined")
        else:
            print("   ✗ JWTAuthMiddlewareStack NOT found")
    except Exception as e:
        print(f"   ✗ Error importing websocket_auth.py: {e}")
else:
    print(f"   ✗ {auth_file} does NOT exist")

print("\n" + "=" * 60)
print("SUMMARY & NEXT STEPS")
print("=" * 60)

issues = []
if not asgi_app:
    issues.append("Add ASGI_APPLICATION to settings.py")
if 'channels' not in settings.INSTALLED_APPS:
    issues.append("Add 'channels' to INSTALLED_APPS")
if not channel_layers:
    issues.append("Add CHANNEL_LAYERS configuration")
if not os.path.exists(asgi_file):
    issues.append("Create agrobridge_backend/asgi.py")
if not os.path.exists(routing_file):
    issues.append("Create ai_assistant/routing.py")
if not os.path.exists(consumers_file):
    issues.append("Create ai_assistant/consumers.py")
if not os.path.exists(auth_file):
    issues.append("Create ai_assistant/websocket_auth.py")

if issues:
    print("\n⚠ Issues Found:")
    for i, issue in enumerate(issues, 1):
        print(f"   {i}. {issue}")
else:
    print("\n✓ All configuration checks passed!")
    print("\nIf WebSocket still doesn't work, ensure you:")
    print("   1. Restarted the Django server after making changes")
    print("   2. Are using 'python manage.py runserver' (not daphne)")
    print("   3. Check server startup logs for ASGI application loading")

print("\n" + "=" * 60)