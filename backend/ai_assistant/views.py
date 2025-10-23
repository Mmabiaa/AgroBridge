"""
AI Assistant API views
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import timedelta
import logging
import time
import uuid

from .models import (
    ChatConversation, ChatMessage, AIRecommendation, 
    KnowledgeBase, VoiceInteraction, AIUsageStatistics
)
from .serializers import (
    ChatConversationSerializer, ChatConversationListSerializer,
    ChatMessageSerializer, AIRecommendationSerializer, KnowledgeBaseSerializer,
    VoiceInteractionSerializer, AIUsageStatisticsSerializer,
    ChatRequestSerializer, ChatResponseSerializer, MessageFeedbackSerializer,
    RecommendationFeedbackSerializer
)
from .ai_service import AIService
from .permissions import IsOwnerOrReadOnly
from django.db import models

logger = logging.getLogger(__name__)


class ChatConversationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing chat conversations
    """
    serializer_class = ChatConversationSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['conversation_type', 'status', 'language']
    search_fields = ['title']
    ordering_fields = ['created_at', 'updated_at', 'last_message_at']
    ordering = ['-updated_at']
    
    def get_queryset(self):
        """Filter conversations for current user"""
        return ChatConversation.objects.filter(
            user=self.request.user
        ).prefetch_related('messages')
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return ChatConversationListSerializer
        return ChatConversationSerializer
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message in this conversation"""
        conversation = self.get_object()
        
        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        message_content = serializer.validated_data['message']
        
        try:
            # Create user message
            user_message = ChatMessage.objects.create(
                conversation=conversation,
                role='user',
                content=message_content,
                message_type='text'
            )
            
            # Get AI response
            ai_service = AIService()
            start_time = time.time()
            
            ai_response = ai_service.generate_response(
                message=message_content,
                conversation=conversation,
                user=request.user
            )
            
            processing_time = int((time.time() - start_time) * 1000)
            
            # Create AI message
            ai_message = ChatMessage.objects.create(
                conversation=conversation,
                role='assistant',
                content=ai_response['response'],
                message_type='text',
                tokens_used=ai_response.get('tokens_used', 0),
                processing_time_ms=processing_time,
                model_used=ai_response.get('model_used', ''),
                confidence_score=ai_response.get('confidence_score', 0.8),
                metadata=ai_response.get('metadata', {})
            )
            
            # Generate recommendations if applicable
            recommendations = ai_service.generate_recommendations(
                message=message_content,
                conversation=conversation,
                user=request.user
            )
            
            logger.info(f"AI response generated for user {request.user.username}")
            
            # Serialize response
            response_data = ChatResponseSerializer({
                'conversation_id': conversation.id,
                'message_id': ai_message.id,
                'response': ai_response['response'],
                'confidence_score': ai_response.get('confidence_score', 0.8),
                'processing_time_ms': processing_time,
                'tokens_used': ai_response.get('tokens_used', 0),
                'recommendations': recommendations
            }).data
            
            return Response(response_data, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"AI response generation failed: {str(e)}")
            return Response(
                {'error': 'Failed to generate AI response. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive a conversation"""
        conversation = self.get_object()
        conversation.status = 'archived'
        conversation.save()
        
        return Response({'message': 'Conversation archived'})
    
    @action(detail=False, methods=['post'])
    def start_conversation(self, request):
        """Start a new conversation with an initial message"""
        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Create new conversation
        conversation = ChatConversation.objects.create(
            user=request.user,
            conversation_type=serializer.validated_data.get('conversation_type', 'general'),
            context_data=serializer.validated_data.get('context_data', {}),
            language=serializer.validated_data.get('language', 'en')
        )
        
        # Send initial message
        request.data['conversation_id'] = str(conversation.id)
        return self.send_message(request, pk=conversation.id)


class ChatMessageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing chat messages
    """
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['role', 'message_type']
    ordering_fields = ['created_at']
    ordering = ['created_at']
    
    def get_queryset(self):
        """Filter messages for current user's conversations"""
        return ChatMessage.objects.filter(
            conversation__user=self.request.user
        ).select_related('conversation')
    
    @action(detail=True, methods=['post'])
    def feedback(self, request, pk=None):
        """Provide feedback on a message"""
        message = self.get_object()
        
        serializer = MessageFeedbackSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Update message with feedback
        if 'is_helpful' in serializer.validated_data:
            message.is_helpful = serializer.validated_data['is_helpful']
        
        if 'user_rating' in serializer.validated_data:
            message.user_rating = serializer.validated_data['user_rating']
        
        message.save()
        
        logger.info(f"Feedback provided for message {message.id}")
        
        return Response({'message': 'Feedback recorded'})


class AIRecommendationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing AI recommendations
    """
    serializer_class = AIRecommendationSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['recommendation_type', 'status', 'priority']
    ordering_fields = ['created_at', 'priority', 'valid_until']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter recommendations for current user"""
        return AIRecommendation.objects.filter(
            user=self.request.user
        ).select_related('context_farm', 'context_crop')
    
    def retrieve(self, request, *args, **kwargs):
        """Mark recommendation as viewed when retrieved"""
        instance = self.get_object()
        instance.mark_as_viewed()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def feedback(self, request, pk=None):
        """Provide feedback on a recommendation"""
        recommendation = self.get_object()
        
        serializer = RecommendationFeedbackSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        action_type = serializer.validated_data['action']
        feedback_text = serializer.validated_data.get('feedback_text', '')
        user_rating = serializer.validated_data.get('user_rating')
        
        if action_type == 'implement':
            recommendation.mark_as_implemented(feedback_text)
        elif action_type == 'dismiss':
            recommendation.dismiss(feedback_text)
        elif action_type == 'rate' and user_rating:
            recommendation.user_rating = user_rating
            recommendation.user_feedback = feedback_text
            recommendation.save()
        
        logger.info(f"Feedback provided for recommendation {recommendation.id}: {action_type}")
        
        return Response({'message': f'Recommendation {action_type}ed'})
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active recommendations"""
        queryset = self.get_queryset().filter(
            status='active',
            valid_until__gt=timezone.now()
        )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def urgent(self, request):
        """Get urgent recommendations"""
        queryset = self.get_queryset().filter(
            status='active',
            priority='urgent'
        )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class KnowledgeBaseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for browsing knowledge base (read-only)
    """
    queryset = KnowledgeBase.objects.filter(is_active=True)
    serializer_class = KnowledgeBaseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'language', 'is_verified']
    search_fields = ['title', 'content', 'summary', 'tags']
    ordering_fields = ['created_at', 'usage_count', 'accuracy_score']
    ordering = ['-usage_count']
    
    def retrieve(self, request, *args, **kwargs):
        """Increment usage count when article is viewed"""
        instance = self.get_object()
        instance.increment_usage()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search knowledge base articles"""
        query = request.query_params.get('q', '')
        category = request.query_params.get('category')
        
        queryset = self.get_queryset()
        
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query) |
                Q(content__icontains=query) |
                Q(summary__icontains=query) |
                Q(tags__icontains=query)
            )
        
        if category:
            queryset = queryset.filter(category=category)
        
        # Limit results
        queryset = queryset[:20]
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class VoiceInteractionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing voice interactions
    """
    serializer_class = VoiceInteractionSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'language_detected']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter voice interactions for current user"""
        return VoiceInteraction.objects.filter(
            user=self.request.user
        ).select_related('conversation')
    
    def create(self, request, *args, **kwargs):
        """Create voice interaction and process audio"""
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        voice_interaction = serializer.save()
        
        # Process voice interaction asynchronously
        # In a real implementation, this would be handled by a background task
        try:
            ai_service = AIService()
            ai_service.process_voice_interaction(voice_interaction)
        except Exception as e:
            logger.error(f"Voice processing failed: {str(e)}")
            voice_interaction.mark_failed(str(e))
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AIAnalyticsViewSet(viewsets.ViewSet):
    """
    ViewSet for AI usage analytics
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def usage_stats(self, request):
        """Get user's AI usage statistics"""
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timedelta(days=days)
        
        stats = AIUsageStatistics.objects.filter(
            user=request.user,
            date__gte=start_date
        ).order_by('date')
        
        serializer = AIUsageStatisticsSerializer(stats, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary of AI usage"""
        # Total conversations
        total_conversations = ChatConversation.objects.filter(
            user=request.user
        ).count()
        
        # Total messages
        total_messages = ChatMessage.objects.filter(
            conversation__user=request.user
        ).count()
        
        # Active recommendations
        active_recommendations = AIRecommendation.objects.filter(
            user=request.user,
            status='active'
        ).count()
        
        # Average response time
        avg_response_time = ChatMessage.objects.filter(
            conversation__user=request.user,
            role='assistant',
            processing_time_ms__isnull=False
        ).aggregate(avg_time=Avg('processing_time_ms'))['avg_time']
        
        # User satisfaction
        avg_rating = ChatMessage.objects.filter(
            conversation__user=request.user,
            role='assistant',
            user_rating__isnull=False
        ).aggregate(avg_rating=Avg('user_rating'))['avg_rating']
        
        return Response({
            'total_conversations': total_conversations,
            'total_messages': total_messages,
            'active_recommendations': active_recommendations,
            'average_response_time_ms': avg_response_time,
            'average_user_rating': avg_rating
        })

class AIUsageStatisticsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing AI usage statistics
    """
    serializer_class = AIUsageStatisticsSerializer
    permission_classes = [IsAuthenticated]
    ordering = ['-date']
    
    def get_queryset(self):
        """Filter statistics for current user"""
        return AIUsageStatistics.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get usage summary for a period"""
        days = int(request.query_params.get('days', 30))
        
        from datetime import timedelta
        start_date = timezone.now().date() - timedelta(days=days)
        
        stats = self.get_queryset().filter(date__gte=start_date)
        
        summary = stats.aggregate(
            total_conversations=models.Sum('conversations_started'),
            total_messages=models.Sum('messages_sent'),
            total_voice_interactions=models.Sum('voice_interactions'),
            total_recommendations=models.Sum('recommendations_received'),
            implemented_recommendations=models.Sum('recommendations_implemented'),
            total_tokens=models.Sum('total_tokens_used'),
            avg_satisfaction=models.Avg('user_satisfaction_score')
        )
        
        return Response({
            'period_days': days,
            'summary': summary,
            'daily_stats': AIUsageStatisticsSerializer(stats, many=True).data
        })