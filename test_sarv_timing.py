#!/usr/bin/env python3
"""
Direct test of Sarv ASR with welcome.wav to measure actual processing time
"""
import sys
import os
import time
import json
from pathlib import Path

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'providers', 'ASR', 'Sarv'))

def test_sarv_performance():
    print("🎯 Testing Sarv ASR Performance")
    print("=" * 50)
    
    # Check if welcome.wav exists
    welcome_file = "welcome.wav"
    if not os.path.exists(welcome_file):
        print(f"❌ {welcome_file} not found in current directory")
        return
    
    print(f"✅ Found {welcome_file}")
    file_size = os.path.getsize(welcome_file)
    print(f"📁 File size: {file_size:,} bytes ({file_size/1024:.1f} KB)")
    
    try:
        # Import Sarv ASR - try different import paths
        sys.path.insert(0, 'providers/ASR/Sarv')
        from sarv_asr import SarvASR
        
        # Load config
        config_path = "providers/ASR/Sarv/config.json"
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        print(f"🔧 Loaded config from {config_path}")
        print(f"🌐 Base URL: {config['provider']['base_url']}")
        print(f"🔑 Requires API key: {config['provider']['requires_api_key']}")
        
        # Initialize Sarv provider
        sarv = SarvASR(config)
        
        # Test models
        models_to_test = [
            ("hindi-specific", "hi-IN"),
            ("hindi-multilingual", "hi-IN"),
            ("multilingual", "hi-IN")
        ]
        
        for model_id, language_code in models_to_test:
            print(f"\n🚀 Testing model: {model_id} with language: {language_code}")
            print("-" * 40)
            
            # Measure total time
            start_time = time.time()
            
            result = sarv.transcribe_audio(welcome_file, model_id, language_code)
            
            end_time = time.time()
            total_time = end_time - start_time
            
            # Display results
            print(f"⏱️  Total time: {total_time:.3f}s")
            print(f"✅ Success: {result.get('success', False)}")
            
            if result.get('success'):
                processing_time = result.get('processing_time', 0)
                print(f"🔥 API processing time: {processing_time:.3f}s")
                print(f"💬 Transcription: '{result.get('transcription', 'N/A')}'")
                print(f"📊 Confidence: {result.get('confidence', 0):.3f}")
                
                # Show timing breakdown if available
                if 'timing_phases' in result:
                    phases = result['timing_phases']
                    print(f"📋 Timing breakdown:")
                    for phase, time_val in phases.items():
                        print(f"   • {phase}: {time_val:.3f}s")
                
            else:
                print(f"❌ Error: {result.get('error', 'Unknown error')}")
            
            print()
    
    except ImportError as e:
        print(f"❌ Failed to import Sarv ASR: {e}")
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_sarv_performance()