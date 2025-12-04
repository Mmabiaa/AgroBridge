"""
WebSocket Routing Configuration for Notifications

This module defines WebSocket URL routing for Django Channels.
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # User notification WebSocket
    re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
    
    # Admin notification WebSocket
    re_path(r'ws/notifications/admin/$', consumers.AdminNotificationConsumer.as_asgi()),
]
