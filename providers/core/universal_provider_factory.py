import os
import json
import sys
import importlib.util
from typing import Dict, List, Optional, Any
from pathlib import Path

class UniversalProviderFactory:
    """Universal factory to handle all AI types: ASR, TTS, and AI models"""
    
    def __init__(self, providers_root: str = None):
        if providers_root is None:
            # Default to providers folder (parent of core)
            current_dir = Path(__file__).parent.parent
            self.providers_root = current_dir
        else:
            self.providers_root = Path(providers_root)
        
        # Load centralized language pack
        self.language_pack = self._load_language_pack()
    
    def _load_language_pack(self) -> Dict[str, Dict]:
        """Load centralized language pack from src/config/language_pack.json"""
        try:
            # Navigate to src/config/language_pack.json from providers/core
            language_pack_path = self.providers_root.parent / "src" / "config" / "language_pack.json"
            
            if language_pack_path.exists():
                with open(language_pack_path, 'r', encoding='utf-8') as f:
                    language_pack = json.load(f)
                    return language_pack.get('languages', {})
            else:
                print(f"Language pack not found at: {language_pack_path}")
                return {}
                
        except Exception as e:
            print(f"Error loading language pack: {e}")
            return {}
    
    def get_ai_types(self) -> List[str]:
        """Get available AI types (ASR, TTS, AI, Embedding)"""
        ai_types = []
        valid_ai_types = {'ASR', 'TTS', 'AI', 'Embedding'}
        
        if self.providers_root.exists():
            for item in self.providers_root.iterdir():
                if item.is_dir() and not item.name.startswith('.') and item.name in valid_ai_types:
                    ai_types.append(item.name)
        return sorted(ai_types)
    
    def get_providers_by_type(self, ai_type: str) -> List[str]:
        """Get available providers for a specific AI type"""
        providers = []
        type_path = self.providers_root / ai_type
        if type_path.exists():
            for item in type_path.iterdir():
                if (item.is_dir() and 
                    not item.name.startswith('.') and 
                    item.name not in ['__pycache__', 'core']):
                    providers.append(item.name)
        return sorted(providers)
    
    def get_provider_config(self, ai_type: str, provider_name: str) -> Optional[Dict]:
        """Get provider configuration from config.json"""
        config_path = self.providers_root / ai_type / provider_name / "config.json"
        if config_path.exists():
            try:
                with open(config_path, 'r') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                print(f"Error reading config for {ai_type}/{provider_name}: {e}")
        return None
    
    def get_all_providers_structure(self) -> Dict[str, Dict[str, Any]]:
        """Get complete provider structure with configurations"""
        structure = {}
        
        for ai_type in self.get_ai_types():
            structure[ai_type] = {}
            
            for provider in self.get_providers_by_type(ai_type):
                config = self.get_provider_config(ai_type, provider)
                if config:
                    structure[ai_type][provider] = config
                else:
                    # Fallback for providers without config
                    structure[ai_type][provider] = {
                        "provider": {
                            "id": f"{provider.lower()}-{ai_type.lower()}",
                            "name": f"{provider} {ai_type}",
                            "description": f"{provider} provider for {ai_type}",
                            "requires_api_key": True
                        }
                    }
        
        return structure
    
    def get_models_for_provider(self, ai_type: str, provider_name: str) -> List[Dict]:
        """Get available models for a specific provider"""
        config = self.get_provider_config(ai_type, provider_name)
        if config and 'models' in config:
            return config['models']
        return []
    
    def get_voices_for_provider(self, ai_type: str, provider_name: str) -> List[Dict]:
        """Get available voices for TTS providers"""
        if ai_type.upper() != 'TTS':
            return []
        
        config = self.get_provider_config(ai_type, provider_name)
        if config and 'voices' in config:
            return config['voices']
        return []
    
    def get_languages_for_provider(self, ai_type: str, provider_name: str) -> Dict[str, Dict]:
        """Get supported languages for a provider, resolved from language pack"""
        return self.resolve_provider_languages(ai_type, provider_name)
    
    def get_provider_info(self, ai_type: str, provider_name: str) -> Dict:
        """Get detailed provider information"""
        config = self.get_provider_config(ai_type, provider_name)
        if not config:
            return {}
        
        info = {
            'ai_type': ai_type,
            'provider_name': provider_name,
            'config': config,
            'models': self.get_models_for_provider(ai_type, provider_name),
            'languages': self.get_languages_for_provider(ai_type, provider_name)
        }
        
        # Add voices for TTS providers
        if ai_type.upper() == 'TTS':
            info['voices'] = self.get_voices_for_provider(ai_type, provider_name)
        
        return info
    
    def search_providers(self, search_term: str, ai_type: str = None) -> List[Dict]:
        """Search providers by name or description"""
        results = []
        ai_types_to_search = [ai_type] if ai_type else self.get_ai_types()
        
        for current_ai_type in ai_types_to_search:
            for provider in self.get_providers_by_type(current_ai_type):
                config = self.get_provider_config(current_ai_type, provider)
                if config:
                    provider_info = config.get('provider', {})
                    name = provider_info.get('name', provider).lower()
                    description = provider_info.get('description', '').lower()
                    
                    if (search_term.lower() in name or 
                        search_term.lower() in description or 
                        search_term.lower() in provider.lower()):
                        results.append({
                            'ai_type': current_ai_type,
                            'provider_name': provider,
                            'config': config
                        })
        
        return results
    
    def validate_provider_exists(self, ai_type: str, provider_name: str) -> bool:
        """Check if a provider exists"""
        provider_path = self.providers_root / ai_type / provider_name
        return provider_path.exists() and provider_path.is_dir()
    
    def get_provider_api_requirements(self, ai_type: str, provider_name: str) -> Dict:
        """Get API key requirements for a provider"""
        config = self.get_provider_config(ai_type, provider_name)
        if not config:
            return {'requires_api_key': False}
        
        provider_info = config.get('provider', {})
        return {
            'requires_api_key': provider_info.get('requires_api_key', True),
            'api_key_type': provider_info.get('api_key_type', 'bearer'),
            'base_url': provider_info.get('base_url', ''),
            'auth_header': provider_info.get('auth_header', 'Authorization')
        }
    
    def export_provider_summary(self) -> Dict:
        """Export a summary of all providers for frontend use"""
        summary = {
            'ai_types': self.get_ai_types(),
            'providers_by_type': {},
            'total_providers': 0
        }
        
        for ai_type in summary['ai_types']:
            providers = self.get_providers_by_type(ai_type)
            summary['providers_by_type'][ai_type] = []
            
            for provider in providers:
                config = self.get_provider_config(ai_type, provider)
                provider_summary = {
                    'name': provider,
                    'display_name': provider,
                    'models_count': 0,
                    'languages_count': 0,
                    'requires_api_key': True
                }
                
                if config:
                    provider_info = config.get('provider', {})
                    provider_summary.update({
                        'display_name': provider_info.get('name', provider),
                        'description': provider_info.get('description', ''),
                        'requires_api_key': provider_info.get('requires_api_key', True),
                        'icon_url': provider_info.get('icon_url', ''),
                        'models_count': len(config.get('models', [])),
                        'languages_count': len(config.get('supported_languages', [])),
                        'voices_count': len(config.get('voices', []))
                    })
                
                summary['providers_by_type'][ai_type].append(provider_summary)
                summary['total_providers'] += 1
        
        return summary
    
    def get_language_info(self, language_code: str) -> Optional[Dict]:
        """Get full language information from language pack by code"""
        return self.language_pack.get(language_code)
    
    def resolve_provider_languages(self, ai_type: str, provider_name: str) -> Dict[str, Dict]:
        """Resolve provider language codes to full language information"""
        config = self.get_provider_config(ai_type, provider_name)
        if not config:
            return {}
        
        # Get language codes from provider config
        provider_language_codes = config.get('supported_languages', [])
        if isinstance(provider_language_codes, dict):
            # If it's already a dict with language info, extract keys
            provider_language_codes = list(provider_language_codes.keys())
        
        # Map language codes to full language information
        resolved_languages = {}
        for lang_code in provider_language_codes:
            lang_info = self.get_language_info(lang_code)
            if lang_info:
                resolved_languages[lang_code] = lang_info
            else:
                # Fallback for unknown language codes
                resolved_languages[lang_code] = {
                    "name": lang_code,
                    "flag": "🌐",
                    "region": "Unknown"
                }
        
        return resolved_languages
    
    def get_all_supported_languages(self) -> Dict[str, Dict]:
        """Get all languages supported by at least one provider"""
        all_supported = {}
        
        for ai_type in self.get_ai_types():
            for provider in self.get_providers_by_type(ai_type):
                provider_languages = self.resolve_provider_languages(ai_type, provider)
                all_supported.update(provider_languages)
        
        return all_supported
    
    def load_provider_class(self, ai_type: str, provider_name: str):
        """Load provider class from the proper file structure"""
        try:
            # Map AI types to their file patterns
            file_patterns = {
                'ASR': f'{provider_name.lower()}_asr.py',
                'TTS': f'{provider_name.lower()}_tts.py', 
                'AI': f'{provider_name.lower()}_ai.py',
                'Embedding': f'{provider_name.lower()}_embedding.py'
            }
            
            # Map AI types to class patterns
            class_patterns = {
                'ASR': f'{provider_name}ASR',
                'TTS': f'{provider_name}TTS',
                'AI': f'{provider_name}AI',
                'Embedding': f'{provider_name}Embedding'
            }
            
            file_name = file_patterns.get(ai_type)
            class_name = class_patterns.get(ai_type)
            
            if not file_name or not class_name:
                return None
            
            # Build path to provider file
            provider_file = self.providers_root / ai_type / provider_name / file_name
            
            if not provider_file.exists():
                print(f"Provider file not found: {provider_file}")
                return None
            
            # Load module dynamically
            spec = importlib.util.spec_from_file_location(
                f"{ai_type.lower()}_{provider_name.lower()}", 
                provider_file
            )
            if spec and spec.loader:
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
                # Get provider class
                if hasattr(module, class_name):
                    return getattr(module, class_name)
                else:
                    print(f"Class {class_name} not found in {provider_file}")
                    return None
        
        except Exception as e:
            print(f"Failed to load provider class {ai_type}/{provider_name}: {e}")
            return None
    
    def create_provider_instance(self, ai_type: str, provider_name: str, api_key: str = None):
        """Create provider instance from the new file structure"""
        try:
            provider_class = self.load_provider_class(ai_type, provider_name)
            if not provider_class:
                return None
            
            config = self.get_provider_config(ai_type, provider_name)
            if not config:
                return None
            
            # Create instance with config and API key
            return provider_class(config, api_key)
            
        except Exception as e:
            print(f"Failed to create provider instance {ai_type}/{provider_name}: {e}")
            return None
    
    def test_provider_connection(self, ai_type: str, provider_name: str, api_key: str) -> Dict:
        """Test provider connection using the new structure"""
        try:
            instance = self.create_provider_instance(ai_type, provider_name, api_key)
            if not instance:
                return {
                    'success': False,
                    'error': f'Failed to create {ai_type} provider instance for {provider_name}'
                }
            
            # Call test_connection method if available
            if hasattr(instance, 'test_connection'):
                return instance.test_connection()
            else:
                return {
                    'success': True,
                    'message': f'{provider_name} {ai_type} provider loaded successfully',
                    'note': 'No test_connection method available'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_provider_models_dynamic(self, ai_type: str, provider_name: str, api_key: str = None) -> List[Dict]:
        """Get models dynamically from provider instance"""
        try:
            instance = self.create_provider_instance(ai_type, provider_name, api_key)
            if not instance:
                # Fallback to config-based models
                return self.get_models_for_provider(ai_type, provider_name)
            
            if hasattr(instance, 'get_available_models'):
                return instance.get_available_models()
            else:
                # Fallback to config-based models
                return self.get_models_for_provider(ai_type, provider_name)
                
        except Exception as e:
            print(f"Failed to get dynamic models for {ai_type}/{provider_name}: {e}")
            return self.get_models_for_provider(ai_type, provider_name)

# Create a global instance
provider_factory = UniversalProviderFactory()