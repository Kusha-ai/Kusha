#!/usr/bin/env python3

import sys
import os
from pathlib import Path

# Add current directory to path for providers import
sys.path.insert(0, os.path.dirname(__file__))

from providers import provider_factory

def test_provider_structure():
    """Test the new provider file structure"""
    print("🧪 Testing Provider Structure")
    print("=" * 50)
    
    # Test getting AI types
    ai_types = provider_factory.get_ai_types()
    print(f"✅ Found AI types: {ai_types}")
    
    # Test each AI type
    for ai_type in ai_types:
        print(f"\n📁 Testing {ai_type} providers:")
        providers = provider_factory.get_providers_by_type(ai_type)
        print(f"   Providers: {providers}")
        
        for provider in providers:
            # Test config loading
            config = provider_factory.get_provider_config(ai_type, provider)
            if config:
                provider_info = config.get('provider', {})
                print(f"   ✅ {provider}: {provider_info.get('name', 'Unknown')}")
                
                # Test models
                models = provider_factory.get_models_for_provider(ai_type, provider)
                print(f"      Models: {len(models)} found")
                
                # Test voices for TTS
                if ai_type == 'TTS':
                    voices = provider_factory.get_voices_for_provider(ai_type, provider)
                    print(f"      Voices: {len(voices)} found")
                
                # Test provider class loading (without API key)
                try:
                    provider_class = provider_factory.load_provider_class(ai_type, provider)
                    if provider_class:
                        print(f"      ✅ Class loaded: {provider_class.__name__}")
                    else:
                        print(f"      ⚠️  Class not found")
                except Exception as e:
                    print(f"      ❌ Class loading failed: {e}")
            else:
                print(f"   ❌ {provider}: Config not found")
    
    print(f"\n🎯 Summary:")
    summary = provider_factory.export_provider_summary()
    print(f"   Total AI types: {len(summary['ai_types'])}")
    print(f"   Total providers: {summary['total_providers']}")
    for ai_type, providers in summary['providers_by_type'].items():
        print(f"   {ai_type}: {len(providers)} providers")

if __name__ == "__main__":
    test_provider_structure()