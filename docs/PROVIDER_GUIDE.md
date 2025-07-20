# Provider Development Guide

## Adding New Providers

To add a new ASR provider:

### 1. Create Provider Structure
```bash
mkdir providers/ASR/NewProvider
```

### 2. Create Configuration File
```json
# providers/ASR/NewProvider/config.json
{
  "provider": {
    "id": "newprovider",
    "name": "New ASR Provider", 
    "description": "Description of the provider",
    "requires_api_key": true,
    "api_key_type": "string",
    "base_url": "https://api.newprovider.com",
    "icon_url": "https://newprovider.com/icon.png",
    "logo_url": "https://newprovider.com/logo.png",
    "provider_type": "ASR"
  },
  "models": [
    {
      "id": "model1",
      "name": "Standard Model",
      "description": "Standard speech recognition",
      "supported_languages": ["en-US", "hi-IN"],
      "features": ["Real-time", "High accuracy"]
    }
  ]
}
```

### 3. Create Implementation File
```python
# providers/ASR/NewProvider/newprovider_asr.py
import time
import requests
from typing import Dict, List

class NewProviderASR:
    def __init__(self, config: dict, api_key: str = None):
        self.config = config
        self.api_key = api_key
        self.provider_name = config['provider']['name']
        self.base_url = config['provider']['base_url']
    
    def transcribe_audio(self, audio_file_path: str, model_id: str, language_code: str) -> Dict:
        """Main transcription method with timing instrumentation"""
        try:
            # Phase 1: Request preparation
            prep_start = time.time()
            # ... preparation code
            prep_time = time.time() - prep_start
            
            # Phase 2: Network request  
            network_start = time.time()
            # ... API call implementation
            network_time = time.time() - network_start
            
            # Phase 3: Response processing
            response_start = time.time()
            # ... response processing
            response_time = time.time() - response_start
            
            return {
                'success': True,
                'provider': self.provider_name,
                'model_id': model_id,
                'language_code': language_code,
                'transcription': 'result text',
                'confidence': 0.95,
                'processing_time': network_time * 1000,  # milliseconds
                'timing_phases': {
                    'preparation_time': prep_time * 1000,
                    'network_time': network_time * 1000, 
                    'response_processing_time': response_time * 1000,
                    'model_processing_time': network_time * 1000
                },
                'error': None
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
                'processing_time': 0,
                'timing_phases': {
                    'preparation_time': 0,
                    'network_time': 0,
                    'response_processing_time': 0,
                    'model_processing_time': 0
                }
            }
    
    def get_available_models(self) -> List[Dict]:
        """Return available models"""
        return self.config.get('models', [])
    
    def test_connection(self) -> Dict:
        """Test provider connection"""
        try:
            # Implement connection test logic
            return {'success': True, 'message': 'Connection successful'}
        except Exception as e:
            return {'success': False, 'message': str(e)}
```

### 4. Restart Application
The provider will be automatically discovered!

## Provider Details

### Sarv ASR
- **Type**: Local service
- **Languages**: 22 Indian languages
- **Models**: Gender-specific models (male/female)
- **API Key**: Not required
- **Endpoint**: http://103.255.103.118:5001

### Google Cloud Speech-to-Text
- **Type**: Cloud service
- **Languages**: 125+ languages
- **Models**: Latest Long, Latest Short, Command & Search, Phone Call, Video
- **API Key**: Service Account JSON file
- **Features**: High accuracy, automatic punctuation

### ElevenLabs
- **Type**: Cloud service
- **Languages**: 14+ major languages  
- **Models**: Whisper Large V3, Medium, Small
- **API Key**: API key string
- **Features**: High quality, multilingual

### Fireworks AI
- **Type**: Cloud service
- **Languages**: 14+ languages
- **Models**: Whisper V3, V2, Large, Medium
- **API Key**: API key string
- **Features**: Fast inference, cost-effective

### OpenAI
- **Type**: Cloud service
- **Languages**: 50+ languages
- **Models**: Whisper-1
- **API Key**: API key string
- **Features**: High accuracy, multilingual

### Groq
- **Type**: Cloud service
- **Languages**: 50+ languages
- **Models**: Whisper Large v3, Distil Whisper
- **API Key**: API key string
- **Features**: Ultra-fast inference