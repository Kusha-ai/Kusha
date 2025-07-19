# Kusha - AI Platform

Kusha is a comprehensive AI platform with two main components: **App** and **Elastic**. The Elastic component provides AI testing capabilities that allow you to compare multiple AI providers simultaneously across ASR, TTS, AI Models, and Embeddings. Built with a modular architecture for easy provider addition and a modern React frontend.

## 🚀 Features

- **Multiple AI Types**: Support for ASR, TTS, AI Models, and Embeddings
- **Multiple Providers**: Google Cloud, ElevenLabs, Fireworks AI, Sarv ASR, Groq, and more
- **22+ Indian Languages**: Comprehensive support for Indian regional languages
- **Simultaneous Testing**: Test multiple providers/models in parallel for speed comparison
- **Modern UI**: Material-UI based React frontend with tabbed interface and intuitive workflow
- **Kusha Elastic**: Elastic component for scalable AI provider management
- **Language-First Workflow**: Select language first, then see compatible models
- **Real-time Audio Recording**: Browser-based audio recording with WebRTC
- **File Upload Support**: Support for WAV, MP3, WEBM, FLAC audio formats
- **Docker Ready**: Containerized deployment with Docker Compose

## 🏗️ Architecture

### Kusha Elastic - Provider Structure
```
providers/
├── ASR/
│   ├── Sarv/
│   │   ├── config.json       # Provider configuration & supported languages
│   │   └── sarv_asr.py       # ASR implementation
│   ├── Google/
│   ├── ElevenLabs/
│   └── OpenAI/
├── TTS/
│   ├── Google/
│   ├── OpenAI/
│   └── ElevenLabs/
├── AI/
│   ├── Groq/
│   ├── OpenAI/
│   └── Anthropic/
└── Embedding/
    ├── OpenAI/
    └── Cohere/
```

### Backend
- **FastAPI**: High-performance Python web framework
- **SQLite**: Configuration and results storage
- **Provider Manager**: Dynamic provider discovery and loading
- **Concurrent Testing**: ThreadPoolExecutor for simultaneous API calls

### Frontend
- **React + TypeScript**: Modern frontend framework
- **Material-UI**: Google's Material Design components
- **Vite**: Fast build tool and development server
- **WebRTC**: Browser audio recording capabilities

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- API keys for desired providers (Google Cloud, ElevenLabs, Fireworks)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd asr-speedtest
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Main interface: http://localhost:5005
   - API documentation: http://localhost:5005/docs
   - Admin panel: http://localhost:5005/admin (admin/admin123)

## 🔧 Configuration

### Environment Variables
Set these in `docker-compose.yml` or `.env` file:

```bash
SERVER_HOST=0.0.0.0
SERVER_PORT=5005
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SARV_ASR_URL=http://103.255.103.118:5001
DATABASE_URL=sqlite:///asr_config.db
```

### API Keys Configuration
Configure API keys through the admin panel or API endpoints:

- **Google Cloud**: Upload service account JSON file
- **ElevenLabs**: API key string
- **Fireworks AI**: API key string
- **Sarv ASR**: No API key required (local service)

## 📝 Usage Workflow

1. **Select Language**: Choose from 22+ Indian languages or international languages
2. **Select Models**: Choose multiple providers and their models for the selected language
3. **Audio Input**: Record audio in browser or upload audio file
4. **Run Test**: Click "Run Speed Test" to test all selected models simultaneously
5. **View Results**: Compare transcriptions, processing times, and confidence scores

## 🔌 Adding New Providers

To add a new ASR provider:

1. **Create provider folder**
   ```bash
   mkdir providers/NewProvider
   ```

