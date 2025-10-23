"""
Health check URLs for AgroBridge API
"""
from django.urls import path
from . import health_views

urlpatterns = [
    path('', health_views.health_check, name='health-check'),
    path('detailed/', health_views.detailed_health_check, name='detailed-health-check'),
]