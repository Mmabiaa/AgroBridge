"""
WebSocket URL routing for the AgroBridge backend
"""
from django.urls import re_path, path
from channels.routing import URLRouter

# Import consumers (will be created in subsequent tasks)
# from notifications.consumers import NotificationConsumer
# from marketplace.consumers import MarketplaceConsumer
# from farms.consumers import FarmMonitoringConsumer
# from chat.consumers import ChatConsumer

websocket_urlpatterns = [
    # Notification WebSocket
    # re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
    
    # Marketplace updates WebSocket
    # re_path(r'ws/marketplace/$', MarketplaceConsumer.as_asgi()),
    
    # Farm monitoring WebSocket
    # re_path(r'ws/farms/(?P<farm_id>\w+)/$', FarmMonitoringConsumer.as_asgi()),
    
    # Chat WebSocket
    # re_path(r'ws/chat/(?P<room_name>\w+)/$', ChatConsumer.as_asgi()),
    
    # Test WebSocket endpoint
    path('ws/test/', TestConsumer.as_asgi()),
]

# Import test consumer
from .consumers import TestConsumer