import json
import time
import base64
import requests
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

class GoogleTTS:
    """Google Cloud Text-to-Speech provider using REST API"""
    
    def __init__(self, config: dict, api_key: str = None):
        self.config = config
        self.api_key = api_key
        self.provider_name = config['provider']['name']
        self.base_url = "https://texttospeech.googleapis.com/v1"
        self.access_token = None
        self._initialize_auth()
    
    def _initialize_auth(self):
        """Initialize Google Cloud TTS authentication using REST API"""
        try:
            if not self.api_key:
                print("Google TTS: No API key provided")
                self.access_token = None
                return
                
            # Parse service account key from API key
            if self.api_key.startswith('{'):
                # JSON service account key
                try:
                    service_account_info = json.loads(self.api_key)
                    self.access_token = self._get_access_token_from_service_account(service_account_info)
                    if self.access_token:
                        print("Google TTS: Successfully authenticated with service account credentials")
                    else:
                        print("Google TTS: Failed to get access token from service account")
                except json.JSONDecodeError as e:
                    print(f"Google TTS: Invalid JSON in service account key: {e}")
                    self.access_token = None
                except Exception as e:
                    print(f"Google TTS: Failed to authenticate with service account key: {e}")
                    self.access_token = None
            else:
                # Treat as direct API key
                print("Google TTS: Using API key for authentication")
                self.access_token = self.api_key
        except Exception as e:
            print(f"Failed to initialize Google TTS authentication: {e}")
            self.access_token = None
    
    def _get_access_token_from_service_account(self, service_account_info: dict) -> str:
        """Get OAuth2 access token from service account credentials"""
        try:
            import jwt
            import time
            
            # Create JWT assertion
            now = int(time.time())
            payload = {
                'iss': service_account_info['client_email'],
                'scope': 'https://www.googleapis.com/auth/cloud-platform',
                'aud': 'https://oauth2.googleapis.com/token',
                'iat': now,
                'exp': now + 3600  # 1 hour expiry
            }
            
            # Sign the JWT
            private_key = service_account_info['private_key']
            token = jwt.encode(payload, private_key, algorithm='RS256')
            
            # Exchange JWT for access token
            response = requests.post('https://oauth2.googleapis.com/token', data={
                'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion': token
            })
            
            if response.status_code == 200:
                return response.json().get('access_token')
            else:
                print(f"Failed to get access token: {response.status_code} - {response.text}")
                return None
                
        except ImportError:
            print("PyJWT library not available, falling back to API key method")
            return None
        except Exception as e:
            print(f"Error getting access token: {e}")
            return None
    
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
    
    def get_available_voices(self, language_code: str = 'en-US', model_filter: str = None) -> List[Dict]:
        """Get available voices for Google TTS using REST API, optionally filtered by model type"""
        if not self.access_token:
            return self._get_fallback_voices(language_code, model_filter)
        
        try:
            # Get list of available voices via REST API
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            
            # If access_token looks like an API key (not JWT), use key parameter instead
            if len(self.access_token) < 100:  # API keys are shorter than JWT tokens
                url = f"{self.base_url}/voices?key={self.access_token}"
                headers = {'Content-Type': 'application/json'}
            else:
                url = f"{self.base_url}/voices"
            
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                voices_data = response.json()
                
                # Get comprehensive language support from config
                comprehensive_languages = self._get_comprehensive_languages()
                
                voices = []
                for voice in voices_data.get('voices', []):
                    # Check if voice supports the requested language
                    voice_language_codes = voice.get('languageCodes', [])
                    
                    # Only include voices that actually support the requested language
                    if language_code not in voice_language_codes:
                        continue
                    
                    voice_name = voice.get('name', '')
                    voice_type = 'Neural2' if 'Neural2' in voice_name else 'WaveNet' if 'Wavenet' in voice_name else 'Standard'
                    
                    # Filter voices by model type if specified
                    if model_filter:
                        expected_type = model_filter.lower()
                        if expected_type == 'neural2' and 'Neural2' not in voice_name:
                            continue
                        elif expected_type == 'wavenet' and 'Wavenet' not in voice_name:
                            continue
                        elif expected_type == 'standard' and ('Neural2' in voice_name or 'Wavenet' in voice_name):
                            continue
                    
                    # Determine gender from SSML gender
                    ssml_gender = voice.get('ssmlGender', 'NEUTRAL')
                    gender = 'male' if ssml_gender == 'MALE' else 'female' if ssml_gender == 'FEMALE' else 'neutral'
                    
                    voice_data = {
                        'id': voice_name,
                        'name': voice_name,
                        'description': f'{voice_type} {gender} voice',
                        'gender': gender,
                        'language_codes': voice_language_codes,  # Use actual language codes only
                        'supported_languages': voice_language_codes,  # Use actual language codes only
                        'voice_type': voice_type.lower()
                    }
                    
                    voices.append(voice_data)
                
                return voices
            else:
                print(f"Failed to get Google TTS voices: HTTP {response.status_code} - {response.text}")
                return self._get_fallback_voices(language_code, model_filter)
            
        except Exception as e:
            print(f"Failed to get Google TTS voices: {e}")
            return self._get_fallback_voices(language_code, model_filter)
    
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

    def _get_fallback_voices(self, language_code: str, model_filter: str = None) -> List[Dict]:
        """Get fallback voices when API call fails, optionally filtered by model type"""
        
        # Enhanced fallback voices with proper language-specific support
        all_fallback_voices = [
            # Neural2 voices
            {
                'id': 'en-US-Neural2-A',
                'name': 'en-US-Neural2-A',
                'description': 'Neural2 female voice',
                'gender': 'female',
                'language_codes': ['en-US', 'en-GB'],
                'supported_languages': ['en-US', 'en-GB'],
                'voice_type': 'neural2'
            },
            {
                'id': 'hi-IN-Neural2-A',
                'name': 'hi-IN-Neural2-A',
                'description': 'Neural2 female Hindi voice',
                'gender': 'female',
                'language_codes': ['hi-IN'],
                'supported_languages': ['hi-IN'],
                'voice_type': 'neural2'
            },
            {
                'id': 'hi-IN-Neural2-B',
                'name': 'hi-IN-Neural2-B',
                'description': 'Neural2 male Hindi voice',
                'gender': 'male',
                'language_codes': ['hi-IN'],
                'supported_languages': ['hi-IN'],
                'voice_type': 'neural2'
            },
            # WaveNet voices
            {
                'id': 'en-US-Wavenet-A',
                'name': 'en-US-Wavenet-A',
                'description': 'WaveNet female voice',
                'gender': 'female',
                'language_codes': ['en-US', 'en-GB'],
                'supported_languages': ['en-US', 'en-GB'],
                'voice_type': 'wavenet'
            },
            {
                'id': 'hi-IN-Wavenet-A',
                'name': 'hi-IN-Wavenet-A',
                'description': 'WaveNet female Hindi voice',
                'gender': 'female',
                'language_codes': ['hi-IN'],
                'supported_languages': ['hi-IN'],
                'voice_type': 'wavenet'
            },
            {
                'id': 'hi-IN-Wavenet-B',
                'name': 'hi-IN-Wavenet-B',
                'description': 'WaveNet male Hindi voice',
                'gender': 'male',
                'language_codes': ['hi-IN'],
                'supported_languages': ['hi-IN'],
                'voice_type': 'wavenet'
            },
            # Standard voices
            {
                'id': 'en-US-Standard-A',
                'name': 'en-US-Standard-A',
                'description': 'Standard female voice',
                'gender': 'female',
                'language_codes': ['en-US', 'en-GB'],
                'supported_languages': ['en-US', 'en-GB'],
                'voice_type': 'standard'
            },
            {
                'id': 'hi-IN-Standard-A',
                'name': 'hi-IN-Standard-A',
                'description': 'Standard female Hindi voice',
                'gender': 'female',
                'language_codes': ['hi-IN'],
                'supported_languages': ['hi-IN'],
                'voice_type': 'standard'
            },
            {
                'id': 'hi-IN-Standard-B',
                'name': 'hi-IN-Standard-B',
                'description': 'Standard male Hindi voice',
                'gender': 'male',
                'language_codes': ['hi-IN'],
                'supported_languages': ['hi-IN'],
                'voice_type': 'standard'
            }
        ]
        
        # Filter by model type if specified
        filtered_voices = all_fallback_voices
        if model_filter:
            expected_type = model_filter.lower()
            filtered_voices = [voice for voice in all_fallback_voices if voice['voice_type'] == expected_type]
        
        # Filter fallback voices by actual language support
        language_filtered_voices = []
        for voice in filtered_voices:
            # Check if the voice actually supports the requested language
            if language_code in voice['language_codes']:
                language_filtered_voices.append(voice)
        
        return language_filtered_voices
    
    def generate_speech(self, text: str, voice_id: str, model_id: str = 'standard', 
                       language_code: str = 'en-US', audio_format: str = 'mp3', speed: float = 1.0) -> Dict:
        """Generate speech using Google Cloud TTS API - main method called by backend"""
        return self.synthesize_speech(text, voice_id, language_code, audio_format, speed)
    
    def synthesize_speech(self, text: str, voice_id: str, language_code: str = 'en-US',
                         audio_format: str = 'mp3', speed: float = 1.0) -> Dict:
        """Synthesize speech using Google Cloud TTS REST API"""
        if not self.access_token:
            error_msg = 'Google TTS not authenticated. '
            if not self.api_key:
                error_msg += 'Please configure a Google Cloud API key or service account JSON key in the API Keys section.'
            else:
                error_msg += 'Please check your Google Cloud API credentials. Ensure the key has Text-to-Speech API permissions.'
            
            return {
                'success': False,
                'error': error_msg,
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
            
            # Configure audio format
            format_mapping = {
                'mp3': 'MP3',
                'wav': 'LINEAR16',
                'ogg': 'OGG_OPUS'
            }
            
            # Prepare request payload
            payload = {
                'input': {
                    'text': text
                },
                'voice': {
                    'languageCode': language_code,
                    'name': voice_id
                },
                'audioConfig': {
                    'audioEncoding': format_mapping.get(audio_format, 'MP3'),
                    'speakingRate': speed
                }
            }
            
            # Set up headers and URL
            headers = {
                'Content-Type': 'application/json'
            }
            
            # If access_token looks like an API key (not JWT), use key parameter instead
            if len(self.access_token) < 100:  # API keys are shorter than JWT tokens
                url = f"{self.base_url}/text:synthesize?key={self.access_token}"
            else:
                url = f"{self.base_url}/text:synthesize"
                headers['Authorization'] = f'Bearer {self.access_token}'
            
            # Make API request
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            if response.status_code == 200:
                response_data = response.json()
                
                # Get audio content (it's base64 encoded in the response)
                audio_base64 = response_data.get('audioContent', '')
                audio_data = base64.b64decode(audio_base64)
                audio_size = len(audio_data)
                
                # Create data URL for immediate playback
                audio_url = f"data:audio/{audio_format};base64,{audio_base64}"
                
                # Estimate audio duration
                words = len(text.split())
                estimated_duration = (words / 150) * 60 / speed
                
                return {
                    'success': True,
                    'audio_data': audio_data,
                    'audio_url': audio_url,
                    'audio_size_bytes': audio_size,
                    'audio_duration': estimated_duration,
                    'processing_time': processing_time,
                    'voice_used': voice_id,
                    'format': audio_format,
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
        """Check Google TTS service status using REST API"""
        if not self.access_token:
            return {
                'service_available': False,
                'status': 'Not authenticated',
                'error': 'Google TTS authentication not configured'
            }
        
        try:
            # Test with a simple voices list call
            headers = {
                'Content-Type': 'application/json'
            }
            
            # If access_token looks like an API key, use key parameter
            if len(self.access_token) < 100:
                url = f"{self.base_url}/voices?key={self.access_token}"
            else:
                url = f"{self.base_url}/voices"
                headers['Authorization'] = f'Bearer {self.access_token}'
            
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                voices_data = response.json()
                return {
                    'service_available': True,
                    'status': 'Active',
                    'available_voices': len(voices_data.get('voices', [])),
                    'authenticated': True
                }
            else:
                return {
                    'service_available': False,
                    'status': f'HTTP {response.status_code}',
                    'error': response.text,
                    'authenticated': bool(self.access_token)
                }
            
        except Exception as e:
            return {
                'service_available': False,
                'status': 'Error',
                'error': str(e),
                'authenticated': bool(self.access_token)
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