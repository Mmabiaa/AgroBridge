"""
Data Management Service URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DataRetentionPolicyViewSet, DataDeletionLogViewSet,
    GDPRRequestViewSet, UserConsentViewSet,
    DataExportViewSet, DataProcessingRecordViewSet
)

router = DefaultRouter()
router.register(r'retention-policies', DataRetentionPolicyViewSet, basename='retention-policy')
router.register(r'deletion-logs', DataDeletionLogViewSet, basename='deletion-log')
router.register(r'gdpr-requests', GDPRRequestViewSet, basename='gdpr-request')
router.register(r'consents', UserConsentViewSet, basename='consent')
router.register(r'exports', DataExportViewSet, basename='export')
router.register(r'processing-records', DataProcessingRecordViewSet, basename='processing-record')

urlpatterns = [
    path('', include(router.urls)),
]
