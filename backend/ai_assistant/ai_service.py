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
        self.model_name = "gpt-4o-mini"  # or "gpt-3.5-turbo" if you don't have access to gpt-4
        self.max_tokens = 1000

    # -------------------------------------------------------------------------
    # 🧠 Generate AI Text Response
    # -------------------------------------------------------------------------
    def _call_ai_model(self, messages: List[Dict]) -> Dict:
    
    # Call OpenAI ChatCompletion API to generate response
    
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
                'language': 'en',  # Whisper auto-detects, can parse from metadata if available
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
            # Save as .mp3 or .wav as desired
            output_path = f"/tmp/voice_output_{timezone.now().timestamp()}.mp3"

            with self.client.audio.speech.with_streaming_response.create(
                model="tts-1",  # (or tts-1-hd for higher quality)
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
    
    #Generate AI response for a user message
    
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