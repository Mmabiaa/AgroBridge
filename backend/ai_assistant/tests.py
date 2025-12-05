"""
Tests for AI assistant app
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch, MagicMock
import json
import uuid
from datetime import timedelta
from django.utils import timezone

from .models import (
    ChatConversation, ChatMessage, AIRecommendation, 
    KnowledgeBase, VoiceInteraction, AIUsageStatistics
)
from .ai_service import AIService
from .voice_service import VoiceService

User = get_user_model()


class AIAssistantModelTests(TestCase):
    """Test AI assistant models"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='farmer'
        )
    
    def test_chat_conversation_creation(self):
        """Test ChatConversation model creation"""
        conversation = ChatConversation.objects.create(
            user=self.user,
            title='Test Conversation',
            conversation_type='farming_advice',
            context_data={'crop': 'tomato', 'location': 'California'}
        )
        
        self.assertEqual(conversation.user, self.user)
        self.assertEqual(conversation.title, 'Test Conversation')
        self.assertEqual(conversation.conversation_type, 'farming_advice')
        self.assertEqual(conversation.message_count, 0)
        self.assertEqual(conversation.status, 'active')
        self.assertIsInstance(conversation.id, uuid.UUID)
    
    def test_chat_message_creation(self):
        """Test ChatMessage model creation"""
        conversation = ChatConversation.objects.create(
            user=self.user,
            title='Test Conversation'
        )
        
        message = ChatMessage.objects.create(
            conversation=conversation,
            role='user',
            content='Hello, I need help with my tomatoes',
            message_type='text'
        )
        
        self.assertEqual(message.conversation, conversation)
        self.assertEqual(message.role, 'user')
        self.assertEqual(message.content, 'Hello, I need help with my tomatoes')
        self.assertEqual(message.message_type, 'text')
        self.assertIsInstance(message.id, uuid.UUID)
    
    def test_conversation_add_message(self):
        """Test adding messages to conversation"""
        conversation = ChatConversation.objects.create(
            user=self.user,
            title='Test Conversation'
        )
        
        # Add user message
        message = conversation.add_message(
            role='user',
            content='What fertilizer should I use?'
        )
        
        self.assertEqual(message.role, 'user')
        self.assertEqual(message.content, 'What fertilizer should I use?')
        
        # Check conversation stats updated
        conversation.refresh_from_db()
        self.assertEqual(conversation.message_count, 1)
    
    def test_ai_recommendation_creation(self):
        """Test AIRecommendation model creation"""
        recommendation = AIRecommendation.objects.create(
            user=self.user,
            recommendation_type='fertilizer',
            title='Fertilizer Recommendation',
            description='Use balanced NPK fertilizer',
            detailed_content={'type': 'NPK 10-10-10', 'amount': '2 lbs per 100 sq ft'},
            confidence_score=0.85
        )
        
        self.assertEqual(recommendation.user, self.user)
        self.assertEqual(recommendation.recommendation_type, 'fertilizer')
        self.assertEqual(recommendation.confidence_score, 0.85)
        self.assertTrue(recommendation.is_valid)
    
    def test_knowledge_base_creation(self):
        """Test KnowledgeBase model creation"""
        kb_entry = KnowledgeBase.objects.create(
            title='Tomato Blight Treatment',
            category='diseases',
            content='Steps to treat tomato blight...',
            tags=['tomato', 'blight', 'disease', 'treatment']
        )
        
        self.assertEqual(kb_entry.title, 'Tomato Blight Treatment')
        self.assertEqual(kb_entry.category, 'diseases')
        self.assertEqual(kb_entry.usage_count, 0)
        self.assertTrue(kb_entry.is_active)
    
    def test_voice_interaction_creation(self):
        """Test VoiceInteraction model creation"""
        conversation = ChatConversation.objects.create(
            user=self.user,
            title='Voice Test'
        )
        
        voice_interaction = VoiceInteraction.objects.create(
            user=self.user,
            conversation=conversation,
            transcribed_text='What is the weather like?',
            response_text='The weather is sunny today.',
            status='completed'
        )
        
        self.assertEqual(voice_interaction.user, self.user)
        self.assertEqual(voice_interaction.conversation, conversation)
        self.assertEqual(voice_interaction.status, 'completed')


