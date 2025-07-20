import requests
import json
import time
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
            # Phase 1: Request preparation
            prep_start = time.time()
            
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
                
                prep_time = time.time() - prep_start
                
                # Phase 2: Network request
                network_start = time.time()
                response = requests.post(url, headers=self.headers, files=files, data=data)
                network_time = time.time() - network_start
                
                # Phase 3: Response processing
                response_start = time.time()
                processing_time = network_time  # Total processing time for backward compatibility
                response_time = time.time() - response_start
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'provider': self.provider_name,
                    'model_id': model_id,
                    'language_code': language_code,
                    'transcription': result.get('text', ''),
                    'confidence': result.get('confidence', 0.0),
                    'processing_time': processing_time * 1000,  # Convert to milliseconds
                    'timing_phases': {
                        'preparation_time': prep_time * 1000,
                        'network_time': network_time * 1000,
                        'response_processing_time': response_time * 1000,
                        'model_processing_time': network_time * 1000
                    },
                    'error': None
                }
            else:
                return {
                    'success': False,
                    'provider': self.provider_name,
                    'model_id': model_id,
                    'language_code': language_code,
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'transcription': '',
                    'confidence': 0.0,
                    'processing_time': 0,
                    'timing_phases': {
                        'preparation_time': 0,
                        'network_time': 0,
                        'response_processing_time': 0,
                        'model_processing_time': 0
                    }
                }
        
        except Exception as e:
            return {
                'success': False,
                'provider': self.provider_name,
                'model_id': model_id,
                'language_code': language_code,
                'error': str(e),
                'transcription': '',
                'confidence': 0.0,
                'processing_time': 0,
                'timing_phases': {
                    'preparation_time': 0,
                    'network_time': 0,
                    'response_processing_time': 0,
                    'model_processing_time': 0
                }
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