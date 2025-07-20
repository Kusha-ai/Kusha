# Core Coding Principles

## For AI/Human Developers - Essential Guidelines

This document outlines the core coding principles and patterns used throughout the Kusha project. Following these principles ensures consistency, maintainability, and seamless integration of new features.

---

## 1. Plugin Architecture Pattern
- **Zero Core Changes Rule**: New providers can be added without modifying core framework code
- **Dynamic Discovery**: Providers are automatically discovered by scanning directory structure
- **Standardized Structure**: All providers follow consistent folder/file organization

```
providers/{AI_TYPE}/{PROVIDER_NAME}/
├── config.json              # Provider metadata and configuration  
└── {provider}_{type}.py      # Implementation class
```

---

## 2. Provider Implementation Standards

**Class Naming Convention:**
```python
class {ProviderName}{Type}:  # Example: GoogleASR, OpenAITTS, GroqAI
    def __init__(self, config: Dict, api_key: str = None):
        # Standard constructor signature
```

**Required Methods:**
```python
def transcribe_audio(self, audio_file_path: str, model_id: str, language_code: str) -> Dict:
    # Core functionality implementation
    
def get_available_models(self) -> List[Dict]:
    # Model enumeration
    
def test_connection(self) -> Dict:
    # Health check implementation
```

---

## 3. Error Handling Standards

**Consistent Error Response Format:**
```python
{
    'success': False,
    'provider': self.provider_name,
    'model_id': model_id,
    'language_code': language_code,
    'error': 'Detailed error message',
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
```

**Error Handling Rules:**
- ✅ Wrap all external API calls in try-catch blocks
- ✅ Return standardized error responses, never raise exceptions
- ✅ Provide clear, user-facing error messages
- ✅ Implement graceful degradation for service unavailability

---

## 4. Performance & Timing Instrumentation

**Mandatory Timing Measurement:**
```python
import time

def transcribe_audio(self, audio_file_path: str, model_id: str, language_code: str) -> Dict:
    # Phase 1: Request preparation
    prep_start = time.time()
    # ... preparation code
    prep_time = time.time() - prep_start
    
    # Phase 2: Network request
    network_start = time.time()
    # ... API call
    network_time = time.time() - network_start
    
    # Phase 3: Response processing
    response_start = time.time()
    # ... response processing
    response_time = time.time() - response_start
    
    return {
        'success': True,
        'processing_time': network_time * 1000,  # Convert to milliseconds
        'timing_phases': {
            'preparation_time': prep_time * 1000,
            'network_time': network_time * 1000,
            'response_processing_time': response_time * 1000,
            'model_processing_time': network_time * 1000
        }
    }
```

**Performance Rules:**
- ✅ Always measure and return timing data in milliseconds
- ✅ Include detailed timing phases breakdown
- ✅ Use `processing_time` for backward compatibility (should equal network_time)

---

## 5. Configuration Management

**Provider Config Structure:**
```json
{
  "provider": {
    "id": "unique-provider-id",
    "name": "Display Name",
    "description": "Provider description",
    "requires_api_key": true,
    "api_key_type": "string",
    "base_url": "https://api.provider.com",
    "icon_url": "https://provider.com/icon.png",
    "logo_url": "https://provider.com/logo.png",
    "provider_type": "ASR"
  },
  "models": [
    {
      "id": "model-id",
      "name": "Model Display Name",
      "description": "Model description",
      "supported_languages": ["hi-IN", "en-US"],
      "features": ["Real-time", "High accuracy"]
    }
  ]
}
```

**Configuration Rules:**
- ✅ Use centralized language pack (`src/config/language_pack.json`)
- ✅ Include provider icons for visual identification
- ✅ Define clear model capabilities and supported languages
- ✅ Use environment variables for deployment-specific settings

---

## 6. Import and Dependency Management

**Import Order Standards:**
```python
# 1. Standard library imports
import os
import sys
import time
import json

# 2. Third-party imports  
import requests
from typing import Dict, List, Optional

# 3. Local imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'core'))
from base_provider import BaseProvider
```

**Dependency Rules:**
- ✅ Minimize external dependencies per provider
- ✅ Handle optional dependencies gracefully  
- ✅ Use relative imports for provider-specific modules

---

## 7. API Response Standards

**Success Response Format:**
```python
{
    'success': True,
    'provider': str,           # Provider name for identification
    'model_id': str,           # Model identifier
    'language_code': str,      # Language code used
    'transcription': str,      # Main result
    'confidence': float,       # Confidence score (0.0-1.0)
    'processing_time': float,  # Total time in milliseconds
    'timing_phases': {         # Detailed timing breakdown
        'preparation_time': float,
        'network_time': float,
        'response_processing_time': float,
        'model_processing_time': float
    },
    'error': None
}
```

---

## 8. Frontend Component Standards

**TypeScript Interface Definitions:**
```typescript
interface Language {
  code: string
  name: string
  flag: string
  region: string
}

interface ModelResult {
  success: boolean
  provider: string
  transcription: string
  confidence: number
  processing_time: number
}
```

**Component Organization:**
- ✅ Use Material-UI components consistently
- ✅ Implement responsive design patterns
- ✅ Follow React hooks patterns (useState, useEffect)
- ✅ Type all props and state with TypeScript interfaces

---

## 9. Database and API Patterns

**FastAPI Endpoint Structure:**
```python
@app.get("/api/resource")
async def get_resource():
    # Public endpoints
    
@app.post("/api/admin/resource", dependencies=[Depends(get_current_admin)])
async def admin_operation():
    # Admin-protected endpoints
```

**Database Patterns:**
- ✅ Use parameterized queries for SQL injection prevention
- ✅ Implement connection pooling and proper resource cleanup
- ✅ Cache frequently accessed data (provider configs, API keys)

---

## 10. Language and Internationalization

**Language Code Standards:**
- ✅ Use ISO format: `hi-IN`, `en-US`, `ta-IN`
- ✅ Reference centralized language pack for display names and flags
- ✅ Support regional variants (India-specific language codes prioritized)
- ✅ Implement fallback mechanisms for unsupported language codes

**Language Pack Integration:**
```python
# Always use centralized language pack
language_pack_file = Path(__file__).parent.parent.parent / 'src' / 'config' / 'language_pack.json'
```

---

## Quick Development Checklist

When adding new providers or features:

- [ ] **Provider Structure**: Follow plugin architecture pattern
- [ ] **Timing**: Implement comprehensive timing measurement
- [ ] **Error Handling**: Return standardized error responses
- [ ] **Configuration**: Create proper config.json with all required fields
- [ ] **Testing**: Implement test_connection() method
- [ ] **Documentation**: Add clear docstrings and comments
- [ ] **Type Safety**: Use proper type hints and interfaces
- [ ] **Language Support**: Use centralized language pack
- [ ] **Performance**: Implement caching and optimization patterns
- [ ] **Security**: Follow authentication and input validation standards

---

## Code Quality Standards

- **Naming**: PascalCase for classes, snake_case for methods/variables
- **Documentation**: Comprehensive docstrings for all public methods
- **Error Messages**: Clear, user-facing error descriptions
- **Performance**: Sub-second response times for most operations
- **Reliability**: Graceful handling of network failures and API errors
- **Maintainability**: Consistent patterns enable easy debugging and extension

---

*Following these principles ensures your code integrates seamlessly with the Kusha platform and maintains the high quality standards expected by users and future developers.*