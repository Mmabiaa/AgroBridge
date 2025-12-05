"""URL configuration for export documentation service."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DocumentTemplateViewSet, ComplianceRuleViewSet,
    ExportDocumentViewSet, CustomsSubmissionViewSet
)

router = DefaultRouter()
router.register(r'templates', DocumentTemplateViewSet, basename='template')
router.register(r'compliance-rules', ComplianceRuleViewSet, basename='compliance-rule')
router.register(r'documents', ExportDocumentViewSet, basename='document')
router.register(r'submissions', CustomsSubmissionViewSet, basename='submission')

app_name = 'export_docs'

urlpatterns = [
    path('', include(router.urls)),
]