2. **Create configuration file**
   ```json
   # providers/NewProvider/config.json
   {
     "provider": {
       "id": "newprovider",
       "name": "New ASR Provider",
       "description": "Description of the provider",
       "requires_api_key": true,
       "api_key_type": "string"
     },
     "models": [
       {
         "id": "model1",
         "name": "Standard Model",
         "description": "Standard speech recognition",
         "supported_languages": ["en-US", "hi-IN"],
         "features": ["Real-time", "High accuracy"]
       }
     ],
     "languages": {
       "en-US": {
         "name": "English (United States)",
         "flag": "🇺🇸",
         "region": "North America"
       }
     }
   }
   ```

3. **Create implementation file**
   ```python
   # providers/NewProvider/newprovider_asr.py
   class NewProviderASR:
       def __init__(self, config, api_key=None):
           # Initialize provider
           pass
       
       def transcribe_audio(self, audio_file_path, model_id, language_code):
           # Implement transcription logic
           return {
               'success': True,
               'transcription': 'result text',
               'confidence': 0.95,
               'processing_time': 1.5
           }
   ```

4. **Restart application** - The provider will be automatically discovered!

## 🌍 Supported Languages

### Indian Languages (22+)
- Hindi (hi-IN) 🇮🇳
- English (India) (en-IN) 🇮🇳
- Bengali (bn-IN) 🇮🇳
- Telugu (te-IN) 🇮🇳
- Marathi (mr-IN) 🇮🇳
- Tamil (ta-IN) 🇮🇳
- Gujarati (gu-IN) 🇮🇳
- Kannada (kn-IN) 🇮🇳
- Malayalam (ml-IN) 🇮🇳
- Punjabi (pa-IN) 🇮🇳
- Odia (or-IN) 🇮🇳
- Assamese (as-IN) 🇮🇳
- And more...

### International Languages
- English (US, UK) 🇺🇸 🇬🇧
- Spanish (Spain, Mexico) 🇪🇸 🇲🇽
- French 🇫🇷
- German 🇩🇪
- Chinese (Simplified, Traditional) 🇨🇳 🇹🇼
- Japanese 🇯🇵
- Korean 🇰🇷
- And more...

## 📊 API Endpoints

### Core Endpoints
- `GET /api/languages` - Get all supported languages
- `GET /api/models/language/{language_code}` - Get models for specific language
- `POST /api/test-multiple-models` - Test multiple models simultaneously
- `GET /api/providers` - Get all available providers

### Admin Endpoints
- `POST /api/save-api-key` - Save API keys for providers
- `POST /api/test-connection/{provider}` - Test provider connectivity
- `GET /api/test-results` - Get historical test results

## 🛠️ Development

### Local Development
1. **Backend Development**
   ```bash
   cd src
   pip install -r ../requirements.txt
   python -m web.app
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Building for Production
```bash
docker-compose up --build
```

## 📋 Provider Details

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

## 🔒 Security

- API keys stored securely in database
- Admin authentication required for configuration
- Input validation and sanitization
- Docker container isolation
- Non-root user execution

## 📈 Performance

- **Simultaneous Testing**: Multiple providers tested in parallel
- **Efficient Threading**: ThreadPoolExecutor for concurrent API calls
- **Caching**: Provider configurations cached in memory
- **Optimized Frontend**: Code splitting and lazy loading

## 🐳 Docker Configuration

### Multi-stage Build
- **Stage 1**: Node.js for building React frontend
- **Stage 2**: Python for backend with built frontend

### Volumes
- `./data:/app/data` - Database and persistent data
- `./logs:/app/logs` - Application logs

### Health Checks
- Endpoint: `/api/providers`
- Interval: 30 seconds
- Timeout: 10 seconds

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your provider in the `providers/` folder
4. Test your implementation
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the logs: `docker-compose logs`
2. Verify API keys are configured correctly
3. Ensure provider services are accessible
4. Check the GitHub issues for known problems

## 🙏 Acknowledgments

- Google Cloud Speech-to-Text for enterprise-grade ASR
- ElevenLabs for high-quality voice AI
- Fireworks AI for fast model inference
- Sarv ASR for comprehensive Indian language support
- Material-UI team for excellent React components
- FastAPI team for the high-performance web framework