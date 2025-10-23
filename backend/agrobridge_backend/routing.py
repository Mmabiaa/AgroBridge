# [AI-INTEGRATION] Updated on 2025-10-12: Django-React/Vue real-time integration setup

from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/some_path/', consumers.YourConsumer.as_asgi()),  # Example WebSocket path
]
