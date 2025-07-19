# Kusha - AI Platform

Kusha is a comprehensive AI platform with two main components: **App** and **Elastic**. The Elastic component provides AI testing capabilities that allow you to compare multiple AI providers simultaneously across ASR, TTS, AI Models, and Embeddings. Built with a modular architecture for easy provider addition and a modern React frontend.

## 🚀 Features

### Core Capabilities
- **Multiple AI Types**: Support for ASR, TTS, AI Models, and Embeddings
- **Multiple Providers**: Google Cloud, ElevenLabs, Fireworks AI, Sarv ASR, Groq, OpenAI, and more
- **22+ Indian Languages**: Comprehensive support for Indian regional languages
- **Simultaneous Testing**: Test multiple providers/models in parallel for speed comparison
- **Language-First Workflow**: Select language first, then see compatible models
- **Real-time Audio Recording**: Browser-based audio recording with WebRTC
- **File Upload Support**: Support for WAV, MP3, WEBM, FLAC audio formats

### Advanced Features
- **Provider Management**: Full CRUD operations for AI provider configuration
- **API Key Management**: Secure storage and management of provider API keys
- **Provider Activation/Deactivation**: Control which providers are available for testing
- **Reactivation System**: Easy reactivation of deactivated providers
- **Provider Icons**: Visual identification with favicon support and fallbacks
- **Bulk Model Selection**: "Select All Models" and "Reset Selection" for efficient testing
- **Individual Model Management**: Remove specific models from selection with one click
- **Analytics Dashboard**: Comprehensive testing analytics and performance metrics

### User Interface
- **Modern UI**: Material-UI based React frontend with tabbed interface
- **Intuitive Workflow**: Step-by-step testing process with clear navigation  
- **Provider-based Organization**: Models organized by AI provider for easy browsing
- **Visual Results**: Provider icons in test results for quick identification
- **Responsive Design**: Works seamlessly across desktop and mobile devices

