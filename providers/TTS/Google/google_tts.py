import json
import time
import base64
from typing import List, Dict, Optional
from google.cloud import texttospeech
from google.oauth2 import service_account
import sys
import os
# Add TTS base provider to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
try:
    from base_tts_provider import BaseTTSProvider
except ImportError:
    # Fallback for standalone usage
    BaseTTSProvider = object

class GoogleTTS:
    """Google Cloud Text-to-Speech provider"""
    
    def __init__(self, config: dict, api_key: str = None):
        self.config = config
        self.api_key = api_key
        self.provider_name = config['provider']['name']
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Google Cloud TTS client"""
        try:
            # Parse service account key from API key
            if self.api_key.startswith('{'):
                # JSON service account key
                service_account_info = json.loads(self.api_key)
                credentials = service_account.Credentials.from_service_account_info(service_account_info)
                self.client = texttospeech.TextToSpeechClient(credentials=credentials)
            else:
                # Try default credentials or API key
                self.client = texttospeech.TextToSpeechClient()
        except Exception as e:
            print(f"Failed to initialize Google TTS client: {e}")
            self.client = None
    
    def get_available_models(self) -> List[Dict]:
        """Get available TTS models from Google"""
        return [
            {
                'id': 'neural2',
                'name': 'Neural2 Voices',
                'description': 'Latest neural voices with improved quality',
                'supported_formats': ['mp3', 'wav', 'ogg'],
                'features': ['Neural', 'High-quality', 'Natural']
            },
            {
                'id': 'wavenet',
                'name': 'WaveNet Voices',
                'description': 'WaveNet-based voices with good quality',
                'supported_formats': ['mp3', 'wav', 'ogg'],
                'features': ['WaveNet', 'Standard', 'Cost-effective']
            },
            {
                'id': 'standard',
                'name': 'Standard Voices',
                'description': 'Basic concatenative voices',
                'supported_formats': ['mp3', 'wav', 'ogg'],
                'features': ['Basic', 'Affordable']
            }
        ]
    
    def get_available_voices(self, language_code: str = 'en-US') -> List[Dict]:
        """Get available voices for Google TTS"""
        if not self.client:
            return []
        
        try:
            # Get list of available voices
            voices_response = self.client.list_voices()
            
            voices = []
            for voice in voices_response.voices:
                if language_code in voice.language_codes:
                    voice_type = 'Neural2' if 'Neural2' in voice.name else 'WaveNet' if 'Wavenet' in voice.name else 'Standard'
                    gender = 'male' if voice.ssml_gender == texttospeech.SsmlVoiceGender.MALE else 'female'
                    
                    voices.append({
                        'id': voice.name,
                        'name': voice.name,
                        'description': f'{voice_type} {gender} voice',
                        'gender': gender,
                        'language_codes': list(voice.language_codes),
                        'voice_type': voice_type.lower()
                    })
            
            return voices
            
        except Exception as e:
            print(f"Failed to get Google TTS voices: {e}")
            return self._get_fallback_voices(language_code)
    
    def _get_fallback_voices(self, language_code: str) -> List[Dict]:
        """Get fallback voices when API call fails"""
        fallback_voices = {
            'en-US': [
                {
                    'id': 'en-US-Neural2-A',
                    'name': 'en-US-Neural2-A',
                    'description': 'Neural2 female voice',
                    'gender': 'female',
                    'language_codes': ['en-US'],
                    'voice_type': 'neural2'
                },
                {
                    'id': 'en-US-Neural2-C',
                    'name': 'en-US-Neural2-C',
                    'description': 'Neural2 female voice',
                    'gender': 'female',
                    'language_codes': ['en-US'],
                    'voice_type': 'neural2'
                },
                {
                    'id': 'en-US-Neural2-D',
                    'name': 'en-US-Neural2-D',
                    'description': 'Neural2 male voice',
                    'gender': 'male',
                    'language_codes': ['en-US'],
                    'voice_type': 'neural2'
                }
            ]
        }
        
        return fallback_voices.get(language_code, fallback_voices['en-US'])
    
    def synthesize_speech(self, text: str, voice_id: str, language_code: str = 'en-US',
                         audio_format: str = 'mp3', speed: float = 1.0) -> Dict:
        """Synthesize speech using Google Cloud TTS"""
        if not self.client:
            return {
                'success': False,
                'error': 'Google TTS client not initialized',
                'audio_data': None,
                'audio_size_bytes': 0,
                'processing_time': 0.0
            }
        
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
            
            # Set up synthesis input
            synthesis_input = texttospeech.SynthesisInput(text=text)
            
            # Configure voice
            voice = texttospeech.VoiceSelectionParams(
                language_code=language_code,
                name=voice_id
            )
            
            # Configure audio format
            format_mapping = {
                'mp3': texttospeech.AudioEncoding.MP3,
                'wav': texttospeech.AudioEncoding.LINEAR16,
                'ogg': texttospeech.AudioEncoding.OGG_OPUS
            }
            
            audio_config = texttospeech.AudioConfig(
                audio_encoding=format_mapping.get(audio_format, texttospeech.AudioEncoding.MP3),
                speaking_rate=speed
            )
            
            # Synthesize speech
            response = self.client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            audio_data = response.audio_content
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
                'voice_used': voice_id,
                'format': audio_format,
                'text_length': len(text),
                'error': None
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
        """Check Google TTS service status"""
        if not self.client:
            return {
                'service_available': False,
                'status': 'Client not initialized',
                'error': 'Failed to initialize Google Cloud TTS client'
            }
        
        try:
            # Test with a simple voices list call
            response = self.client.list_voices()
            
            return {
                'service_available': True,
                'status': 'Active',
                'available_voices': len(response.voices),
                'client_initialized': True
            }
            
        except Exception as e:
            return {
                'service_available': False,
                'status': 'Error',
                'error': str(e),
                'client_initialized': bool(self.client)
            }
    
    def is_service_available(self) -> bool:
        """Check if Google TTS service is available"""
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
        elif len(text) > 5000:
            errors.append("Text too long (max 5000 characters)")
        
        if not voice_id:
            errors.append("Voice ID is required")
        
        if audio_format not in ['mp3', 'wav', 'ogg']:
            errors.append("Invalid audio format. Supported: mp3, wav, ogg")
        
        if speed < 0.25 or speed > 4.0:
            errors.append("Speed must be between 0.25 and 4.0")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }