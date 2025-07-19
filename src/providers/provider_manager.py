import os
import json
import sys
import importlib.util
from pathlib import Path
from typing import Dict, List, Optional, Any

class ProviderManager:
    """Manages ASR providers by scanning the providers folder"""
    
    def __init__(self, providers_dir: str = None):
        if providers_dir is None:
            # Default to providers folder in project root
            project_root = Path(__file__).parent.parent.parent
            providers_dir = project_root / 'providers'
        
        self.providers_dir = Path(providers_dir)
        self.providers = {}
        
        # Load centralized language pack
        self._load_language_pack()
        self._load_providers()
    
    def _load_language_pack(self):
        """Load centralized language pack"""
        try:
            # Load language pack from config folder
            language_pack_file = Path(__file__).parent.parent / 'config' / 'language_pack.json'
            
            if language_pack_file.exists():
                with open(language_pack_file, 'r', encoding='utf-8') as f:
                    language_pack = json.load(f)
                    self.language_pack = language_pack.get('languages', {})
            else:
                print(f"Language pack not found: {language_pack_file}")
                self.language_pack = {}
                
        except Exception as e:
            print(f"Error loading language pack: {e}")
            self.language_pack = {}
    
    def _load_providers(self):
        """Load all providers from the providers directory with nested structure support"""
        self.providers = {}
        
        if not self.providers_dir.exists():
            print(f"Providers directory not found: {self.providers_dir}")
            return
        
        # Scan for both old flat structure and new nested structure
        ai_types = ['ASR', 'TTS', 'AI', 'Embedding']
        
        # First, try to load from nested structure (providers/ASR/, providers/TTS/, etc.)
        for ai_type in ai_types:
            ai_type_dir = self.providers_dir / ai_type
            if ai_type_dir.exists() and ai_type_dir.is_dir():
                print(f"Loading {ai_type} providers from {ai_type_dir}")
                for provider_path in ai_type_dir.iterdir():
                    if provider_path.is_dir():
                        self._load_provider(provider_path, ai_type)
        
        # Fallback: scan root providers directory for backwards compatibility
        for provider_path in self.providers_dir.iterdir():
            if provider_path.is_dir() and provider_path.name not in ai_types:
                self._load_provider(provider_path, 'ASR')  # Default to ASR for legacy providers
    
    def _load_provider(self, provider_path: Path, ai_type: str = 'ASR'):
        """Load a single provider from its directory"""
        provider_name = provider_path.name
        config_file = provider_path / 'config.json'
        
        if not config_file.exists():
            print(f"No config.json found for provider: {provider_name}")
            return
        
        try:
            # Load config
            with open(config_file, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            provider_id = config['provider']['id']
            
            # Find the Python implementation file
            python_files = list(provider_path.glob('*.py'))
            if not python_files:
                print(f"No Python implementation found for provider: {provider_name}")
                return
            
            # Use the first Python file (or find one that matches pattern)
            impl_file = None
            for py_file in python_files:
                if py_file.name.endswith('_asr.py') or py_file.name == f"{provider_id}_asr.py":
                    impl_file = py_file
                    break
            
            if not impl_file:
                impl_file = python_files[0]  # Use first Python file as fallback
            
            # Add provider_type to config if not present
            if 'provider_type' not in config['provider']:
                config['provider']['provider_type'] = ai_type
            
            # Store provider info
            self.providers[provider_id] = {
                'config': config,
                'path': provider_path,
                'impl_file': impl_file,
                'name': provider_name,
                'ai_type': ai_type
            }
            
            print(f"Loaded {ai_type} provider: {provider_name} ({provider_id})")
            
        except Exception as e:
            print(f"Error loading provider {provider_name}: {e}")
    
    def get_all_languages(self) -> List[Dict]:
        """Get all languages from centralized language pack, filtered by provider support"""
        supported_languages = {}
        
        # Collect all language codes supported by providers
        for provider_id, provider_info in self.providers.items():
            config = provider_info['config']
            provider_models = config.get('models', [])
            
            for model in provider_models:
                for lang_code in model.get('supported_languages', []):
                    if lang_code not in supported_languages:
                        supported_languages[lang_code] = []
                    if provider_id not in supported_languages[lang_code]:
                        supported_languages[lang_code].append(provider_id)
        
        # Build language list using centralized language pack
        languages_list = []
        for lang_code in supported_languages:
            if lang_code in self.language_pack:
                lang_info = self.language_pack[lang_code]
                languages_list.append({
                    'code': lang_code,
                    'name': lang_info['name'],
                    'flag': lang_info.get('flag', '🌐'),
                    'region': lang_info.get('region', 'Other'),
                    'providers': supported_languages[lang_code]
                })
            else:
                # Fallback for languages not in language pack
                languages_list.append({
                    'code': lang_code,
                    'name': lang_code.upper(),
                    'flag': '🌐',
                    'region': 'Other',
                    'providers': supported_languages[lang_code]
                })
        
        # Sort by region (India first) then by name
        languages_list.sort(key=lambda x: (x['region'] != 'India', x['region'], x['name']))
        return languages_list
    
    def get_models_for_language(self, language_code: str) -> List[Dict]:
        """Get all models that support a specific language with provider info"""
        models = []
        
        for provider_id, provider_info in self.providers.items():
            config = provider_info['config']
            provider_config = config['provider']
            provider_models = config.get('models', [])
            
            for model in provider_models:
                if language_code in model.get('supported_languages', []):
                    model_info = {
                        'id': f"{provider_id}-{model['id']}",
                        'provider_id': provider_id,
                        'provider_name': provider_config['name'],
                        'provider_folder': provider_info['name'],
                        'model_id': model['id'],
                        'name': model['name'],
                        'description': model.get('description', ''),
                        'features': model.get('features', []),
                        'supported_languages': model.get('supported_languages', []),
                        'requires_api_key': provider_config.get('requires_api_key', True)
                    }
                    models.append(model_info)
        
        return models
    
    def get_provider_instance(self, provider_id: str, api_key: str = None):
        """Get an instance of a provider class"""
        if provider_id not in self.providers:
            raise ValueError(f"Provider {provider_id} not found")
        
        provider_info = self.providers[provider_id]
        config = provider_info['config']
        impl_file = provider_info['impl_file']
        
        try:
            # Dynamically import the provider module
            spec = importlib.util.spec_from_file_location(f"{provider_id}_module", impl_file)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            
            # Find the ASR class (convention: ProviderNameASR)
            class_name = None
            for attr_name in dir(module):
                if attr_name.endswith('ASR') and not attr_name.startswith('_'):
                    class_name = attr_name
                    break
            
            if not class_name:
                raise ValueError(f"No ASR class found in {impl_file}")
            
            provider_class = getattr(module, class_name)
            
            # Initialize the provider
            if config['provider'].get('requires_api_key', True):
                return provider_class(config, api_key)
            else:
                return provider_class(config)
            
        except Exception as e:
            raise Exception(f"Failed to instantiate provider {provider_id}: {e}")
    
    def get_provider_config(self, provider_id: str) -> Optional[Dict]:
        """Get the configuration for a specific provider"""
        provider_info = self.providers.get(provider_id)
        return provider_info['config'] if provider_info else None
    
    def get_all_providers(self) -> List[Dict]:
        """Get all provider configurations"""
        providers_list = []
        for provider_id, provider_info in self.providers.items():
            config = provider_info['config']['provider'].copy()
            config['id'] = provider_id
            config['folder_name'] = provider_info['name']
            config['provider_type'] = provider_info.get('ai_type', 'ASR')  # Include AI type
            providers_list.append(config)
        return providers_list
    
    def get_provider_ids(self) -> List[str]:
        """Get list of all provider IDs"""
        return list(self.providers.keys())
    
    def test_provider_connection(self, provider_id: str, api_key: str = None) -> Dict[str, Any]:
        """Test connection to a specific provider"""
        try:
            provider_instance = self.get_provider_instance(provider_id, api_key)
            return provider_instance.test_connection()
        except Exception as e:
            return {
                'success': False,
                'message': f"Failed to test provider {provider_id}: {str(e)}"
            }
    
    def get_provider_stats(self) -> Dict[str, Any]:
        """Get statistics about loaded providers"""
        total_models = 0
        total_languages = len(self.get_all_languages())
        api_required_count = 0
        
        for provider_info in self.providers.values():
            config = provider_info['config']
            total_models += len(config.get('models', []))
            if config['provider'].get('requires_api_key', True):
                api_required_count += 1
        
        return {
            'total_providers': len(self.providers),
            'total_models': total_models,
            'total_languages': total_languages,
            'providers_requiring_api_key': api_required_count,
            'providers_no_api_key': len(self.providers) - api_required_count
        }
    
    def reload_providers(self):
        """Reload all providers from disk"""
        self._load_providers()
    
    def add_provider_folder(self, provider_folder_path: str) -> bool:
        """Add a new provider folder dynamically"""
        try:
            provider_path = Path(provider_folder_path)
            if provider_path.exists() and provider_path.is_dir():
                self._load_provider(provider_path)
                return True
            return False
        except Exception as e:
            print(f"Error adding provider folder {provider_folder_path}: {e}")
            return False