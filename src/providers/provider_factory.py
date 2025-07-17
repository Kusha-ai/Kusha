from typing import Dict, Optional
from .google_asr import GoogleASRProvider
from .elevenlabs_asr import ElevenLabsASRProvider
from .fireworks_asr import FireworksASRProvider
from .sarv_asr import SarvASRProvider
from .base_provider import BaseASRProvider

class ProviderFactory:
    _providers = {
        'google': GoogleASRProvider,
        'elevenlabs': ElevenLabsASRProvider,
        'fireworks': FireworksASRProvider,
        'sarv': SarvASRProvider
    }
    
    @classmethod
    def create_provider(cls, provider_name: str, api_key: str) -> Optional[BaseASRProvider]:
        provider_class = cls._providers.get(provider_name.lower())
        if provider_class:
            if provider_name.lower() == 'sarv':
                # For Sarv, api_key is actually the base URL
                return provider_class(api_key or "http://103.255.103.118:5001")
            else:
                return provider_class(api_key)
        return None
    
    @classmethod
    def get_available_providers(cls) -> Dict[str, str]:
        return {
            'google': 'Google Cloud Speech-to-Text',
            'elevenlabs': 'ElevenLabs ASR',
            'fireworks': 'Fireworks AI Whisper',
            'sarv': 'Sarv ASR (Indian Languages)'
        }
    
    @classmethod
    def get_provider_names(cls) -> list:
        return list(cls._providers.keys())