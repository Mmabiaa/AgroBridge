"""
AI Service for handling AI assistant functionality
"""
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
    Service class for AI assistant functionality
    """
    
    def __init__(self):
        # Initialize OpenAI client
        openai.api_key = settings.OPENAI_API_KEY
        self.model_name = "gpt-3.5-turbo"
        self.max_tokens = 1000
        
    def generate_response(self, message: str, conversation: ChatConversation, user) -> Dict:
        """
        Generate AI response to user message
        """
        try:
            # Get conversation context
            context = self._build_conversation_context(conversation)
            
            # Get relevant knowledge base articles
            knowledge_context = self._get_relevant_knowledge(message, conversation.conversation_type)
            
            # Build system prompt
            system_prompt = self._build_system_prompt(
                conversation.conversation_type,
                user,
                knowledge_context
            )
            
            # Prepare messages for AI model
            messages = [
                {"role": "system", "content": system_prompt},
                *context,
                {"role": "user", "content": message}
            ]
            
            # Generate response (mock implementation)
            response = self._call_ai_model(messages)
            
            return {
                'response': response['content'],
                'tokens_used': response.get('tokens_used', 0),
                'model_used': self.model_name,
                'confidence_score': response.get('confidence_score', 0.8),
                'metadata': response.get('metadata', {})
            }
            
        except Exception as e:
            logger.error(f"AI response generation failed: {str(e)}")
            return {
                'response': "I apologize, but I'm having trouble processing your request right now. Please try again later.",
                'tokens_used': 0,
                'model_used': self.model_name,
                'confidence_score': 0.0,
                'metadata': {'error': str(e)}
            }
    
    def generate_recommendations(self, message: str, conversation: ChatConversation, user) -> List[Dict]:
        """
        Generate AI recommendations based on the conversation
        """
        recommendations = []
        
        try:
            # Analyze message for recommendation opportunities
            recommendation_triggers = self._analyze_for_recommendations(
                message, conversation, user
            )
            
            for trigger in recommendation_triggers:
                recommendation = self._create_recommendation(trigger, user)
                if recommendation:
                    recommendations.append(recommendation)
            
        except Exception as e:
            logger.error(f"Recommendation generation failed: {str(e)}")
        
        return recommendations
    
    def process_voice_interaction(self, voice_interaction):
        """
        Process voice interaction (transcription and response)
        """
        try:
            # Transcribe audio (mock implementation)
            transcription = self._transcribe_audio(voice_interaction.input_audio)
            
            voice_interaction.transcribed_text = transcription['text']
            voice_interaction.language_detected = transcription.get('language', 'en')
            voice_interaction.confidence_score = transcription.get('confidence', 0.8)
            voice_interaction.transcription_time_ms = transcription.get('processing_time', 1000)
            
            # Generate text response
            if voice_interaction.conversation:
                ai_response = self.generate_response(
                    transcription['text'],
                    voice_interaction.conversation,
                    voice_interaction.user
                )
                voice_interaction.response_text = ai_response['response']
            
            # Generate speech (mock implementation)
            speech_audio = self._synthesize_speech(
                voice_interaction.response_text,
                voice_interaction.language_detected
            )
            
            if speech_audio:
                voice_interaction.output_audio = speech_audio['audio_file']
                voice_interaction.synthesis_time_ms = speech_audio.get('processing_time', 1000)
            
            voice_interaction.mark_completed()
            
        except Exception as e:
            logger.error(f"Voice processing failed: {str(e)}")
            voice_interaction.mark_failed(str(e))
    
    def _build_conversation_context(self, conversation: ChatConversation) -> List[Dict]:
        """
        Build conversation context from recent messages
        """
        # Get last 10 messages for context
        recent_messages = conversation.messages.order_by('-created_at')[:10]
        
        context = []
        for msg in reversed(recent_messages):
            context.append({
                "role": msg.role,
                "content": msg.content
            })
        
        return context
    
    def _get_relevant_knowledge(self, message: str, conversation_type: str) -> List[Dict]:
        """
        Get relevant knowledge base articles
        """
        # Simple keyword matching (in production, use vector search)
        knowledge_articles = KnowledgeBase.objects.filter(
            category=conversation_type,
            is_active=True
        )
        
        # Filter by keywords in message
        keywords = message.lower().split()
        relevant_articles = []
        
        for article in knowledge_articles[:3]:  # Limit to 3 articles
            article_text = (article.title + " " + article.content).lower()
            if any(keyword in article_text for keyword in keywords):
                relevant_articles.append({
                    'title': article.title,
                    'content': article.summary or article.content[:500],
                    'category': article.category
                })
                article.increment_usage()
        
        return relevant_articles
    
    def _build_system_prompt(self, conversation_type: str, user, knowledge_context: List[Dict]) -> str:
        """
        Build system prompt for AI model
        """
        base_prompt = """You are AgriGPT, an AI assistant specialized in agriculture and farming. 
        You help farmers, agricultural experts, and others in the agricultural sector with advice, 
        information, and recommendations."""
        
        # Add conversation type specific instructions
        type_prompts = {
            'farming_advice': "Focus on providing practical farming advice and best practices.",
            'crop_diagnosis': "Help diagnose crop issues and suggest treatments.",
            'market_info': "Provide market information and trading advice.",
            'weather': "Discuss weather patterns and their impact on farming.",
            'pest_control': "Advise on pest identification and control methods.",
            'fertilizer': "Recommend appropriate fertilizers and application methods.",
            'irrigation': "Provide irrigation guidance and water management advice.",
            'livestock': "Offer livestock care and management advice.",
            'financial': "Help with agricultural financial planning and analysis."
        }
        
        if conversation_type in type_prompts:
            base_prompt += f"\n\n{type_prompts[conversation_type]}"
        
        # Add user context
        if hasattr(user, 'profile'):
            base_prompt += f"\n\nUser context: The user is a {user.role} with {getattr(user.profile, 'farm_experience', 0)} years of experience."
        
        # Add knowledge context
        if knowledge_context:
            base_prompt += "\n\nRelevant knowledge base information:\n"
            for article in knowledge_context:
                base_prompt += f"- {article['title']}: {article['content']}\n"
        
        base_prompt += "\n\nProvide helpful, accurate, and practical advice. If you're unsure about something, say so and suggest consulting with local agricultural experts."
        
        return base_prompt
    
    def _call_ai_model(self, messages: List[Dict]) -> Dict:
        """
        Call OpenAI API to generate response
        """
        try:
            # Call OpenAI API
            response = openai.ChatCompletion.create(
                model=self.model_name,
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=0.7,
                top_p=1,
                frequency_penalty=0,
                presence_penalty=0
            )
            
            # Extract response data
            choice = response.choices[0]
            content = choice.message.content
            
            return {
                'content': content,
                'tokens_used': response.usage.total_tokens,
                'confidence_score': 0.9,  # OpenAI doesn't provide confidence scores
                'metadata': {
                    'model': response.model,
                    'finish_reason': choice.finish_reason,
                    'prompt_tokens': response.usage.prompt_tokens,
                    'completion_tokens': response.usage.completion_tokens
                }
            }
            
        except openai.error.RateLimitError:
            logger.error("OpenAI rate limit exceeded")
            return self._get_agricultural_fallback_response(messages[-1]['content'])
            
        except openai.error.InvalidRequestError as e:
            logger.error(f"OpenAI invalid request: {str(e)}")
            return self._get_agricultural_fallback_response(messages[-1]['content'])
            
        except openai.error.AuthenticationError:
            logger.error("OpenAI authentication failed - API key may be invalid or expired")
            return self._get_agricultural_fallback_response(messages[-1]['content'])
            
        except openai.error.APIConnectionError:
            logger.error("OpenAI API connection failed")
            return self._get_agricultural_fallback_response(messages[-1]['content'])
            
        except Exception as e:
            logger.error(f"OpenAI API call failed: {str(e)}")
            return self._get_agricultural_fallback_response(messages[-1]['content'])
    
    def _get_fallback_response(self, message: str) -> Dict:
        """
        Get fallback response when OpenAI API fails
        """
        return {
            'content': message,
            'tokens_used': 0,
            'confidence_score': 0.5,
            'metadata': {'fallback_response': True}
        }
    
    def _get_agricultural_fallback_response(self, user_message: str) -> Dict:
        """
        Get agricultural-specific fallback response when OpenAI API fails
        """
        user_message_lower = user_message.lower()
        
        # Provide helpful agricultural responses based on keywords
        if 'tomato' in user_message_lower:
            if 'water' in user_message_lower:
                response = """For tomato watering:

