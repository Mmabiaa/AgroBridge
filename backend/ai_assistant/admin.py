from django.contrib import admin
from .models import (
    ChatConversation, ChatMessage, AIRecommendation, 
    KnowledgeBase, VoiceInteraction, AIUsageStatistics
)


@admin.register(ChatConversation)
class ChatConversationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'conversation_type', 'status', 'message_count', 'created_at']
    list_filter = ['conversation_type', 'status', 'created_at']
    search_fields = ['title', 'user__username', 'user__email']
    readonly_fields = ['id', 'message_count', 'total_tokens_used', 'created_at', 'updated_at']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['conversation', 'role', 'message_type', 'created_at', 'tokens_used']
    list_filter = ['role', 'message_type', 'created_at']
    search_fields = ['content', 'conversation__title']
    readonly_fields = ['id', 'created_at']


@admin.register(AIRecommendation)
class AIRecommendationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'recommendation_type', 'status', 'priority', 'confidence_score', 'created_at']
    list_filter = ['recommendation_type', 'status', 'priority', 'created_at']
    search_fields = ['title', 'description', 'user__username']
    readonly_fields = ['id', 'confidence_score', 'created_at', 'updated_at']


@admin.register(KnowledgeBase)
class KnowledgeBaseAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'language', 'usage_count', 'is_active']
    list_filter = ['category', 'language', 'is_active', 'created_at']
    search_fields = ['title', 'content', 'tags', 'keywords']
    readonly_fields = ['id', 'usage_count', 'last_used', 'created_at', 'updated_at']


@admin.register(VoiceInteraction)
class VoiceInteractionAdmin(admin.ModelAdmin):
    list_display = ['user', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['transcribed_text', 'response_text', 'user__username']
    readonly_fields = ['id', 'created_at', 'completed_at']


@admin.register(AIUsageStatistics)
class AIUsageStatisticsAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'conversations_started', 'messages_sent', 'recommendations_received']
    list_filter = ['date']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
