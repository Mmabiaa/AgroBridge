"""
Farm management URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'farms', views.FarmViewSet, basename='farm')
router.register(r'fields', views.FieldViewSet, basename='field')
router.register(r'crops', views.CropViewSet, basename='crop')
router.register(r'livestock', views.LivestockViewSet, basename='livestock')
router.register(r'activities', views.FarmActivityViewSet, basename='farmactivity')
router.register(r'equipment', views.EquipmentViewSet, basename='equipment')
router.register(r'satellite-imagery', views.SatelliteImageryViewSet, basename='satelliteimagery')

urlpatterns = [
    path('', include(router.urls)),
    path('health/', views.health_check, name='farm-service-health'),
]