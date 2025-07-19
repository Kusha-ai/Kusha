import os
import sys
import tempfile
import asyncio
import concurrent.futures
import uuid
import time
import sqlite3
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
from fastapi import FastAPI, Request, Form, File, UploadFile, HTTPException, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
import uvicorn

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from utils.database import DatabaseManager
from utils.elasticsearch_client import es_client
from utils.auth import admin_auth, get_current_admin
from providers.provider_manager import ProviderManager
from services.analytics_service import analytics_service

# Initialize provider manager
provider_manager = ProviderManager()

load_dotenv()

def get_audio_duration(file_path: str) -> float:
    """Get audio duration in seconds (simple implementation)"""
    try:
        # Simple fallback - return file size based estimation
        # In production, you'd use librosa or similar
        file_size = os.path.getsize(file_path)
        # Rough estimation: 1 second ≈ 16KB for typical audio
        return max(1.0, file_size / 16384)
    except Exception:
        return 1.0

app = FastAPI(
    title="ASR Speed Test",
    description="A comprehensive ASR speed testing application",
    version="1.0.0"
)

# Setup templates and static files
templates = Jinja2Templates(directory="templates")

# Create templates directory if it doesn't exist
os.makedirs("templates", exist_ok=True)
os.makedirs("static", exist_ok=True)

# Mount static files for React app assets
app.mount("/assets", StaticFiles(directory="static/dist/assets"), name="assets")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve React app
@app.get("/app", response_class=HTMLResponse)
async def react_app():
    """Serve the React application"""
    try:
        with open("static/dist/index.html", "r") as f:
            html_content = f.read()
            # Ensure assets are loaded from the correct path
            html_content = html_content.replace('src="/assets/', 'src="/assets/')
            html_content = html_content.replace('href="/assets/', 'href="/assets/')
            return html_content
    except FileNotFoundError:
        return """
        <html>
        <head><title>ASR Speed Test</title></head>
        <body>
            <h1>Frontend not built</h1>
            <p>Please build the frontend first: <code>docker-compose up --build</code></p>
        </body>
        </html>
        """

# Initialize database with persistent volume path
os.makedirs("/app/database", exist_ok=True)
db = DatabaseManager(db_path="/app/database/asr_config.db")

@app.get("/", response_class=HTMLResponse)
async def user_interface(request: Request):
    """Main user interface for ASR testing - redirect to React frontend"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>ASR Speed Test</title>
        <meta http-equiv="refresh" content="0; url=/app">
    </head>
    <body>
        <p>Redirecting to React frontend...</p>
        <p>If not redirected, <a href="/app">click here</a>.</p>
    </body>
    </html>
    """

# Old admin panel removed - now handled by React frontend with token authentication

