# Provider Implementations

This folder contains **ALL** provider implementations organized by AI type.

## 📁 Structure:
```
providers/
├── ASR/                    # Automatic Speech Recognition
│   ├── Google/
│   │   ├── config.json     # Provider configuration
│   │   └── google_asr.py   # Implementation (class GoogleASR)
│   ├── OpenAI/
│   │   ├── config.json
│   │   └── openai_asr.py   # Implementation (class OpenAIASR)
│   └── ...
├── TTS/                    # Text-to-Speech  
│   ├── base_tts_provider.py # Base class for TTS providers
│   ├── OpenAI/
│   │   ├── config.json     # Provider configuration
│   │   └── openai_tts.py   # Implementation (class OpenAITTS)
│   └── ...
├── AI/                     # AI Chat Models
│   ├── Anthropic/
│   │   ├── config.json     # Provider configuration
│   │   └── anthropic_ai.py # Implementation (class AnthropicAI)
│   └── ...
└── Embedding/              # Embedding Models
    └── ...
```

## 🎯 Adding New Provider:
1. **Create folder**: `{TYPE}/{PROVIDER_NAME}/`
2. **Add config**: `config.json` with provider metadata and models
3. **Add implementation**: `{provider_name}_{type}.py` with class `{ProviderName}{TYPE}`
4. **That's it!** No core code changes needed.

## 🔧 Class Naming Convention:
- **ASR**: `{ProviderName}ASR` (e.g., `GoogleASR`, `OpenAIASR`)
- **TTS**: `{ProviderName}TTS` (e.g., `GoogleTTS`, `OpenAITTS`) 
- **AI**: `{ProviderName}AI` (e.g., `AnthropicAI`, `GroqAI`)
- **Embedding**: `{ProviderName}Embedding`

## 🏗️ Implementation Requirements:
Each provider class should:
- Accept `(config: dict, api_key: str = None)` in `__init__`
- Implement required methods for the AI type
- Have a `test_connection()` method
- Follow the base class interface