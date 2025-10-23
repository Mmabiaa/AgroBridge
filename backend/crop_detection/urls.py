"""
URL configuration for crop detection app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'diseases', views.DiseaseViewSet, basename='disease')
router.register(r'treatments', views.TreatmentViewSet, basename='treatment')
router.register(r'scans', views.CropScanViewSet, basename='scan')
router.register(r'analysis', views.ImageAnalysisViewSet, basename='analysis')
router.register(r'history', views.ScanHistoryViewSet, basename='history')
router.register(r'reviews', views.ExpertReviewViewSet, basename='review')

app_name = 'crop_detection'

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
]