@app.get("/api/providers")
async def get_providers(activated_only: bool = False):
    """Get available providers with their configurations (all providers by default)"""
    try:
        providers = provider_manager.get_all_providers()
        provider_statuses = db.get_all_provider_statuses()
        
        # Add API key status and activation status for each provider
        filtered_providers = []
        for provider in providers:
            api_key = db.get_api_key(provider['id'])
            provider['hasApiKey'] = bool(api_key)
            
            # Check activation status
            status = provider_statuses.get(provider['id'], {})
            is_activated = status.get('is_activated', False)
            
            # Auto-activate providers that don't require API keys
            if not provider['requires_api_key'] and not is_activated:
                success = db.update_provider_status(
                    provider_id=provider['id'],
                    is_activated=True,
                    test_result="no_api_key_required",
                    transcription="Provider automatically activated (no API key required)",
                    model_used="auto_activation",
                    language_used="n/a",
                    processing_time=0.0
                )
                if success:
                    is_activated = True
            
            provider['isActivated'] = is_activated
            
            # Include all providers by default, filter only if activated_only is True
            if not activated_only or provider['isActivated']:
                filtered_providers.append(provider)
        
        return {"providers": filtered_providers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load providers: {str(e)}")

@app.get("/api/languages")
async def get_languages():
    """Get all available languages from all providers"""
    try:
        languages = provider_manager.get_all_languages()
        return {"languages": languages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load languages: {str(e)}")

@app.get("/api/models")
async def get_all_models():
    """Get all available models"""
    try:
        # Get available providers (those with API keys)
        available_providers = []
        for provider_id in provider_manager.get_provider_ids():
            api_key = db.get_api_key(provider_id)
            provider_config = provider_manager.get_provider_config(provider_id)
            if not provider_config['provider']['requires_api_key'] or api_key:
                available_providers.append(provider_id)
        
        models = provider_manager.get_all_models(available_providers)
        
        # Add API key status to each model
        for model in models:
            api_key = db.get_api_key(model['provider_id'])
            provider_config = provider_manager.get_provider_config(model['provider_id'])
            model['hasApiKey'] = not provider_config['provider']['requires_api_key'] or bool(api_key)
        
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load models: {str(e)}")

@app.get("/api/models/language/{language_code}")
async def get_models_for_language(language_code: str):
    """Get models available for a specific language"""
    try:
        models = provider_manager.get_models_for_language(language_code)
        
        # Add API key status to each model
        for model in models:
            api_key = db.get_api_key(model['provider_id'])
            model['hasApiKey'] = not model['requires_api_key'] or bool(api_key)
        
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load models for language {language_code}: {str(e)}")

@app.get("/api/models/{provider}")
async def get_models(provider: str):
    """Get models for a specific provider"""
    models = db.get_models(provider)
    return {"models": models}

# Old save API key endpoint removed - now handled by new admin authentication system

# Old test connection endpoint removed - now handled by new admin authentication system

# Old refresh models endpoint removed - now handled by new admin authentication system

@app.post("/api/transcribe")
async def transcribe_audio(
    provider: str = Form(...),
    model_id: str = Form(...),
    language: str = Form(...),
    audio: UploadFile = File(...)
):
    """Transcribe audio using selected provider and model"""
    if not audio.filename:
        raise HTTPException(status_code=400, detail="No audio file provided")
    
    # Determine file extension based on content type or filename
    content_type = audio.content_type or ''
    filename = audio.filename or ''
    
    if 'webm' in content_type or filename.endswith('.webm'):
        suffix = '.webm'
    elif 'wav' in content_type or filename.endswith('.wav'):
        suffix = '.wav'
    elif 'mp3' in content_type or filename.endswith('.mp3'):
        suffix = '.mp3'
    elif 'm4a' in content_type or filename.endswith('.m4a'):
        suffix = '.m4a'
    elif 'flac' in content_type or filename.endswith('.flac'):
        suffix = '.flac'
    else:
        suffix = '.wav'  # Default fallback
    
    # Save uploaded file temporarily
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        content = await audio.read()
        temp_file.write(content)
        temp_file.close()
        
        # Get provider API key
        api_key = db.get_api_key(provider)
        provider_config = provider_manager.get_provider_config(provider)
        
        if not provider_config:
            raise HTTPException(status_code=400, detail=f"Provider {provider} not found")
        
        if provider_config['provider']['requires_api_key'] and not api_key:
            raise HTTPException(status_code=400, detail=f"No API key configured for {provider}")
        
        # Create provider instance
        provider_instance = provider_manager.get_provider_instance(provider, api_key)
        if not provider_instance:
            raise HTTPException(status_code=500, detail=f"Failed to create provider: {provider}")
        
        # Run transcription
        result = provider_instance.transcribe_audio(temp_file.name, model_id, language)
        
        # Save result to database
        if result['success']:
            db.save_test_result(
                result['provider'],
                result['model_id'],
                result['language_code'],
                0.0,  # audio_duration - would need to calculate
                result['processing_time'],
                result['transcription'],
                result['confidence']
            )
        
        return result
        
    finally:
        # Clean up temp file
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)

@app.post("/api/test-all-providers")
async def test_all_providers(
    language: str = Form(...),
    audio: UploadFile = File(...)
):
    """Test audio with all available providers"""
    if not audio.filename:
        raise HTTPException(status_code=400, detail="No audio file provided")
    
    # Determine file extension based on content type or filename
    content_type = audio.content_type or ''
    filename = audio.filename or ''
    
    if 'webm' in content_type or filename.endswith('.webm'):
        suffix = '.webm'
    elif 'wav' in content_type or filename.endswith('.wav'):
        suffix = '.wav'
    elif 'mp3' in content_type or filename.endswith('.mp3'):
        suffix = '.mp3'
    elif 'm4a' in content_type or filename.endswith('.m4a'):
        suffix = '.m4a'
    elif 'flac' in content_type or filename.endswith('.flac'):
        suffix = '.flac'
    else:
        suffix = '.wav'  # Default fallback
    
    # Save uploaded file temporarily
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        content = await audio.read()
        temp_file.write(content)
        temp_file.close()
        
        results = []
        
        for provider_id in provider_manager.get_provider_ids():
            api_key = db.get_api_key(provider_id)
            provider_config = provider_manager.get_provider_config(provider_id)
            
            if provider_config['provider']['requires_api_key'] and not api_key:
                continue
            
            try:
                provider_instance = provider_manager.get_provider_instance(provider_id, api_key)
                if not provider_instance:
                    continue
                
                models = provider_instance.get_available_models(language)
                if not models:
                    continue
                
                # Test with first model
                model = models[0]
                result = provider_instance.transcribe_audio(temp_file.name, model['id'], language)
                results.append(result)
                
            except Exception as e:
                results.append({
                    'provider': provider_id,
                    'success': False,
                    'error': str(e),
                    'transcription': '',
                    'processing_time': 0.0,
                    'confidence': 0.0
                })
        
        return {"results": results}
        
    finally:
        # Clean up temp file
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)

