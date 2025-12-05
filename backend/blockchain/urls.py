"""URL configuration for blockchain service."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CertificateViewSet, SupplyChainEventViewSet, CertificationBodyViewSet

router = DefaultRouter()
router.register(r'certificates', CertificateViewSet, basename='certificate')
router.register(r'supply-chain', SupplyChainEventViewSet, basename='supply-chain')
router.register(r'certification-bodies', CertificationBodyViewSet, basename='certification-body')

urlpatterns = [
    path('', include(router.urls)),
]
