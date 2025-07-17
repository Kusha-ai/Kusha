from typing import Dict, Optional
from .sarv_asr import SarvASRProvider
from .base_provider import BaseASRProvider

class MinimalProviderFactory:
    """Minimal provider factory that only includes Sarv ASR (no external dependencies)"""
    
    _providers = {
        'sarv': SarvASRProvider
    }
    
    @classmethod
    def create_provider(cls, provider_name: str, api_key: str) -> Optional[BaseASRProvider]:
        provider_class = cls._providers.get(provider_name.lower())
        if provider_class:
            if provider_name.lower() == 'sarv':
                return provider_class(api_key or "http://103.255.103.118:5001")
            else:
                return provider_class(api_key)
        return None
    
    @classmethod
    def get_available_providers(cls) -> Dict[str, str]:
        return {
            'sarv': 'Sarv ASR (Indian Languages)'
        }
    
    @classmethod
    def get_provider_names(cls) -> list:
        return list(cls._providers.keys())