def test_single_model(args):
    """Test a single model - designed to run in thread pool"""
    temp_file_path, model_info, language_code, api_key = args
    
    try:
        provider_id = model_info['provider_id']
        model_id = model_info['model_id']
        
        # Get provider instance
        provider_instance = provider_manager.get_provider_instance(provider_id, api_key)
        if not provider_instance:
            return {
                'provider_id': provider_id,
                'model_id': model_id,
                'success': False,
                'error': f'Failed to create provider instance: {provider_id}',
                'processing_time': 0.0
            }
        
        # Run transcription
        result = provider_instance.transcribe_audio(temp_file_path, model_id, language_code)
        result['provider_id'] = provider_id
        result['model_id'] = model_id
        return result
        
    except Exception as e:
        return {
            'provider_id': model_info['provider_id'],
            'model_id': model_info['model_id'],
            'success': False,
            'error': str(e),
            'processing_time': 0.0
        }

@app.post("/api/test-multiple-models")
async def test_multiple_models(
    request: Request,
    language: str = Form(...),
    model_ids: str = Form(...),  # Comma-separated list of model IDs
    audio: UploadFile = File(...)
):
    """Test audio with multiple selected models simultaneously"""
    if not audio.filename:
        raise HTTPException(status_code=400, detail="No audio file provided")
    
    # Parse model IDs
    selected_model_ids = [mid.strip() for mid in model_ids.split(',') if mid.strip()]
    if not selected_model_ids:
        raise HTTPException(status_code=400, detail="No models selected")
    
    # Get all models for the language
    available_models = provider_manager.get_models_for_language(language)
    
    # Filter to only selected models
    selected_models = []
    for model in available_models:
        if model['id'] in selected_model_ids:
            api_key = db.get_api_key(model['provider_id'])
            if not model['requires_api_key'] or api_key:
                model['api_key'] = api_key
                selected_models.append(model)
    
    if not selected_models:
        raise HTTPException(status_code=400, detail="No valid models found with API keys")
    
    # Determine file extension
    content_type = audio.content_type or ''
    filename = audio.filename or ''
    
    if 'webm' in content_type or filename.endswith('.webm'):
        suffix = '.webm'
    elif 'wav' in content_type or filename.endswith('.wav'):
        suffix = '.wav'
    elif 'mp3' in content_type or filename.endswith('.mp3'):
        suffix = '.mp3'
    elif 'm4a' in content_type or filename.endswith('.m4a'):
        suffix = '.m4a'
    elif 'flac' in content_type or filename.endswith('.flac'):
        suffix = '.flac'
    else:
        suffix = '.wav'
    
    # Save uploaded file temporarily
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        content = await audio.read()
        temp_file.write(content)
        temp_file.close()
        
        # Prepare arguments for each model test
        test_args = []
        for model in selected_models:
            test_args.append((
                temp_file.name,
                model,
                language,
                model.get('api_key')
            ))
        
        # Calculate audio metrics
        audio_duration = get_audio_duration(temp_file.name)
        audio_file_size = os.path.getsize(temp_file.name)
        audio_format = suffix.lstrip('.')
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Run all tests simultaneously using thread pool
        results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(test_args)) as executor:
            futures = [executor.submit(test_single_model, args) for args in test_args]
            
            for future in concurrent.futures.as_completed(futures):
                try:
                    result = future.result()
                    results.append(result)
                    
                    # Save successful results to database
                    if result.get('success'):
                        db.save_test_result(
                            result.get('provider', result.get('provider_id', 'unknown')),
                            result.get('model_id', 'unknown'),
                            language,
                            audio_duration,
                            result.get('processing_time', 0.0),
                            result.get('transcription', ''),
                            result.get('confidence', 0.0)
                        )
                        
                        # Index to Elasticsearch
                        es_test_result = {
                            'test_id': str(uuid.uuid4()),
                            'session_id': session_id,
                            'timestamp': datetime.utcnow(),
                            'provider': result.get('provider', result.get('provider_id', 'unknown')),
                            'model_id': result.get('model_id', 'unknown'),
                            'model_name': result.get('model_name', result.get('model_id', 'unknown')),
                            'language': language,
                            'audio_duration': audio_duration,
                            'audio_file_size': audio_file_size,
                            'audio_format': audio_format,
                            'processing_time': result.get('processing_time', 0.0),
                            'confidence': result.get('confidence', 0.0),
                            'success': True,
                            'transcription': result.get('transcription', ''),
                            'user_agent': request.headers.get('user-agent', ''),
                            'ip_address': request.client.host if request.client else '127.0.0.1'
                        }
                        es_client.index_test_result(es_test_result)
                    else:
                        # Index failed results too
                        es_test_result = {
                            'test_id': str(uuid.uuid4()),
                            'session_id': session_id,
                            'timestamp': datetime.utcnow(),
                            'provider': result.get('provider', result.get('provider_id', 'unknown')),
                            'model_id': result.get('model_id', 'unknown'),
                            'model_name': result.get('model_name', result.get('model_id', 'unknown')),
                            'language': language,
                            'audio_duration': audio_duration,
                            'audio_file_size': audio_file_size,
                            'audio_format': audio_format,
                            'processing_time': result.get('processing_time', 0.0),
                            'confidence': 0.0,
                            'success': False,
                            'error_message': result.get('error', 'Unknown error'),
                            'user_agent': request.headers.get('user-agent', ''),
                            'ip_address': request.client.host if request.client else '127.0.0.1'
                        }
                        es_client.index_test_result(es_test_result)
                        
                except Exception as e:
                    error_result = {
                        'success': False,
                        'error': f'Future execution failed: {str(e)}',
                        'processing_time': 0.0
                    }
                    results.append(error_result)
                    
                    # Index error result
                    es_test_result = {
                        'test_id': str(uuid.uuid4()),
                        'session_id': session_id,
                        'timestamp': datetime.utcnow(),
                        'provider': 'unknown',
                        'model_id': 'unknown',
                        'model_name': 'unknown',
                        'language': language,
                        'audio_duration': audio_duration,
                        'audio_file_size': audio_file_size,
                        'audio_format': audio_format,
                        'processing_time': 0.0,
                        'confidence': 0.0,
                        'success': False,
                        'error_message': str(e),
                        'user_agent': request.headers.get('user-agent', ''),
                        'ip_address': request.client.host if request.client else '127.0.0.1'
                    }
                    es_client.index_test_result(es_test_result)
        
        # Index session summary
        successful_results = [r for r in results if r.get('success')]
        failed_results = [r for r in results if not r.get('success')]
        
        session_data = {
            'session_id': session_id,
            'timestamp': datetime.utcnow(),
            'language': language,
            'selected_models': [model.get('id', 'unknown') for model in selected_models],
            'total_models': len(selected_models),
            'successful_models': len(successful_results),
            'failed_models': len(failed_results),
            'total_duration': sum(r.get('processing_time', 0) for r in results),
            'avg_processing_time': sum(r.get('processing_time', 0) for r in successful_results) / max(1, len(successful_results)),
            'avg_confidence': sum(r.get('confidence', 0) for r in successful_results) / max(1, len(successful_results)),
            'audio_duration': audio_duration,
            'audio_file_size': audio_file_size,
            'audio_format': audio_format,
            'user_agent': request.headers.get('user-agent', ''),
            'ip_address': request.client.host if request.client else '127.0.0.1'
        }
        es_client.index_test_session(session_data)
        
        return {"results": results, "session_id": session_id}
        
    finally:
        # Clean up temp file
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)