🌱 **Frequency**: Water deeply 1-2 times per week rather than daily light watering
🌱 **Amount**: Provide 1-2 inches of water per week including rainfall
🌱 **Timing**: Water early morning to reduce disease risk
🌱 **Method**: Water at soil level, avoid wetting leaves
🌱 **Signs**: Check soil moisture 2 inches deep - water when dry

Consistent watering prevents blossom end rot and cracking."""
            
            elif 'disease' in user_message_lower or 'yellow' in user_message_lower:
                response = """Common tomato issues:

🍅 **Yellow leaves**: Often indicates overwatering, nutrient deficiency, or disease
🍅 **Blight**: Remove affected leaves, improve air circulation, apply fungicide
🍅 **Wilting**: Check for pests, ensure proper watering, examine roots
🍅 **Spots**: May be bacterial or fungal - remove affected parts immediately

Prevention: Good spacing, proper watering, disease-resistant varieties."""
            
            else:
                response = """Tomato growing tips:

🌿 **Planting**: Start indoors 6-8 weeks before last frost
🌿 **Spacing**: 24-36 inches apart for good air circulation  
🌿 **Support**: Use cages or stakes for indeterminate varieties
🌿 **Fertilizer**: Balanced fertilizer at planting, then potassium-rich during fruiting
🌿 **Pruning**: Remove suckers and lower leaves touching ground

