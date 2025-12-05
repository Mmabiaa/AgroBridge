"""
Payment Service URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TransactionViewSet, EscrowViewSet, PaymentReceiptViewSet,
    DisputeViewSet, ExchangeRateViewSet
)

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'escrow', EscrowViewSet, basename='escrow')
router.register(r'receipts', PaymentReceiptViewSet, basename='receipt')
router.register(r'disputes', DisputeViewSet, basename='dispute')
router.register(r'exchange-rates', ExchangeRateViewSet, basename='exchange-rate')

urlpatterns = [
    path('', include(router.urls)),
]
