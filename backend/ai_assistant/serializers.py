"""
Serializers for AI assistant models
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    ChatConversation, ChatMessage, AIRecommendation, 
    KnowledgeBase, VoiceInteraction, AIUsageStatistics
)

User = get_user_model()


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for ChatMessage model"""
    
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'role', 'message_type', 'content', 'metadata', 'tokens_used',
            'processing_time_ms', 'image', 'voice_file', 'attachment', 'model_used',
            'confidence_score', 'is_helpful', 'user_rating', 'created_at'
        ]
        read_only_fields = [
            'id', 'tokens_used', 'processing_time_ms', 'model_used', 
            'confidence_score', 'created_at'
        ]
    
    def validate_content(self, value):
        """Validate message content"""
        if not value.strip():
            raise serializers.ValidationError("Message content cannot be empty")
        return value
    
    def validate_user_rating(self, value):
        """Validate user rating"""
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value


class ChatConversationSerializer(serializers.ModelSerializer):
    """Serializer for ChatConversation model"""
    messages = ChatMessageSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    is_active = serializers.ReadOnlyField()
    
    class Meta:
        model = ChatConversation
        fields = [
            'id', 'title', 'conversation_type', 'status', 'context_data',
            'language', 'message_count', 'total_tokens_used', 'created_at',
            'updated_at', 'last_message_at', 'messages', 'user_name', 'is_active'
        ]
        read_only_fields = [
            'id', 'message_count', 'total_tokens_used', 'created_at',
            'updated_at', 'last_message_at'
        ]
    
    def create(self, validated_data):
        """Create conversation with current user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate_context_data(self, value):
        """Validate context data"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Context data must be a valid JSON object")
        return value


class ChatConversationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for conversation listings"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    is_active = serializers.ReadOnlyField()
    latest_message = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatConversation
        fields = [
            'id', 'title', 'conversation_type', 'status', 'message_count',
            'created_at', 'updated_at', 'last_message_at', 'user_name',
            'is_active', 'latest_message'
        ]
    
    def get_latest_message(self, obj):
        """Get the latest message preview"""
        latest = obj.messages.last()
        if latest:
            return {
                'content': latest.content[:100] + '...' if len(latest.content) > 100 else latest.content,
                'role': latest.role,
                'created_at': latest.created_at
            }
        return None


class AIRecommendationSerializer(serializers.ModelSerializer):
    """Serializer for AIRecommendation model"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    farm_name = serializers.CharField(source='context_farm.name', read_only=True)
    crop_name = serializers.CharField(source='context_crop.name', read_only=True)
    is_valid = serializers.ReadOnlyField()
    is_urgent = serializers.ReadOnlyField()
    
    class Meta:
        model = AIRecommendation
        fields = [
            'id', 'recommendation_type', 'title', 'description', 'detailed_content',
            'priority', 'status', 'confidence_score', 'model_used', 'reasoning',
            'trigger_data', 'context_farm', 'context_crop', 'valid_until',
            'best_implementation_date', 'viewed_at', 'user_feedback', 'user_rating',
            'created_at', 'updated_at', 'user_name', 'farm_name', 'crop_name',
            'is_valid', 'is_urgent'
        ]
        read_only_fields = [
            'id', 'confidence_score', 'model_used', 'reasoning', 'trigger_data',
            'viewed_at', 'created_at', 'updated_at'
        ]
    
    def validate_detailed_content(self, value):
        """Validate detailed content"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Detailed content must be a valid JSON object")
        return value
    
    def validate_user_rating(self, value):
        """Validate user rating"""
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value


class KnowledgeBaseSerializer(serializers.ModelSerializer):
    """Serializer for KnowledgeBase model"""
    
    class Meta:
        model = KnowledgeBase
        fields = [
            'id', 'title', 'content', 'summary', 'category', 'tags',
            'language', 'region_specific', 'version', 'accuracy_score',
            'usage_count', 'last_used', 'is_active', 'is_verified',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'usage_count', 'last_used', 'created_at', 'updated_at'
        ]
    
    def validate_tags(self, value):
        """Validate tags"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Tags must be a list")
        return value


class VoiceInteractionSerializer(serializers.ModelSerializer):
    """Serializer for VoiceInteraction model"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = VoiceInteraction
        fields = [
            'id', 'conversation', 'input_audio', 'output_audio', 'transcribed_text',
            'response_text', 'status', 'language_detected', 'confidence_score',
            'transcription_time_ms', 'response_generation_time_ms', 'synthesis_time_ms',
            'error_message', 'created_at', 'completed_at', 'user_name'
        ]
        read_only_fields = [
            'id', 'output_audio', 'transcribed_text', 'response_text', 'status',
            'language_detected', 'confidence_score', 'transcription_time_ms',
            'response_generation_time_ms', 'synthesis_time_ms', 'error_message',
            'created_at', 'completed_at'
        ]
    
    def create(self, validated_data):
        """Create voice interaction with current user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class AIUsageStatisticsSerializer(serializers.ModelSerializer):
    """Serializer for AIUsageStatistics model"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = AIUsageStatistics
        fields = [
            'user', 'date', 'conversations_started', 'messages_sent',
            'voice_interactions', 'recommendations_received', 'recommendations_implemented',
            'total_tokens_used', 'crop_diagnosis_queries', 'market_info_queries',
            'weather_queries', 'farming_advice_queries', 'average_response_time_ms',
            'user_satisfaction_score', 'created_at', 'updated_at', 'user_name'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ChatRequestSerializer(serializers.Serializer):
    """Serializer for chat requests"""
    message = serializers.CharField(max_length=5000)
    conversation_id = serializers.UUIDField(required=False, allow_null=True)
    conversation_type = serializers.ChoiceField(
        choices=ChatConversation.CONVERSATION_TYPE_CHOICES,
        default='general'
    )
    context_data = serializers.JSONField(required=False, default=dict)
    language = serializers.CharField(max_length=10, default='en')
    
    def validate_message(self, value):
        """Validate message content"""
        if not value.strip():
            raise serializers.ValidationError("Message cannot be empty")
        return value.strip()
    
    def validate_context_data(self, value):
        """Validate context data"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Context data must be a valid JSON object")
        return value


class ChatResponseSerializer(serializers.Serializer):
    """Serializer for chat responses"""
    conversation_id = serializers.UUIDField()
    message_id = serializers.UUIDField()
    response = serializers.CharField()
    confidence_score = serializers.FloatField()
    processing_time_ms = serializers.IntegerField()
    tokens_used = serializers.IntegerField()
    recommendations = AIRecommendationSerializer(many=True, required=False)
    
    
class MessageFeedbackSerializer(serializers.Serializer):
    """Serializer for message feedback"""
    is_helpful = serializers.BooleanField(required=False, allow_null=True)
    user_rating = serializers.IntegerField(
        required=False, 
        allow_null=True,
        min_value=1, 
        max_value=5
    )
    feedback_text = serializers.CharField(max_length=1000, required=False, allow_blank=True)


class RecommendationFeedbackSerializer(serializers.Serializer):
    """Serializer for recommendation feedback"""
    action = serializers.ChoiceField(choices=['implement', 'dismiss', 'rate'])
    user_rating = serializers.IntegerField(
        required=False, 
        allow_null=True,
        min_value=1, 
        max_value=5
    )
    feedback_text = serializers.CharField(max_length=1000, required=False, allow_blank=True)