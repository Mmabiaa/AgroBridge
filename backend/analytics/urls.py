"""
Analytics Service URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardViewSet, PredictiveAnalyticsViewSet,
    TimeSeriesViewSet, ReportViewSet, InsightViewSet,
    PredictionModelViewSet
)

router = DefaultRouter()
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'insights', InsightViewSet, basename='insight')
router.register(r'models', PredictionModelViewSet, basename='prediction-model')

urlpatterns = [
    # Dashboard endpoints
    path('dashboard/overview/', DashboardViewSet.as_view({'get': 'overview'}), name='dashboard-overview'),
    path('dashboard/farm-performance/', DashboardViewSet.as_view({'get': 'farm_performance'}), name='dashboard-farm-performance'),
    path('dashboard/marketplace-stats/', DashboardViewSet.as_view({'get': 'marketplace_stats'}), name='dashboard-marketplace-stats'),
    path('dashboard/user-activity/', DashboardViewSet.as_view({'get': 'user_activity'}), name='dashboard-user-activity'),
    path('dashboard/financial-summary/', DashboardViewSet.as_view({'get': 'financial_summary'}), name='dashboard-financial-summary'),
    
    # Predictive analytics endpoints
    path('predictions/yield/', PredictiveAnalyticsViewSet.as_view({'post': 'predict_yield'}), name='predict-yield'),
    path('predictions/price/', PredictiveAnalyticsViewSet.as_view({'post': 'predict_price'}), name='predict-price'),
    path('predictions/demand/', PredictiveAnalyticsViewSet.as_view({'post': 'forecast_demand'}), name='forecast-demand'),
    
    # Time-series analysis endpoints
    path('time-series/sensor-trends/', TimeSeriesViewSet.as_view({'get': 'sensor_trends'}), name='sensor-trends'),
    path('time-series/crop-health/', TimeSeriesViewSet.as_view({'get': 'crop_health_trends'}), name='crop-health-trends'),
    path('time-series/financial/', TimeSeriesViewSet.as_view({'get': 'financial_trends'}), name='financial-trends'),
    
    # Router URLs
    path('', include(router.urls)),
]
