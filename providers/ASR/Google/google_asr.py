import os
import time
import json
import base64
import requests
from typing import Dict, List, Optional, Any

class GoogleASR:
    """Google Cloud Speech-to-Text ASR provider using REST API with API key"""
    
    def __init__(self, config: Dict, api_key: str = None):
        self.config = config
        self.api_key = api_key
        self.base_url = config['provider']['base_url']
        self.provider_id = config['provider']['id']
        self.provider_name = config['provider']['name']
    
    def get_supported_languages(self) -> List[str]:
        """Get list of supported language codes"""
        return self.config.get('supported_languages', [])
    
    def get_available_models(self, language_code: str = None) -> List[Dict]:
        """Get available models, optionally filtered by language"""
        models = self.config['models']
        if language_code:
            models = [m for m in models if language_code in m.get('supported_languages', [])]
        return models
    
    def is_service_available(self) -> bool:
        """Check if Google Cloud Speech service is available"""
        return bool(self.api_key)
    
    def transcribe_audio(self, audio_file_path: str, model_id: str, language_code: str) -> Dict[str, Any]:
        """
        Transcribe audio using Google Cloud Speech-to-Text REST API
        
        Args:
            audio_file_path: Path to audio file
            model_id: Model ID to use
            language_code: Language code (e.g., 'hi-IN')
            
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
                'transcription': '',
                'confidence': 0.0,
                'processing_time': 0
            }
        
        try:
            # Phase 1: Request preparation
            prep_start = time.time()
            
            # Read and encode audio file
            with open(audio_file_path, 'rb') as audio_file:
                audio_content = audio_file.read()
                audio_base64 = base64.b64encode(audio_content).decode('utf-8')
            
            # Determine audio encoding
            encoding = "WEBM_OPUS"
            if audio_file_path.lower().endswith('.wav'):
                encoding = "LINEAR16"
            elif audio_file_path.lower().endswith('.mp3'):
                encoding = "MP3"
            elif audio_file_path.lower().endswith('.flac'):
                encoding = "FLAC"
            
            # Prepare request data
            request_data = {
                "config": {
                    "encoding": encoding,
                    "sampleRateHertz": 16000,
                    "languageCode": language_code,
                    "model": model_id,
                    "enableAutomaticPunctuation": True,
                    "enableWordConfidence": True
                },
                "audio": {
                    "content": audio_base64
                }
            }
            
            # Make request to Google Cloud Speech API
            headers = {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': self.api_key
            }
            
            prep_time = time.time() - prep_start
            
            # Phase 2: Network request
            network_start = time.time()
            
            response = requests.post(
                f"{self.base_url}/speech:recognize",
                headers=headers,
                json=request_data,
                timeout=120
            )
            
            network_time = time.time() - network_start
            
            # Total processing time (network only for backward compatibility)
            processing_time = network_time
            
            if response.status_code == 200:
                result = response.json()
                
                # Process results
                if 'results' in result and result['results']:
                    # Get the best alternative
                    first_result = result['results'][0]
                    if 'alternatives' in first_result and first_result['alternatives']:
                        alternative = first_result['alternatives'][0]
                        
                        # Calculate average word confidence
                        word_confidences = []
                        if 'words' in alternative:
                            for word in alternative['words']:
                                if 'confidence' in word:
                                    word_confidences.append(word['confidence'])
                        
                        avg_confidence = alternative.get('confidence', 0.85)
                        if word_confidences:
                            avg_confidence = sum(word_confidences) / len(word_confidences)
                        
                        return {
                            'success': True,
                            'provider': self.provider_name,
                            'model_id': model_id,
                            'language_code': language_code,
                            'transcription': alternative.get('transcript', ''),
                            'confidence': avg_confidence,
                            'processing_time': processing_time,
                            'error': None
                        }
                
                return {
                    'success': False,
                    'provider': self.provider_name,
                    'model_id': model_id,
                    'language_code': language_code,
                    'error': 'No transcription results returned',
                    'transcription': '',
                    'confidence': 0.0,
                    'processing_time': processing_time
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
                    'transcription': '',
                    'confidence': 0.0,
                    'processing_time': processing_time
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
                'processing_time': 0.0
            }
    
    def test_connection(self) -> Dict[str, Any]:
        """Test connection to Google Cloud Speech service"""
        if not self.api_key:
            return {
                'success': False,
                'message': 'API key not provided'
            }
        
        try:
            # Test with a simple API call - try to get operation info (lightweight)
            headers = {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': self.api_key
            }
            
            # Test with minimal recognition request to validate API key
            test_data = {
                "config": {
                    "encoding": "LINEAR16",
                    "sampleRateHertz": 16000,
                    "languageCode": "en-US"
                },
                "audio": {
                    "content": base64.b64encode(b'\x00' * 1000).decode('utf-8')  # Empty audio for testing
                }
            }
            
            response = requests.post(
                f"{self.base_url}/speech:recognize",
                headers=headers,
                json=test_data,
                timeout=10
            )
            
            # Even if recognition fails, a 200 or valid error response indicates API key works
            if response.status_code == 200 or response.status_code == 400:
                models = self.get_available_models()
                languages = self.get_supported_languages()
                return {
                    'success': True,
                    'message': f"Connected successfully. {len(models)} models available for {len(languages)} languages.",
                    'models_count': len(models),
                    'languages_count': len(languages)
                }
            elif response.status_code == 403:
                return {
                    'success': False,
                    'message': "Invalid API key or insufficient permissions"
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