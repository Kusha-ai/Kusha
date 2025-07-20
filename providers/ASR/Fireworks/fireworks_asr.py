import requests
import json
import base64
from typing import List, Dict, Optional
import sys
import os
# Add providers/core to path for base provider import
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'core'))

class FireworksASR:
    """Fireworks AI ASR provider using Whisper models"""
    
    def __init__(self, config: dict, api_key: str = None):
        self.config = config
        self.api_key = api_key
        self.provider_name = config['provider']['name']
        self.base_url = "https://api.fireworks.ai/inference/v1"
        self.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
    
    def get_available_models(self) -> List[Dict]:
        return [
            {
                'id': 'whisper-v3',
                'name': 'Whisper v3',
                'language_code': 'en'
            },
            {
                'id': 'whisper-v3-turbo',
                'name': 'Whisper v3 Turbo',
                'language_code': 'en'
            }
        ]
    
    def _map_model_id(self, model_id: str) -> str:
        """Map short model IDs to full Fireworks model paths if needed"""
        model_mapping = {
            'whisper-v3-turbo': 'whisper-v3',  # Fireworks only has whisper-v3, not turbo
            'whisper-v3': 'whisper-v3'
        }
        return model_mapping.get(model_id, model_id)

    def _map_language_code(self, language_code: str) -> str:
        """Map language codes to Fireworks/Whisper supported format"""
        # Whisper models typically use ISO 639-1 codes (2-letter) or specific formats
        # Common mappings for Whisper/OpenAI format
        language_mappings = {
            'hi-IN': 'hi',      # Hindi
            'hi': 'hi',         # Hindi
            'en-US': 'en',      # English  
            'en-GB': 'en',      # English
            'en-IN': 'en',      # English
            'en': 'en',         # English
            'es-ES': 'es',      # Spanish
            'es': 'es',         # Spanish
            'fr-FR': 'fr',      # French
            'fr': 'fr',         # French
            'de-DE': 'de',      # German
            'de': 'de',         # German
            'it-IT': 'it',      # Italian
            'it': 'it',         # Italian
            'pt-BR': 'pt',      # Portuguese
            'pt': 'pt',         # Portuguese
            'ru-RU': 'ru',      # Russian
            'ru': 'ru',         # Russian
            'ja-JP': 'ja',      # Japanese
            'ja': 'ja',         # Japanese
            'ko-KR': 'ko',      # Korean
            'ko': 'ko',         # Korean
            'zh-CN': 'zh',      # Chinese
            'zh': 'zh',         # Chinese
            'ar-SA': 'ar',      # Arabic
            'ar': 'ar',         # Arabic
        }
        
        # Try exact match first, then fallback to language part
        mapped_lang = language_mappings.get(language_code)
        if mapped_lang:
            return mapped_lang
        
        # Fallback: extract language part (before hyphen)
        base_lang = language_code.split('-')[0].lower()
        return language_mappings.get(base_lang, base_lang)

    def transcribe_audio(self, audio_file_path: str, model_id: str, language_code: str = 'en') -> Dict:
        try:
            url = f"{self.base_url}/audio/transcriptions"
            
            # Map model ID to what Fireworks expects
            fireworks_model = self._map_model_id(model_id)
            
            # Map language code to Fireworks format
            fireworks_language = self._map_language_code(language_code)
            
            # Use multipart form data instead of JSON with base64
            with open(audio_file_path, 'rb') as audio_file:
                files = {
                    'file': ('audio.wav', audio_file, 'audio/wav')
                }
                
                data = {
                    'model': fireworks_model,
                    'response_format': 'json'
                }
                
                # Fireworks/Whisper models can auto-detect language, so let's try without language parameter first
                # Some Whisper implementations don't support all language codes
                # If Hindi fails, we'll let the model auto-detect
                print(f"Fireworks ASR: Using model {fireworks_model} with auto-detection for language {language_code}")
                
                # Update headers for multipart form data
                headers = {
                    "Authorization": f"Bearer {self.api_key}"
                    # Remove Content-Type header to let requests set it automatically for multipart
                }
                
                response = requests.post(url, headers=headers, files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'transcription': result.get('text', ''),
                    'confidence': 1.0,
                    'error': None
                }
            else:
                return {
                    'success': False,
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'transcription': '',
                    'confidence': 0.0
                }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'transcription': '',
                'confidence': 0.0
            }
    
    def get_models(self) -> List[Dict]:
        try:
            url = f"{self.base_url}/models"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                models = response.json().get('data', [])
                return [model for model in models if 'whisper' in model.get('id', '').lower()]
            else:
                return []
        
        except Exception as e:
            print(f"Error getting models: {e}")
            return []