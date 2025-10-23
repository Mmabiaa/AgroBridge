"""
WebSocket URL routing for the AgroBridge backend
"""
from django.urls import re_path, path
from channels.routing import URLRouter

# Import test consumer
from .consumers import TestConsumer, SimpleTestConsumer

websocket_urlpatterns = [
    # Basic WebSocket endpoint for frontend connection
    path('ws/', TestConsumer.as_asgi()),
    
    # Test WebSocket endpoint
    path('ws/test/', TestConsumer.as_asgi()),
    
    # Simple test endpoint without authentication
    path('ws/simple/', SimpleTestConsumer.as_asgi()),
    
    # Future WebSocket endpoints (to be implemented)
    # re_path(r'ws/notifications/(?P<user_id>\w+)/$', NotificationConsumer.as_asgi()),
    # re_path(r'ws/marketplace/$', MarketplaceConsumer.as_asgi()),
    # re_path(r'ws/farms/(?P<farm_id>\w+)/$', FarmMonitoringConsumer.as_asgi()),
    # re_path(r'ws/chat/(?P<room_name>\w+)/$', ChatConsumer.as_asgi()),
]