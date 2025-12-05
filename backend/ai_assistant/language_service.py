"""
Multi-language support service for AI assistant
"""
import logging
from typing import Dict, List, Optional
from django.conf import settings
from django.utils.translation import gettext as _

logger = logging.getLogger(__name__)


class LanguageService:
    """
    Service for handling multi-language support in AI assistant
    """
    
    def __init__(self):
        self.supported_languages = {
            'en': {
                'name': 'English',
                'native_name': 'English',
                'code': 'en',
                'region': 'Global',
                'voice_available': True,
                'ai_model_support': True
            },
            'tw': {
                'name': 'Twi',
                'native_name': 'Twi',
                'code': 'tw',
                'region': 'Ghana',
                'voice_available': False,  # Limited voice support
                'ai_model_support': True
            },
            'ha': {
                'name': 'Hausa',
                'native_name': 'Hausa',
                'code': 'ha',
                'region': 'Nigeria, Niger, Chad',
                'voice_available': False,  # Limited voice support
                'ai_model_support': True
            },
            'yo': {
                'name': 'Yoruba',
                'native_name': 'Yorùbá',
                'code': 'yo',
                'region': 'Nigeria, Benin',
                'voice_available': False,
                'ai_model_support': True
            },
            'ig': {
                'name': 'Igbo',
                'native_name': 'Igbo',
                'code': 'ig',
                'region': 'Nigeria',
                'voice_available': False,
                'ai_model_support': True
            },
            'sw': {
                'name': 'Swahili',
                'native_name': 'Kiswahili',
                'code': 'sw',
                'region': 'Kenya, Tanzania, Uganda',
                'voice_available': True,
                'ai_model_support': True
            },
            'fr': {
                'name': 'French',
                'native_name': 'Français',
                'code': 'fr',
                'region': 'West/Central Africa',
                'voice_available': True,
                'ai_model_support': True
            },
            'ar': {
                'name': 'Arabic',
                'native_name': 'العربية',
                'code': 'ar',
                'region': 'North Africa',
                'voice_available': True,
                'ai_model_support': True
            }
        }
        
        # Agricultural terms translations
        self.agricultural_terms = {
            'en': {
                'crop': 'crop',
                'farm': 'farm',
                'soil': 'soil',
                'water': 'water',
                'fertilizer': 'fertilizer',
                'pest': 'pest',
                'disease': 'disease',
                'harvest': 'harvest',
                'planting': 'planting',
                'irrigation': 'irrigation',
                'weather': 'weather',
                'market': 'market',
                'price': 'price',
                'yield': 'yield',
                'seed': 'seed'
            },
            'tw': {
                'crop': 'nnɔbae',
                'farm': 'afuo',
                'soil': 'asase',
                'water': 'nsuo',
                'fertilizer': 'wura',
                'pest': 'mmoa bɔne',
                'disease': 'yare',
                'harvest': 'otwa',
                'planting': 'dua',
                'irrigation': 'nsuo gu',
                'weather': 'wim tebea',
                'market': 'gua',
                'price': 'bo',
                'yield': 'aba',
                'seed': 'aba'
            },
            'ha': {
                'crop': 'amfani',
                'farm': 'gona',
                'soil': 'ƙasa',
                'water': 'ruwa',
                'fertilizer': 'takin ƙasa',
                'pest': 'kwari',
                'disease': 'cuta',
                'harvest': 'girbi',
                'planting': 'shuki',
                'irrigation': 'ban ruwa',
                'weather': 'yanayi',
                'market': 'kasuwa',
                'price': 'farashi',
                'yield': 'amfani',
                'seed': 'iri'
            },
            'sw': {
                'crop': 'mazao',
                'farm': 'shamba',
                'soil': 'udongo',
                'water': 'maji',
                'fertilizer': 'mbolea',
                'pest': 'wadudu',
                'disease': 'ugonjwa',
                'harvest': 'mavuno',
                'planting': 'kupanda',
                'irrigation': 'umwagiliaji',
                'weather': 'hali ya hewa',
                'market': 'soko',
                'price': 'bei',
                'yield': 'mazao',
                'seed': 'mbegu'
            }
        }
        
        # Common agricultural phrases
        self.common_phrases = {
            'en': {
                'greeting': 'Hello! I\'m AgriGPT, your agricultural assistant. How can I help you today?',
                'crop_advice': 'I can help you with crop selection, planting, and care advice.',
                'weather_help': 'I can provide weather information and farming recommendations.',
                'market_info': 'I can help you with market prices and selling strategies.',
                'pest_control': 'I can help identify pests and suggest treatment options.',
                'soil_health': 'I can provide advice on soil testing and improvement.',
                'irrigation': 'I can help with irrigation planning and water management.',
                'fertilizer': 'I can recommend fertilizers based on your crops and soil.',
                'harvest': 'I can help you plan harvest timing and post-harvest handling.',
                'error': 'I\'m sorry, I didn\'t understand. Could you please rephrase your question?',
                'goodbye': 'Thank you for using AgriGPT. Good luck with your farming!'
            },
            'tw': {
                'greeting': 'Akwaaba! Me ne AgriGPT, wo kuafo boafo. Ɛdeɛn na metumi aboa wo nnɛ?',
                'crop_advice': 'Metumi aboa wo wɔ nnɔbae a wobɛpaw, dua, ne hwɛ ho.',
                'weather_help': 'Metumi ama wo wim tebea ho nsɛm ne kuafo akwankyerɛ.',
                'market_info': 'Metumi aboa wo wɔ gua bo ne tɔn akwan ho.',
                'pest_control': 'Metumi aboa wo ahu mmoa bɔne na makyerɛ wo ɔkwan a wobɛfa so ayɛ.',
                'soil_health': 'Metumi ama wo akwankyerɛ wɔ asase sɔhwɛ ne nkɔso ho.',
                'irrigation': 'Metumi aboa wo wɔ nsuo gu nhyehyɛe ne nsuo so dwumadi ho.',
                'fertilizer': 'Metumi akamfo wura a ɛfata wo nnɔbae ne wo asase.',
                'harvest': 'Metumi aboa wo nhyehyɛe otwa bere ne otwa akyi dwumadi.',
                'error': 'Mepa wo kyɛw, mente wo aseɛ. Wobɛtumi asan abisa wo asɛm no bio?',
                'goodbye': 'Meda wo ase sɛ wode AgriGPT dii dwuma. Nkɔso pa wɔ wo kuafo adwuma mu!'
            },
            'ha': {
                'greeting': 'Sannu! Ni ne AgriGPT, mataimaki na noman. Yaya zan taimake ka yau?',
                'crop_advice': 'Zan iya taimaka ka wajen zaɓar amfani, shuki, da kuma kulawa.',
                'weather_help': 'Zan iya ba ka bayanan yanayi da shawarwarin noma.',
                'market_info': 'Zan iya taimaka ka wajen farashin kasuwa da dabarun sayarwa.',
                'pest_control': 'Zan iya taimaka wajen gane kwari da ba da shawarar magani.',
                'soil_health': 'Zan iya ba da shawara kan gwajin ƙasa da ingantawa.',
                'irrigation': 'Zan iya taimaka wajen tsarin ban ruwa da sarrafa ruwa.',
                'fertilizer': 'Zan iya ba da shawarar takin ƙasa bisa ga amfanin ka da ƙasa.',
                'harvest': 'Zan iya taimaka ka shirya lokacin girbi da ayyukan bayan girbi.',
                'error': 'Yi hakuri, ban fahimta ba. Za ka iya sake faɗa tambayar ka?',
                'goodbye': 'Na gode da amfani da AgriGPT. Nasara a aikin noma!'
            },
            'sw': {
                'greeting': 'Hujambo! Mimi ni AgriGPT, msaidizi wako wa kilimo. Ninawezaje kukusaidia leo?',
                'crop_advice': 'Ninaweza kukusaidia katika uchaguzi wa mazao, kupanda, na ushauri wa utunzaji.',
                'weather_help': 'Ninaweza kutoa habari za hali ya hewa na mapendekezo ya kilimo.',
                'market_info': 'Ninaweza kukusaidia kuhusu bei za sokoni na mikakati ya uuzaji.',
                'pest_control': 'Ninaweza kusaidia kutambua wadudu na kupendekeza chaguo za matibabu.',
                'soil_health': 'Ninaweza kutoa ushauri kuhusu upimaji wa udongo na uboreshaji.',
                'irrigation': 'Ninaweza kusaidia katika mipango ya umwagiliaji na usimamizi wa maji.',
                'fertilizer': 'Ninaweza kupendekeza mbolea kulingana na mazao yako na udongo.',
                'harvest': 'Ninaweza kukusaidia kupanga wakati wa mavuno na ushughulikaji baada ya mavuno.',
                'error': 'Samahani, sikuelewa. Unaweza kuuliza swali lako tena?',
                'goodbye': 'Asante kwa kutumia AgriGPT. Bahati njema katika kilimo chako!'
            }
        }
    
    def detect_language(self, text: str) -> Dict:
        """
        Detect language from text (simple keyword-based detection)
        In production, use proper language detection libraries like langdetect
        """
        text_lower = text.lower()
        
        # Simple keyword-based detection
        language_keywords = {
            'tw': ['akwaaba', 'ɛdeɛn', 'metumi', 'kuafo', 'nnɔbae', 'asase'],
            'ha': ['sannu', 'yaya', 'noma', 'gona', 'amfani', 'ƙasa'],
            'sw': ['hujambo', 'kilimo', 'mazao', 'shamba', 'udongo', 'maji'],
            'fr': ['bonjour', 'agriculture', 'ferme', 'culture', 'sol', 'eau'],
            'ar': ['مرحبا', 'زراعة', 'مزرعة', 'محصول', 'تربة', 'ماء']
        }
        
        detected_scores = {}
        
        for lang_code, keywords in language_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            if score > 0:
                detected_scores[lang_code] = score / len(keywords)
        
        if detected_scores:
            # Return language with highest score
            best_lang = max(detected_scores, key=detected_scores.get)
            return {
                'language': best_lang,
                'confidence': detected_scores[best_lang],
                'supported': best_lang in self.supported_languages
            }
        
        # Default to English if no language detected
        return {
            'language': 'en',
            'confidence': 0.5,
            'supported': True
        }
    
    def translate_agricultural_term(self, term: str, from_lang: str, to_lang: str) -> str:
        """
        Translate agricultural terms between languages
        """
        try:
            if from_lang in self.agricultural_terms and to_lang in self.agricultural_terms:
                # Find term in source language
                source_terms = self.agricultural_terms[from_lang]
                target_terms = self.agricultural_terms[to_lang]
                
                # Direct lookup
                if term.lower() in source_terms:
                    # Find the key for this term
                    for key, value in source_terms.items():
                        if value.lower() == term.lower():
                            return target_terms.get(key, term)
                
                # Reverse lookup (if term is a key)
                if term.lower() in target_terms:
                    return target_terms[term.lower()]
            
            return term  # Return original if no translation found
            
        except Exception as e:
            logger.error(f"Translation failed: {str(e)}")
            return term
    
    def get_localized_response(self, response_type: str, language: str = 'en') -> str:
        """
        Get localized response for common agricultural interactions
        """
        try:
            if language in self.common_phrases:
                return self.common_phrases[language].get(
                    response_type, 
                    self.common_phrases['en'].get(response_type, '')
                )
            
            # Fallback to English
            return self.common_phrases['en'].get(response_type, '')
            
        except Exception as e:
            logger.error(f"Localization failed: {str(e)}")
            return self.common_phrases['en'].get(response_type, '')
    
    def enhance_prompt_for_language(self, prompt: str, language: str) -> str:
        """
        Enhance AI prompt with language-specific instructions
        """
        if language == 'en':
            return prompt
        
        language_info = self.supported_languages.get(language, {})
        language_name = language_info.get('name', language)
        
        enhanced_prompt = f"""
        {prompt}
        
        IMPORTANT LANGUAGE INSTRUCTIONS:
        - Respond in {language_name} language (code: {language})
        - Use agricultural terminology appropriate for {language_info.get('region', 'the region')}
        - If you don't know specific {language_name} terms, provide the English term in parentheses
        - Keep responses culturally appropriate for farmers in {language_info.get('region', 'the region')}
        - Use simple, clear language that farmers can easily understand
        """
        
        return enhanced_prompt
    
    def get_supported_languages(self) -> List[Dict]:
        """
        Get list of supported languages with details
        """
        return [
            {
                'code': code,
                'name': info['name'],
                'native_name': info['native_name'],
                'region': info['region'],
                'voice_available': info['voice_available'],
                'ai_model_support': info['ai_model_support']
            }
            for code, info in self.supported_languages.items()
        ]
    
    def is_language_supported(self, language_code: str) -> bool:
        """
        Check if a language is supported
        """
        return language_code in self.supported_languages
    
    def get_language_info(self, language_code: str) -> Dict:
        """
        Get detailed information about a language
        """
        return self.supported_languages.get(language_code, {})
    
    def suggest_language_from_location(self, country: str = None, region: str = None) -> List[str]:
        """
        Suggest languages based on user location
        """
        location_languages = {
            'ghana': ['tw', 'en'],
            'nigeria': ['ha', 'yo', 'ig', 'en'],
            'kenya': ['sw', 'en'],
            'tanzania': ['sw', 'en'],
            'uganda': ['sw', 'en'],
            'senegal': ['fr', 'en'],
            'mali': ['fr', 'en'],
            'burkina faso': ['fr', 'en'],
            'ivory coast': ['fr', 'en'],
            'cameroon': ['fr', 'en'],
            'morocco': ['ar', 'fr', 'en'],
            'algeria': ['ar', 'fr', 'en'],
            'tunisia': ['ar', 'fr', 'en'],
            'egypt': ['ar', 'en'],
            'south africa': ['en'],
            'ethiopia': ['en'],
            'rwanda': ['fr', 'en'],
        }
        
        if country:
            country_lower = country.lower()
            return location_languages.get(country_lower, ['en'])
        
        return ['en']  # Default to English