What specific aspect of tomato growing would you like to know more about?"""
        
        elif 'fertilizer' in user_message_lower or 'nutrient' in user_message_lower:
            response = """Fertilizer guidance:

🌱 **Soil test first**: Know your soil's pH and nutrient levels
🌱 **NPK basics**: Nitrogen (leaves), Phosphorus (roots/flowers), Potassium (fruit/disease resistance)
🌱 **Organic options**: Compost, aged manure, bone meal, fish emulsion
🌱 **Timing**: Apply at planting and during growing season
🌱 **Application**: Follow package rates, water in thoroughly

Over-fertilizing can harm plants - less is often more!"""
        
        elif 'pest' in user_message_lower or 'insect' in user_message_lower:
            response = """Integrated Pest Management:

🐛 **Prevention**: Healthy soil, proper spacing, beneficial insects
🐛 **Identification**: Know your pests - different treatments for different bugs
🐛 **Organic controls**: Neem oil, insecticidal soap, diatomaceous earth
🐛 **Beneficial insects**: Ladybugs, lacewings, parasitic wasps
🐛 **Physical barriers**: Row covers, copper tape for slugs

Monitor regularly and act early for best results."""
        
        elif 'plant' in user_message_lower and ('when' in user_message_lower or 'time' in user_message_lower):
            response = """Planting timing guide:

📅 **Know your zone**: Check USDA hardiness zone for your area
📅 **Last frost**: Plant warm-season crops after last frost date
📅 **Soil temperature**: Wait for soil to warm (60°F+ for most vegetables)
📅 **Season length**: Consider days to maturity for your growing season
📅 **Succession planting**: Plant every 2-3 weeks for continuous harvest

Local extension office has specific timing for your area."""
        
        else:
            response = """I'm here to help with your agricultural questions! I can provide guidance on:

🌾 **Crop management**: Planting, watering, fertilizing, harvesting
🌾 **Pest & disease control**: Identification and treatment options  
🌾 **Soil health**: Testing, amendments, composting
🌾 **Garden planning**: Timing, spacing, crop rotation
🌾 **Troubleshooting**: Plant problems and solutions

Please provide more details about your specific question or challenge, and I'll give you targeted advice!

