# 📚 Kusha Documentation

Welcome to the Kusha documentation hub. Here you'll find comprehensive guides, API documentation, and release information.

## 📖 Documentation Sections

### 🚀 [Release Notes](release-notes/)
Detailed information about each version release, including new features, bug fixes, and migration guides.
- **Latest**: [v0.0.2 - Complete TTS Implementation](release-notes/RELEASE_NOTES_v0.0.2.md)

### 🔧 API Documentation
- **Interactive API Docs**: Available at `/api/docs` when running the application
- **ASR Endpoints**: Automatic Speech Recognition API
- **TTS Endpoints**: Text-to-Speech API (New in v0.0.2)
- **Admin Endpoints**: Provider management and configuration

### ⚙️ Configuration Guides
- **Provider Setup**: Configure ASR and TTS providers
- **API Key Management**: Secure credential handling
- **Environment Variables**: Application configuration
- **Docker Deployment**: Containerized deployment options

### 🏗️ Architecture
- **System Overview**: High-level architecture
- **Provider Framework**: Extensible provider system
- **Database Schema**: Data storage and management
- **Authentication**: Security and access control

---

## 🚀 Quick Start

1. **Installation**: Follow the setup guide in the main README
2. **Configuration**: Set up your provider API keys
3. **Testing**: Use the built-in test interfaces
4. **Integration**: Connect to your applications via API

## 📊 Current Capabilities

### Automatic Speech Recognition (ASR)
- **Providers**: Google Cloud Speech, OpenAI Whisper, ElevenLabs, Sarv, Assembly AI, Deepgram
- **Languages**: 50+ supported languages
- **Audio Formats**: WAV, MP3, M4A, FLAC, WebM
- **Real-time**: Streaming and batch processing

### Text-to-Speech (TTS) ✨ New in v0.0.2
- **Providers**: ElevenLabs, Google Cloud TTS, OpenAI TTS
- **Voice Types**: Neural, WaveNet, Standard, Custom
- **Languages**: 40+ supported languages with native voices
- **Audio Formats**: MP3, WAV, OGG, FLAC, AAC

## 🛠️ Development

### Contributing
- **Code Standards**: Follow the established patterns
- **Testing**: Comprehensive test coverage required
- **Documentation**: Update docs for new features
- **Provider Development**: Extend with new providers

### Architecture Principles
- **Modularity**: Plugin-based provider system
- **Performance**: Optimized for concurrent requests
- **Reliability**: Robust error handling and fallbacks
- **Security**: Secure credential management

---

## 📞 Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/Kusha-ai/Kusha/issues)
- **Documentation Issues**: Help improve these docs
- **Community**: Join our Discord for discussions

---

## 📋 Version History

- **v0.0.2** (July 2025): Complete TTS Implementation
- **v0.0.1** (Previous): Initial ASR Implementation

For detailed version information, see the [Release Notes](release-notes/).

---

*This documentation is continuously updated. Last updated: July 2025*