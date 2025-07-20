import requests
import json
import time
from typing import List, Dict, Optional, Any

class OpenAIAI:
    """OpenAI AI provider for chat completion and text generation"""
    
    def __init__(self, config: Dict, api_key: str = None):
        self.config = config
        self.api_key = api_key
        self.base_url = config['provider']['base_url']
        self.provider_id = config['provider']['id']
        self.provider_name = config['provider']['name']
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def get_supported_languages(self) -> List[str]:
        """Get list of supported language codes"""
        return list(self.config['languages'].keys())
    
    def get_available_models(self, language_code: str = None) -> List[Dict]:
        """Get available AI models"""
        models = []
        for model in self.config.get('models', []):
            if not language_code or language_code in model.get('supported_languages', []):
                models.append({
                    'id': model['id'],
                    'name': model['name'],
                    'description': model['description'],
                    'supported_languages': model.get('supported_languages', []),
                    'features': model.get('features', []),
                    'max_tokens': model.get('max_tokens', 4096),
                    'provider': self.provider_name
                })
        return models
    
    def chat_completion(self, messages: List[Dict], model_id: str, 
                       temperature: float = 0.7, max_tokens: int = 1000,
                       stream: bool = False) -> Dict:
        """Generate chat completion using OpenAI API"""
        try:
            start_time = time.time()
            
            payload = {
                "model": model_id,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": stream
            }
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
                timeout=60
            )
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            if response.status_code == 200:
                result = response.json()
                
                if stream:
                    return {
                        'success': True,
                        'response': result,
                        'processing_time': processing_time,
                        'provider': self.provider_name,
                        'model': model_id
                    }
                else:
                    message = result['choices'][0]['message']['content']
                    usage = result.get('usage', {})
                    
                    return {
                        'success': True,
                        'message': message,
                        'usage': usage,
                        'processing_time': processing_time,
                        'provider': self.provider_name,
                        'model': model_id,
                        'finish_reason': result['choices'][0].get('finish_reason'),
                        'prompt_tokens': usage.get('prompt_tokens', 0),
                        'completion_tokens': usage.get('completion_tokens', 0),
                        'total_tokens': usage.get('total_tokens', 0)
                    }
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                try:
                    error_data = response.json()
                    if 'error' in error_data:
                        error_msg = error_data['error'].get('message', error_msg)
                except:
                    pass
                
                return {
                    'success': False,
                    'error': error_msg,
                    'processing_time': processing_time
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'processing_time': 0.0
            }
    
    def text_completion(self, prompt: str, model_id: str, 
                       temperature: float = 0.7, max_tokens: int = 1000) -> Dict:
        """Generate text completion (for older models)"""
        try:
            start_time = time.time()
            
            payload = {
                "model": model_id,
                "prompt": prompt,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            
            response = requests.post(
                f"{self.base_url}/completions",
                headers=self.headers,
                json=payload,
                timeout=60
            )
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            if response.status_code == 200:
                result = response.json()
                text = result['choices'][0]['text']
                usage = result.get('usage', {})
                
                return {
                    'success': True,
                    'text': text,
                    'usage': usage,
                    'processing_time': processing_time,
                    'provider': self.provider_name,
                    'model': model_id,
                    'finish_reason': result['choices'][0].get('finish_reason')
                }
            else:
                return {
                    'success': False,
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'processing_time': processing_time
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'processing_time': 0.0
            }
    
    def test_connection(self) -> Dict:
        """Test API connection and key validity"""
        try:
            response = requests.get(
                f"{self.base_url}/models",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                models = response.json()
                return {
                    'success': True,
                    'status': 'Connected',
                    'available_models': len(models.get('data', [])),
                    'provider': self.provider_name
                }
            else:
                return {
                    'success': False,
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'provider': self.provider_name
                }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'provider': self.provider_name
            }
    
    def get_model_info(self, model_id: str) -> Dict:
        """Get detailed information about a specific model"""
        try:
            response = requests.get(
                f"{self.base_url}/models/{model_id}",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'model_info': response.json()
                }
            else:
                return {
                    'success': False,
                    'error': f"HTTP {response.status_code}: {response.text}"
                }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }