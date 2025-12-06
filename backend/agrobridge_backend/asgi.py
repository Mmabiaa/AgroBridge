"""
ASGI config for agrobridge_backend project.
"""
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agrobridge_backend.settings')

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

# Import routing after Django is initialized
from agrobridge_backend.routing import websocket_urlpatterns as main_websocket_urlpatterns
from marketplace.routing import websocket_urlpatterns as marketplace_websocket_urlpatterns

# Combine all WebSocket URL patterns
all_websocket_urlpatterns = main_websocket_urlpatterns + marketplace_websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(all_websocket_urlpatterns)
        )
    ),
})
