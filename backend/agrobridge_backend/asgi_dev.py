"""
Development ASGI config for agrobridge_backend project.
"""

import os
import logging
from django.core.asgi import get_asgi_application

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agrobridge_backend.settings')

# Initialize Django ASGI application
django_asgi_app = get_asgi_application()

# Import after Django initialization
from channels.routing import ProtocolTypeRouter, URLRouter
from .routing import websocket_urlpatterns
from .websocket_auth import JWTAuthMiddlewareStack

logger.info("DEVELOPMENT ASGI application configured with WebSocket support")
logger.info(f"WebSocket routes: {[str(p.pattern) for p in websocket_urlpatterns]}")

# Development configuration - no origin validation
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})