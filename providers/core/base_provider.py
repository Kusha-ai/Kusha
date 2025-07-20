from abc import ABC, abstractmethod
from typing import List, Dict, Optional
import time

class BaseASRProvider(ABC):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.provider_name = self.__class__.__name__.replace('Provider', '').lower()
    
    @abstractmethod
    def get_available_models(self) -> List[Dict]:
        pass
    
    @abstractmethod
    def transcribe_audio(self, audio_file_path: str, model_id: str, language_code: str = 'en-US') -> Dict:
        pass
    
    def test_speed(self, audio_file_path: str, model_id: str, language_code: str = 'en-US') -> Dict:
        total_start_time = time.time()
        result = self.transcribe_audio(audio_file_path, model_id, language_code)
        total_end_time = time.time()
        
        total_processing_time = total_end_time - total_start_time
        api_processing_time = result.get('processing_time', 0.0)  # API call time from transcribe_audio
        overhead_time = total_processing_time - api_processing_time
        
        return {
            'provider': self.provider_name,
            'model_id': model_id,
            'language_code': language_code,
            'processing_time': api_processing_time,  # Keep this for backward compatibility
            'api_call_time': api_processing_time,    # Explicit API call time
            'total_processing_time': total_processing_time,  # Total time including overhead
            'overhead_time': overhead_time,          # File I/O and other overhead
            'transcription': result.get('transcription', ''),
            'confidence': result.get('confidence', 0.0),
            'success': result.get('success', False),
            'error': result.get('error', None)
        }