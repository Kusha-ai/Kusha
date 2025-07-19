import os
import time
import requests
from typing import Dict, List, Optional, Any

class OpenAIASR:
    """OpenAI ASR provider using Whisper API"""
    
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
        """Check if OpenAI service is available"""
        return bool(self.api_key)
    
    def transcribe_audio(self, audio_file_path: str, model_id: str, language_code: str) -> Dict[str, Any]:
        """
        Transcribe audio using OpenAI Whisper API
        
        Args:
            audio_file_path: Path to audio file
            model_id: Model ID to use
            language_code: Language code (e.g., 'en-US')
            
        Returns:
            Dictionary with transcription results
        """
        start_time = time.time()
        
        if not self.api_key:
            return {
                'success': False,
                'provider': self.provider_name,
                'model_id': model_id,
                'language_code': language_code,
                'error': 'API key not provided',
                'processing_time': 0
            }
        
        try:
            # Prepare the request headers
            headers = {
                'Authorization': f'Bearer {self.api_key}'
            }
            
            # OpenAI uses standard Whisper model names
            model_mapping = {
                'whisper-1': 'whisper-1'
            }
            
            openai_model = model_mapping.get(model_id, model_id)
            
            # Prepare files and data for multipart form
            files = {
                'file': open(audio_file_path, 'rb')
            }
            
            data = {
                'model': openai_model,
                'language': language_code.split('-')[0],  # Convert 'en-US' to 'en'
                'response_format': 'verbose_json'  # Get detailed response with timestamps
            }
            
            # Make request to OpenAI API
            response = requests.post(
                f"{self.base_url}/audio/transcriptions",
                headers=headers,
                files=files,
                data=data,
                timeout=120  # OpenAI can be slower for longer files
            )
            
            # Make sure to close the file
            files['file'].close()
            
            processing_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                
                # Extract confidence from segments if available
                confidence = 0.85  # Default confidence
                if 'segments' in result and result['segments']:
                    # Calculate average confidence from segments
                    segment_confidences = []
                    for segment in result['segments']:
                        if 'avg_logprob' in segment:
                            # Convert log probability to confidence (approximate)
                            conf = min(max((segment['avg_logprob'] + 1) / 1, 0), 1)
                            segment_confidences.append(conf)
                    if segment_confidences:
                        confidence = sum(segment_confidences) / len(segment_confidences)
                
                return {
                    'success': True,
                    'provider': self.provider_name,
                    'model_id': model_id,
                    'language_code': language_code,
                    'transcription': result.get('text', ''),
                    'confidence': confidence,
                    'processing_time': processing_time,
                    'raw_response': result,
                    'language_detected': result.get('language'),
                    'duration': result.get('duration')
                }
            else:
                error_detail = "Unknown error"
                try:
                    error_response = response.json()
                    if 'error' in error_response:
                        error_detail = error_response['error'].get('message', str(error_response['error']))
                except:
                    error_detail = response.text
                
                return {
                    'success': False,
                    'provider': self.provider_name,
                    'model_id': model_id,
                    'language_code': language_code,
                    'error': f"HTTP {response.status_code}: {error_detail}",
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
        """Test connection to OpenAI service"""
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
                error_detail = "Unknown error"
                try:
                    error_response = response.json()
                    if 'error' in error_response:
                        error_detail = error_response['error'].get('message', str(error_response['error']))
                except:
                    error_detail = response.text
                
                return {
                    'success': False,
                    'message': f"API responded with status {response.status_code}: {error_detail}"
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