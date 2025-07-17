import requests
import json
import base64
from typing import List, Dict, Optional
from .base_provider import BaseASRProvider

class FireworksASRProvider(BaseASRProvider):
    def __init__(self, api_key: str):
        super().__init__(api_key)
        self.base_url = "https://api.fireworks.ai/inference/v1"
        self.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
    
    def get_available_models(self) -> List[Dict]:
        return [
            {
                'id': 'accounts/fireworks/models/whisper-v3',
                'name': 'Whisper v3',
                'language_code': 'en'
            },
            {
                'id': 'accounts/fireworks/models/whisper-v3-turbo',
                'name': 'Whisper v3 Turbo',
                'language_code': 'en'
            }
        ]
    
    def transcribe_audio(self, audio_file_path: str, model_id: str, language_code: str = 'en') -> Dict:
        try:
            with open(audio_file_path, 'rb') as audio_file:
                audio_data = audio_file.read()
                audio_b64 = base64.b64encode(audio_data).decode('utf-8')
            
            url = f"{self.base_url}/audio/transcriptions"
            
            payload = {
                "model": model_id,
                "file": audio_b64,
                "language": language_code,
                "response_format": "json"
            }
            
            response = requests.post(url, headers=self.headers, json=payload)
            
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