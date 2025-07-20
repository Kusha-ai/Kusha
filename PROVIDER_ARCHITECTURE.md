# Kusha Provider Architecture

## 🏗️ **Clean Folder Separation**

After restructuring, we have achieved **perfect separation** between core framework and provider implementations:

### **`src/providers/` - CORE FRAMEWORK (Never Changes)**
```
src/providers/
├── __init__.py                      # Python module init
├── base_provider.py                 # Base ASR provider interface
├── universal_provider_factory.py   # 🎯 Core factory (loads all providers)
├── provider_manager.py             # Provider lifecycle management
├── modular_manager.py              # Modular components
├── minimal_factory.py              # Lightweight factory
├── provider_factory.py             # Legacy factory (being phased out)
└── README.md                       # Documentation
```

**Purpose**: Stable core framework that handles:
- ✅ Dynamic provider discovery and loading
- ✅ Configuration management  
- ✅ API key management
- ✅ Provider instance creation
- ✅ Testing and validation framework

**Key Principle**: **ZERO changes needed here when adding new providers**

---

### **`providers/` - IMPLEMENTATIONS ONLY (Add Providers Here)**
```
providers/
├── ASR/                            # Automatic Speech Recognition
│   ├── Google/
│   │   ├── config.json            # Provider metadata, models, languages
│   │   └── google_asr.py          # GoogleASR class implementation
│   ├── OpenAI/
│   │   ├── config.json
│   │   └── openai_asr.py          # OpenAIASR class
│   ├── Sarv/
│   │   ├── config.json
│   │   └── sarv_asr.py            # SarvASR class  
│   └── [ElevenLabs, Fireworks, Groq...]
├── TTS/                            # Text-to-Speech
│   ├── base_tts_provider.py       # Base class for TTS providers
│   ├── OpenAI/
│   │   ├── config.json            # Models: TTS-1, TTS-1-HD
│   │   └── openai_tts.py          # OpenAITTS class
│   ├── Google/
│   │   ├── config.json            # Neural2, WaveNet voices
│   │   └── google_tts.py          # GoogleTTS class
│   └── ElevenLabs/
│       ├── config.json            # Custom voices, cloning
│       └── elevenlabs_tts.py      # ElevenLabsTTS class
├── AI/                             # Chat AI Models
│   ├── OpenAI/
│   │   ├── config.json            # GPT-4o, GPT-4o-mini models
│   │   └── openai_ai.py           # OpenAIAI class
│   ├── Anthropic/
│   │   ├── config.json            # Claude 3.5 Sonnet, Haiku, Opus
│   │   └── anthropic_ai.py        # AnthropicAI class
│   └── Groq/
│       ├── config.json            # LLaMA 3, Mixtral (ultra-fast)
│       └── groq_ai.py             # GroqAI class
└── README.md                       # Instructions for adding providers
```

**Purpose**: All provider-specific implementations organized by AI type.
**Key Principle**: **Adding providers here requires ZERO core changes**

---

## 🎯 **Adding New Providers (Zero Core Changes)**

### Example: Adding Azure OpenAI TTS

```bash
# 1. Create provider folder
mkdir providers/TTS/Azure

# 2. Create config.json
cat > providers/TTS/Azure/config.json << EOF
{
  "provider": {
    "id": "azure-tts",
    "name": "Azure Speech Services",
    "description": "Microsoft Azure Text-to-Speech",
    "base_url": "https://{region}.tts.speech.microsoft.com",
    "requires_api_key": true,
    "api_key_type": "bearer"
  },
  "models": [
    {
      "id": "neural-tts",
      "name": "Neural TTS",
      "description": "High-quality neural voices"
    }
  ]
}
EOF

# 3. Create implementation  
cat > providers/TTS/Azure/azure_tts.py << EOF
class AzureTTS:
    def __init__(self, config: dict, api_key: str = None):
        self.config = config
        self.api_key = api_key
    
    def synthesize_speech(self, text, voice_id, language_code='en-US'):
        # Azure TTS implementation here
        pass
    
    def get_available_voices(self, language_code='en-US'):
        # Return Azure voices
        pass
EOF

# 4. Done! No core changes needed
```

The `universal_provider_factory.py` will **automatically**:
- ✅ Discover the new `Azure` folder
- ✅ Load the `config.json` 
- ✅ Import the `AzureTTS` class
- ✅ Make it available via API endpoints

---

## 🚀 **Benefits of This Architecture**

### **1. Plugin Architecture**
- Drop provider files → Automatically available
- No core code modifications
- Clean separation of concerns

### **2. Consistent Interface** 
- All providers follow same patterns:
  - **Config**: `providers/{TYPE}/{PROVIDER}/config.json`
  - **Code**: `providers/{TYPE}/{PROVIDER}/{provider}_{type}.py`  
  - **Class**: `{Provider}{TYPE}` (e.g., `GoogleTTS`, `OpenAIASR`)

### **3. Dynamic Loading**
- Factory scans `providers/` folder at runtime
- Loads configurations and classes on-demand
- Caches for performance

### **4. Zero Breaking Changes**
- Core framework stable
- Provider additions don't affect existing functionality
- Easy to maintain and debug

---

## 🔧 **Technical Implementation**

The `universal_provider_factory.py` uses:

```python
# Dynamic provider discovery
def get_ai_types(self) -> List[str]:
    """Scans providers/ folder for AI types"""
    
def get_providers_by_type(self, ai_type: str) -> List[str]:  
    """Scans providers/{TYPE}/ for providers"""

# Dynamic class loading
def load_provider_class(self, ai_type: str, provider_name: str):
    """Loads {provider}_{type}.py and returns {Provider}{Type} class"""
    
def create_provider_instance(self, ai_type: str, provider_name: str, api_key: str):
    """Creates provider instance with config and API key"""
```

This ensures the **"no core changes" rule** is enforced at the architectural level!

---

## ✅ **What We Eliminated**

### ❌ **Before (Problematic)**
- `src/providers/` - Mixed core + implementations
- `src/providers/extensions/` - Duplicate configs
- Provider-specific code scattered in core folder
- Adding providers required core changes

### ✅ **After (Clean)**  
- `src/providers/` - Pure core framework only
- `providers/` - All implementations organized by type
- No duplicate configs
- **Zero core changes** to add providers

This architecture ensures **maintainability**, **scalability**, and **clean separation of concerns**!