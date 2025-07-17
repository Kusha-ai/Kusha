import requests
import json
from typing import List, Dict, Optional
from .base_provider import BaseASRProvider

class ElevenLabsASRProvider(BaseASRProvider):
    def __init__(self, api_key: str):
        super().__init__(api_key)
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
            url = f"{self.base_url}/speech-to-text"
            
            with open(audio_file_path, 'rb') as audio_file:
                files = {
                    'audio': audio_file,
                    'model_id': (None, model_id),
                    'language_code': (None, language_code)
                }
                
                response = requests.post(url, headers=self.headers, files=files)
            
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