*Note: OpenAI integration is currently unavailable, but I can still provide helpful agricultural guidance.*"""
        
        return {
            'content': response,
            'tokens_used': 0,
            'confidence_score': 0.7,
            'metadata': {'fallback_response': True, 'agricultural_guidance': True}
        }
    
    def _analyze_for_recommendations(self, message: str, conversation: ChatConversation, user) -> List[Dict]:
        """
        Analyze message for recommendation opportunities
        """
        triggers = []
        message_lower = message.lower()
        
        # Simple rule-based recommendation triggers
        if 'plant' in message_lower and 'when' in message_lower:
            triggers.append({
                'type': 'planting_schedule',
                'confidence': 0.7,
                'context': {'message': message, 'season': timezone.now().month}
            })
        
        if 'fertilizer' in message_lower or 'nutrient' in message_lower:
            triggers.append({
                'type': 'fertilizer',
                'confidence': 0.8,
                'context': {'message': message}
            })
        
        if 'pest' in message_lower or 'insect' in message_lower or 'bug' in message_lower:
            triggers.append({
                'type': 'pest_control',
                'confidence': 0.9,
                'context': {'message': message}
            })
        
        return triggers
    
    def _create_recommendation(self, trigger: Dict, user) -> Optional[Dict]:
        """
        Create AI recommendation based on trigger
        """
        try:
            recommendation_data = {
                'planting_schedule': {
                    'title': 'Optimal Planting Schedule',
                    'description': 'Based on your inquiry about planting timing, here are recommendations for your region.',
                    'detailed_content': {
                        'crops': ['tomatoes', 'peppers', 'lettuce'],
                        'timing': 'Plant after last frost date',
                        'preparation': 'Prepare soil 2 weeks before planting'
                    }
                },
                'fertilizer': {
                    'title': 'Fertilizer Recommendation',
                    'description': 'Customized fertilizer recommendations based on your crops and soil conditions.',
                    'detailed_content': {
                        'type': 'Balanced NPK (10-10-10)',
                        'application_rate': '1-2 lbs per 100 sq ft',
                        'timing': 'Apply at planting and mid-season'
                    }
                },
                'pest_control': {
                    'title': 'Integrated Pest Management',
                    'description': 'Comprehensive pest control strategy for your crops.',
                    'detailed_content': {
                        'prevention': 'Regular monitoring and crop rotation',
                        'organic_options': 'Neem oil, beneficial insects',
                        'chemical_options': 'Use as last resort, follow label instructions'
                    }
                }
            }
            
            if trigger['type'] in recommendation_data:
                rec_data = recommendation_data[trigger['type']]
                
                # Create recommendation in database
                recommendation = AIRecommendation.objects.create(
                    user=user,
                    recommendation_type=trigger['type'],
                    title=rec_data['title'],
                    description=rec_data['description'],
                    detailed_content=rec_data['detailed_content'],
                    confidence_score=trigger['confidence'],
                    model_used=self.model_name,
                    reasoning=f"Generated based on user message analysis: {trigger['context']['message'][:100]}...",
                    trigger_data=trigger['context'],
                    priority='medium',
                    valid_until=timezone.now() + timezone.timedelta(days=30)
                )
                
                return {
                    'id': str(recommendation.id),
                    'type': recommendation.recommendation_type,
                    'title': recommendation.title,
                    'description': recommendation.description,
                    'confidence_score': recommendation.confidence_score
                }
        
        except Exception as e:
            logger.error(f"Failed to create recommendation: {str(e)}")
        
        return None
    
    def _transcribe_audio(self, audio_file) -> Dict:
        """
        Transcribe audio to text (mock implementation)
        """
        # Mock transcription - in production, use speech-to-text service
        return {
            'text': "This is a mock transcription of the audio file.",
            'language': 'en',
            'confidence': 0.85,
            'processing_time': 1500
        }
    
    def _synthesize_speech(self, text: str, language: str = 'en') -> Dict:
        """
        Synthesize speech from text (mock implementation)
        """
        # Mock speech synthesis - in production, use text-to-speech service
        return {
            'audio_file': None,  # Would be actual audio file
            'processing_time': 2000
        }