"""
URL configuration for AI assistant app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'conversations', views.ChatConversationViewSet, basename='conversation')
router.register(r'recommendations', views.AIRecommendationViewSet, basename='recommendation')
router.register(r'voice', views.VoiceInteractionViewSet, basename='voice')
router.register(r'knowledge', views.KnowledgeBaseViewSet, basename='knowledge')
router.register(r'statistics', views.AIUsageStatisticsViewSet, basename='statistics')
router.register(r'language', views.LanguageViewSet, basename='language')
router.register(r'analytics', views.AIAnalyticsViewSet, basename='analytics')

app_name = 'ai_assistant'

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Additional custom endpoints can be added here
    # path('custom-endpoint/', views.CustomView.as_view(), name='custom-endpoint'),
]