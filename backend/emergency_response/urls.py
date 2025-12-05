"""URL configuration for emergency response service."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmergencyAlertViewSet, IncidentReportViewSet,
    EmergencyGuidelineViewSet, IncidentAnalyticsViewSet
)

router = DefaultRouter()
router.register(r'alerts', EmergencyAlertViewSet, basename='alert')
router.register(r'incidents', IncidentReportViewSet, basename='incident')
router.register(r'guidelines', EmergencyGuidelineViewSet, basename='guideline')
router.register(r'analytics', IncidentAnalyticsViewSet, basename='analytics')

app_name = 'emergency_response'

urlpatterns = [
    path('', include(router.urls)),
]
