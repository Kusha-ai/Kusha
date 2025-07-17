import os
import io
from google.cloud import speech
from google.oauth2 import service_account
from typing import List, Dict, Optional
import json
import tempfile
from .base_provider import BaseASRProvider

class GoogleASRProvider(BaseASRProvider):
    def __init__(self, api_key_json: str):
        super().__init__(api_key_json)
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        try:
            if isinstance(self.api_key, str):
                if os.path.isfile(self.api_key):
                    credentials = service_account.Credentials.from_service_account_file(self.api_key)
                else:
                    credentials_info = json.loads(self.api_key)
                    credentials = service_account.Credentials.from_service_account_info(credentials_info)
                
                self.client = speech.SpeechClient(credentials=credentials)
            else:
                raise ValueError("Invalid API key format")
        except Exception as e:
            print(f"Error initializing Google Speech client: {e}")
            self.client = None
    
    def get_available_models(self) -> List[Dict]:
        return [
            {
                'id': 'latest_long',
                'name': 'Latest Long (Latest long-form model)',
                'language_code': 'en-US'
            },
            {
                'id': 'latest_short',
                'name': 'Latest Short (Latest short-form model)',
                'language_code': 'en-US'
            },
            {
                'id': 'command_and_search',
                'name': 'Command and Search',
                'language_code': 'en-US'
            },
            {
                'id': 'phone_call',
                'name': 'Phone Call',
                'language_code': 'en-US'
            },
            {
                'id': 'video',
                'name': 'Video',
                'language_code': 'en-US'
            },
            {
                'id': 'default',
                'name': 'Default',
                'language_code': 'en-US'
            }
        ]
    
    def transcribe_audio(self, audio_file_path: str, model_id: str, language_code: str = 'en-US') -> Dict:
        if not self.client:
            return {
                'success': False,
                'error': 'Google Speech client not initialized',
                'transcription': '',
                'confidence': 0.0
            }
        
        try:
            with io.open(audio_file_path, 'rb') as audio_file:
                content = audio_file.read()
            
            audio = speech.RecognitionAudio(content=content)
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,
                language_code=language_code,
                model=model_id,
                enable_automatic_punctuation=True,
                enable_word_confidence=True,
                enable_word_time_offsets=True
            )
            
            response = self.client.recognize(config=config, audio=audio)
            
            if response.results:
                result = response.results[0]
                alternative = result.alternatives[0]
                
                return {
                    'success': True,
                    'transcription': alternative.transcript,
                    'confidence': alternative.confidence,
                    'error': None
                }
            else:
                return {
                    'success': False,
                    'transcription': '',
                    'confidence': 0.0,
                    'error': 'No transcription results'
                }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'transcription': '',
                'confidence': 0.0
            }
    
    def transcribe_streaming(self, audio_generator, model_id: str, language_code: str = 'en-US'):
        if not self.client:
            return None
        
        try:
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,
                language_code=language_code,
                model=model_id
            )
            
            streaming_config = speech.StreamingRecognitionConfig(
                config=config,
                interim_results=True
            )
            
            requests = (speech.StreamingRecognizeRequest(audio_content=chunk) 
                       for chunk in audio_generator)
            
            responses = self.client.streaming_recognize(streaming_config, requests)
            
            for response in responses:
                for result in response.results:
                    yield {
                        'transcript': result.alternatives[0].transcript,
                        'confidence': result.alternatives[0].confidence,
                        'is_final': result.is_final
                    }
        
        except Exception as e:
            print(f"Streaming transcription error: {e}")
            return None