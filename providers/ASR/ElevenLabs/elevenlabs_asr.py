import requests
import json
from typing import List, Dict, Optional
import sys
import os
# Add providers/core to path for base provider import  
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'core'))

class ElevenLabsASR:
    """ElevenLabs ASR provider"""
    
    def __init__(self, config: dict, api_key: str = None):
        self.config = config
        self.api_key = api_key
        self.provider_name = config['provider']['name']
        self.base_url = "https://api.elevenlabs.io/v1"
        self.headers = {
            "Accept": "application/json",
            "xi-api-key": self.api_key
        }
    
    def get_available_models(self) -> List[Dict]:
        return [
            {
                'id': 'eleven_multilingual_v2',
                'name': 'Eleven Multilingual v2',
                'language_code': 'en'
            },
            {
                'id': 'eleven_multilingual_v1',
                'name': 'Eleven Multilingual v1',
                'language_code': 'en'
            },
            {
                'id': 'eleven_english_v1',
                'name': 'Eleven English v1',
                'language_code': 'en'
            }
        ]
    
    def transcribe_audio(self, audio_file_path: str, model_id: str, language_code: str = 'en') -> Dict:
        try:
            # ElevenLabs uses a different endpoint pattern
            url = f"{self.base_url}/speech-to-text"
            
            # Prepare the multipart form data correctly for ElevenLabs API
            with open(audio_file_path, 'rb') as audio_file:
                # Use the correct parameter name 'file' instead of 'audio'
                files = {
                    'file': ('audio.wav', audio_file, 'audio/wav')
                }
                
                # Include model_id in the form data
                data = {
                    'model_id': model_id
                }
                
                response = requests.post(url, headers=self.headers, files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'transcription': result.get('text', ''),
                    'confidence': result.get('confidence', 0.0),
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
    
    def get_user_info(self) -> Dict:
        try:
            url = f"{self.base_url}/user"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                return {'error': f"HTTP {response.status_code}: {response.text}"}
        
        except Exception as e:
            return {'error': str(e)}
    
    def get_voices(self) -> List[Dict]:
        try:
            url = f"{self.base_url}/voices"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                return response.json().get('voices', [])
            else:
                return []
        
        except Exception as e:
            print(f"Error getting voices: {e}")
            return []