@app.get("/api/test-results")
async def get_test_results(limit: int = 50):
    """Get recent test results"""
    results = db.get_test_results(limit=limit)
    return {"results": results}

@app.get("/api/test-results/{provider}")
async def get_provider_test_results(provider: str, limit: int = 50):
    """Get test results for a specific provider"""
    results = db.get_test_results(provider=provider, limit=limit)
    return {"results": results}

@app.get("/api/test-results-extended")
async def get_extended_test_results(limit: int = 1000):
    """Get test results from both SQLite and Elasticsearch"""
    try:
        # Get from SQLite first
        sqlite_results = db.get_test_results(limit=limit)
        
        # If SQLite has limited results, get from Elasticsearch
        if len(sqlite_results) < 10:  # If less than 10 results in SQLite
            try:
                es_results = es_client.get_recent_test_results(limit=limit)
                
                # Transform Elasticsearch results to match SQLite format
                extended_results = []
                for idx, item in enumerate(es_results):
                    extended_results.append({
                        "id": idx + 1,
                        "provider": item.get("provider", ""),
                        "model_id": item.get("model_id", ""),
                        "language_code": item.get("language", ""),
                        "audio_duration": item.get("audio_duration", 0),
                        "processing_time": item.get("processing_time", 0),
                        "transcription": item.get("transcription", ""),
                        "accuracy_score": item.get("confidence", 0),
                        "created_at": item.get("timestamp", "")
                    })
                
                return {"results": extended_results}
                
            except Exception as e:
                print(f"Elasticsearch error: {e}")
                return {"results": sqlite_results}
        
        return {"results": sqlite_results}
        
    except Exception as e:
        return {"results": [], "error": str(e)}

