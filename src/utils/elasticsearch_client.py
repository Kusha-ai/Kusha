"""
Elasticsearch client for ASR Speed Test analytics and reporting.
"""
import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import ConnectionError, NotFoundError

logger = logging.getLogger(__name__)

class ElasticsearchClient:
    """Elasticsearch client for ASR test results and analytics."""
    
    def __init__(self):
        self.es_url = os.getenv('ELASTICSEARCH_URL', 'http://localhost:9200')
        self.client = None
        self.test_results_index = 'asr-test-results'
        self.test_sessions_index = 'asr-test-sessions'
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Elasticsearch client."""
        try:
            self.client = Elasticsearch(
                hosts=[self.es_url],
                timeout=30,
                max_retries=3,
                retry_on_timeout=True
            )
            
            # Test connection
            if self.client.ping():
                logger.info(f"Connected to Elasticsearch at {self.es_url}")
                self._create_indices()
            else:
                logger.error("Failed to connect to Elasticsearch")
                self.client = None
        except Exception as e:
            logger.error(f"Failed to initialize Elasticsearch client: {e}")
            self.client = None
    
    def _create_indices(self):
        """Create indices with proper mappings."""
        try:
            # Test results index mapping
            test_results_mapping = {
                "mappings": {
                    "properties": {
                        "test_id": {"type": "keyword"},
                        "session_id": {"type": "keyword"},
                        "timestamp": {"type": "date"},
                        "provider": {"type": "keyword"},
                        "model_id": {"type": "keyword"},
                        "model_name": {"type": "text"},
                        "language": {"type": "keyword"},
                        "audio_duration": {"type": "float"},
                        "audio_file_size": {"type": "long"},
                        "audio_format": {"type": "keyword"},
                        "processing_time": {"type": "float"},
                        "confidence": {"type": "float"},
                        "success": {"type": "boolean"},
                        "transcription": {"type": "text"},
                        "error_message": {"type": "text"},
                        "inference_speed": {"type": "float"},  # processing_time / audio_duration
                        "real_time_factor": {"type": "float"},  # audio_duration / processing_time
                        "user_agent": {"type": "text"},
                        "ip_address": {"type": "ip"}
                    }
                }
            }
            
            # Test sessions index mapping
            test_sessions_mapping = {
                "mappings": {
                    "properties": {
                        "session_id": {"type": "keyword"},
                        "timestamp": {"type": "date"},
                        "language": {"type": "keyword"},
                        "selected_models": {"type": "keyword"},
                        "total_models": {"type": "integer"},
                        "successful_models": {"type": "integer"},
                        "failed_models": {"type": "integer"},
                        "total_duration": {"type": "float"},
                        "avg_processing_time": {"type": "float"},
                        "avg_confidence": {"type": "float"},
                        "audio_duration": {"type": "float"},
                        "audio_file_size": {"type": "long"},
                        "audio_format": {"type": "keyword"},
                        "user_agent": {"type": "text"},
                        "ip_address": {"type": "ip"}
                    }
                }
            }
            
            # Create indices if they don't exist
            if not self.client.indices.exists(index=self.test_results_index):
                self.client.indices.create(index=self.test_results_index, body=test_results_mapping)
                logger.info(f"Created index: {self.test_results_index}")
            
            if not self.client.indices.exists(index=self.test_sessions_index):
                self.client.indices.create(index=self.test_sessions_index, body=test_sessions_mapping)
                logger.info(f"Created index: {self.test_sessions_index}")
                
        except Exception as e:
            logger.error(f"Failed to create indices: {e}")
    
    def is_connected(self) -> bool:
        """Check if Elasticsearch is connected."""
        return self.client is not None and self.client.ping()
    
    def index_test_result(self, test_result: Dict[str, Any]) -> bool:
        """Index a single test result."""
        if not self.is_connected():
            logger.warning("Elasticsearch not connected, skipping indexing")
            return False
        
        try:
            # Calculate inference metrics
            if test_result.get('processing_time') and test_result.get('audio_duration'):
                test_result['inference_speed'] = test_result['processing_time'] / test_result['audio_duration']
                test_result['real_time_factor'] = test_result['audio_duration'] / test_result['processing_time']
            
            # Add timestamp if not present
            if 'timestamp' not in test_result:
                test_result['timestamp'] = datetime.utcnow()
            
            response = self.client.index(
                index=self.test_results_index,
                body=test_result,
                id=test_result.get('test_id')
            )
            
            logger.info(f"Indexed test result: {test_result.get('test_id')}")
            return response.get('result') == 'created' or response.get('result') == 'updated'
            
        except Exception as e:
            logger.error(f"Failed to index test result: {e}")
            return False
    
    def index_test_session(self, session_data: Dict[str, Any]) -> bool:
        """Index a test session summary."""
        if not self.is_connected():
            logger.warning("Elasticsearch not connected, skipping session indexing")
            return False
        
        try:
            # Add timestamp if not present
            if 'timestamp' not in session_data:
                session_data['timestamp'] = datetime.utcnow()
            
            response = self.client.index(
                index=self.test_sessions_index,
                body=session_data,
                id=session_data.get('session_id')
            )
            
            logger.info(f"Indexed test session: {session_data.get('session_id')}")
            return response.get('result') == 'created' or response.get('result') == 'updated'
            
        except Exception as e:
            logger.error(f"Failed to index test session: {e}")
            return False
    
    def search_test_results(self, query: Dict[str, Any], size: int = 100) -> List[Dict[str, Any]]:
        """Search test results."""
        if not self.is_connected():
            return []
        
        try:
            response = self.client.search(
                index=self.test_results_index,
                body=query,
                size=size
            )
            
            return [hit['_source'] for hit in response['hits']['hits']]
            
        except Exception as e:
            logger.error(f"Failed to search test results: {e}")
            return []
    
    def get_provider_performance_stats(self, days: int = 30) -> Dict[str, Any]:
        """Get provider performance statistics."""
        if not self.is_connected():
            return {}
        
        try:
            query = {
                "size": 0,
                "query": {
                    "range": {
                        "timestamp": {
                            "gte": f"now-{days}d"
                        }
                    }
                },
                "aggs": {
                    "providers": {
                        "terms": {"field": "provider", "size": 20},
                        "aggs": {
                            "avg_processing_time": {"avg": {"field": "processing_time"}},
                            "avg_confidence": {"avg": {"field": "confidence"}},
                            "avg_inference_speed": {"avg": {"field": "inference_speed"}},
                            "success_rate": {
                                "value_count": {"field": "success"}
                            },
                            "languages": {
                                "terms": {"field": "language", "size": 50}
                            }
                        }
                    }
                }
            }
            
            response = self.client.search(index=self.test_results_index, body=query)
            return response['aggregations']
            
        except Exception as e:
            logger.error(f"Failed to get provider performance stats: {e}")
            return {}
    
    def get_language_performance_stats(self, days: int = 30) -> Dict[str, Any]:
        """Get language performance statistics."""
        if not self.is_connected():
            return {}
        
        try:
            query = {
                "size": 0,
                "query": {
                    "range": {
                        "timestamp": {
                            "gte": f"now-{days}d"
                        }
                    }
                },
                "aggs": {
                    "languages": {
                        "terms": {"field": "language", "size": 50},
                        "aggs": {
                            "avg_processing_time": {"avg": {"field": "processing_time"}},
                            "avg_confidence": {"avg": {"field": "confidence"}},
                            "avg_inference_speed": {"avg": {"field": "inference_speed"}},
                            "providers": {
                                "terms": {"field": "provider", "size": 20}
                            }
                        }
                    }
                }
            }
            
            response = self.client.search(index=self.test_results_index, body=query)
            return response['aggregations']
            
        except Exception as e:
            logger.error(f"Failed to get language performance stats: {e}")
            return {}
    
    def get_recording_length_analysis(self, days: int = 30) -> Dict[str, Any]:
        """Get recording length vs performance analysis."""
        if not self.is_connected():
            return {}
        
        try:
            query = {
                "size": 0,
                "query": {
                    "range": {
                        "timestamp": {
                            "gte": f"now-{days}d"
                        }
                    }
                },
                "aggs": {
                    "duration_buckets": {
                        "histogram": {
                            "field": "audio_duration",
                            "interval": 5,
                            "min_doc_count": 1
                        },
                        "aggs": {
                            "avg_processing_time": {"avg": {"field": "processing_time"}},
                            "avg_confidence": {"avg": {"field": "confidence"}},
                            "avg_inference_speed": {"avg": {"field": "inference_speed"}},
                            "providers": {
                                "terms": {"field": "provider", "size": 20}
                            }
                        }
                    }
                }
            }
            
            response = self.client.search(index=self.test_results_index, body=query)
            return response['aggregations']
            
        except Exception as e:
            logger.error(f"Failed to get recording length analysis: {e}")
            return {}
    
    def get_recent_test_results(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent test results."""
        if not self.is_connected():
            return []
        
        try:
            query = {
                "sort": [{"timestamp": {"order": "desc"}}],
                "size": limit
            }
            
            response = self.client.search(index=self.test_results_index, body=query)
            return [hit['_source'] for hit in response['hits']['hits']]
            
        except Exception as e:
            logger.error(f"Failed to get recent test results: {e}")
            return []
    
    def get_test_volume_over_time(self, days: int = 30) -> Dict[str, Any]:
        """Get test volume over time."""
        if not self.is_connected():
            return {}
        
        try:
            query = {
                "size": 0,
                "query": {
                    "range": {
                        "timestamp": {
                            "gte": f"now-{days}d"
                        }
                    }
                },
                "aggs": {
                    "tests_over_time": {
                        "date_histogram": {
                            "field": "timestamp",
                            "calendar_interval": "1d",
                            "min_doc_count": 0
                        },
                        "aggs": {
                            "providers": {
                                "terms": {"field": "provider", "size": 20}
                            },
                            "languages": {
                                "terms": {"field": "language", "size": 50}
                            }
                        }
                    }
                }
            }
            
            response = self.client.search(index=self.test_results_index, body=query)
            return response['aggregations']
            
        except Exception as e:
            logger.error(f"Failed to get test volume over time: {e}")
            return {}

# Global instance
es_client = ElasticsearchClient()