import sqlite3
import os
from typing import Optional, Dict, List

class DatabaseManager:
    def __init__(self, db_path: str = "asr_config.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS api_keys (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    provider TEXT UNIQUE NOT NULL,
                    api_key TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS provider_models (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    provider TEXT NOT NULL,
                    model_name TEXT NOT NULL,
                    model_id TEXT NOT NULL,
                    language_code TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(provider, model_id)
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS test_results (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    provider TEXT NOT NULL,
                    model_id TEXT NOT NULL,
                    language_code TEXT,
                    audio_duration REAL,
                    processing_time REAL,
                    transcription TEXT,
                    accuracy_score REAL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS provider_status (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    provider_id TEXT UNIQUE NOT NULL,
                    is_activated BOOLEAN DEFAULT FALSE,
                    last_test_date TIMESTAMP,
                    last_test_result TEXT,
                    last_transcription TEXT,
                    test_model_used TEXT,
                    test_language_used TEXT,
                    test_processing_time REAL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()
    
    def save_api_key(self, provider: str, api_key: str) -> bool:
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO api_keys (provider, api_key, updated_at) 
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                """, (provider, api_key))
                conn.commit()
                return True
        except Exception as e:
            print(f"Error saving API key: {e}")
            return False
    
    def get_api_key(self, provider: str) -> Optional[str]:
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT api_key FROM api_keys WHERE provider = ?", (provider,))
                result = cursor.fetchone()
                return result[0] if result else None
        except Exception as e:
            print(f"Error retrieving API key: {e}")
            return None
    
    def get_all_api_keys(self) -> Dict[str, str]:
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT provider, api_key FROM api_keys")
                results = cursor.fetchall()
                return {provider: api_key for provider, api_key in results}
        except Exception as e:
            print(f"Error retrieving API keys: {e}")
            return {}
    
    def save_models(self, provider: str, models: List[Dict]) -> bool:
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM provider_models WHERE provider = ?", (provider,))
                
                for model in models:
                    cursor.execute("""
                        INSERT INTO provider_models (provider, model_name, model_id, language_code)
                        VALUES (?, ?, ?, ?)
                    """, (provider, model.get('name'), model.get('id'), model.get('language_code')))
                
                conn.commit()
                return True
        except Exception as e:
            print(f"Error saving models: {e}")
            return False
    
    def get_models(self, provider: str) -> List[Dict]:
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT model_name, model_id, language_code 
                    FROM provider_models 
                    WHERE provider = ?
                """, (provider,))
                results = cursor.fetchall()
                return [{'name': name, 'id': model_id, 'language_code': lang} 
                       for name, model_id, lang in results]
        except Exception as e:
            print(f"Error retrieving models: {e}")
            return []
    
    def save_test_result(self, provider: str, model_id: str, language_code: str, 
                        audio_duration: float, processing_time: float, 
                        transcription: str, accuracy_score: float = None) -> bool:
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO test_results 
                    (provider, model_id, language_code, audio_duration, processing_time, 
                     transcription, accuracy_score)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (provider, model_id, language_code, audio_duration, processing_time, 
                      transcription, accuracy_score))
                conn.commit()
                return True
        except Exception as e:
            print(f"Error saving test result: {e}")
            return False
    
    def get_test_results(self, provider: str = None, limit: int = 100) -> List[Dict]:
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                if provider:
                    cursor.execute("""
                        SELECT * FROM test_results 
                        WHERE provider = ? 
                        ORDER BY created_at DESC 
                        LIMIT ?
                    """, (provider, limit))
                else:
                    cursor.execute("""
                        SELECT * FROM test_results 
                        ORDER BY created_at DESC 
                        LIMIT ?
                    """, (limit,))
                
                results = cursor.fetchall()
                columns = [desc[0] for desc in cursor.description]
                return [dict(zip(columns, result)) for result in results]
        except Exception as e:
            print(f"Error retrieving test results: {e}")
            return []
    
    def update_provider_status(self, provider_id: str, is_activated: bool, 
                              test_result: str = None, transcription: str = None,
                              model_used: str = None, language_used: str = None,
                              processing_time: float = None) -> bool:
        """Update provider activation status based on test results"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO provider_status 
                    (provider_id, is_activated, last_test_date, last_test_result, 
                     last_transcription, test_model_used, test_language_used, 
                     test_processing_time, updated_at)
                    VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """, (provider_id, is_activated, test_result, transcription, 
                      model_used, language_used, processing_time))
                conn.commit()
                return True
        except Exception as e:
            print(f"Error updating provider status: {e}")
            return False
    
    def get_provider_status(self, provider_id: str) -> Optional[Dict]:
        """Get provider activation status"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM provider_status WHERE provider_id = ?
                """, (provider_id,))
                result = cursor.fetchone()
                if result:
                    columns = [desc[0] for desc in cursor.description]
                    return dict(zip(columns, result))
                return None
        except Exception as e:
            print(f"Error retrieving provider status: {e}")
            return None
    
    def get_all_provider_statuses(self) -> Dict[str, Dict]:
        """Get all provider activation statuses"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM provider_status")
                results = cursor.fetchall()
                columns = [desc[0] for desc in cursor.description]
                
                statuses = {}
                for result in results:
                    status_dict = dict(zip(columns, result))
                    statuses[status_dict['provider_id']] = status_dict
                return statuses
        except Exception as e:
            print(f"Error retrieving provider statuses: {e}")
            return {}
    
    def is_provider_activated(self, provider_id: str) -> bool:
        """Check if provider is activated"""
        status = self.get_provider_status(provider_id)
        return status['is_activated'] if status else False