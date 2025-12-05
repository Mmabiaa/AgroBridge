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
from django.core.cache import cache  # 🆕 ADD THIS IMPORT
from django.db import transaction     # 🆕 ADD THIS IMPORT
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
    
    def create(self, request, *args, **kwargs):
        """Create a new conversation with optional initial message"""
        try:
            # Extract initial message if provided
            initial_message = request.data.pop('initial_message', None)
            
            # Create conversation using standard serializer
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            conversation = serializer.save(user=request.user)
            
            # Add initial message if provided
            if initial_message:
                user_message = ChatMessage.objects.create(
                    conversation=conversation,
                    role='user',
                    content=initial_message,
                    message_type='text'
                )
                
                # Generate AI response
                try:
                    ai_service = AIService()
                    ai_response = ai_service.generate_response(
                        message=initial_message,
                        conversation=conversation,
                        user=request.user
                    )
                    
                    ChatMessage.objects.create(
                        conversation=conversation,
                        role='assistant',
                        content=ai_response['response'],
                        message_type='text',
                        tokens_used=ai_response.get('tokens_used', 0),
                        model_used=ai_response.get('model_used', ''),
                        confidence_score=ai_response.get('confidence_score', 0.8),
                        metadata=ai_response.get('metadata', {})
                    )
                    
                except Exception as e:
                    logger.error(f"AI response generation failed during conversation creation: {str(e)}")
                    # Add fallback message
                    ChatMessage.objects.create(
                        conversation=conversation,
                        role='assistant',
                        content="I'm here to help you with your agricultural questions. How can I assist you today?"
                    )
            
            # Return created conversation
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            logger.error(f"Conversation creation failed: {str(e)}")
            return Response(
                {'error': 'Failed to create conversation'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message in this conversation"""
        conversation = self.get_object()
        
        # Simple validation
        message_content = request.data.get('content') or request.data.get('message')
        if not message_content:
            return Response({'error': 'Message content is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 🔒 ADD DEDUPLICATION - Prevent multiple requests for same message
        cache_key = f"msg_lock_{conversation.id}_{hash(message_content)}"
        if cache.get(cache_key):
            logger.warning(f"Duplicate message detected for conversation {conversation.id}")
            return Response(
                {'error': 'Message is already being processed'}, 
                status=status.HTTP_409_CONFLICT
            )
        
        # Set lock for 10 seconds
        cache.set(cache_key, True, 10)
        
        try:
            # Use atomic transaction to ensure data consistency
            with transaction.atomic():
                # Create user message
                user_message = ChatMessage.objects.create(
                    conversation=conversation,
                    role='user',
                    content=message_content,
                    message_type='text'
                )
                
                logger.info(f"Created user message for conversation {conversation.id}")
                
                # Get AI response
                ai_service = AIService()
                start_time = time.time()
                
                try:
                    ai_response = ai_service.generate_response(
                        message=message_content,
                        conversation=conversation,
                        user=request.user
                    )
                    
                    processing_time = int((time.time() - start_time) * 1000)
                    logger.info(f"AI response generated successfully in {processing_time}ms")
                    
                except Exception as ai_error:
                    logger.error(f"AI service failed: {str(ai_error)}")
                    # Use fallback response
                    ai_response = {
                        'response': "I'm currently experiencing technical difficulties. Please try again in a moment or rephrase your question about agriculture, crops, or farming practices.",
                        'tokens_used': 0,
                        'confidence_score': 0.5,
                        'model_used': 'fallback',
                        'metadata': {'fallback': True, 'error': str(ai_error)}
                    }
                    processing_time = 0
                
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
                
                logger.info(f"Created AI message with ID: {ai_message.id}")
                
                # Generate recommendations (handle gracefully if it fails)
                recommendations = []
                try:
                    recommendations = ai_service.generate_recommendations(
                        conversation=conversation,
                        user=request.user,
                        message_content=message_content
                    )
                    logger.info(f"Generated {len(recommendations)} recommendations")
                except Exception as rec_error:
                    logger.warning(f"Recommendation generation failed: {str(rec_error)}")
                    # Continue without recommendations
                
                # Update conversation stats
                conversation.message_count = conversation.messages.count()
                conversation.total_tokens_used += ai_response.get('tokens_used', 0)
                conversation.save()
                
                # Serialize response
                response_data = {
                    'conversation_id': str(conversation.id),
                    'message_id': str(ai_message.id),
                    'response': ai_response['response'],
                    'confidence_score': ai_response.get('confidence_score', 0.8),
                    'processing_time_ms': processing_time,
                    'tokens_used': ai_response.get('tokens_used', 0),
                    'recommendations': recommendations
                }
                
                logger.info(f"Successfully completed send_message for conversation {conversation.id}")
                
                return Response(response_data, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Send message failed for conversation {conversation.id}: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to process your message. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        finally:
            # 🧹 Always clear the lock
            try:
                cache.delete(cache_key)
            except Exception as cache_error:
                logger.warning(f"Failed to clear cache lock: {str(cache_error)}")
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get messages for this conversation"""
        try:
            conversation = self.get_object()
            messages = conversation.messages.all().order_by('created_at')
            
            serializer = ChatMessageSerializer(messages, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Failed to get messages: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve messages'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive a conversation"""
        try:
            conversation = self.get_object()
            conversation.status = 'archived'
            conversation.save()
            
            return Response({'message': 'Conversation archived'})
        except Exception as e:
            logger.error(f"Failed to archive conversation: {str(e)}")
            return Response(
                {'error': 'Failed to archive conversation'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def start_conversation(self, request):
        """Start a new conversation with an initial message"""
        try:
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
            
        except Exception as e:
            logger.error(f"Start conversation failed: {str(e)}")
            return Response(
                {'error': 'Failed to start conversation'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
        try:
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
            
        except Exception as e:
            logger.error(f"Feedback submission failed: {str(e)}")
            return Response(
                {'error': 'Failed to record feedback'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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
        try:
            instance = self.get_object()
            instance.mark_as_viewed()
            
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Failed to retrieve recommendation: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve recommendation'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def feedback(self, request, pk=None):
        """Provide feedback on a recommendation"""
        try:
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
            
        except Exception as e:
            logger.error(f"Recommendation feedback failed: {str(e)}")
            return Response(
                {'error': 'Failed to process feedback'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active recommendations"""
        try:
            queryset = self.get_queryset().filter(
                status='active',
                valid_until__gt=timezone.now()
            )
            
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Failed to get active recommendations: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve recommendations'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def urgent(self, request):
        """Get urgent recommendations"""
        try:
            queryset = self.get_queryset().filter(
                status='active',
                priority='urgent'
            )
            
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Failed to get urgent recommendations: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve urgent recommendations'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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
        try:
            instance = self.get_object()
            instance.increment_usage()
            
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Failed to retrieve knowledge base article: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve article'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search knowledge base articles"""
        try:
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
        except Exception as e:
            logger.error(f"Knowledge base search failed: {str(e)}")
            return Response(
                {'error': 'Search failed'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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
        try:
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            voice_interaction = serializer.save()
            
            # Process voice interaction asynchronously
            try:
                ai_service = AIService()
                ai_service.process_voice_interaction(voice_interaction)
            except Exception as e:
                logger.error(f"Voice processing failed: {str(e)}")
                voice_interaction.mark_failed(str(e))
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Voice interaction creation failed: {str(e)}")
            return Response(
                {'error': 'Failed to create voice interaction'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def transcribe(self, request):
        """Transcribe audio to text"""
        try:
            from .voice_service import VoiceService
            voice_service = VoiceService()
            
            audio_file = request.FILES.get('audio_file')
            if not audio_file:
                return Response(
                    {'error': 'Audio file is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            language = request.data.get('language', 'en')
            
            result = voice_service.transcribe_audio(audio_file, language)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Audio transcription failed: {str(e)}")
            return Response(
                {'error': 'Transcription failed'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def synthesize(self, request):
        """Convert text to speech"""
        try:
            from .voice_service import VoiceService
            voice_service = VoiceService()
            
            text = request.data.get('text')
            if not text:
                return Response(
                    {'error': 'Text is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            language = request.data.get('language', 'en')
            voice_model = request.data.get('voice_model', 'default')
            
            result = voice_service.synthesize_speech(text, language, voice_model)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Speech synthesis failed: {str(e)}")
            return Response(
                {'error': 'Speech synthesis failed'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def process_command(self, request):
        """Process complete voice command (transcribe + respond + synthesize)"""
        try:
            from .voice_service import VoiceService
            voice_service = VoiceService()
            
            audio_file = request.FILES.get('audio_file')
            if not audio_file:
                return Response(
                    {'error': 'Audio file is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            conversation_id = request.data.get('conversation_id')
            conversation = None
            
            if conversation_id:
                try:
                    conversation = ChatConversation.objects.get(
                        id=conversation_id, 
                        user=request.user
                    )
                except ChatConversation.DoesNotExist:
                    return Response(
                        {'error': 'Conversation not found'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            result = voice_service.process_voice_command(
                audio_file, 
                request.user, 
                conversation
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Voice command processing failed: {str(e)}")
            return Response(
                {'error': 'Voice command processing failed'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def supported_languages(self, request):
        """Get supported languages for voice processing"""
        try:
            from .voice_service import VoiceService
            voice_service = VoiceService()
            
            languages = voice_service.get_supported_languages()
            
            return Response({
                'supported_languages': languages
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to get supported languages: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve supported languages'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def voice_models(self, request):
        """Get available voice models for a language"""
        try:
            from .voice_service import VoiceService
            voice_service = VoiceService()
            
            language = request.query_params.get('language', 'en')
            models = voice_service.get_voice_models(language)
            
            return Response({
                'language': language,
                'voice_models': models
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to get voice models: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve voice models'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LanguageViewSet(viewsets.ViewSet):
    """
    ViewSet for language support functionality
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def supported_languages(self, request):
        """Get list of supported languages"""
        try:
            from .language_service import LanguageService
            language_service = LanguageService()
            
            languages = language_service.get_supported_languages()
            
            return Response({
                'supported_languages': languages
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to get supported languages: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve supported languages'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def detect_language(self, request):
        """Detect language from text"""
        try:
            from .language_service import LanguageService
            language_service = LanguageService()
            
            text = request.data.get('text')
            if not text:
                return Response(
                    {'error': 'Text is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            result = language_service.detect_language(text)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Language detection failed: {str(e)}")
            return Response(
                {'error': 'Language detection failed'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def translate_term(self, request):
        """Translate agricultural terms between languages"""
        try:
            from .language_service import LanguageService
            language_service = LanguageService()
            
            term = request.data.get('term')
            from_lang = request.data.get('from_language', 'en')
            to_lang = request.data.get('to_language', 'en')
            
            if not term:
                return Response(
                    {'error': 'Term is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            translated = language_service.translate_agricultural_term(
                term, from_lang, to_lang
            )
            
            return Response({
                'original_term': term,
                'translated_term': translated,
                'from_language': from_lang,
                'to_language': to_lang
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Term translation failed: {str(e)}")
            return Response(
                {'error': 'Translation failed'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def suggest_languages(self, request):
        """Suggest languages based on user location"""
        try:
            from .language_service import LanguageService
            language_service = LanguageService()
            
            country = request.query_params.get('country')
            region = request.query_params.get('region')
            
            suggested = language_service.suggest_language_from_location(
                country, region
            )
            
            return Response({
                'suggested_languages': suggested,
                'country': country,
                'region': region
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Language suggestion failed: {str(e)}")
            return Response(
                {'error': 'Language suggestion failed'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AIAnalyticsViewSet(viewsets.ViewSet):
    """
    ViewSet for AI usage analytics
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def usage_stats(self, request):
        """Get user's AI usage statistics"""
        try:
            days = int(request.query_params.get('days', 30))
            start_date = timezone.now().date() - timedelta(days=days)
            
            stats = AIUsageStatistics.objects.filter(
                user=request.user,
                date__gte=start_date
            ).order_by('date')
            
            serializer = AIUsageStatisticsSerializer(stats, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Failed to get usage stats: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve usage statistics'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary of AI usage"""
        try:
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
                'average_response_time_ms': avg_response_time or 0,
                'average_user_rating': avg_rating or 0
            })
        except Exception as e:
            logger.error(f"Failed to get analytics summary: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve analytics'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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
        try:
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
        except Exception as e:
            logger.error(f"Failed to get usage statistics summary: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve usage statistics'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )