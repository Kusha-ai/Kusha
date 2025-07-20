import os
import sys
import asyncio
import aiofiles
from typing import List, Dict, Optional, Any
from datetime import datetime
from pathlib import Path

# FastAPI imports for performance
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager

# Add project root to path for providers import
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

# Import our optimized providers
from providers import provider_factory
from utils.database import DatabaseManager
from utils.auth import admin_auth, get_current_admin

# Global cache for performance
_provider_cache = {}
_models_cache = {}
_cache_timestamp = None
CACHE_DURATION = 300  # 5 minutes

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events"""
    # Startup
    print("🚀 Starting optimized AI provider FastAPI server...")
    await warm_up_caches()
    yield
    # Shutdown
    print("🔄 Shutting down server...")

async def warm_up_caches():
    """Pre-warm caches for better performance"""
    global _provider_cache, _models_cache, _cache_timestamp
    
    try:
        # Cache provider structure
        _provider_cache = await asyncio.get_event_loop().run_in_executor(
            None, provider_factory.get_all_providers_structure
        )
        
        # Cache models by AI type
        _models_cache = {}
        for ai_type in provider_factory.get_ai_types():
            _models_cache[ai_type] = {}
            for provider in provider_factory.get_providers_by_type(ai_type):
                models = await asyncio.get_event_loop().run_in_executor(
                    None, provider_factory.get_models_for_provider, ai_type, provider
                )
                _models_cache[ai_type][provider] = models
        
        _cache_timestamp = datetime.now()
        print(f"✅ Cached {len(_provider_cache)} AI types with providers and models")
        
    except Exception as e:
        print(f"⚠️ Cache warm-up failed: {e}")

async def refresh_cache_if_needed():
    """Refresh cache if it's older than CACHE_DURATION"""
    global _cache_timestamp
    
    if (_cache_timestamp is None or 
        (datetime.now() - _cache_timestamp).total_seconds() > CACHE_DURATION):
        await warm_up_caches()