# Admin Authentication Endpoints
@app.post("/api/admin/auth")
async def admin_authenticate(request: Request):
    """Authenticate admin with token"""
    try:
        body = await request.json()
        admin_token = body.get("token")
        
        if not admin_token:
            raise HTTPException(status_code=400, detail="Admin token is required")
        
        auth_result = admin_auth.authenticate_admin(admin_token)
        return auth_result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

@app.get("/api/admin/verify")
async def verify_admin_token(admin_user: dict = Depends(get_current_admin)):
    """Verify admin authentication"""
    return {"valid": True, "user": admin_user}

# Enhanced Analytics Endpoints
@app.get("/api/analytics/provider-performance")
async def get_provider_performance(
    days: int = 30,
    admin_user: dict = Depends(get_current_admin)
):
    """Get provider performance analytics"""
    try:
        stats = es_client.get_provider_performance_stats(days=days)
        return {"success": True, "data": stats}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/analytics/language-performance")
async def get_language_performance(
    days: int = 30,
    admin_user: dict = Depends(get_current_admin)
):
    """Get language performance analytics"""
    try:
        stats = es_client.get_language_performance_stats(days=days)
        return {"success": True, "data": stats}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/analytics/recording-length-analysis")
async def get_recording_length_analysis(
    days: int = 30,
    admin_user: dict = Depends(get_current_admin)
):
    """Get recording length vs performance analysis"""
    try:
        stats = es_client.get_recording_length_analysis(days=days)
        return {"success": True, "data": stats}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/analytics/test-volume")