### Infrastructure
- **Kusha Elastic**: Elasticsearch integration for scalable data management
- **Docker Ready**: Containerized deployment with Docker Compose
- **Health Monitoring**: Built-in health checks and monitoring capabilities

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
   cd Kusha
   ```

2. **Start with Docker Compose**
   ```bash
   docker compose up --build
   ```

3. **Access the application**
   - Main interface: http://localhost:5005
   - API documentation: http://localhost:5005/docs
   - Admin panel: Access through the main interface using admin token: `kusha-admin-token-2025`

## 🔧 Configuration

### Environment Variables
Set these in `docker-compose.yml` or `.env` file:

```bash
SERVER_HOST=0.0.0.0
SERVER_PORT=5005
ADMIN_TOKEN=kusha-admin-token-2025
JWT_SECRET_KEY=asr-speedtest-secret-key-2025
SARV_ASR_URL=http://103.255.103.118:5001
DATABASE_URL=sqlite:////app/database/kusha_config.db
ELASTICSEARCH_URL=http://elasticsearch:9200
DEBUG=False
ENVIRONMENT=production
```

### API Keys Configuration
Configure API keys through the admin panel or API endpoints:

- **Google Cloud**: Service account JSON file content
- **ElevenLabs**: API key string
- **Fireworks AI**: API key string  
- **OpenAI**: API key string
- **Groq**: API key string
- **Sarv ASR**: No API key required (local service)

## 🎨 User Interface Features

### Model Selection Interface
- **Provider Organization**: Models grouped by AI provider with expandable accordions
- **Visual Identification**: Provider icons and logos for easy recognition
- **Bulk Operations**: 
  - "Select All Models" button to select all available models at once
  - "Reset Selection" button to clear all selections
- **Individual Management**: Remove specific models using X buttons on selection chips
- **Smart Filtering**: Search across models, providers, features, and descriptions
- **Status Indicators**: Clear visual indicators for model availability and activation status

### Admin Panel Enhancements  
- **Provider Management**: Organized by AI type (ASR, TTS, AI Models, Embeddings)
- **Visual Provider Icons**: Favicon support with intelligent fallbacks
- **Activation Controls**: 
  - Deactivate providers to remove them from testing (PowerOff icon)
  - Reactivate providers with one click (ToggleOn icon)
  - Clear visual distinction between activated and deactivated providers
- **Status Management**: Providers moved to Status column for better organization
- **Connection Testing**: Built-in API key validation and connection testing

### Results Display
- **Provider Branding**: Icons displayed in test results for quick identification
- **Performance Metrics**: Detailed timing, confidence, and accuracy information
- **Visual Feedback**: Color-coded results and status indicators
- **Responsive Layout**: Optimized for both desktop and mobile viewing

## 📝 Usage Workflow

### Main Testing Process
1. **Select Language**: Choose from 22+ Indian languages or international languages
2. **Select Models**: Choose multiple providers and their models for the selected language
   - Browse models organized by provider (Google, OpenAI, Groq, etc.)
   - Use "Select All Models" for bulk selection
   - Use "Reset Selection" to clear all selections  
   - Remove individual models using X buttons on selected model chips
3. **Audio Input**: Record audio in browser or upload audio file (WAV, MP3, WEBM, FLAC)
4. **Run Test**: Click "Run Speed Test" to test all selected models simultaneously
5. **View Results**: Compare transcriptions, processing times, and confidence scores
   - See provider icons for visual identification
   - View detailed performance metrics
   - Access comprehensive analytics

### Admin Management
1. **API Key Management**: 
   - Configure API keys for different AI providers (ASR, TTS, AI, Embedding)
   - Visual provider identification with icons
   - Test connections and validate configurations
2. **Provider Control**:
   - Activate/Deactivate providers as needed
   - Reactivate deactivated providers with one click
   - Only activated providers appear during testing
3. **Analytics & Monitoring**:
   - View usage statistics and performance metrics
   - Monitor provider health and response times
   - Access detailed testing history

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
- `GET /api/models/language/{language_code}` - Get models for specific language (includes activation status)
- `POST /api/test-multiple-models` - Test multiple models simultaneously (includes provider icons)
- `GET /api/providers` - Get all available providers
- `GET /api/test-results` - Get historical test results

### Admin Authentication
- `POST /api/admin/auth` - Authenticate with admin token to get JWT
- `GET /api/admin/verify` - Verify admin JWT token

### Admin Management Endpoints
- `GET /api/admin/api-keys` - Get all API keys with provider information and icons
- `POST /api/admin/api-keys/{provider_id}` - Save/update API key for specific provider
- `DELETE /api/admin/api-keys/{provider_id}` - Delete API key for specific provider
- `POST /api/admin/api-keys/{provider_id}/test` - Test provider connection
- `POST /api/admin/api-keys/{provider_id}/test-transcription` - Test provider with audio file

### Provider Control Endpoints
- `POST /api/admin/api-keys/{provider_id}/deactivate` - Deactivate provider
- `POST /api/admin/api-keys/{provider_id}/reactivate` - Reactivate provider  
- `POST /api/admin/activate-all-providers` - Activate all providers with valid API keys

### Analytics Endpoints
- `GET /api/analytics/dashboard` - Get dashboard analytics with date range filtering

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

## 🆕 Recent Updates

### Version 2.0 - Platform Transformation
- **Multi-AI Support**: Expanded from ASR-only to comprehensive AI platform (ASR, TTS, AI, Embedding)
- **Provider Management**: Complete provider lifecycle management with activation controls
- **Enhanced UI/UX**: Redesigned interface with provider icons, bulk operations, and improved workflows
- **Admin Authentication**: JWT-based admin authentication system with secure token management
- **Analytics Integration**: Elasticsearch integration for advanced analytics and monitoring

### Key Improvements
- ✅ **Provider Icons**: Visual identification throughout the interface
- ✅ **Bulk Model Selection**: Select all models or reset selections with one click  
- ✅ **Individual Model Management**: Remove specific models with X buttons
- ✅ **Provider Activation System**: Control which providers are available for testing
- ✅ **Reactivation Controls**: Easy reactivation of deactivated providers
- ✅ **Enhanced Admin Panel**: Organized by AI type with improved status management
- ✅ **Test Results Enhancement**: Provider icons in results for better identification
- ✅ **Nested Provider Structure**: Organized provider directory by AI type
- ✅ **Modern Authentication**: JWT-based admin access with proper token validation

## 🙏 Acknowledgments

- Google Cloud Speech-to-Text for enterprise-grade ASR
- ElevenLabs for high-quality voice AI  
- Fireworks AI for fast model inference
- OpenAI for cutting-edge AI capabilities
- Groq for ultra-fast inference platform
- Sarv ASR for comprehensive Indian language support
- Material-UI team for excellent React components
- FastAPI team for the high-performance web framework
- Elasticsearch team for scalable search and analytics