"""
Notification Service URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'deliveries', views.NotificationDeliveryViewSet, basename='delivery')
router.register(r'preferences', views.UserNotificationPreferencesViewSet, basename='preferences')
router.register(r'templates', views.NotificationTemplateViewSet, basename='template')
router.register(r'admin', views.NotificationAdminViewSet, basename='admin')

app_name = 'notifications'

urlpatterns = [
    # API endpoints
    path('api/v1/', include(router.urls)),
    
    # Health check endpoint
    path('health/', views.NotificationViewSet.as_view({'get': 'list'}), name='health'),
]