async def get_test_volume(
    days: int = 30,
    admin_user: dict = Depends(get_current_admin)
):
    """Get test volume over time"""
    try:
        stats = es_client.get_test_volume_over_time(days=days)
        return {"success": True, "data": stats}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/analytics/recent-tests")
async def get_recent_tests(
    limit: int = 100,
    admin_user: dict = Depends(get_current_admin)
):
    """Get recent test results from Elasticsearch"""
    try:
        results = es_client.get_recent_test_results(limit=limit)
        return {"success": True, "data": results}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/analytics/dashboard")
async def get_dashboard_data(
    days: int = 30,
    admin_user: dict = Depends(get_current_admin)
):
    """Get comprehensive dashboard data"""
    try:
        dashboard_data = {
            "provider_performance": es_client.get_provider_performance_stats(days=days),
            "language_performance": es_client.get_language_performance_stats(days=days),
            "recording_analysis": es_client.get_recording_length_analysis(days=days),
            "test_volume": es_client.get_test_volume_over_time(days=days),
            "recent_tests": es_client.get_recent_test_results(limit=50)
        }
        return {"success": True, "data": dashboard_data}
    except Exception as e:
        return {"success": False, "error": str(e)}

# API Key Management Endpoints
@app.get("/api/admin/api-keys")
async def get_api_keys(admin_user: dict = Depends(get_current_admin)):
    """Get all configured API keys with activation status"""
    try:
        api_keys = db.get_all_api_keys()
        providers = provider_manager.get_all_providers()
        provider_statuses = db.get_all_provider_statuses()
        
        # Format response with provider info
        result = []
        for provider in providers:
            provider_id = provider['id']
            api_key = api_keys.get(provider_id)
            status = provider_statuses.get(provider_id, {})
            
            result.append({
                "provider_id": provider_id,
                "provider_name": provider['name'],
                "provider_type": provider.get('provider_type', 'ASR'),  # Include provider type
                "requires_api_key": provider['requires_api_key'],
                "api_key_type": provider['api_key_type'],
                "has_api_key": bool(api_key),
                "api_key_preview": api_key[:10] + "..." if api_key and len(api_key) > 10 else api_key,
                "is_activated": status.get('is_activated', False),
                "last_test_date": status.get('last_test_date'),
                "last_transcription": status.get('last_transcription'),
                "test_model_used": status.get('test_model_used'),
                "test_language_used": status.get('test_language_used'),
                "test_processing_time": status.get('test_processing_time')
            })
        
        return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/admin/api-keys/{provider_id}")
async def save_api_key(
    provider_id: str,
    request: Request,
    admin_user: dict = Depends(get_current_admin)
):
    """Save API key for a provider"""
    try:
        body = await request.json()
        api_key = body.get("api_key")
        
        if not api_key:
            raise HTTPException(status_code=400, detail="API key is required")
        
        # Validate provider exists
        provider_config = provider_manager.get_provider_config(provider_id)
        if not provider_config:
            raise HTTPException(status_code=404, detail="Provider not found")
        
        # Save API key
        success = db.save_api_key(provider_id, api_key)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save API key")
        
        return {"success": True, "message": f"API key saved for {provider_id}"}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.delete("/api/admin/api-keys/{provider_id}")
