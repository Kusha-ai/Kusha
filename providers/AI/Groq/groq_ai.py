import requests
import json
import time
from typing import List, Dict, Optional, Any

class GroqAI:
    """Groq AI provider for ultra-fast inference with LLaMA and Mixtral models"""
    
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
                    'context_window': model.get('context_window', 8192),
                    'provider': self.provider_name
                })
        return models
    
    def chat_completion(self, messages: List[Dict], model_id: str, 
                       temperature: float = 0.7, max_tokens: int = 1000,
                       stream: bool = False) -> Dict:
        """Generate chat completion using Groq API"""
        try:
            start_time = time.time()
            
            payload = {
                "model": model_id,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": stream,
                "top_p": 1,
                "stop": None
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
                        'total_tokens': usage.get('total_tokens', 0),
                        'tokens_per_second': usage.get('completion_tokens', 0) / max(processing_time, 0.001)  # Groq is fast!
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
        """Generate text completion using chat format"""
        messages = [{"role": "user", "content": prompt}]
        return self.chat_completion(messages, model_id, temperature, max_tokens)
    
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
                    'provider': self.provider_name,
                    'note': 'Groq provides ultra-fast inference'
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
    
    def get_speed_benchmark(self, model_id: str, test_prompt: str = "Explain quantum computing in simple terms.") -> Dict:
        """Benchmark the speed of Groq inference"""
        try:
            messages = [{"role": "user", "content": test_prompt}]
            
            # Run multiple iterations for accurate benchmarking
            times = []
            tokens_per_second = []
            
            for i in range(3):  # 3 iterations
                result = self.chat_completion(messages, model_id, max_tokens=100)
                
                if result['success']:
                    times.append(result['processing_time'])
                    if 'tokens_per_second' in result:
                        tokens_per_second.append(result['tokens_per_second'])
            
            if times:
                avg_time = sum(times) / len(times)
                avg_tokens_per_sec = sum(tokens_per_second) / len(tokens_per_second) if tokens_per_second else 0
                
                return {
                    'success': True,
                    'model': model_id,
                    'average_response_time': avg_time,
                    'average_tokens_per_second': avg_tokens_per_sec,
                    'iterations': len(times),
                    'provider': self.provider_name
                }
            else:
                return {
                    'success': False,
                    'error': 'No successful benchmark runs',
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
                model_data = response.json()
                return {
                    'success': True,
                    'model_info': model_data,
                    'speed_optimized': True,
                    'provider': self.provider_name
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