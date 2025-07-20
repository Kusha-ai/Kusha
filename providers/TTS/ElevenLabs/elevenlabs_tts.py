import requests
import json
import time
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

class ElevenLabsTTS:
    """ElevenLabs Text-to-Speech provider"""
    
    def __init__(self, config: dict, api_key: str = None):
        self.config = config
        self.api_key = api_key
        self.provider_name = config['provider']['name']
        self.base_url = "https://api.elevenlabs.io/v1"
        self.headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }
    
    def get_available_models(self) -> List[Dict]:
        """Get available TTS models from ElevenLabs"""
        try:
            response = requests.get(
                f"{self.base_url}/models",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                models_data = response.json()
                models = []
                
                for model in models_data:
                    models.append({
                        'id': model.get('model_id', ''),
                        'name': model.get('name', ''),
                        'description': model.get('description', ''),
                        'supported_formats': ['mp3', 'wav', 'pcm'],
                        'max_characters': model.get('max_characters_request_free', 2500),
                        'features': model.get('languages', [])
                    })
                
                return models
            
        except Exception as e:
            print(f"Failed to get ElevenLabs models: {e}")
        
        # Return fallback models
        return [
            {
                'id': 'eleven_multilingual_v2',
                'name': 'Multilingual v2',
                'description': 'Latest multilingual model with improved quality',
                'supported_formats': ['mp3', 'wav', 'pcm'],
                'max_characters': 2500,
                'features': ['Multilingual', 'High quality', 'Custom voices']
            },
            {
                'id': 'eleven_turbo_v2',
                'name': 'Turbo v2',
                'description': 'Fast model optimized for speed with good quality',
                'supported_formats': ['mp3', 'wav', 'pcm'],
                'max_characters': 2500,
                'features': ['Fastest', 'Low latency', 'Good quality']
            }
        ]
    
    def get_available_voices(self, language_code: str = 'en-US') -> List[Dict]:
        """Get available voices for ElevenLabs TTS"""
        try:
            response = requests.get(
                f"{self.base_url}/voices",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                voices_data = response.json()
                voices = []
                
                for voice in voices_data.get('voices', []):
                    # ElevenLabs voices work with multiple languages
                    voices.append({
                        'id': voice.get('voice_id', ''),
                        'name': voice.get('name', ''),
                        'description': voice.get('description', ''),
                        'gender': self._detect_gender(voice.get('name', ''), voice.get('labels', {})),
                        'accent': voice.get('labels', {}).get('accent', 'american'),
                        'age': voice.get('labels', {}).get('age', 'young adult'),
                        'supported_languages': ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'it-IT'],
                        'preview_url': voice.get('preview_url', ''),
                        'category': voice.get('category', 'premade')
                    })
                
                return voices
            
        except Exception as e:
            print(f"Failed to get ElevenLabs voices: {e}")
        
        # Return fallback voices
        return self._get_fallback_voices()
    
    def _detect_gender(self, name: str, labels: Dict) -> str:
        """Detect gender from voice name and labels"""
        gender = labels.get('gender', '').lower()
        if gender in ['male', 'female']:
            return gender
        
        # Try to detect from name
        male_names = ['adam', 'antoni', 'arnold', 'josh', 'sam', 'ethan', 'brian', 'daniel']
        female_names = ['rachel', 'domi', 'bella', 'elli', 'emily', 'sarah', 'nicole', 'jessica']
        
        name_lower = name.lower()
        if any(male_name in name_lower for male_name in male_names):
            return 'male'
        elif any(female_name in name_lower for female_name in female_names):
            return 'female'
        
        return 'unknown'
    
    def _get_fallback_voices(self) -> List[Dict]:
        """Get fallback voices when API call fails"""
        return [
            {
                'id': '21m00Tcm4TlvDq8ikWAM',
                'name': 'Rachel',
                'description': 'Young adult female with American accent',
                'gender': 'female',
                'accent': 'american',
                'age': 'young adult',
                'supported_languages': ['en-US'],
                'category': 'premade'
            },
            {
                'id': 'ErXwobaYiN019PkySvjV',
                'name': 'Antoni',
                'description': 'Young male with American accent',
                'gender': 'male',
                'accent': 'american',
                'age': 'young',
                'supported_languages': ['en-US'],
                'category': 'premade'
            },
            {
                'id': 'EXAVITQu4vr4xnSDxMaL',
                'name': 'Bella',
                'description': 'Young female with American accent',
                'gender': 'female',
                'accent': 'american',
                'age': 'young',
                'supported_languages': ['en-US'],
                'category': 'premade'
            }
        ]
    
    def synthesize_speech(self, text: str, voice_id: str, language_code: str = 'en-US',
                         audio_format: str = 'mp3', speed: float = 1.0) -> Dict:
        """Synthesize speech using ElevenLabs TTS API"""
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
            
            start_time = time.time()
            
            # Prepare request payload
            payload = {
                "text": text,
                "voice_settings": {
                    "stability": 0.75,
                    "similarity_boost": 0.75,
                    "style": 0.0,
                    "use_speaker_boost": True
                }
            }
            
            # Add speed control if supported (newer models)
            if speed != 1.0:
                payload["voice_settings"]["speed"] = speed
            
            # Use default model for synthesis
            model_id = "eleven_multilingual_v2"
            
            # Make API request
            response = requests.post(
                f"{self.base_url}/text-to-speech/{voice_id}",
                headers=self.headers,
                json=payload,
                params={"model_id": model_id},
                timeout=30
            )
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            if response.status_code == 200:
                audio_data = response.content
                audio_size = len(audio_data)
                
                # Estimate audio duration
                words = len(text.split())
                estimated_duration = (words / 150) * 60 / speed
                
                return {
                    'success': True,
                    'audio_data': audio_data,
                    'audio_size_bytes': audio_size,
                    'audio_duration': estimated_duration,
                    'processing_time': processing_time,
                    'model_used': model_id,
                    'voice_used': voice_id,
                    'format': audio_format,
                    'text_length': len(text),
                    'error': None
                }
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                try:
                    error_data = response.json()
                    if 'detail' in error_data:
                        error_msg = error_data['detail'].get('message', error_msg)
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
        """Check ElevenLabs TTS service status"""
        try:
            # Test with a simple user info call
            response = requests.get(
                f"{self.base_url}/user",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                user_data = response.json()
                return {
                    'service_available': True,
                    'status': 'Active',
                    'api_key_valid': True,
                    'subscription': user_data.get('subscription', {}),
                    'character_count': user_data.get('character_count', 0),
                    'character_limit': user_data.get('character_limit', 0)
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
        """Check if ElevenLabs TTS service is available"""
        try:
            status = self.get_service_status()
            return status.get('service_available', False)
        except:
            return False
    
    def get_voice_info(self, voice_id: str) -> Dict:
        """Get detailed information about a specific voice"""
        try:
            response = requests.get(
                f"{self.base_url}/voices/{voice_id}",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {'error': f'HTTP {response.status_code}: {response.text}'}
                
        except Exception as e:
            return {'error': str(e)}
    
    def validate_parameters(self, text: str, voice_id: str, language_code: str, 
                          audio_format: str, speed: float) -> Dict:
        """Validate synthesis parameters"""
        errors = []
        
        if not text or not text.strip():
            errors.append("Text cannot be empty")
        elif len(text) > 2500:
            errors.append("Text too long (max 2500 characters for free tier)")
        
        if not voice_id:
            errors.append("Voice ID is required")
        
        if audio_format not in ['mp3', 'wav', 'pcm']:
            errors.append("Invalid audio format. Supported: mp3, wav, pcm")
        
        if speed < 0.5 or speed > 2.0:
            errors.append("Speed must be between 0.5 and 2.0")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }