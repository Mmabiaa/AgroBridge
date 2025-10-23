"""
AI Assistant URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'conversations', views.ChatConversationViewSet, basename='conversation')
router.register(r'messages', views.ChatMessageViewSet, basename='message')
router.register(r'recommendations', views.AIRecommendationViewSet, basename='recommendation')
router.register(r'knowledge', views.KnowledgeBaseViewSet, basename='knowledge')
router.register(r'voice', views.VoiceInteractionViewSet, basename='voice')
router.register(r'analytics', views.AIAnalyticsViewSet, basename='ai-analytics')

urlpatterns = [
    path('', include(router.urls)),
]