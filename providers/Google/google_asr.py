import os
import time
import json
import tempfile
from typing import Dict, List, Optional, Any
from pathlib import Path

try:
    from google.cloud import speech
    from google.oauth2 import service_account
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False

class GoogleASR:
    """Google Cloud Speech-to-Text ASR provider"""
    
    def __init__(self, config: Dict, api_key_content: str = None):
        self.config = config
        self.provider_id = config['provider']['id']
        self.provider_name = config['provider']['name']
        self.client = None
        
        if GOOGLE_AVAILABLE and api_key_content:
            self._initialize_client(api_key_content)
    
    def _initialize_client(self, api_key_content: str):
        """Initialize Google Cloud Speech client"""
        try:
            # Parse JSON credentials
            credentials_dict = json.loads(api_key_content)
            credentials = service_account.Credentials.from_service_account_info(credentials_dict)
            self.client = speech.SpeechClient(credentials=credentials)
        except Exception as e:
            print(f"Failed to initialize Google Speech client: {e}")
            self.client = None
    
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
        """Check if Google Cloud Speech service is available"""
        return GOOGLE_AVAILABLE and self.client is not None
    
    def transcribe_audio(self, audio_file_path: str, model_id: str, language_code: str) -> Dict[str, Any]:
        """
        Transcribe audio using Google Cloud Speech-to-Text
        
        Args:
            audio_file_path: Path to audio file
            model_id: Model ID to use
            language_code: Language code (e.g., 'hi-IN')
            
        Returns:
            Dictionary with transcription results
        """
        start_time = time.time()
        
        if not self.is_service_available():
            return {
                'success': False,
                'provider': self.provider_name,
                'model_id': model_id,
                'language_code': language_code,
                'error': 'Google Cloud Speech client not available or not initialized',
                'processing_time': 0
            }
        
        try:
            # Read audio file
            with open(audio_file_path, 'rb') as audio_file:
                content = audio_file.read()
            
            # Determine audio encoding
            audio_encoding = speech.RecognitionConfig.AudioEncoding.WEBM_OPUS
            if audio_file_path.lower().endswith('.wav'):
                audio_encoding = speech.RecognitionConfig.AudioEncoding.LINEAR16
            elif audio_file_path.lower().endswith('.mp3'):
                audio_encoding = speech.RecognitionConfig.AudioEncoding.MP3
            elif audio_file_path.lower().endswith('.flac'):
                audio_encoding = speech.RecognitionConfig.AudioEncoding.FLAC
            
            # Configure recognition
            audio = speech.RecognitionAudio(content=content)
            config = speech.RecognitionConfig(
                encoding=audio_encoding,
                sample_rate_hertz=16000,  # Default sample rate
                language_code=language_code,
                model=model_id,
                enable_automatic_punctuation=True,
                enable_word_confidence=True
            )
            
            # Perform recognition
            response = self.client.recognize(config=config, audio=audio)
            processing_time = time.time() - start_time
            
            # Process results
            if response.results:
                # Get the best alternative
                result = response.results[0]
                alternative = result.alternatives[0] if result.alternatives else None
                
                if alternative:
                    # Calculate average word confidence
                    word_confidences = [word.confidence for word in alternative.words if hasattr(word, 'confidence')]
                    avg_confidence = sum(word_confidences) / len(word_confidences) if word_confidences else alternative.confidence
                    
                    return {
                        'success': True,
                        'provider': self.provider_name,
                        'model_id': model_id,
                        'language_code': language_code,
                        'transcription': alternative.transcript,
                        'confidence': avg_confidence,
                        'processing_time': processing_time,
                        'raw_response': {
                            'alternatives_count': len(result.alternatives),
                            'words_count': len(alternative.words) if hasattr(alternative, 'words') else 0
                        }
                    }
            
            return {
                'success': False,
                'provider': self.provider_name,
                'model_id': model_id,
                'language_code': language_code,
                'error': 'No transcription results returned',
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
        """Test connection to Google Cloud Speech service"""
        if not GOOGLE_AVAILABLE:
            return {
                'success': False,
                'message': 'Google Cloud Speech library not installed'
            }
        
        if not self.client:
            return {
                'success': False,
                'message': 'Google Cloud Speech client not initialized. Check API key.'
            }
        
        try:
            # Try to list supported languages (lightweight operation)
            models = self.get_available_models()
            languages = self.get_supported_languages()
            
            return {
                'success': True,
                'message': f"Connected successfully. {len(models)} models available for {len(languages)} languages.",
                'models_count': len(models),
                'languages_count': len(languages)
            }
        except Exception as e:
            return {
                'success': False,
                'message': f"Connection test failed: {str(e)}"
            }
    
    def get_service_info(self) -> Dict[str, Any]:
        """Get service information"""
        return {
            'provider': self.provider_name,
            'provider_id': self.provider_id,
            'supported_languages': len(self.get_supported_languages()),
            'available_models': len(self.config['models']),
            'requires_api_key': self.config['provider']['requires_api_key'],
            'library_available': GOOGLE_AVAILABLE,
            'client_initialized': self.client is not None
        }