import openai
import json
import logging
from django.conf import settings
from django.utils import timezone
from typing import Dict, List, Optional
from .models import ChatConversation, ChatMessage, AIRecommendation, KnowledgeBase

logger = logging.getLogger(__name__)


class AIService:
    """
    Service class for AI assistant functionality using OpenAI API
    """

    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model_name = "gpt-4o-mini"
        self.max_tokens = 1000

    # -------------------------------------------------------------------------
    # 🧠 Generate AI Text Response
    # -------------------------------------------------------------------------
    def _call_ai_model(self, messages: List[Dict]) -> Dict:
        """
        Call OpenAI ChatCompletion API to generate response
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=0.7,
                top_p=1,
            )

            choice = response.choices[0]
            content = choice.message.content

            return {
                'content': content,
                'tokens_used': response.usage.total_tokens,
                'confidence_score': 0.9,
                'metadata': {
                    'model': response.model,
                    'finish_reason': choice.finish_reason,
                    'prompt_tokens': response.usage.prompt_tokens,
                    'completion_tokens': response.usage.completion_tokens
                }
            }

        except openai.RateLimitError as e:
            logger.error(f"OpenAI rate limit exceeded: {str(e)}")
            raise Exception("OpenAI rate limit exceeded. Please try again in a few moments.")

        except openai.BadRequestError as e:
            logger.error(f"OpenAI bad request: {str(e)}")
            raise Exception(f"Invalid request: {str(e)}")

        except openai.AuthenticationError as e:
            logger.error(f"OpenAI authentication failed: {str(e)}")
            raise Exception("AI service authentication failed. Please contact support.")

        except openai.APIConnectionError as e:
            logger.error(f"OpenAI API connection error: {str(e)}")
            raise Exception("Failed to connect to AI service. Please check your connection.")

        except Exception as e:
            logger.error(f"OpenAI chat completion failed: {str(e)}")
            raise Exception(f"AI service error: {str(e)}")

    # -------------------------------------------------------------------------
    # 🎙️ Real Speech-to-Text (Transcription)
    # -------------------------------------------------------------------------
    def _transcribe_audio(self, audio_file) -> Dict:
        """
        Transcribe audio to text using OpenAI Whisper model
        """
        try:
            with audio_file.open("rb") as audio:
                transcription = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio
                )

            return {
                'text': transcription.text,
                'language': 'en',
                'confidence': 0.95,
                'processing_time': 1500
            }

        except Exception as e:
            logger.error(f"Audio transcription failed: {str(e)}")
            raise

    # -------------------------------------------------------------------------
    # 🔊 Real Text-to-Speech (TTS)
    # -------------------------------------------------------------------------
    def _synthesize_speech(self, text: str, language: str = 'en') -> Dict:
        """
        Generate speech from text using OpenAI TTS model
        """
        try:
            output_path = f"/tmp/voice_output_{timezone.now().timestamp()}.mp3"

            with self.client.audio.speech.with_streaming_response.create(
                model="tts-1",
                voice="alloy",
                input=text
            ) as response:
                response.stream_to_file(output_path)

            return {
                'audio_file': output_path,
                'processing_time': 2000
            }

        except Exception as e:
            logger.error(f"Speech synthesis failed: {str(e)}")
            raise

    def generate_response(self, message: str, conversation, user) -> Dict:
        """
        Generate AI response for a user message
        """
        # Build conversation history
        messages = self._build_conversation_history(conversation)
        
        # Add system prompt for agriculture
        system_prompt = {
            'role': 'system',
            'content': '''You are AgriGPT, an expert agricultural advisor specializing in farming practices, 
            crop management, pest control, soil health, and sustainable agriculture. Provide practical, 
            actionable advice based on agricultural best practices. Be concise, helpful, and supportive.'''
        }
        
        # Add user message
        messages.insert(0, system_prompt)
        messages.append({
            'role': 'user',
            'content': message
        })
        
        # Call OpenAI API (will raise exception if fails)
        ai_response = self._call_ai_model(messages)
        
        return {
            'response': ai_response['content'],
            'tokens_used': ai_response['tokens_used'],
            'confidence_score': ai_response['confidence_score'],
            'model_used': self.model_name,
            'metadata': ai_response['metadata']
        }

    def _build_conversation_history(self, conversation) -> List[Dict]:
        """Build conversation history from messages"""
        messages = []
        
        # Get last 10 messages for context
        recent_messages = conversation.messages.order_by('created_at')[:10]
        
        for msg in recent_messages:
            messages.append({
                'role': msg.role,
                'content': msg.content
            })
        
        return messages

    # -------------------------------------------------------------------------
    # 🎯 Generate Recommendations
    # -------------------------------------------------------------------------
    def generate_recommendations(self, conversation, user, message_content: str) -> List[Dict]:
        """
        Generate AI-powered recommendations based on conversation context
        """
        try:
            recommendation_prompt = {
                'role': 'system',
                'content': '''You are an agricultural expert. Based on the user's query, generate 1-3 specific, 
                actionable recommendations. Focus on practical farming advice, crop management, pest control, 
                soil improvement, or sustainable practices relevant to the user's context.'''
            }
            
            user_prompt = {
                'role': 'user',
                'content': f"Based on this farming question: '{message_content}', provide 1-3 specific recommendations with clear actionable steps."
            }
            
            messages = [recommendation_prompt, user_prompt]
            
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                max_tokens=500,
                temperature=0.7,
            )
            
            recommendations_text = response.choices[0].message.content
            
            # Parse recommendations (simple parsing - you might want more sophisticated parsing)
            recommendations = []
            lines = recommendations_text.split('\n')
            
            for line in lines:
                line = line.strip()
                if line and (line.startswith('-') or line.startswith('•') or line[0].isdigit()):
                    # Clean up the recommendation text
                    recommendation_text = line.lstrip('-• ').lstrip('1234567890. ').strip()
                    if recommendation_text:
                        recommendations.append({
                            'title': f"Recommendation for {message_content[:30]}...",
                            'description': recommendation_text,
                            'recommendation_type': 'agricultural_advice',
                            'confidence_score': 0.8,
                            'priority': 'medium'
                        })
            
            # Ensure we have at least one recommendation
            if not recommendations:
                recommendations.append({
                    'title': 'General Farming Advice',
                    'description': 'Consider consulting with local agricultural extension services for region-specific advice.',
                    'recommendation_type': 'general_advice',
                    'confidence_score': 0.7,
                    'priority': 'low'
                })
            
            return recommendations[:3]  # Return max 3 recommendations
            
        except Exception as e:
            logger.error(f"Recommendation generation failed: {str(e)}")
            # Return empty list if recommendation generation fails
            return []

    # -------------------------------------------------------------------------
    # 🔄 Fallback Response
    # -------------------------------------------------------------------------
    def _get_agricultural_fallback_response(self, user_message: str) -> Dict:
        """
        Provide fallback responses when OpenAI API fails
        """
        fallback_responses = {
            'general': "I'm here to help with your farming questions! I can provide advice on crops, soil management, pest control, and sustainable farming practices.",
            'tomato': "For tomato plants: ensure proper spacing (24-36 inches), consistent watering, and watch for common issues like blight or blossom end rot.",
            'maize': "For maize/corn: plant in well-drained soil after last frost, use balanced fertilizer, and ensure adequate spacing for good air circulation.",
            'fertilizer': "Consider soil testing first to determine nutrient needs. Organic options include compost, manure, or balanced NPK fertilizers.",
            'pest': "For pest control: identify the specific pest first, then consider organic options like neem oil, companion planting, or biological controls."
        }
        
        user_message_lower = user_message.lower()
        
        for key, response in fallback_responses.items():
            if key in user_message_lower and key != 'general':
                return {
                    'content': response,
                    'tokens_used': 0,
                    'confidence_score': 0.5,
                    'metadata': {'fallback': True}
                }
        
        return {
            'content': fallback_responses['general'],
            'tokens_used': 0,
            'confidence_score': 0.5,
            'metadata': {'fallback': True}
        }

    # -------------------------------------------------------------------------
    # 🎙️ Voice Interaction Processing
    # -------------------------------------------------------------------------
    def process_voice_interaction(self, voice_interaction):
        """
        Process voice interaction (transcribe + generate response)
        """
        try:
            # Transcribe audio
            transcription_result = self._transcribe_audio(voice_interaction.audio_input)
            voice_interaction.transcribed_text = transcription_result['text']
            voice_interaction.transcription_confidence = transcription_result['confidence']
            
            # Generate response
            if voice_interaction.conversation:
                response = self.generate_response(
                    message=transcription_result['text'],
                    conversation=voice_interaction.conversation,
                    user=voice_interaction.user
                )
                voice_interaction.response_text = response['response']
            
            voice_interaction.status = 'completed'
            voice_interaction.completed_at = timezone.now()
            voice_interaction.save()
            
        except Exception as e:
            logger.error(f"Voice interaction processing failed: {str(e)}")
            voice_interaction.status = 'failed'
            voice_interaction.error_message = str(e)
            voice_interaction.save()