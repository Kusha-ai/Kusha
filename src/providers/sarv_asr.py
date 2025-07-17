import requests
import json
from typing import List, Dict, Optional
from .base_provider import BaseASRProvider

class SarvASRProvider(BaseASRProvider):
    def __init__(self, api_url: str = "http://103.255.103.118:5001"):
        super().__init__(api_url)
        self.base_url = api_url.rstrip('/')
        self.supported_languages = {
            'assamese': 'as',
            'bengali': 'bn',
            'bodo': 'brx',
            'dogri': 'doi',
            'gujarati': 'gu',
            'hindi': 'hi',
            'kannada': 'kn',
            'konkani': 'kok',
            'kashmiri': 'ks',
            'maithili': 'mai',
            'malayalam': 'ml',
            'manipuri': 'mni',
            'marathi': 'mr',
            'nepali': 'ne',
            'odia': 'or',
            'punjabi': 'pa',
            'sanskrit': 'sa',
            'santali': 'sat',
            'sindhi': 'sd',
            'tamil': 'ta',
            'telugu': 'te',
            'urdu': 'ur'
        }
    
    def get_available_models(self) -> List[Dict]:
        models = []
        
        # Hindi-specific models
        models.append({
            'id': 'hindi-specific',
            'name': 'Hindi Specific Model (CTC)',
            'language_code': 'hi',
            'decoding_strategy': 'ctc'
        })
        
        models.append({
            'id': 'hindi-specific-rnnt',
            'name': 'Hindi Specific Model (RNNT)',
            'language_code': 'hi',
            'decoding_strategy': 'rnnt'
        })
        
        # Hindi multilingual models
        models.append({
            'id': 'hindi-multilingual',
            'name': 'Hindi Multilingual Model (CTC)',
            'language_code': 'hi',
            'decoding_strategy': 'ctc'
        })
        
        models.append({
            'id': 'hindi-multilingual-rnnt',
            'name': 'Hindi Multilingual Model (RNNT)',
            'language_code': 'hi',
            'decoding_strategy': 'rnnt'
        })
        
        # Multilingual models for other languages
        for lang_name, lang_code in self.supported_languages.items():
            if lang_code != 'hi':  # Skip Hindi as it's handled above
                models.append({
                    'id': f'multilingual-{lang_code}',
                    'name': f'{lang_name.title()} Multilingual Model (CTC)',
                    'language_code': lang_code,
                    'decoding_strategy': 'ctc'
                })
                
                models.append({
                    'id': f'multilingual-{lang_code}-rnnt',
                    'name': f'{lang_name.title()} Multilingual Model (RNNT)',
                    'language_code': lang_code,
                    'decoding_strategy': 'rnnt'
                })
        
        return models
    
    def transcribe_audio(self, audio_file_path: str, model_id: str, language_code: str = 'hi') -> Dict:
        try:
            url = f"{self.base_url}/upload"
            
            # Parse model preferences from model_id
            model_preference = None
            decoding_strategy = 'ctc'
            
            if 'hindi-specific' in model_id:
                model_preference = 'hindi-specific'
            elif 'hindi-multilingual' in model_id:
                model_preference = 'hindi-multilingual'
            
            if 'rnnt' in model_id:
                decoding_strategy = 'rnnt'
            
            # Prepare the request
            with open(audio_file_path, 'rb') as audio_file:
                files = {'audio': audio_file}
                data = {
                    'language': language_code,
                    'decoding_strategy': decoding_strategy,
                    'debug': 'true'  # Enable debug mode for detailed timing
                }
                
                if model_preference:
                    data['model_preference'] = model_preference
                
                response = requests.post(url, files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('success', False):
                    return {
                        'success': True,
                        'transcription': result.get('transcription', ''),
                        'confidence': 1.0,  # Sarv doesn't provide confidence scores
                        'processing_time': result.get('processing_time', 0.0),
                        'audio_duration': result.get('audio_duration', 0.0),
                        'model_used': result.get('model_used', 'Unknown'),
                        'real_time_factor': result.get('real_time_factor', 0.0),
                        'end_to_end_time': result.get('end_to_end_time', 0.0),
                        'error': None
                    }
                else:
                    return {
                        'success': False,
                        'error': result.get('detail', 'Unknown error'),
                        'transcription': '',
                        'confidence': 0.0
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
    
    def get_service_status(self) -> Dict:
        """Get service status and model information"""
        try:
            url = f"{self.base_url}/status"
            response = requests.get(url)
            
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'model_loaded': False
                }
        
        except Exception as e:
            return {
                'error': str(e),
                'model_loaded': False
            }
    
    def get_supported_languages(self) -> Dict[str, str]:
        """Get supported languages"""
        return self.supported_languages
    
    def is_service_available(self) -> bool:
        """Check if the Sarv ASR service is available"""
        try:
            status = self.get_service_status()
            return status.get('model_loaded', False)
        except:
            return False
    
    def get_language_name(self, language_code: str) -> str:
        """Get language name from language code"""
        for name, code in self.supported_languages.items():
            if code == language_code:
                return name.title()
        return language_code