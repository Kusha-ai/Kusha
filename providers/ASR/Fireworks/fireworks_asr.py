import os
import time
import requests
from typing import Dict, List, Optional, Any

class FireworksASR:
    """Fireworks AI ASR provider using Whisper models"""
    
    def __init__(self, config: Dict, api_key: str = None):
        self.config = config
        self.api_key = api_key
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
        """Check if Fireworks AI service is available"""
        return bool(self.api_key)
    
    def transcribe_audio(self, audio_file_path: str, model_id: str, language_code: str) -> Dict[str, Any]:
        """
        Transcribe audio using Fireworks AI Whisper models
        
        Args:
            audio_file_path: Path to audio file
            model_id: Model ID to use
            language_code: Language code (e.g., 'en-US')
            
        Returns:
            Dictionary with transcription results
        """
        if not self.api_key:
            return {
                'success': False,
                'provider': self.provider_name,
                'model_id': model_id,
                'language_code': language_code,
                'error': 'API key not provided',
                'processing_time': 0,
                'timing_phases': {
                    'preparation_time': 0,
                    'network_time': 0,
                    'response_processing_time': 0,
                    'model_processing_time': 0
                }
            }
        
        try:
            # Phase 1: Request preparation
            prep_start = time.time()
            
            # Prepare the request headers
            headers = {
                'Authorization': f'Bearer {self.api_key}'
            }
            
            # For Fireworks API, map our model IDs to what the API actually expects
            # The API expects "whisper-v3" for the turbo model, not "whisper-v3-turbo"
            model_mapping = {
                'whisper-v3-turbo': 'whisper-v3'  # Map our display name to API name
            }
            
            fireworks_model = model_mapping.get(model_id, model_id)
            
            # Prepare files and data for multipart form
            files = {
                'file': open(audio_file_path, 'rb')
            }
            
            data = {
                'model': fireworks_model,
                'language': language_code.split('-')[0]  # Convert 'en-US' to 'en'
            }
            
            prep_time = time.time() - prep_start
            
            # Phase 2: Network request
            network_start = time.time()
            
            # Make request to Fireworks AI
            response = requests.post(
                f"{self.base_url}/audio/transcriptions",
                headers=headers,
                files=files,
                data=data,
                timeout=60
            )
            
            network_time = time.time() - network_start
            
            # Phase 3: Response processing
            response_start = time.time()
            
            # Make sure to close the file
            files['file'].close()
            
            # Total processing time (network only for backward compatibility)
            processing_time = network_time
            response_time = time.time() - response_start
            
            if response.status_code == 200:
                result = response.json()
                
                return {
                    'success': True,
                    'provider': self.provider_name,
                    'model_id': model_id,
                    'language_code': language_code,
                    'transcription': result.get('text', ''),
                    'confidence': 0.85,  # Fireworks doesn't provide confidence, use default
                    'processing_time': processing_time,
                    'raw_response': result,
                    # Detailed timing breakdown
                    'timing_phases': {
                        'preparation_time': prep_time,
                        'network_time': network_time,
                        'response_processing_time': response_time,
                        'model_processing_time': network_time  # Fireworks doesn't provide server-side processing time
                    }
                }
            else:
                return {
                    'success': False,
                    'provider': self.provider_name,
                    'model_id': model_id,
                    'language_code': language_code,
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'processing_time': processing_time,
                    'timing_phases': {
                        'preparation_time': prep_time,
                        'network_time': network_time,
                        'response_processing_time': response_time,
                        'model_processing_time': 0
                    }
                }
                
        except Exception as e:
            # If error occurred before timing started, set minimal processing time
            processing_time = getattr(locals(), 'processing_time', 0.001)
            prep_time = getattr(locals(), 'prep_time', 0.001)
            network_time = getattr(locals(), 'network_time', 0)
            response_time = getattr(locals(), 'response_time', 0)
            
            return {
                'success': False,
                'provider': self.provider_name,
                'model_id': model_id,
                'language_code': language_code,
                'error': str(e),
                'processing_time': processing_time,
                'timing_phases': {
                    'preparation_time': prep_time,
                    'network_time': network_time,
                    'response_processing_time': response_time,
                    'model_processing_time': 0
                }
            }
    
    def test_speed(self, audio_file_path: str, model_id: str, language_code: str = 'en-US') -> Dict:
        """
        Test processing speed by measuring total processing time around transcribe_audio call
        
        Args:
            audio_file_path: Path to audio file
            model_id: Model ID to use
            language_code: Language code (e.g., 'en-US')
            
        Returns:
            Dictionary with detailed timing information
        """
        total_start_time = time.time()
        result = self.transcribe_audio(audio_file_path, model_id, language_code)
        total_end_time = time.time()
        
        total_processing_time = total_end_time - total_start_time
        api_processing_time = result.get('processing_time', 0.0)  # API call time from transcribe_audio
        overhead_time = total_processing_time - api_processing_time
        
        # Update result with detailed timing
        result['api_call_time'] = api_processing_time
        result['total_processing_time'] = total_processing_time
        result['overhead_time'] = overhead_time
        result['processing_time'] = api_processing_time  # Keep for backward compatibility
        
        return result
    
    def test_connection(self) -> Dict[str, Any]:
        """Test connection to Fireworks AI service"""
        if not self.api_key:
            return {
                'success': False,
                'message': 'API key not provided'
            }
        
        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            # Test with a simple API call to list models
            response = requests.get(
                f"{self.base_url}/models",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                models = self.get_available_models()
                languages = self.get_supported_languages()
                return {
                    'success': True,
                    'message': f"Connected successfully. {len(models)} models available for {len(languages)} languages.",
                    'models_count': len(models),
                    'languages_count': len(languages)
                }
            else:
                return {
                    'success': False,
                    'message': f"API responded with status {response.status_code}"
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
            'requires_api_key': self.config['provider']['requires_api_key'],
            'api_key_configured': bool(self.api_key)
        }