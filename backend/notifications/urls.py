"""
Notification Service URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'', views.NotificationViewSet, basename='notification')
router.register(r'deliveries', views.NotificationDeliveryViewSet, basename='delivery')
router.register(r'preferences', views.UserNotificationPreferencesViewSet, basename='preferences')
router.register(r'templates', views.NotificationTemplateViewSet, basename='template')
router.register(r'admin', views.NotificationAdminViewSet, basename='admin')

app_name = 'notifications'

urlpatterns = [
    # Health check endpoint
    path('health/', views.NotificationViewSet.as_view({'get': 'list'}), name='health'),
    
    # Custom endpoints (must be before router to avoid UUID matching)
    path('unread-count/', views.NotificationViewSet.as_view({'get': 'unread_count'}), name='unread-count'),
    
    # API endpoints
    path('', include(router.urls)),
]