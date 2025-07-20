import requests
import json
import time
from typing import List, Dict, Optional, Any

class AnthropicAI:
    """Anthropic Claude AI provider for chat completion and text generation"""
    
    def __init__(self, config: Dict, api_key: str = None):
        self.config = config
        self.api_key = api_key
        self.base_url = config['provider']['base_url']
        self.provider_id = config['provider']['id']
        self.provider_name = config['provider']['name']
        self.headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
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
                    'max_tokens': model.get('max_tokens', 200000),
                    'provider': self.provider_name
                })
        return models
    
    def chat_completion(self, messages: List[Dict], model_id: str, 
                       temperature: float = 0.7, max_tokens: int = 1000,
                       stream: bool = False) -> Dict:
        """Generate chat completion using Anthropic Claude API"""
        try:
            start_time = time.time()
            
            # Convert OpenAI-style messages to Anthropic format
            system_message = ""
            claude_messages = []
            
            for msg in messages:
                if msg["role"] == "system":
                    system_message = msg["content"]
                elif msg["role"] in ["user", "assistant"]:
                    claude_messages.append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })
            
            payload = {
                "model": model_id,
                "messages": claude_messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "stream": stream
            }
            
            if system_message:
                payload["system"] = system_message
            
            response = requests.post(
                f"{self.base_url}/messages",
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
                    message = result['content'][0]['text']
                    usage = result.get('usage', {})
                    
                    return {
                        'success': True,
                        'message': message,
                        'usage': usage,
                        'processing_time': processing_time,
                        'provider': self.provider_name,
                        'model': model_id,
                        'stop_reason': result.get('stop_reason'),
                        'input_tokens': usage.get('input_tokens', 0),
                        'output_tokens': usage.get('output_tokens', 0)
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
        """Generate text completion using messages format"""
        messages = [{"role": "user", "content": prompt}]
        return self.chat_completion(messages, model_id, temperature, max_tokens)
    
    def test_connection(self) -> Dict:
        """Test API connection and key validity"""
        try:
            # Test with a simple message
            test_messages = [{"role": "user", "content": "Hello"}]
            
            payload = {
                "model": "claude-3-haiku-20240307",  # Use fastest model for testing
                "messages": test_messages,
                "max_tokens": 10
            }
            
            response = requests.post(
                f"{self.base_url}/messages",
                headers=self.headers,
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'status': 'Connected',
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
    
    def get_model_capabilities(self, model_id: str) -> Dict:
        """Get model capabilities and limits"""
        model_info = None
        for model in self.config.get('models', []):
            if model['id'] == model_id:
                model_info = model
                break
        
        if model_info:
            return {
                'success': True,
                'model_id': model_id,
                'max_tokens': model_info.get('max_tokens', 200000),
                'features': model_info.get('features', []),
                'supported_languages': model_info.get('supported_languages', [])
            }
        else:
            return {
                'success': False,
                'error': f"Model {model_id} not found in configuration"
            }