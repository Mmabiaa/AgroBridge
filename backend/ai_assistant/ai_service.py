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
        # Initialize OpenAI client
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model_name = "gpt-4o-mini"  # faster and better for production
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
                    model="gpt-4o-mini-transcribe",
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
                model="gpt-4o-mini-tts",
                voice="alloy",  # Available: alloy, verse, sage, etc.
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
