import requests
import json
import time
import io
from typing import List, Dict, Optional
import sys
import os
# Add TTS base provider to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
try:
    from base_tts_provider import BaseTTSProvider
except ImportError:
    # Fallback for standalone usage
    BaseTTSProvider = object

class OpenAITTS:
    """OpenAI Text-to-Speech provider"""
    
    def __init__(self, config: dict, api_key: str = None):
        self.config = config
        self.api_key = api_key
        self.provider_name = config['provider']['name']
        self.base_url = "https://api.openai.com/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def get_available_models(self) -> List[Dict]:
        """Get available TTS models from OpenAI"""
        return [
            {
                'id': 'tts-1',
                'name': 'TTS-1 (Standard)',
                'description': 'Standard text-to-speech model with good quality and speed',
                'max_characters': 4096,
                'supported_formats': ['mp3', 'opus', 'aac', 'flac'],
                'cost_per_1k_chars': 0.015
            },
            {
                'id': 'tts-1-hd',
                'name': 'TTS-1-HD (High Definition)',
                'description': 'High-definition text-to-speech model with superior quality',
                'max_characters': 4096,
                'supported_formats': ['mp3', 'opus', 'aac', 'flac'],
                'cost_per_1k_chars': 0.030
            }
        ]
    
    def get_available_voices(self, language_code: str = 'en-US') -> List[Dict]:
        """Get available voices for OpenAI TTS"""
        # Get comprehensive language support from config
        comprehensive_languages = self._get_comprehensive_languages()
        
        # Define all available voices with comprehensive language support (updated with official OpenAI voices)
        all_voices = [
            {
                'id': 'alloy',
                'name': 'Alloy',
                'description': 'Balanced and versatile voice',
                'gender': 'neutral',
                'language_codes': comprehensive_languages,
                'supported_languages': comprehensive_languages
            },
            {
                'id': 'echo',
                'name': 'Echo',
                'description': 'Warm and friendly voice',
                'gender': 'male',
                'language_codes': comprehensive_languages,
                'supported_languages': comprehensive_languages
            },
            {
                'id': 'fable',
                'name': 'Fable',
                'description': 'Expressive and storytelling voice',
                'gender': 'male',
                'language_codes': comprehensive_languages,
                'supported_languages': comprehensive_languages
            },
            {
                'id': 'onyx',
                'name': 'Onyx',
                'description': 'Deep and authoritative voice',
                'gender': 'male',
                'language_codes': comprehensive_languages,
                'supported_languages': comprehensive_languages
            },
            {
                'id': 'nova',
                'name': 'Nova',
                'description': 'Clear and professional voice',
                'gender': 'female',
                'language_codes': comprehensive_languages,
                'supported_languages': comprehensive_languages
            },
            {
                'id': 'shimmer',
                'name': 'Shimmer',
                'description': 'Bright and energetic voice',
                'gender': 'female',
                'language_codes': comprehensive_languages,
                'supported_languages': comprehensive_languages
            },
            {
                'id': 'ash',
                'name': 'Ash',
                'description': 'Warm and friendly voice (new)',
                'gender': 'male',
                'language_codes': comprehensive_languages,
                'supported_languages': comprehensive_languages
            },
            {
                'id': 'ballad',
                'name': 'Ballad',
                'description': 'Melodic and expressive voice (new)',
                'gender': 'female',
                'language_codes': comprehensive_languages,
                'supported_languages': comprehensive_languages
            },
            {
                'id': 'coral',
                'name': 'Coral',
                'description': 'Cheerful and positive voice (new)',
                'gender': 'female',
                'language_codes': comprehensive_languages,
                'supported_languages': comprehensive_languages
            },
            {
                'id': 'sage',
                'name': 'Sage',
                'description': 'Wise and thoughtful voice (new)',
                'gender': 'neutral',
                'language_codes': comprehensive_languages,
                'supported_languages': comprehensive_languages
            }
        ]
        
        # Filter voices that support the requested language
        filtered_voices = []
        if language_code in comprehensive_languages:
            filtered_voices = all_voices
        
        return filtered_voices

    def _get_comprehensive_languages(self) -> List[str]:
        """Get comprehensive language support from config"""
        try:
            # Always read from config to follow DRY principle
            if hasattr(self, 'config') and 'supported_languages' in self.config:
                return self.config['supported_languages']
        except:
            pass
        
        # Fallback to basic languages if config loading fails
        return ["en-US", "en-GB"]
    
    def generate_speech(self, text: str, voice_id: str, model_id: str = 'tts-1', 
                       language_code: str = 'en-US', audio_format: str = 'mp3', speed: float = 1.0) -> Dict:
        """Generate speech using OpenAI TTS API - main method called by backend"""
        return self.synthesize_speech(text, voice_id, language_code, audio_format, speed)
    
    def synthesize_speech(self, text: str, voice_id: str, language_code: str = 'en-US',
                         audio_format: str = 'mp3', speed: float = 1.0) -> Dict:
        """Synthesize speech using OpenAI TTS API"""
        try:
            # Validate parameters
            validation = self.validate_parameters(text, voice_id, language_code, audio_format, speed)
            if not validation['valid']:
                return {
                    'success': False,
                    'error': '; '.join(validation['errors']),
                    'audio_data': None,
                    'audio_size_bytes': 0,
                    'processing_time': 0.0
                }
            
            # Use tts-1 as default model, can be made configurable
            model = 'tts-1'
            
            # Map format names
            format_mapping = {
                'mp3': 'mp3',
                'wav': 'wav',
                'ogg': 'opus'  # OpenAI uses opus for ogg-like format
            }
            
            response_format = format_mapping.get(audio_format, 'mp3')
            
            start_time = time.time()
            
            # Prepare request payload
            payload = {
                'model': model,
                'input': text,
                'voice': voice_id,
                'response_format': response_format,
                'speed': speed
            }
            
            # Make API request
            response = requests.post(
                f"{self.base_url}/audio/speech",
                headers=self.headers,
                json=payload,
                stream=True
            )
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            if response.status_code == 200:
                audio_data = response.content
                audio_size = len(audio_data)
                
                # Save audio to a temporary file and create URL
                import tempfile
                import base64
                
                # Create data URL for immediate playback (for small files)
                audio_base64 = base64.b64encode(audio_data).decode('utf-8')
                audio_url = f"data:audio/{response_format};base64,{audio_base64}"
                
                # Estimate audio duration (rough calculation)
                # Average speaking rate is ~150 words per minute
                words = len(text.split())
                estimated_duration = (words / 150) * 60 / speed
                
                return {
                    'success': True,
                    'audio_data': audio_data,
                    'audio_url': audio_url,
                    'audio_size_bytes': audio_size,
                    'audio_duration': estimated_duration,
                    'processing_time': processing_time,
                    'model_used': model,
                    'voice_used': voice_id,
                    'format': response_format,
                    'text_length': len(text),
                    'character_count': len(text),
                    'error': None
                }
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                try:
                    error_data = response.json()
                    if 'error' in error_data:
                        error_msg = error_data['error'].get('message', error_msg)
                except:
                    pass
                
                return {
                    'success': False,
                    'error': error_msg,
                    'audio_data': None,
                    'audio_size_bytes': 0,
                    'processing_time': processing_time
                }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'audio_data': None,
                'audio_size_bytes': 0,
                'processing_time': 0.0
            }
    
    def get_service_status(self) -> Dict:
        """Check OpenAI TTS service status"""
        try:
            # Test with a simple request to models endpoint
            response = requests.get(
                f"{self.base_url}/models",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                return {
                    'service_available': True,
                    'status': 'Active',
                    'api_key_valid': True
                }
            else:
                return {
                    'service_available': False,
                    'status': f'HTTP {response.status_code}',
                    'api_key_valid': response.status_code != 401,
                    'error': response.text
                }
        
        except Exception as e:
            return {
                'service_available': False,
                'status': 'Error',
                'api_key_valid': None,
                'error': str(e)
            }
    
    def is_service_available(self) -> bool:
        """Check if OpenAI TTS service is available"""
        try:
            status = self.get_service_status()
            return status.get('service_available', False)
        except:
            return False
    
    def validate_parameters(self, text: str, voice_id: str, language_code: str, 
                          audio_format: str, speed: float) -> Dict:
        """Validate synthesis parameters"""
        errors = []
        
        if not text or not text.strip():
            errors.append("Text cannot be empty")
        elif len(text) > 4096:
            errors.append("Text too long (max 4096 characters)")
        
        if not voice_id:
            errors.append("Voice ID is required")
        elif voice_id not in ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'ash', 'ballad', 'coral', 'sage']:
            errors.append("Invalid voice ID. Supported: alloy, echo, fable, onyx, nova, shimmer, ash, ballad, coral, sage")
        
        if audio_format not in ['mp3', 'opus', 'aac', 'flac', 'wav', 'ogg']:
            errors.append("Invalid audio format. Supported: mp3, opus, aac, flac, wav, ogg")
        
        if speed < 0.25 or speed > 4.0:
            errors.append("Speed must be between 0.25 and 4.0")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }