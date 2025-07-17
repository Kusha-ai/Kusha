#!/usr/bin/env python3

import os
import sys
from dotenv import load_dotenv

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    from src.web.app import run_server
    print("Starting ASR Speed Test FastAPI Server...")
    print(f"Server will run at: http://localhost:{os.getenv('SERVER_PORT', 5005)}")
    print(f"Admin panel: http://localhost:{os.getenv('SERVER_PORT', 5005)}/admin")
    print("Press Ctrl+C to stop the server")
    run_server()