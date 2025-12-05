"""URL configuration for file storage service."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FileStorageViewSet, ChunkedUploadViewSet,
    StorageQuotaViewSet, FileAccessLogViewSet
)

router = DefaultRouter()
router.register(r'files', FileStorageViewSet, basename='file')
router.register(r'chunked-uploads', ChunkedUploadViewSet, basename='chunked-upload')
router.register(r'quotas', StorageQuotaViewSet, basename='quota')
router.register(r'access-logs', FileAccessLogViewSet, basename='access-log')

urlpatterns = [
    path('', include(router.urls)),
]
