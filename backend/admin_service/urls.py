from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserManagementViewSet, SystemConfigurationViewSet,
    FeatureFlagViewSet, ModerationQueueViewSet,
    AuditLogViewSet, SecurityIncidentViewSet,
    PlatformMetricsViewSet, DashboardViewSet
)

router = DefaultRouter()
router.register(r'users', UserManagementViewSet, basename='admin-users')
router.register(r'config', SystemConfigurationViewSet, basename='admin-config')
router.register(r'feature-flags', FeatureFlagViewSet, basename='admin-feature-flags')
router.register(r'moderation', ModerationQueueViewSet, basename='admin-moderation')
router.register(r'audit-logs', AuditLogViewSet, basename='admin-audit-logs')
router.register(r'security', SecurityIncidentViewSet, basename='admin-security')
router.register(r'metrics', PlatformMetricsViewSet, basename='admin-metrics')
router.register(r'dashboard', DashboardViewSet, basename='admin-dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
