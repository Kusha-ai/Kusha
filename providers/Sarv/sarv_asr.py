import os
import time
import requests
import tempfile
import json
from typing import Dict, List, Optional, Any

class SarvASR:
    """Sarv ASR provider for Indian languages"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.base_url = config['provider']['base_url']
        self.provider_id = config['provider']['id']
        self.provider_name = config['provider']['name']
    
    def get_supported_languages(self) -> List[str]:
        """Get list of supported language codes"""
        return list(self.config['languages'].keys())
    
    def get_available_models(self, language_code: str = None) -> List[Dict]:
        """Get available models, optionally filtered by language"""
        models = self.config['models']
        if language_code:
            models = [m for m in models if language_code in m['supported_languages']]
        return models
    
    def is_service_available(self) -> bool:
        """Check if Sarv ASR service is available"""
        try:
            response = requests.get(f"{self.base_url}/status", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def transcribe_audio(self, audio_file_path: str, model_id: str, language_code: str) -> Dict[str, Any]:
        """
        Transcribe audio using Sarv ASR
        
        Args:
            audio_file_path: Path to audio file
            model_id: Model ID to use ('hindi-specific', 'hindi-multilingual', 'multilingual')
            language_code: Language code (e.g., 'hi-IN')
            
        Returns:
            Dictionary with transcription results
        """
        start_time = time.time()
        
        try:
            # Convert language code from 'hi-IN' format to 'hi' format for Sarv API
            sarv_language_code = language_code.split('-')[0] if '-' in language_code else language_code
            
            # Prepare the request
            files = {
                'audio': open(audio_file_path, 'rb')
            }
            
            data = {
                'language': sarv_language_code
            }
            
            # Add model preference for Hindi
            if language_code == 'hi-IN':
                if model_id == 'hindi-specific':
                    data['model_preference'] = 'hindi-specific'
                elif model_id == 'hindi-multilingual':
                    data['model_preference'] = 'hindi-multilingual'
                # For multilingual model, let it auto-select
            
            # Make request to Sarv ASR
            response = requests.post(
                f"{self.base_url}/upload",
                files=files,
                data=data,
                timeout=30
            )
            
            processing_time = time.time() - start_time
            files['audio'].close()
            
            if response.status_code == 200:
                result = response.json()
                
                return {
                    'success': True,
                    'provider': self.provider_name,
                    'model_id': model_id,
                    'language_code': language_code,
                    'transcription': result.get('transcription', ''),
                    'confidence': result.get('confidence', 0.95),  # Default confidence if not provided
                    'processing_time': processing_time,
                    'model_used': result.get('model_used', model_id),
                    'real_time_factor': result.get('real_time_factor', None),
                    'raw_response': result
                }
            else:
                return {
                    'success': False,
                    'provider': self.provider_name,
                    'model_id': model_id,
                    'language_code': language_code,
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'processing_time': processing_time
                }
                
        except Exception as e:
            processing_time = time.time() - start_time
            return {
                'success': False,
                'provider': self.provider_name,
                'model_id': model_id,
                'language_code': language_code,
                'error': str(e),
                'processing_time': processing_time
            }
    
    def test_connection(self) -> Dict[str, Any]:
        """Test connection to Sarv ASR service"""
        try:
            response = requests.get(f"{self.base_url}/status", timeout=10)
            
            if response.status_code == 200:
                models = self.get_available_models()
                status_data = response.json()
                
                return {
                    'success': True,
                    'message': f"Connected successfully. {len(models)} models available.",
                    'models_count': len(models),
                    'languages_count': len(self.get_supported_languages()),
                    'service_status': status_data
                }
            else:
                return {
                    'success': False,
                    'message': f"Service responded with status {response.status_code}"
                }
        except Exception as e:
            return {
                'success': False,
                'message': f"Connection failed: {str(e)}"
            }
    
    def get_service_info(self) -> Dict[str, Any]:
        """Get service information"""
        return {
            'provider': self.provider_name,
            'provider_id': self.provider_id,
            'base_url': self.base_url,
            'supported_languages': len(self.get_supported_languages()),
            'available_models': len(self.config['models']),
            'requires_api_key': self.config['provider']['requires_api_key']
        }