# Create FastAPI app with optimizations
app = FastAPI(
    title="Kusha AI Provider API",
    description="Optimized AI provider management for ASR, TTS, and AI models",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add performance middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
db = DatabaseManager()

# ===== AI TYPE ENDPOINTS =====

@app.get("/api/v2/ai-types", response_model=Dict[str, Any])
async def get_ai_types():
    """Get all available AI types with provider counts"""
    await refresh_cache_if_needed()
    
    summary = {
        "ai_types": [],
        "total_providers": 0
    }
    
    for ai_type in provider_factory.get_ai_types():
        providers = provider_factory.get_providers_by_type(ai_type)
        summary["ai_types"].append({
            "type": ai_type,
            "name": ai_type.upper(),
            "provider_count": len(providers),
            "providers": providers
        })
        summary["total_providers"] += len(providers)
    
    return summary

@app.get("/api/v2/ai-types/{ai_type}/providers", response_model=Dict[str, Any])
async def get_providers_by_ai_type(ai_type: str):
    """Get all providers for a specific AI type with their configurations"""
    await refresh_cache_if_needed()
    
    if ai_type not in _provider_cache:
        raise HTTPException(status_code=404, detail=f"AI type '{ai_type}' not found")
    
    providers_data = _provider_cache.get(ai_type, {})
    
    # Add API key status from database
    result = {}
    for provider_name, config in providers_data.items():
        provider_id = f"{provider_name.lower()}-{ai_type.lower()}"
        api_key_info = db.get_api_key_info(provider_id)
        
        result[provider_name] = {
            **config,
            "api_key_status": {
                "has_key": api_key_info.get("has_api_key", False),
                "is_activated": api_key_info.get("is_activated", False),
                "last_tested": api_key_info.get("last_test_date")
            }
        }
    
    return {
        "ai_type": ai_type,
        "providers": result,
        "count": len(result)
    }

@app.get("/api/v2/ai-types/{ai_type}/providers/{provider_name}/models")
async def get_provider_models(ai_type: str, provider_name: str):
    """Get models for a specific provider"""
    await refresh_cache_if_needed()
    
    if ai_type not in _models_cache:
        raise HTTPException(status_code=404, detail=f"AI type '{ai_type}' not found")
    
    if provider_name not in _models_cache[ai_type]:
        raise HTTPException(status_code=404, detail=f"Provider '{provider_name}' not found")
    
    models = _models_cache[ai_type][provider_name]
    
    return {
        "ai_type": ai_type,
        "provider": provider_name,
        "models": models,
        "count": len(models)
    }

@app.get("/api/v2/ai-types/{ai_type}/providers/{provider_name}/voices")
async def get_provider_voices(ai_type: str, provider_name: str):
    """Get voices for TTS providers"""
    if ai_type.upper() != "TTS":
        raise HTTPException(status_code=400, detail="Voices are only available for TTS providers")
    
    voices = provider_factory.get_voices_for_provider(ai_type, provider_name)
    
    return {
        "ai_type": ai_type,
        "provider": provider_name,
        "voices": voices,
        "count": len(voices)
    }

# ===== OPTIMIZED API KEY MANAGEMENT =====

@app.get("/api/v2/admin/api-keys", dependencies=[Depends(admin_auth)])
async def get_all_api_keys_v2():
    """Get all API keys organized by AI type"""
    await refresh_cache_if_needed()
    
    result = {
        "ai_types": {},
        "total_providers": 0,
        "configured_providers": 0,
        "activated_providers": 0
    }
    
    for ai_type, providers in _provider_cache.items():
        result["ai_types"][ai_type] = []
        
        for provider_name, config in providers.items():
            provider_id = f"{provider_name.lower()}-{ai_type.lower()}"
            api_key_info = db.get_api_key_info(provider_id)
            
            provider_data = {
                "provider_id": provider_id,
                "provider_name": provider_name,
                "provider_type": ai_type,
                "config": config,
                "requires_api_key": config.get("provider", {}).get("requires_api_key", True),
                "has_api_key": api_key_info.get("has_api_key", False),
                "is_activated": api_key_info.get("is_activated", False),
                "last_test_date": api_key_info.get("last_test_date"),
                "api_key_preview": api_key_info.get("api_key_preview")
            }
            
            result["ai_types"][ai_type].append(provider_data)
            result["total_providers"] += 1
            
            if provider_data["has_api_key"] or not provider_data["requires_api_key"]:
                result["configured_providers"] += 1
            
            if provider_data["is_activated"]:
                result["activated_providers"] += 1
    
    return {
        "success": True,
        "data": result
    }

@app.post("/api/v2/admin/api-keys/{provider_id}", dependencies=[Depends(admin_auth)])
async def save_api_key_v2(provider_id: str, request: Request):
    """Save API key for a provider with async processing"""
    data = await request.json()
    api_key = data.get("api_key", "").strip()
    
    if not api_key:
        raise HTTPException(status_code=400, detail="API key cannot be empty")
    
    try:
        # Save to database asynchronously
        success = await asyncio.get_event_loop().run_in_executor(
            None, db.save_api_key, provider_id, api_key
        )
        
        if success:
            # Invalidate cache to force refresh
            global _cache_timestamp
            _cache_timestamp = None
            
            return {"success": True, "message": "API key saved successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to save API key")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving API key: {str(e)}")

@app.post("/api/v2/admin/api-keys/{provider_id}/test", dependencies=[Depends(admin_auth)])
async def test_api_key_v2(provider_id: str):
    """Test API key and provider connection"""
    try:
        # Parse provider_id to get ai_type and provider_name
        # Expected format: "provider-aitype" (e.g., "openai-tts", "google-asr")
        parts = provider_id.split('-')
        if len(parts) < 2:
            raise HTTPException(status_code=400, detail="Invalid provider ID format")
        
        provider_name = parts[0].title()  # e.g., "openai" -> "OpenAI"
        ai_type = parts[1].upper()  # e.g., "tts" -> "TTS"
        
        # Special handling for provider name mapping
        provider_mapping = {
            'openai': 'OpenAI',
            'google': 'Google', 
            'elevenlabs': 'ElevenLabs',
            'anthropic': 'Anthropic',
            'groq': 'Groq',
            'sarv': 'Sarv',
            'fireworks': 'Fireworks'
        }
        provider_name = provider_mapping.get(parts[0].lower(), provider_name)
        
        # Get API key from database
        api_key_info = db.get_api_key_info(provider_id)
        if not api_key_info.get("has_api_key"):
            raise HTTPException(status_code=400, detail="API key not found")
        
        api_key = db.get_api_key(provider_id)
        if not api_key:
            raise HTTPException(status_code=400, detail="Failed to retrieve API key")
        
        # Test connection using provider factory
        test_result = await asyncio.get_event_loop().run_in_executor(
            None, provider_factory.test_provider_connection, ai_type, provider_name, api_key
        )
        
        # Update activation status if test successful
        if test_result.get('success'):
            db.activate_provider(provider_id)
        
        return {
            "success": test_result.get('success', False),
            "test_result": test_result,
            "provider_activated": test_result.get('success', False)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")

@app.delete("/api/v2/admin/api-keys/{provider_id}", dependencies=[Depends(admin_auth)])
async def delete_api_key_v2(provider_id: str):
    """Delete API key for a provider"""
    try:
        success = await asyncio.get_event_loop().run_in_executor(
            None, db.delete_api_key, provider_id
        )
        
        if success:
            # Invalidate cache
            global _cache_timestamp
            _cache_timestamp = None
            
            return {"success": True, "message": "API key deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="API key not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting API key: {str(e)}")

# ===== BULK OPERATIONS FOR PERFORMANCE =====

@app.post("/api/v2/admin/bulk-activate", dependencies=[Depends(admin_auth)])
async def bulk_activate_providers(background_tasks: BackgroundTasks):
    """Activate all providers with valid configurations in background"""
    
    async def activate_all():
        activated_count = 0
        for ai_type, providers in _provider_cache.items():
            for provider_name in providers.keys():
                provider_id = f"{provider_name.lower()}-{ai_type.lower()}"
                api_key_info = db.get_api_key_info(provider_id)
                
                if api_key_info.get("has_api_key") or not providers[provider_name].get("provider", {}).get("requires_api_key", True):
                    success = db.activate_provider(provider_id)
                    if success:
                        activated_count += 1
        
        print(f"✅ Background activation completed: {activated_count} providers activated")
    
    background_tasks.add_task(activate_all)
    
    return {
        "success": True,
        "message": "Bulk activation started in background",
        "status": "processing"
    }

@app.get("/api/v2/admin/provider-summary")
async def get_provider_summary(ai_type: Optional[str] = None):
    """Get quick summary of provider status"""
    await refresh_cache_if_needed()
    
    summary = {
        "total_providers": 0,
        "configured_providers": 0,
        "activated_providers": 0,
        "by_ai_type": {}
    }
    
    providers_to_check = {ai_type: _provider_cache[ai_type]} if ai_type and ai_type in _provider_cache else _provider_cache
    
    for current_ai_type, providers in providers_to_check.items():
        type_summary = {"total": 0, "configured": 0, "activated": 0}
        
        for provider_name in providers.keys():
            provider_id = f"{provider_name.lower()}-{current_ai_type.lower()}"
            api_key_info = db.get_api_key_info(provider_id)
            
            type_summary["total"] += 1
            summary["total_providers"] += 1
            
            if api_key_info.get("has_api_key") or not providers[provider_name].get("provider", {}).get("requires_api_key", True):
                type_summary["configured"] += 1
                summary["configured_providers"] += 1
            
            if api_key_info.get("is_activated"):
                type_summary["activated"] += 1
                summary["activated_providers"] += 1
        
        summary["by_ai_type"][current_ai_type] = type_summary
    
    return summary

# ===== TTS SYNTHESIS ENDPOINTS =====

@app.post("/api/v2/tts/synthesize")
async def synthesize_speech(request: Request, background_tasks: BackgroundTasks):
    """Synthesize speech using TTS providers"""
    data = await request.json()
    
    text = data.get("text", "").strip()
    ai_type = data.get("ai_type", "TTS")
    provider_name = data.get("provider")
    voice_id = data.get("voice_id")
    language_code = data.get("language_code", "en-US")
    audio_format = data.get("audio_format", "mp3")
    speed = data.get("speed", 1.0)
    
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    if ai_type.upper() != "TTS":
        raise HTTPException(status_code=400, detail="AI type must be TTS")
    
    if not provider_name:
        raise HTTPException(status_code=400, detail="Provider name is required")
    
    if not voice_id:
        raise HTTPException(status_code=400, detail="Voice ID is required")
    
    # Check if provider exists
    if not provider_factory.validate_provider_exists(ai_type, provider_name):
        raise HTTPException(status_code=404, detail=f"TTS provider '{provider_name}' not found")
    
    # Get API key
    provider_id = f"{provider_name.lower()}-{ai_type.lower()}"
    api_key_info = db.get_api_key_info(provider_id)
    
    if not api_key_info.get("has_api_key") and provider_factory.get_provider_api_requirements(ai_type, provider_name).get("requires_api_key", True):
        raise HTTPException(status_code=400, detail="API key not configured for this provider")
    
    if not api_key_info.get("is_activated"):
        raise HTTPException(status_code=400, detail="Provider is not activated")
    
    try:
        # Get API key for synthesis
        api_key = db.get_api_key(provider_id)
        if not api_key:
            raise HTTPException(status_code=400, detail="Failed to retrieve API key")
        
        # Create provider instance and synthesize
        result = await asyncio.get_event_loop().run_in_executor(
            None, _synthesize_speech_sync, ai_type, provider_name, api_key, text, voice_id, language_code, audio_format, speed
        )
        
        if result['success']:
            # Store audio data temporarily (in production, use proper storage)
            import base64
            audio_base64 = base64.b64encode(result['audio_data']).decode('utf-8') if result.get('audio_data') else None
            
            return {
                "success": True,
                "audio_base64": audio_base64,
                "audio_size_bytes": result.get('audio_size_bytes', 0),
                "audio_duration": result.get('audio_duration', 0),
                "processing_time": result.get('processing_time', 0),
                "provider": provider_name,
                "voice_id": voice_id,
                "text_length": len(text),
                "language_code": language_code,
                "audio_format": audio_format,
                "speed": speed
            }
        else:
            raise HTTPException(status_code=500, detail=result.get('error', 'Synthesis failed'))
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")

def _synthesize_speech_sync(ai_type: str, provider_name: str, api_key: str, 
                           text: str, voice_id: str, language_code: str, 
                           audio_format: str, speed: float) -> Dict:
    """Synchronous speech synthesis for thread pool execution"""
    try:
        # Create provider instance
        instance = provider_factory.create_provider_instance(ai_type, provider_name, api_key)
        if not instance:
            return {
                'success': False,
                'error': f'Failed to create {provider_name} TTS provider instance'
            }
        
        # Check if provider has synthesize_speech method
        if hasattr(instance, 'synthesize_speech'):
            return instance.synthesize_speech(text, voice_id, language_code, audio_format, speed)
        else:
            return {
                'success': False,
                'error': f'{provider_name} provider does not support speech synthesis'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@app.get("/api/v2/tts/test/{provider_name}")
async def test_tts_provider(provider_name: str):
    """Test a TTS provider with sample text"""
    ai_type = "TTS"
    
    if not provider_factory.validate_provider_exists(ai_type, provider_name):
        raise HTTPException(status_code=404, detail=f"TTS provider '{provider_name}' not found")
    
    # Get provider voices for testing
    voices = provider_factory.get_voices_for_provider(ai_type, provider_name)
    if not voices:
        raise HTTPException(status_code=400, detail="No voices available for this provider")
    
    # Use first available voice for testing
    test_voice = voices[0]["id"]
    test_text = "Hello, this is a test of the text-to-speech functionality."
    
    return {
        "provider": provider_name,
        "test_voice": test_voice,
        "test_text": test_text,
        "available_voices": len(voices),
        "test_ready": True
    }

# ===== AI MODEL ENDPOINTS =====

@app.post("/api/v2/ai/chat")
async def chat_with_ai(request: Request):
    """Chat with AI providers"""
    data = await request.json()
    
    messages = data.get("messages", [])
    ai_type = data.get("ai_type", "AI")
    provider_name = data.get("provider")
    model_id = data.get("model_id")
    
    if not messages:
        raise HTTPException(status_code=400, detail="Messages are required")
    
    if ai_type.upper() != "AI":
        raise HTTPException(status_code=400, detail="AI type must be AI")
    
    if not provider_name or not model_id:
        raise HTTPException(status_code=400, detail="Provider name and model ID are required")
    
    # Check if provider exists
    if not provider_factory.validate_provider_exists(ai_type, provider_name):
        raise HTTPException(status_code=404, detail=f"AI provider '{provider_name}' not found")
    
    # Get API key
    provider_id = f"{provider_name.lower()}-{ai_type.lower()}"
    api_key_info = db.get_api_key_info(provider_id)
    
    if not api_key_info.get("has_api_key"):
        raise HTTPException(status_code=400, detail="API key not configured for this provider")
    
    if not api_key_info.get("is_activated"):
        raise HTTPException(status_code=400, detail="Provider is not activated")
    
    # Mock response for AI chat
    return {
        "success": True,
        "message": "AI chat endpoint ready",
        "provider": provider_name,
        "model": model_id,
        "message_count": len(messages),
        "response": "This is a mock AI response. Implement actual AI provider integration here."
    }

# ===== HEALTH CHECK =====

@app.get("/api/v2/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "cache_age": (datetime.now() - _cache_timestamp).total_seconds() if _cache_timestamp else None,
        "cached_ai_types": list(_provider_cache.keys()),
        "version": "2.0.0"
    }

# ===== PERFORMANCE MONITORING =====

@app.get("/api/v2/stats")
async def get_performance_stats():
    """Get API performance statistics"""
    return {
        "cache_status": {
            "last_refresh": _cache_timestamp.isoformat() if _cache_timestamp else None,
            "cached_ai_types": len(_provider_cache),
            "total_cached_providers": sum(len(providers) for providers in _provider_cache.values()),
            "cache_age_seconds": (datetime.now() - _cache_timestamp).total_seconds() if _cache_timestamp else None
        },
        "provider_factory_stats": {
            "ai_types": provider_factory.get_ai_types(),
            "providers_root": str(provider_factory.providers_root)
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "optimized_app:app",
        host="0.0.0.0",
        port=int(os.getenv("SERVER_PORT", 5005)),
        reload=True,
        workers=1,  # Use single worker for development
        loop="asyncio"
    )