class AIServiceTests(TestCase):
    """Test AI service functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='farmer'
        )
        self.conversation = ChatConversation.objects.create(
            user=self.user,
            title='Test Conversation',
            conversation_type='farming_advice'
        )
        self.ai_service = AIService()
    
    def test_generate_response(self):
        """Test AI response generation"""
        response = self.ai_service.generate_response(
            message='What fertilizer should I use for tomatoes?',
            conversation=self.conversation,
            user=self.user
        )
        
        self.assertIn('response', response)
        self.assertIn('tokens_used', response)
        self.assertIn('confidence_score', response)
        self.assertIsInstance(response['response'], str)
        self.assertGreater(len(response['response']), 0)
    
    def test_generate_recommendations(self):
        """Test AI recommendation generation"""
        recommendations = self.ai_service.generate_recommendations(
            message='My tomatoes have brown spots on the leaves',
            conversation=self.conversation,
            user=self.user
        )
        
        self.assertIsInstance(recommendations, list)
        # Should generate at least one recommendation for disease-related query
        if recommendations:
            rec = recommendations[0]
            self.assertIn('type', rec)
            self.assertIn('title', rec)
            self.assertIn('confidence_score', rec)


class VoiceServiceTests(TestCase):
    """Test voice service functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='farmer'
        )
        self.voice_service = VoiceService()
    
    def test_transcribe_audio_mock(self):
        """Test audio transcription (mock)"""
        # Create mock audio file
        audio_file = SimpleUploadedFile(
            "test_audio.wav",
            b"fake audio content",
            content_type="audio/wav"
        )
        
        result = self.voice_service.transcribe_audio(audio_file, 'en')
        
        self.assertTrue(result['success'])
        self.assertIn('text', result)
        self.assertIn('confidence', result)
        self.assertIn('language', result)
        self.assertGreater(len(result['text']), 0)
    
    def test_synthesize_speech_mock(self):
        """Test speech synthesis (mock)"""
        text = "Hello, this is a test message for speech synthesis."
        
        result = self.voice_service.synthesize_speech(text, 'en', 'default')
        
        self.assertTrue(result['success'])
        self.assertIn('duration_seconds', result)
        self.assertIn('processing_time_ms', result)
        self.assertIn('character_count', result)
    
    def test_interpret_voice_command(self):
        """Test voice command interpretation"""
        text = "What fertilizer should I use for my tomatoes?"
        
        interpretation = self.voice_service._interpret_voice_command(
            text, self.user, None
        )
        
        self.assertIn('intent', interpretation)
        self.assertIn('confidence', interpretation)
        self.assertIn('entities', interpretation)
        self.assertEqual(interpretation['intent'], 'fertilizer_advice')
    
    def test_supported_languages(self):
        """Test getting supported languages"""
        languages = self.voice_service.get_supported_languages()
        
        self.assertIsInstance(languages, list)
        self.assertIn('en', languages)
        self.assertGreater(len(languages), 0)


