#!/usr/bin/env python3

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_web_application():
    print("ASR Speed Test Web Application Test")
    print("=" * 40)
    
    success = True
    
    # Test 1: FastAPI app import
    print("\n1. Testing FastAPI app import...")
    try:
        from src.web.app import app
        print("✓ FastAPI app imported successfully")
    except Exception as e:
        print(f"✗ FastAPI app import failed: {e}")
        success = False
    
    # Test 2: Database functionality
    print("\n2. Testing database...")
    try:
        from src.utils.database import DatabaseManager
        
        db = DatabaseManager("test_web.db")
        db.save_api_key("sarv", "http://103.255.103.118:5001")
        retrieved_url = db.get_api_key("sarv")
        
        if retrieved_url == "http://103.255.103.118:5001":
            print("✓ Database operations working")
        else:
            print("✗ Database operations failed")
            success = False
        
        # Clean up
        import os
        os.remove("test_web.db")
        
    except Exception as e:
        print(f"✗ Database test failed: {e}")
        success = False
    
    # Test 3: Sarv ASR provider
    print("\n3. Testing Sarv ASR provider...")
    try:
        # Updated import for consolidated provider structure
# This would now need to be handled through the provider factory
# from providers.ASR.Sarv import sarv_asr
        
        provider = SarvASRProvider()
        models = provider.get_available_models()
        languages = provider.get_supported_languages()
        
        if len(models) > 0 and len(languages) > 0:
            print(f"✓ Sarv ASR: {len(models)} models, {len(languages)} languages")
        else:
            print("✗ Sarv ASR failed")
            success = False
            
    except Exception as e:
        print(f"✗ Sarv ASR test failed: {e}")
        success = False
    
    # Test 4: Templates
    print("\n4. Testing templates...")
    try:
        import os
        template_files = ['templates/base.html', 'templates/index.html', 'templates/admin.html']
        for template in template_files:
            if os.path.exists(template):
                print(f"✓ {template} exists")
            else:
                print(f"✗ {template} missing")
                success = False
    except Exception as e:
        print(f"✗ Template check failed: {e}")
        success = False
    
    # Test 5: Environment config
    print("\n5. Testing environment config...")
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        import os
        server_port = os.getenv('SERVER_PORT', '5005')
        admin_username = os.getenv('ADMIN_USERNAME', 'admin')
        sarv_url = os.getenv('SARV_ASR_URL', 'http://103.255.103.118:5001')
        
        print(f"✓ Server port: {server_port}")
        print(f"✓ Admin username: {admin_username}")
        print(f"✓ Sarv ASR URL: {sarv_url}")
        
    except Exception as e:
        print(f"✗ Environment config failed: {e}")
        success = False
    
    print("\n" + "=" * 40)
    if success:
        print("🎉 Web Application Test SUCCESS!")
        print("\nStart the application:")
        print("docker-compose up -d")
        print("\nAccess points:")
        print("- User Interface: http://localhost:5005")
        print("- Admin Panel: http://localhost:5005/admin")
        print("- API Docs: http://localhost:5005/docs")
        print("\nFeatures:")
        print("- ✓ Web-based audio recording")
        print("- ✓ Multiple ASR providers")
        print("- ✓ Speed testing and comparison")
        print("- ✓ Admin panel with authentication")
        print("- ✓ Real-time results display")
        print("- ✓ Dockerized deployment")
    else:
        print("❌ Some tests failed.")
        sys.exit(1)

if __name__ == "__main__":
    test_web_application()