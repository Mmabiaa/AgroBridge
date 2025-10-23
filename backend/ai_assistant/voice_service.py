"""
Voice processing service for AI assistant
"""
import logging
import json
from typing import Dict, Optional
from django.conf import settings
from django.core.files.base import ContentFile
from django.utils import timezone
import tempfile
import os

logger = logging.getLogger(__name__)


class VoiceService:
    """
    Service for handling voice-related operations
    """
    
    def __init__(self):
        self.supported_languages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'hi', 'ar']
        self.max_audio_duration = 300  # 5 minutes
        self.supported_formats = ['wav', 'mp3', 'm4a', 'ogg', 'flac']
    
    def transcribe_audio(self, audio_file, language='en') -> Dict:
        """
        Transcribe audio file to text
        
        Args:
            audio_file: Audio file to transcribe
            language: Language code for transcription
            
        Returns:
            Dict with transcription results
        """
        try:
            # Validate audio file
            validation_result = self._validate_audio_file(audio_file)
            if not validation_result['valid']:
                raise ValueError(validation_result['error'])
            
            # Mock transcription implementation
            # In production, integrate with services like:
            # - OpenAI Whisper API
            # - Google Speech-to-Text
            # - Azure Speech Services
            # - AWS Transcribe
            
            transcription_result = self._mock_transcribe(audio_file, language)
            
            return {
                'success': True,
                'text': transcription_result['text'],
                'language': transcription_result['language'],
                'confidence': transcription_result['confidence'],
                'duration_seconds': transcription_result['duration'],
                'processing_time_ms': transcription_result['processing_time'],
                'word_count': len(transcription_result['text'].split()),
                'metadata': transcription_result.get('metadata', {})
            }
            
        except Exception as e:
            logger.error(f"Audio transcription failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'text': '',
                'confidence': 0.0
            }
    
    def synthesize_speech(self, text: str, language='en', voice_model='default') -> Dict:
        """
        Convert text to speech
        
        Args:
            text: Text to convert to speech
            language: Language for speech synthesis
            voice_model: Voice model to use
            
        Returns:
            Dict with synthesis results
        """
        try:
            # Validate input text
            if not text or not text.strip():
                raise ValueError("Text cannot be empty")
            
            if len(text) > 5000:
                raise ValueError("Text too long (max 5000 characters)")
            
            # Mock speech synthesis implementation
            # In production, integrate with services like:
            # - OpenAI TTS API
            # - Google Text-to-Speech
            # - Azure Speech Services
            # - AWS Polly
            # - ElevenLabs
            
            synthesis_result = self._mock_synthesize(text, language, voice_model)
            
            return {
                'success': True,
                'audio_url': synthesis_result.get('audio_url'),
                'audio_data': synthesis_result.get('audio_data'),
                'duration_seconds': synthesis_result['duration'],
                'processing_time_ms': synthesis_result['processing_time'],
                'character_count': len(text),
                'language': language,
                'voice_model': voice_model,
                'metadata': synthesis_result.get('metadata', {})
            }
            
        except Exception as e:
            logger.error(f"Speech synthesis failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'audio_url': None
            }
    
    def process_voice_command(self, audio_file, user, conversation=None) -> Dict:
        """
        Process complete voice command (transcribe + interpret + respond)
        
        Args:
            audio_file: Audio file containing voice command
            user: User making the request
            conversation: Optional conversation context
            
        Returns:
            Dict with complete processing results
        """
        try:
            # Step 1: Transcribe audio
            transcription = self.transcribe_audio(audio_file)
            
            if not transcription['success']:
                return {
                    'success': False,
                    'error': 'Transcription failed',
                    'details': transcription
                }
            
            # Step 2: Interpret command
            command_interpretation = self._interpret_voice_command(
                transcription['text'], 
                user, 
                conversation
            )
            
            # Step 3: Generate response
            from .ai_service import AIService
            ai_service = AIService()
            
            if conversation:
                ai_response = ai_service.generate_response(
                    transcription['text'],
                    conversation,
                    user
                )
            else:
                # Create temporary conversation context
                ai_response = {
                    'response': self._generate_standalone_response(
                        transcription['text'], 
                        command_interpretation
                    ),
                    'tokens_used': 50,
                    'confidence_score': 0.8
                }
            
            # Step 4: Convert response to speech
            speech_synthesis = self.synthesize_speech(
                ai_response['response'],
                transcription.get('language', 'en')
            )
            
            return {
                'success': True,
                'transcription': transcription,
                'command_interpretation': command_interpretation,
                'text_response': ai_response['response'],
                'audio_response': speech_synthesis,
                'processing_summary': {
                    'total_processing_time_ms': (
                        transcription.get('processing_time_ms', 0) +
                        speech_synthesis.get('processing_time_ms', 0)
                    ),
                    'tokens_used': ai_response.get('tokens_used', 0),
                    'confidence_score': min(
                        transcription.get('confidence', 0),
                        ai_response.get('confidence_score', 0)
                    )
                }
            }
            
        except Exception as e:
            logger.error(f"Voice command processing failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _validate_audio_file(self, audio_file) -> Dict:
        """Validate audio file format and size"""
        try:
            # Check file size (max 25MB)
            if audio_file.size > 25 * 1024 * 1024:
                return {
                    'valid': False,
                    'error': 'Audio file too large (max 25MB)'
                }
            
            # Check file format
            file_extension = audio_file.name.split('.')[-1].lower()
            if file_extension not in self.supported_formats:
                return {
                    'valid': False,
                    'error': f'Unsupported format. Supported: {", ".join(self.supported_formats)}'
                }
            
            return {'valid': True}
            
        except Exception as e:
            return {
                'valid': False,
                'error': f'File validation error: {str(e)}'
            }
    
    def _mock_transcribe(self, audio_file, language) -> Dict:
        """Mock transcription implementation"""
        # This is a mock implementation for development
        # Replace with actual transcription service in production
        
        mock_transcriptions = {
            'en': [
                "What's the best fertilizer for tomatoes?",
                "How do I treat blight on my crops?",
                "When should I plant corn this season?",
                "What are the current market prices for wheat?",
                "How much water do my vegetables need?",
                "Can you help me identify this plant disease?",
                "What's the weather forecast for farming this week?",
                "How do I improve my soil quality?",
                "What crops grow best in my region?",
                "When is the best time to harvest potatoes?"
            ],
            'es': [
                "¿Cuál es el mejor fertilizante para tomates?",
                "¿Cómo trato el tizón en mis cultivos?",
                "¿Cuándo debo plantar maíz esta temporada?"
            ]
        }
        
        # Select random transcription based on language
        import random
        transcriptions = mock_transcriptions.get(language, mock_transcriptions['en'])
        selected_text = random.choice(transcriptions)
        
        return {
            'text': selected_text,
            'language': language,
            'confidence': round(random.uniform(0.7, 0.95), 2),
            'duration': round(random.uniform(2.0, 8.0), 1),
            'processing_time': random.randint(800, 2000),
            'metadata': {
                'mock_transcription': True,
                'audio_quality': 'good'
            }
        }
    
    def _mock_synthesize(self, text, language, voice_model) -> Dict:
        """Mock speech synthesis implementation"""
        # This is a mock implementation for development
        # Replace with actual TTS service in production
        
        # Calculate estimated duration (rough estimate: 150 words per minute)
        word_count = len(text.split())
        estimated_duration = (word_count / 150) * 60  # seconds
        
        return {
            'audio_url': None,  # Would be actual audio file URL
            'audio_data': None,  # Would be actual audio binary data
            'duration': round(estimated_duration, 1),
            'processing_time': len(text) * 10,  # Mock processing time
            'metadata': {
                'mock_synthesis': True,
                'voice_model': voice_model,
                'estimated_duration': True
            }
        }
    
    def _interpret_voice_command(self, text: str, user, conversation) -> Dict:
        """Interpret voice command and extract intent"""
        text_lower = text.lower()
        
        # Simple intent classification
        intents = {
            'crop_advice': ['crop', 'plant', 'grow', 'harvest', 'seed'],
            'disease_diagnosis': ['disease', 'pest', 'bug', 'sick', 'problem', 'blight'],
            'weather_inquiry': ['weather', 'rain', 'temperature', 'forecast', 'climate'],
            'market_info': ['price', 'market', 'sell', 'buy', 'cost', 'value'],
            'fertilizer_advice': ['fertilizer', 'nutrient', 'soil', 'feed', 'compost'],
            'irrigation_help': ['water', 'irrigation', 'watering', 'drought', 'moisture'],
            'general_question': []  # Default fallback
        }
        
        detected_intent = 'general_question'
        confidence = 0.5
        
        for intent, keywords in intents.items():
            if intent == 'general_question':
                continue
            
            matches = sum(1 for keyword in keywords if keyword in text_lower)
            if matches > 0:
                detected_intent = intent
                confidence = min(0.9, 0.6 + (matches * 0.1))
                break
        
        # Extract entities (simple keyword extraction)
        entities = self._extract_entities(text_lower)
        
        return {
            'intent': detected_intent,
            'confidence': confidence,
            'entities': entities,
            'original_text': text,
            'processed_text': text_lower
        }
    
    def _extract_entities(self, text: str) -> Dict:
        """Extract entities from text"""
        entities = {}
        
        # Crop entities
        crops = ['tomato', 'corn', 'wheat', 'rice', 'potato', 'carrot', 'lettuce', 'pepper']
        for crop in crops:
            if crop in text:
                entities['crop'] = crop
                break
        
        # Disease entities
        diseases = ['blight', 'rust', 'mold', 'fungus', 'aphid', 'beetle']
        for disease in diseases:
            if disease in text:
                entities['disease'] = disease
                break
        
        # Time entities
        time_words = ['today', 'tomorrow', 'week', 'month', 'season', 'spring', 'summer', 'fall', 'winter']
        for time_word in time_words:
            if time_word in text:
                entities['time'] = time_word
                break
        
        return entities
    
    def _generate_standalone_response(self, text: str, interpretation: Dict) -> str:
        """Generate response for standalone voice commands"""
        intent = interpretation['intent']
        
        responses = {
            'crop_advice': "I'd be happy to help with crop advice. Could you tell me more about your specific crop and growing conditions?",
            'disease_diagnosis': "For disease diagnosis, I'll need more details about the symptoms you're seeing. Can you describe the affected plants?",
            'weather_inquiry': "I can help with weather-related farming advice. What specific weather information do you need for your area?",
            'market_info': "I can provide market information. Which crops or products are you interested in pricing for?",
            'fertilizer_advice': "For fertilizer recommendations, I'll need to know about your soil type and crops. What are you planning to grow?",
            'irrigation_help': "I can help with irrigation planning. What's your current watering situation and what crops are you growing?",
            'general_question': "I'm here to help with your agricultural questions. Could you be more specific about what you'd like to know?"
        }
        
        return responses.get(intent, responses['general_question'])
    
    def get_supported_languages(self) -> list:
        """Get list of supported languages"""
        return self.supported_languages
    
    def get_voice_models(self, language='en') -> list:
        """Get available voice models for a language"""
        # Mock voice models - replace with actual available models
        models = {
            'en': ['default', 'male', 'female', 'professional', 'casual'],
            'es': ['default', 'male', 'female'],
            'fr': ['default', 'male', 'female'],
        }
        
        return models.get(language, ['default'])