"""
ASGI config for agrobridge_backend project.
"""

import os
import logging
from django.core.asgi import get_asgi_application

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agrobridge_backend.settings')

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

# Import after Django initialization
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from agrobridge_backend.websocket_auth import JWTAuthMiddlewareStack
from agrobridge_backend.routing import websocket_urlpatterns

logger.info("ASGI application configured with WebSocket support")
logger.info(f"WebSocket routes: {[str(p.pattern) for p in websocket_urlpatterns]}")

# Main ASGI application
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})

logger.info("ASGI application setup complete")