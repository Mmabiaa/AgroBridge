"""
URL configuration for financial management service
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FinancialRecordViewSet, BudgetViewSet, ExchangeRateViewSet

router = DefaultRouter()
router.register(r'records', FinancialRecordViewSet, basename='financial-record')
router.register(r'budgets', BudgetViewSet, basename='budget')
router.register(r'exchange-rates', ExchangeRateViewSet, basename='exchange-rate')

app_name = 'financial'

urlpatterns = [
    path('', include(router.urls)),
    
    # Additional endpoints for convenience (aliases to viewset actions)
    path('summary/', FinancialRecordViewSet.as_view({'get': 'summary'}), name='financial-summary'),
    path('categories/', FinancialRecordViewSet.as_view({'get': 'categories'}), name='financial-categories'),
]