async def delete_api_key(
    provider_id: str,
    admin_user: dict = Depends(get_current_admin)
):
    """Delete API key for a provider"""
    try:
        # Remove API key from database
        with sqlite3.connect(db.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM api_keys WHERE provider = ?", (provider_id,))
            conn.commit()
            
        return {"success": True, "message": f"API key deleted for {provider_id}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/admin/api-keys/{provider_id}/test")
async def test_api_key(
    provider_id: str,
    admin_user: dict = Depends(get_current_admin)
):
    """Test API key for a provider and activate if successful"""
    try:
        # Get API key
        api_key = db.get_api_key(provider_id)
        if not api_key:
            raise HTTPException(status_code=400, detail="No API key configured for this provider")
        
        # Get provider instance and test connection
        provider_instance = provider_manager.get_provider_instance(provider_id, api_key)
        if not provider_instance:
            raise HTTPException(status_code=404, detail="Provider not found")
        
        # Test connection
        test_result = provider_instance.test_connection()
        
        # If connection test succeeds, activate the provider
        if test_result.get('success', False):
            db.update_provider_status(
                provider_id=provider_id,
                is_activated=True,
                test_result="connection_success",
                transcription="Connection test passed - provider activated",
                model_used="connection_test",
                language_used="n/a",
                processing_time=0.0
            )
        
        return {
            "success": True, 
            "test_result": test_result,
            "provider_activated": test_result.get('success', False)
        }
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/admin/api-keys/{provider_id}/deactivate")
async def deactivate_provider(
    provider_id: str,
    admin_user: dict = Depends(get_current_admin)
):
    """Deactivate a specific provider"""
    try:
        # Get provider config to verify it exists
        provider_config = provider_manager.get_provider_config(provider_id)
        if not provider_config:
            raise HTTPException(status_code=404, detail="Provider not found")
        
        # Deactivate the provider
        success = db.update_provider_status(
            provider_id=provider_id,
            is_activated=False,
            test_result="manual_deactivation",
            transcription="Provider manually deactivated by admin",
            model_used="manual_deactivation",
            language_used="n/a",
            processing_time=0.0
        )
        
        if success:
            return {
                "success": True,
                "message": f"Provider {provider_config['provider']['name']} deactivated successfully"
            }
        else:
            return {"success": False, "error": "Failed to deactivate provider"}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/admin/activate-all-providers")
async def activate_all_providers(admin_user: dict = Depends(get_current_admin)):
    """Activate all providers that have API keys or don't require them"""
    try:
        providers = provider_manager.get_all_providers()
        activated_count = 0
        
        for provider in providers:
            provider_id = provider['id']
            requires_api_key = provider['requires_api_key']
            
            should_activate = False
            if requires_api_key:
                # Provider requires API key - check if it has one
                api_key = db.get_api_key(provider_id)
                should_activate = bool(api_key)
            else:
                # Provider doesn't require API key - can be activated
                should_activate = True
            
            if should_activate:
                success = db.update_provider_status(
                    provider_id=provider_id,
                    is_activated=True,
                    test_result="manual_activation",
                    transcription="Provider manually activated by admin",
                    model_used="manual_activation",
                    language_used="n/a",
                    processing_time=0.0
                )
                if success:
                    activated_count += 1
        
        return {
            "success": True,
            "message": f"Activated {activated_count} providers",
            "activated_count": activated_count
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/admin/provider/{provider_id}/dashboard")
async def get_provider_dashboard(
    provider_id: str,
    days: int = 30,
    admin_user: dict = Depends(get_current_admin)
):
    """Get detailed dashboard data for a specific provider"""
    try:
        # Get provider config
        provider_config = provider_manager.get_provider_config(provider_id)
        if not provider_config:
            raise HTTPException(status_code=404, detail="Provider not found")
        
        # Get provider status
        provider_status = db.get_provider_status(provider_id) or {}
        
        # Get analytics for this provider
        analytics = analytics_service.get_provider_analytics(provider_id, days)
        
        # Get supported languages with details
        languages = provider_config.get('languages', {})
        models = provider_config.get('models', [])
        
        return {
            "success": True,
            "data": {
                "provider_info": {
                    "id": provider_config['provider']['id'],
                    "name": provider_config['provider']['name'],
                    "description": provider_config['provider']['description'],
                    "base_url": provider_config['provider']['base_url'],
                    "requires_api_key": provider_config['provider']['requires_api_key'],
                    "api_key_type": provider_config['provider']['api_key_type']
                },
                "activation_status": {
                    "is_activated": provider_status.get('is_activated', False),
                    "last_test_date": provider_status.get('last_test_date'),
                    "last_test_result": provider_status.get('last_test_result'),
                    "test_model_used": provider_status.get('test_model_used'),
                    "test_language_used": provider_status.get('test_language_used'),
                    "test_processing_time": provider_status.get('test_processing_time')
                },
                "supported_languages": languages,
                "available_models": models,
                "analytics": analytics,
                "summary": {
                    "total_languages": len(languages),
                    "total_models": len(models),
                    "total_tests": analytics.get('total_tests', 0),
                    "avg_processing_time": analytics.get('avg_processing_time', 0),
                    "avg_confidence": analytics.get('avg_confidence', 0),
                    "success_rate": analytics.get('success_rate', 0)
                }
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/admin/api-keys/{provider_id}/test-transcription")
async def test_provider_transcription(
    provider_id: str,
    admin_user: dict = Depends(get_current_admin)
):
    """Test provider transcription with welcome.wav file"""
    try:
        # Get API key
        api_key = db.get_api_key(provider_id)
        
        # Get provider config
        provider_config = provider_manager.get_provider_config(provider_id)
        if not provider_config:
            raise HTTPException(status_code=404, detail="Provider not found")
        
        # Check if provider requires API key
        if provider_config['provider']['requires_api_key'] and not api_key:
            raise HTTPException(status_code=400, detail="No API key configured for this provider")
        
        # Get provider instance
        provider_instance = provider_manager.get_provider_instance(provider_id, api_key)
        if not provider_instance:
            raise HTTPException(status_code=404, detail="Provider not found")
        
        # Test with welcome.wav file
        welcome_file = "welcome.wav"
        if not os.path.exists(welcome_file):
            raise HTTPException(status_code=500, detail="welcome.wav test file not found")
        
        # Get available models for this provider
        available_models = provider_config['models']
        if not available_models:
            raise HTTPException(status_code=400, detail="No models configured for this provider")
        
        # Test with the appropriate model and language for Hindi audio in welcome.wav
        test_language = "hi-IN"  # Since welcome.wav contains Hindi audio
        test_model = None
        
        # Find the best model for Hindi transcription
        for model in available_models:
            if test_language in model.get('supported_languages', []):
                # Prefer multilingual models for Hindi
                if 'multilingual' in model.get('name', '').lower() or 'multilingual' in model.get('description', '').lower():
                    test_model = model
                    break
                # Otherwise, use the first model that supports Hindi
                elif not test_model:
                    test_model = model
        
        # If no Hindi support found, fall back to English with first model
        if not test_model:
            test_model = available_models[0]
            test_language = "en-US"
            # If the model doesn't support English, use the first supported language
            if test_language not in test_model.get('supported_languages', []):
                test_language = test_model.get('supported_languages', ['en-US'])[0]
        
        # Perform transcription test
        result = provider_instance.transcribe_audio(
            audio_file_path=welcome_file,
            model_id=test_model['id'],
            language_code=test_language
        )
        
        # Update provider status based on test result
        is_activated = result.get('success', False) and bool(result.get('transcription', '').strip())
        
        db.update_provider_status(
            provider_id=provider_id,
            is_activated=is_activated,
            test_result="success" if is_activated else "failed",
            transcription=result.get('transcription', ''),
            model_used=test_model['id'],
            language_used=test_language,
            processing_time=result.get('processing_time', 0)
        )
        
        return {
            "success": True,
            "test_result": result,
            "test_file": welcome_file,
            "model_used": test_model['id'],
            "language_used": test_language,
            "provider_activated": is_activated,
            "activation_status": "activated" if is_activated else "failed_activation"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": str(e)}

# Catch-all route for React Router (SPA) - MUST be last!
@app.get("/{path:path}", response_class=HTMLResponse)
async def catch_all(path: str):
    """Catch-all route for React Router single page application"""
    # Don't serve React app for API routes
    if path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    
    # Serve React app for all other routes
    try:
        with open("static/dist/index.html", "r") as f:
            html_content = f.read()
            # Ensure assets are loaded from the correct path
            html_content = html_content.replace('src="/assets/', 'src="/assets/')
            html_content = html_content.replace('href="/assets/', 'href="/assets/')
            return html_content
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Frontend not built")

def run_server():
    """Run the FastAPI server"""
    host = os.getenv('SERVER_HOST', '0.0.0.0')
    port = int(os.getenv('SERVER_PORT', 5005))
    
    uvicorn.run(
        "src.web.app:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    run_server()