class ChatConversationAPITests(APITestCase):
    """Test ChatConversation API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='farmer'
        )
        self.client = APIClient()
        
        # Get JWT token
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    def test_create_conversation(self):
        """Test creating a new conversation"""
        url = reverse('ai_assistant:conversation-list')
        data = {
            'title': 'Test Conversation',
            'conversation_type': 'farming_advice',
            'context_data': {'crop': 'tomato'},
            'initial_message': 'Hello, I need help with my tomatoes'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Test Conversation')
        self.assertEqual(response.data['conversation_type'], 'farming_advice')
        
        # Check conversation was created in database
        conversation = ChatConversation.objects.get(id=response.data['id'])
        self.assertEqual(conversation.user, self.user)
    
    def test_list_conversations(self):
        """Test listing user's conversations"""
        # Create test conversations
        ChatConversation.objects.create(
            user=self.user,
            title='Conversation 1',
            conversation_type='farming_advice'
        )
        ChatConversation.objects.create(
            user=self.user,
            title='Conversation 2',
            conversation_type='pest_control'
        )
        
        url = reverse('ai_assistant:conversation-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_send_message(self):
        """Test sending a message in conversation"""
        conversation = ChatConversation.objects.create(
            user=self.user,
            title='Test Conversation'
        )
        
        url = reverse('ai_assistant:conversation-send-message', kwargs={'pk': conversation.id})
        data = {
            'content': 'What fertilizer should I use?',
            'message_type': 'text'
        }
        
        with patch.object(AIService, 'generate_response') as mock_generate:
            mock_generate.return_value = {
                'content': 'I recommend using a balanced NPK fertilizer.',
                'tokens_used': 25,
                'confidence_score': 0.8,
                'metadata': {}
            }
            
            response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user_message', response.data)
        self.assertIn('assistant_message', response.data)
        
        # Check messages were created
        conversation.refresh_from_db()
        self.assertEqual(conversation.message_count, 2)  # User + Assistant
    
    def test_archive_conversation(self):
        """Test archiving a conversation"""
        conversation = ChatConversation.objects.create(
            user=self.user,
            title='Test Conversation'
        )
        
        url = reverse('ai_assistant:conversation-archive', kwargs={'pk': conversation.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        conversation.refresh_from_db()
        self.assertEqual(conversation.status, 'archived')


class AIRecommendationAPITests(APITestCase):
    """Test AIRecommendation API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='farmer'
        )
        self.client = APIClient()
        
        # Get JWT token
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    def test_list_recommendations(self):
        """Test listing user's recommendations"""
        # Create test recommendations
        AIRecommendation.objects.create(
            user=self.user,
            recommendation_type='fertilizer',
            title='Fertilizer Recommendation',
            description='Use balanced NPK',
            detailed_content={'type': 'NPK 10-10-10'},
            confidence_score=0.8
        )
        
        url = reverse('ai_assistant:recommendation-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_provide_feedback(self):
        """Test providing feedback on recommendation"""
        recommendation = AIRecommendation.objects.create(
            user=self.user,
            recommendation_type='fertilizer',
            title='Fertilizer Recommendation',
            description='Use balanced NPK',
            detailed_content={'type': 'NPK 10-10-10'},
            confidence_score=0.8
        )
        
        url = reverse('ai_assistant:recommendation-provide-feedback', kwargs={'pk': recommendation.id})
        data = {
            'user_rating': 4,
            'user_feedback': 'Very helpful recommendation',
            'status': 'accepted'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        recommendation.refresh_from_db()
        self.assertEqual(recommendation.user_rating, 4)
        self.assertEqual(recommendation.status, 'accepted')
    
    def test_active_recommendations(self):
        """Test getting active recommendations"""
        # Create active recommendation
        AIRecommendation.objects.create(
            user=self.user,
            recommendation_type='fertilizer',
            title='Active Recommendation',
            description='Use balanced NPK',
            detailed_content={'type': 'NPK 10-10-10'},
            confidence_score=0.8,
            status='pending'
        )
        
        # Create expired recommendation
        AIRecommendation.objects.create(
            user=self.user,
            recommendation_type='pest_control',
            title='Expired Recommendation',
            description='Use neem oil',
            detailed_content={'type': 'neem oil'},
            confidence_score=0.7,
            status='pending'
        )
        
        url = reverse('ai_assistant:recommendation-active')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Active Recommendation')


class VoiceInteractionAPITests(APITestCase):
    """Test VoiceInteraction API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='farmer'
        )
        self.client = APIClient()
        
        # Get JWT token
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    def test_transcribe_audio(self):
        """Test audio transcription endpoint"""
        # Create mock audio file
        audio_file = SimpleUploadedFile(
            "test_audio.wav",
            b"fake audio content",
            content_type="audio/wav"
        )
        
        url = reverse('ai_assistant:voice-transcribe')
        data = {
            'audio_file': audio_file,
            'language': 'en'
        }
        
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('transcription', response.data)
        self.assertIn('confidence', response.data)
    
    def test_synthesize_speech(self):
        """Test speech synthesis endpoint"""
        url = reverse('ai_assistant:voice-synthesize')
        data = {
            'text': 'Hello, this is a test message.',
            'language': 'en',
            'voice_model': 'default'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('duration_seconds', response.data)
    
    def test_process_voice_command(self):
        """Test complete voice command processing"""
        # Create mock audio file
        audio_file = SimpleUploadedFile(
            "test_command.wav",
            b"fake audio content",
            content_type="audio/wav"
        )
        
        url = reverse('ai_assistant:voice-process-command')
        data = {
            'audio_file': audio_file,
            'language': 'en'
        }
        
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('transcription', response.data)
        self.assertIn('text_response', response.data)
        self.assertIn('command_interpretation', response.data)
    
    def test_supported_languages(self):
        """Test getting supported languages"""
        url = reverse('ai_assistant:voice-supported-languages')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('supported_languages', response.data)
        self.assertIsInstance(response.data['supported_languages'], list)
    
    def test_voice_models(self):
        """Test getting voice models"""
        url = reverse('ai_assistant:voice-voice-models')
        response = self.client.get(url, {'language': 'en'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('voice_models', response.data)
        self.assertIsInstance(response.data['voice_models'], list)


class KnowledgeBaseAPITests(APITestCase):
    """Test KnowledgeBase API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='farmer'
        )
        self.client = APIClient()
        
        # Get JWT token
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    def test_list_knowledge_base(self):
        """Test listing knowledge base entries"""
        # Create test knowledge base entries
        KnowledgeBase.objects.create(
            title='Tomato Care Guide',
            category='crops',
            content='How to care for tomatoes...',
            tags=['tomato', 'care', 'guide']
        )
        
        url = reverse('ai_assistant:knowledge-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_search_knowledge_base(self):
        """Test searching knowledge base"""
        KnowledgeBase.objects.create(
            title='Tomato Blight Treatment',
            category='diseases',
            content='How to treat tomato blight disease...',
            tags=['tomato', 'blight', 'disease']
        )
        
        url = reverse('ai_assistant:knowledge-list')
        response = self.client.get(url, {'search': 'tomato'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_retrieve_knowledge_entry(self):
        """Test retrieving specific knowledge base entry"""
        kb_entry = KnowledgeBase.objects.create(
            title='Pest Control Guide',
            category='pests',
            content='How to control common pests...',
            tags=['pest', 'control']
        )
        
        url = reverse('ai_assistant:knowledge-detail', kwargs={'pk': kb_entry.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Pest Control Guide')
        
        # Check usage count was incremented
        kb_entry.refresh_from_db()
        self.assertEqual(kb_entry.usage_count, 1)


class AIUsageStatisticsAPITests(APITestCase):
    """Test AIUsageStatistics API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='farmer'
        )
        self.client = APIClient()
        
        # Get JWT token
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    def test_list_usage_statistics(self):
        """Test listing usage statistics"""
        # Create test statistics
        AIUsageStatistics.objects.create(
            user=self.user,
            date=timezone.now().date(),
            conversations_started=5,
            messages_sent=20,
            voice_interactions=3,
            recommendations_received=2
        )
        
        url = reverse('ai_assistant:statistics-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_usage_summary(self):
        """Test getting usage summary"""
        # Create test statistics for multiple days
        today = timezone.now().date()
        AIUsageStatistics.objects.create(
            user=self.user,
            date=today,
            conversations_started=3,
            messages_sent=15,
            voice_interactions=2
        )
        AIUsageStatistics.objects.create(
            user=self.user,
            date=today - timedelta(days=1),
            conversations_started=2,
            messages_sent=10,
            voice_interactions=1
        )
        
        url = reverse('ai_assistant:statistics-summary')
        response = self.client.get(url, {'days': 7})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('summary', response.data)
        self.assertIn('daily_stats', response.data)
        self.assertEqual(response.data['period_days'], 7)


class LanguageServiceTests(TestCase):
    """Test language service functionality"""
    
    def setUp(self):
        from .language_service import LanguageService
        self.language_service = LanguageService()
    
    def test_language_detection(self):
        """Test language detection from text"""
        # Test English
        result = self.language_service.detect_language("What fertilizer should I use for tomatoes?")
        self.assertEqual(result['language'], 'en')
        
        # Test Twi
        result = self.language_service.detect_language("Akwaaba! Ɛdeɛn na metumi aboa wo nnɛ?")
        self.assertEqual(result['language'], 'tw')
        
        # Test Hausa
        result = self.language_service.detect_language("Sannu! Yaya zan taimake ka wajen noma?")
        self.assertEqual(result['language'], 'ha')
    
    def test_agricultural_term_translation(self):
        """Test agricultural term translation"""
        # Test English to Twi
        result = self.language_service.translate_agricultural_term('crop', 'en', 'tw')
        self.assertEqual(result, 'nnɔbae')
        
        # Test English to Hausa
        result = self.language_service.translate_agricultural_term('farm', 'en', 'ha')
        self.assertEqual(result, 'gona')
        
        # Test unknown term
        result = self.language_service.translate_agricultural_term('unknown', 'en', 'tw')
        self.assertEqual(result, 'unknown')  # Should return original
    
    def test_localized_responses(self):
        """Test getting localized responses"""
        # Test English greeting
        result = self.language_service.get_localized_response('greeting', 'en')
        self.assertIn('AgriGPT', result)
        
        # Test Twi greeting
        result = self.language_service.get_localized_response('greeting', 'tw')
        self.assertIn('Akwaaba', result)
        
        # Test fallback for unsupported language
        result = self.language_service.get_localized_response('greeting', 'xyz')
        self.assertIn('AgriGPT', result)  # Should fallback to English
    
    def test_supported_languages(self):
        """Test getting supported languages"""
        languages = self.language_service.get_supported_languages()
        
        self.assertIsInstance(languages, list)
        self.assertGreater(len(languages), 0)
        
        # Check English is included
        english_found = any(lang['code'] == 'en' for lang in languages)
        self.assertTrue(english_found)
    
    def test_language_suggestion_by_location(self):
        """Test language suggestion based on location"""
        # Test Ghana
        result = self.language_service.suggest_language_from_location('Ghana')
        self.assertIn('tw', result)
        self.assertIn('en', result)
        
        # Test Nigeria
        result = self.language_service.suggest_language_from_location('Nigeria')
        self.assertIn('ha', result)
        self.assertIn('en', result)
        
        # Test unknown country
        result = self.language_service.suggest_language_from_location('Unknown')
        self.assertEqual(result, ['en'])  # Should default to English


class LanguageAPITests(APITestCase):
    """Test Language API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='farmer'
        )
        self.client = APIClient()
        
        # Get JWT token
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    def test_supported_languages_endpoint(self):
        """Test getting supported languages via API"""
        url = reverse('ai_assistant:language-supported-languages')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('supported_languages', response.data)
        self.assertIsInstance(response.data['supported_languages'], list)
    
    def test_detect_language_endpoint(self):
        """Test language detection via API"""
        url = reverse('ai_assistant:language-detect-language')
        data = {
            'text': 'What fertilizer should I use for my tomatoes?'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('language', response.data)
        self.assertIn('confidence', response.data)
    
    def test_translate_term_endpoint(self):
        """Test term translation via API"""
        url = reverse('ai_assistant:language-translate-term')
        data = {
            'term': 'crop',
            'from_language': 'en',
            'to_language': 'tw'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('translated_term', response.data)
        self.assertIn('original_term', response.data)
    
    def test_suggest_languages_endpoint(self):
        """Test language suggestion via API"""
        url = reverse('ai_assistant:language-suggest-languages')
        response = self.client.get(url, {'country': 'Ghana'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('suggested_languages', response.data)
        self.assertIsInstance(response.data['suggested_languages'], list)


class FarmContextIntegrationTests(TestCase):
    """Test farm context integration in AI responses"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='farmer'
        )
        
        # Create test farm data
        from farms.models import Farm, Field, Crop
        
        self.farm = Farm.objects.create(
            owner=self.user,
            name='Test Farm',
            location='Test Location',
            size_hectares=10.5,
            soil_type='loamy'
        )
        
        self.field = Field.objects.create(
            farm=self.farm,
            name='Test Field',
            size_hectares=5.0
        )
        
        self.crop = Crop.objects.create(
            field=self.field,
            crop_type='tomato',
            variety='Roma',
            planting_date=timezone.now().date(),
            status='growing'
        )
        
        self.ai_service = AIService()
    
    def test_farm_context_retrieval(self):
        """Test retrieving farm context for user"""
        context = self.ai_service._get_farm_context(self.user)
        
        self.assertIn('Test Farm', context)
        self.assertIn('10.5ha', context)
        self.assertIn('loamy', context)
        self.assertIn('tomato', context)
    
    def test_ai_response_with_farm_context(self):
        """Test AI response generation with farm context"""
        conversation = ChatConversation.objects.create(
            user=self.user,
            title='Test Conversation'
        )
        
        response = self.ai_service.generate_response(
            message='What should I do for my tomatoes?',
            conversation=conversation,
            user=self.user
        )
        
        self.assertIn('response', response)
        self.assertIn('metadata', response)
        self.assertTrue(response['metadata'].get('farm_context_used', False))


class EnhancedVoiceProcessingTests(TestCase):
    """Test enhanced voice processing functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='farmer'
        )
        self.voice_service = VoiceService()
    
    def test_multi_language_voice_processing(self):
        """Test voice processing with different languages"""
        # Create mock audio file
        audio_file = SimpleUploadedFile(
            "test_audio_twi.wav",
            b"fake twi audio content",
            content_type="audio/wav"
        )
        
        result = self.voice_service.process_voice_command(
            audio_file, 
            self.user, 
            None
        )
        
        self.assertTrue(result['success'])
        self.assertIn('transcription', result)
        self.assertIn('command_interpretation', result)
        self.assertIn('text_response', result)
    
    def test_voice_command_interpretation(self):
        """Test voice command interpretation with agricultural context"""
        text = "My tomato plants have brown spots on the leaves"
        
        interpretation = self.voice_service._interpret_voice_command(
            text, self.user, None
        )
        
        self.assertEqual(interpretation['intent'], 'disease_diagnosis')
        self.assertIn('entities', interpretation)
        self.assertGreater(interpretation['confidence'], 0.5)
