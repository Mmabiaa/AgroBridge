"""
WebSocket URL routing for AI Assistant
"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/$', consumers.ChatConsumer.as_asgi()),
]