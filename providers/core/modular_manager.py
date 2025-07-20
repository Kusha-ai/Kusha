import os
import json
import glob
from typing import Dict, List, Optional, Any
from pathlib import Path

class ModularProviderManager:
    """Manages modular ASR providers with config-based extensions"""
    
    def __init__(self, extensions_dir: str = None):
        if extensions_dir is None:
            extensions_dir = os.path.join(os.path.dirname(__file__), 'extensions')
        self.extensions_dir = Path(extensions_dir)
        self._provider_configs = {}
        self._load_provider_configs()
    
    def _load_provider_configs(self):
        """Load all provider configurations from extensions directory"""
        self._provider_configs = {}
        
        for provider_dir in self.extensions_dir.glob('*/'):
            if provider_dir.is_dir():
                config_file = provider_dir / 'config.json'
                if config_file.exists():
                    try:
                        with open(config_file, 'r', encoding='utf-8') as f:
                            config = json.load(f)
                            provider_id = config['provider']['id']
                            self._provider_configs[provider_id] = config
                    except Exception as e:
                        print(f"Error loading config for {provider_dir.name}: {e}")
    
    def get_available_providers(self) -> Dict[str, Dict]:
        """Get all available providers with their basic info"""
        providers = {}
        for provider_id, config in self._provider_configs.items():
            provider_info = config['provider'].copy()
            providers[provider_id] = provider_info
        return providers
    
    def get_provider_config(self, provider_id: str) -> Optional[Dict]:
        """Get full configuration for a specific provider"""
        return self._provider_configs.get(provider_id)
    
    def get_all_languages(self) -> Dict[str, Dict]:
        """Get all supported languages across all providers"""
        all_languages = {}
        
        for config in self._provider_configs.values():
            languages = config.get('languages', {})
            for lang_code, lang_info in languages.items():
                if lang_code not in all_languages:
                    all_languages[lang_code] = lang_info
                    all_languages[lang_code]['providers'] = []
                
                if config['provider']['id'] not in all_languages[lang_code]['providers']:
                    all_languages[lang_code]['providers'].append(config['provider']['id'])
        
        return all_languages
    
    def get_models_for_language(self, language_code: str, available_providers: List[str] = None) -> List[Dict]:
        """Get all models that support a specific language"""
        models = []
        
        for provider_id, config in self._provider_configs.items():
            # Filter by available providers if specified
            if available_providers and provider_id not in available_providers:
                continue
            
            provider_info = config['provider']
            provider_models = config.get('models', [])
            
            for model in provider_models:
                if language_code in model.get('supported_languages', []):
                    model_info = {
                        'provider_id': provider_id,
                        'provider_name': provider_info['name'],
                        'provider_logo': provider_info.get('logo'),
                        'provider_favicon': provider_info.get('favicon'),
                        'model_id': model['id'],
                        'model_name': model['name'],
                        'description': model.get('description', ''),
                        'requires_api_key': provider_info.get('requires_api_key', True),
                        'api_key_type': provider_info.get('api_key_type', 'string')
                    }
                    models.append(model_info)
        
        return models
    
    def get_provider_models(self, provider_id: str) -> List[Dict]:
        """Get all models for a specific provider"""
        config = self._provider_configs.get(provider_id)
        if not config:
            return []
        
        provider_info = config['provider']
        models = []
        
        for model in config.get('models', []):
            model_info = {
                'provider_id': provider_id,
                'provider_name': provider_info['name'],
                'model_id': model['id'],
                'model_name': model['name'],
                'description': model.get('description', ''),
                'supported_languages': model.get('supported_languages', []),
                'requires_api_key': provider_info.get('requires_api_key', True)
            }
            models.append(model_info)
        
        return models
    
    def get_languages_by_region(self) -> Dict[str, List[Dict]]:
        """Group languages by region"""
        all_languages = self.get_all_languages()
        regions = {}
        
        for lang_code, lang_info in all_languages.items():
            region = lang_info.get('region', 'Other')
            if region not in regions:
                regions[region] = []
            
            regions[region].append({
                'code': lang_code,
                'name': lang_info['name'],
                'flag': lang_info.get('flag', '🌐'),
                'providers': lang_info.get('providers', [])
            })
        
        # Sort languages within each region
        for region in regions:
            regions[region].sort(key=lambda x: x['name'])
        
        return regions
    
    def validate_provider_config(self, provider_id: str) -> List[str]:
        """Validate provider configuration and return any errors"""
        errors = []
        config = self._provider_configs.get(provider_id)
        
        if not config:
            errors.append(f"Provider {provider_id} not found")
            return errors
        
        # Validate required fields
        provider_info = config.get('provider', {})
        required_fields = ['id', 'name', 'description']
        
        for field in required_fields:
            if field not in provider_info:
                errors.append(f"Missing required field: provider.{field}")
        
        # Validate models
        models = config.get('models', [])
        if not models:
            errors.append("No models defined")
        
        for i, model in enumerate(models):
            if 'id' not in model:
                errors.append(f"Model {i}: Missing id")
            if 'name' not in model:
                errors.append(f"Model {i}: Missing name")
            if 'supported_languages' not in model:
                errors.append(f"Model {i}: Missing supported_languages")
        
        # Validate languages
        languages = config.get('languages', {})
        if not languages:
            errors.append("No languages defined")
        
        return errors
    
    def get_provider_stats(self) -> Dict[str, Any]:
        """Get statistics about loaded providers"""
        stats = {
            'total_providers': len(self._provider_configs),
            'total_models': 0,
            'total_languages': len(self.get_all_languages()),
            'providers_by_api_requirement': {'required': 0, 'optional': 0},
            'languages_by_region': {}
        }
        
        for config in self._provider_configs.values():
            stats['total_models'] += len(config.get('models', []))
            
            if config['provider'].get('requires_api_key', True):
                stats['providers_by_api_requirement']['required'] += 1
            else:
                stats['providers_by_api_requirement']['optional'] += 1
        
        regions = self.get_languages_by_region()
        for region, languages in regions.items():
            stats['languages_by_region'][region] = len(languages)
        
        return stats
    
    def reload_configs(self):
        """Reload all provider configurations"""
        self._load_provider_configs()
    
    def add_provider_extension(self, provider_id: str, config: Dict) -> bool:
        """Add a new provider extension programmatically"""
        try:
            provider_dir = self.extensions_dir / provider_id
            provider_dir.mkdir(exist_ok=True)
            
            config_file = provider_dir / 'config.json'
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            
            self._provider_configs[provider_id] = config
            return True
        except Exception as e:
            print(f"Error adding provider extension {provider_id}: {e}")
            return False
    
    def get_all_providers(self) -> List[Dict]:
        """Get all providers as a list with their configurations"""
        providers = []
        for provider_id, config in self._provider_configs.items():
            provider_info = config['provider'].copy()
            provider_info['id'] = provider_id
            providers.append(provider_info)
        return providers
    
    def get_provider_ids(self) -> List[str]:
        """Get list of all provider IDs"""
        return list(self._provider_configs.keys())
    
    def get_all_models(self, available_providers: List[str] = None) -> List[Dict]:
        """Get all models from all providers"""
        models = []
        
        for provider_id, config in self._provider_configs.items():
            # Filter by available providers if specified
            if available_providers and provider_id not in available_providers:
                continue
            
            provider_info = config['provider']
            provider_models = config.get('models', [])
            
            for model in provider_models:
                model_info = {
                    'id': f"{provider_id}-{model['id']}",
                    'name': model['name'],
                    'provider_id': provider_id,
                    'provider_name': provider_info['name'],
                    'description': model.get('description', ''),
                    'features': model.get('features', []),
                    'languages': model.get('supported_languages', []),
                    'hasApiKey': False  # Will be set by the API endpoint
                }
                models.append(model_info)
        
        return models
    
    def get_all_languages_formatted(self) -> List[Dict]:
        """Get all languages formatted for frontend consumption"""
        all_languages = self.get_all_languages()
        languages = []
        
        for lang_code, lang_info in all_languages.items():
            language = {
                'code': lang_code,
                'name': lang_info['name'],
                'flag': lang_info.get('flag', '🌐'),
                'region': lang_info.get('region', 'Other')
            }
            languages.append(language)
        
        # Sort by region (India first) then by name
        languages.sort(key=lambda x: (x['region'] != 'India', x['region'], x['name']))
        return languages