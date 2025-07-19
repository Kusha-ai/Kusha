"""
Analytics service for provider-specific analytics
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from utils.elasticsearch_client import es_client as elasticsearch_client
from utils.database import DatabaseManager

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Service for handling analytics queries and calculations"""
    
    def __init__(self):
        self.es_client = elasticsearch_client
        self.db = DatabaseManager()
    
    def get_provider_analytics(self, provider_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Get comprehensive analytics for a specific provider
        
        Args:
            provider_id: Provider identifier
            days: Number of days to look back
            
        Returns:
            Dictionary with provider analytics data
        """
        try:
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            # Try Elasticsearch first (preferred for analytics)
            if self.es_client and self.es_client.is_connected():
                return self._get_provider_analytics_from_es(provider_id, days)
            else:
                # Fallback to SQLite if Elasticsearch is not available
                return self._get_provider_analytics_from_db(provider_id, days)
                
        except Exception as e:
            logger.error(f"Error getting provider analytics for {provider_id}: {e}")
            return self._get_empty_analytics()
    
    def _get_provider_analytics_from_es(self, provider_id: str, days: int) -> Dict[str, Any]:
        """Get provider analytics from Elasticsearch"""
        try:
            # Get provider-specific performance stats
            provider_stats = self.es_client.get_provider_performance_stats(days)
            
            # Filter for specific provider
            provider_data = None
            if provider_stats and 'providers' in provider_stats:
                for bucket in provider_stats['providers'].get('buckets', []):
                    if bucket.get('key') == provider_id:
                        provider_data = bucket
                        break
            
            if not provider_data:
                return self._get_empty_analytics()
            
            # Get recent tests for this provider
            recent_tests = self.es_client.get_recent_test_results(limit=1000)
            provider_tests = []
            if recent_tests:
                provider_tests = [test for test in recent_tests if test.get('provider') == provider_id]
            
            # Calculate analytics
            total_tests = provider_data.get('doc_count', 0)
            avg_processing_time = provider_data.get('avg_processing_time', {}).get('value', 0) or 0
            avg_confidence = provider_data.get('avg_confidence', {}).get('value', 0) or 0
            
            # Calculate success rate from recent tests
            success_rate = 0.0
            if provider_tests:
                successful_tests = sum(1 for test in provider_tests if test.get('success', False))
                success_rate = successful_tests / len(provider_tests) if len(provider_tests) > 0 else 0
            
            # Get language breakdown
            language_breakdown = {}
            for test in provider_tests:
                lang = test.get('language', 'unknown')
                if lang not in language_breakdown:
                    language_breakdown[lang] = {'count': 0, 'avg_time': 0, 'avg_confidence': 0}
                language_breakdown[lang]['count'] += 1
                language_breakdown[lang]['avg_time'] += test.get('processing_time', 0)
                language_breakdown[lang]['avg_confidence'] += test.get('confidence', 0)
            
            # Calculate averages for language breakdown
            for lang_data in language_breakdown.values():
                if lang_data['count'] > 0:
                    lang_data['avg_time'] /= lang_data['count']
                    lang_data['avg_confidence'] /= lang_data['count']
            
            return {
                'total_tests': total_tests,
                'avg_processing_time': avg_processing_time,
                'avg_confidence': avg_confidence,
                'success_rate': success_rate,
                'language_breakdown': language_breakdown,
                'recent_tests': provider_tests[-10:],  # Last 10 tests
                'test_trends': self._calculate_test_trends(provider_tests, days)
            }
            
        except Exception as e:
            logger.error(f"Error getting provider analytics from ES for {provider_id}: {e}")
            return self._get_empty_analytics()
    
    def _get_provider_analytics_from_db(self, provider_id: str, days: int) -> Dict[str, Any]:
        """Get provider analytics from SQLite database (fallback)"""
        try:
            # Get test results for this provider
            test_results = self.db.get_test_results(provider=provider_id, limit=1000)
            
            if not test_results:
                return self._get_empty_analytics()
            
            # Filter by date range
            cutoff_date = datetime.now() - timedelta(days=days)
            recent_results = []
            
            for result in test_results:
                # Parse timestamp - handle different formats
                timestamp = result.get('timestamp')
                if isinstance(timestamp, str):
                    try:
                        # Try ISO format first
                        test_date = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    except:
                        try:
                            # Try other common formats
                            test_date = datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S')
                        except:
                            continue
                elif isinstance(timestamp, datetime):
                    test_date = timestamp
                else:
                    continue
                
                if test_date >= cutoff_date:
                    recent_results.append(result)
            
            if not recent_results:
                return self._get_empty_analytics()
            
            # Calculate analytics
            total_tests = len(recent_results)
            total_time = sum(r.get('processing_time', 0) for r in recent_results)
            total_confidence = sum(r.get('confidence', 0) for r in recent_results)
            successful_tests = sum(1 for r in recent_results if r.get('success', False))
            
            avg_processing_time = total_time / total_tests if total_tests > 0 else 0
            avg_confidence = total_confidence / total_tests if total_tests > 0 else 0
            success_rate = successful_tests / total_tests if total_tests > 0 else 0
            
            # Language breakdown
            language_breakdown = {}
            for result in recent_results:
                lang = result.get('language', 'unknown')
                if lang not in language_breakdown:
                    language_breakdown[lang] = {'count': 0, 'avg_time': 0, 'avg_confidence': 0}
                language_breakdown[lang]['count'] += 1
                language_breakdown[lang]['avg_time'] += result.get('processing_time', 0)
                language_breakdown[lang]['avg_confidence'] += result.get('confidence', 0)
            
            # Calculate averages
            for lang_data in language_breakdown.values():
                if lang_data['count'] > 0:
                    lang_data['avg_time'] /= lang_data['count']
                    lang_data['avg_confidence'] /= lang_data['count']
            
            return {
                'total_tests': total_tests,
                'avg_processing_time': avg_processing_time,
                'avg_confidence': avg_confidence,
                'success_rate': success_rate,
                'language_breakdown': language_breakdown,
                'recent_tests': recent_results[-10:],  # Last 10 tests
                'test_trends': self._calculate_test_trends(recent_results, days)
            }
            
        except Exception as e:
            logger.error(f"Error getting provider analytics from DB for {provider_id}: {e}")
            return self._get_empty_analytics()
    
    def _calculate_test_trends(self, tests: list, days: int) -> Dict[str, Any]:
        """Calculate test trends over time"""
        try:
            if not tests:
                return {'daily_counts': {}, 'trend': 'stable'}
            
            # Group tests by day
            daily_counts = {}
            for test in tests:
                timestamp = test.get('timestamp')
                if isinstance(timestamp, str):
                    try:
                        test_date = datetime.fromisoformat(timestamp.replace('Z', '+00:00')).date()
                    except:
                        continue
                elif isinstance(timestamp, datetime):
                    test_date = timestamp.date()
                else:
                    continue
                
                day_key = test_date.strftime('%Y-%m-%d')
                daily_counts[day_key] = daily_counts.get(day_key, 0) + 1
            
            # Calculate trend (simple)
            if len(daily_counts) < 2:
                trend = 'stable'
            else:
                sorted_days = sorted(daily_counts.keys())
                first_half = sorted_days[:len(sorted_days)//2]
                second_half = sorted_days[len(sorted_days)//2:]
                
                first_avg = sum(daily_counts[day] for day in first_half) / len(first_half)
                second_avg = sum(daily_counts[day] for day in second_half) / len(second_half)
                
                if second_avg > first_avg * 1.1:
                    trend = 'increasing'
                elif second_avg < first_avg * 0.9:
                    trend = 'decreasing'
                else:
                    trend = 'stable'
            
            return {
                'daily_counts': daily_counts,
                'trend': trend
            }
            
        except Exception as e:
            logger.error(f"Error calculating test trends: {e}")
            return {'daily_counts': {}, 'trend': 'stable'}
    
    def _get_empty_analytics(self) -> Dict[str, Any]:
        """Return empty analytics structure"""
        return {
            'total_tests': 0,
            'avg_processing_time': 0.0,
            'avg_confidence': 0.0,
            'success_rate': 0.0,
            'language_breakdown': {},
            'recent_tests': [],
            'test_trends': {'daily_counts': {}, 'trend': 'stable'}
        }

# Global instance
analytics_service = AnalyticsService()