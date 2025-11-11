"""
WebSocket URL routing for the AgroBridge backend
"""
import logging
from django.urls import re_path
from .consumers import TestConsumer, SimpleTestConsumer, NotificationConsumer, ChatConsumer

logger = logging.getLogger(__name__)

# Use re_path for WebSocket routes (Channels compatible)
websocket_urlpatterns = [
    # Main WebSocket endpoint with JWT authentication
    re_path(r'^ws/$', TestConsumer.as_asgi(), name='ws_main'),
    
    # Test WebSocket endpoint with JWT authentication
    re_path(r'^ws/test/$', TestConsumer.as_asgi(), name='ws_test'),
    
    # Simple test endpoint without authentication
    re_path(r'^ws/simple/$', SimpleTestConsumer.as_asgi(), name='ws_simple'),
    
    # Notification WebSocket endpoint
    re_path(r'^ws/notifications/$', NotificationConsumer.as_asgi(), name='ws_notifications'),
    
    # Chat WebSocket endpoint
    re_path(r'^ws/chat/(?P<room_name>\w+)/$', ChatConsumer.as_asgi(), name='ws_chat'),
    
    # User-specific notifications
    re_path(r'^ws/notifications/(?P<user_id>\w+)/$', NotificationConsumer.as_asgi(), name='ws_user_notifications'),
]

logger.info("WebSocket URL patterns configured")
logger.info(f"Available WebSocket endpoints:")
for pattern in websocket_urlpatterns:
    logger.info(f"  - {pattern.pattern}")