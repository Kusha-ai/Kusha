from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Union
import time
import io

class BaseTTSProvider(ABC):
    def __init__(self, config: dict, api_key: str = None):
        self.config = config
        self.api_key = api_key
        self.provider_name = config['provider']['name']
    
    @abstractmethod
    def get_available_models(self) -> List[Dict]:
        """Get list of available TTS models"""
        pass
    
    @abstractmethod
    def get_available_voices(self, language_code: str = 'en-US') -> List[Dict]:
        """Get available voices for a specific language"""
        pass
    
    @abstractmethod
    def synthesize_speech(self, text: str, voice_id: str, language_code: str = 'en-US', 
                         audio_format: str = 'mp3', speed: float = 1.0) -> Dict:
        """
        Synthesize speech from text
        
        Args:
            text: Text to convert to speech
            voice_id: Voice/model identifier
            language_code: Language code (e.g., 'en-US')
            audio_format: Output format ('mp3', 'wav', 'ogg')
            speed: Speech speed multiplier (0.5 - 2.0)
            
        Returns:
            Dict containing success status, audio data, and metadata
        """
        pass
    
    def test_speed(self, text: str, voice_id: str, language_code: str = 'en-US', 
                   audio_format: str = 'mp3', speed: float = 1.0) -> Dict:
        """Test synthesis speed and performance"""
        total_start_time = time.time()
        result = self.synthesize_speech(text, voice_id, language_code, audio_format, speed)
        total_end_time = time.time()
        
        total_processing_time = total_end_time - total_start_time
        api_processing_time = result.get('processing_time', 0.0)
        overhead_time = total_processing_time - api_processing_time
        
        return {
            'provider': self.provider_name,
            'voice_id': voice_id,
            'language_code': language_code,
            'text_length': len(text),
            'audio_format': audio_format,
            'speed': speed,
            'processing_time': api_processing_time,
            'api_call_time': api_processing_time,
            'total_processing_time': total_processing_time,
            'overhead_time': overhead_time,
            'audio_duration': result.get('audio_duration', 0.0),
            'audio_size_bytes': result.get('audio_size_bytes', 0),
            'success': result.get('success', False),
            'error': result.get('error', None)
        }
    
    def get_supported_languages(self) -> Dict[str, str]:
        """Get supported languages from config"""
        return self.config.get('languages', {})
    
    def validate_parameters(self, text: str, voice_id: str, language_code: str, 
                          audio_format: str, speed: float) -> Dict:
        """Validate TTS parameters"""
        errors = []
        
        if not text or not text.strip():
            errors.append("Text cannot be empty")
        
        if len(text) > 5000:  # Most TTS services have character limits
            errors.append("Text exceeds maximum length of 5000 characters")
        
        if not voice_id:
            errors.append("Voice ID is required")
        
        if audio_format not in ['mp3', 'wav', 'ogg']:
            errors.append("Audio format must be mp3, wav, or ogg")
        
        if not (0.25 <= speed <= 4.0):
            errors.append("Speed must be between 0.25 and 4.0")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }