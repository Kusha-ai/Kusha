import requests
import json
from typing import List, Dict, Optional
import sys
import os
# Add providers/core to path for base provider import
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'core'))

class SarvASR:
    """Sarv ASR provider for Indian languages"""
    
    def __init__(self, config: dict, api_key: str = None):
        self.config = config
        self.api_key = api_key or "http://103.255.103.118:5001"
        self.provider_name = config['provider']['name']
        self.base_url = self.api_key.rstrip('/')
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
    
    def _map_language_code(self, language_code: str) -> str:
        """Map language codes from full format (e.g., hi-IN) to Sarv format (e.g., hi)"""
        # If it's already in the short format, return as is
        if language_code in self.supported_languages.values():
            return language_code
        
        # Map common full codes to short codes
        code_mapping = {
            'hi-IN': 'hi',
            'as-IN': 'as',
            'bn-IN': 'bn',
            'brx-IN': 'brx',
            'doi-IN': 'doi',
            'gu-IN': 'gu',
            'kn-IN': 'kn',
            'kok-IN': 'kok',
            'ks-IN': 'ks',
            'mai-IN': 'mai',
            'ml-IN': 'ml',
            'mni-IN': 'mni',
            'mr-IN': 'mr',
            'ne-IN': 'ne',
            'or-IN': 'or',
            'pa-IN': 'pa',
            'sa-IN': 'sa',
            'sat-IN': 'sat',
            'sd-IN': 'sd',
            'ta-IN': 'ta',
            'te-IN': 'te',
            'ur-IN': 'ur'
        }
        
        return code_mapping.get(language_code, language_code.split('-')[0])

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
            
            # Map language code to Sarv format
            sarv_language_code = self._map_language_code(language_code)
            
            # Prepare the request
            with open(audio_file_path, 'rb') as audio_file:
                files = {'audio': audio_file}
                data = {
                    'language': sarv_language_code,
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