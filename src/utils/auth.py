"""
Authentication utilities for admin access.
"""
import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from functools import wraps
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

logger = logging.getLogger(__name__)

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "asr-speedtest-secret-key-2025")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Admin token from environment
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "asr-admin-token-2025")

security = HTTPBearer()

class AdminAuth:
    """Admin authentication manager."""
    
    def __init__(self):
        self.admin_token = ADMIN_TOKEN
        self.secret_key = SECRET_KEY
        self.algorithm = ALGORITHM
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError as e:
            logger.error(f"JWT verification failed: {e}")
            return None
    
    def verify_admin_token(self, token: str) -> bool:
        """Verify admin token."""
        return token == self.admin_token
    
    def authenticate_admin(self, token: str) -> Dict[str, Any]:
        """Authenticate admin and return access token."""
        if not self.verify_admin_token(token):
            raise HTTPException(status_code=401, detail="Invalid admin token")
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = self.create_access_token(
            data={"sub": "admin", "type": "admin"},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }

# Global instance
admin_auth = AdminAuth()

def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Get current admin from JWT token."""
    payload = admin_auth.verify_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    if payload.get("type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return payload

def admin_required(f):
    """Decorator to require admin authentication."""
    @wraps(f)
    async def decorated_function(*args, **kwargs):
        # This will be used with FastAPI dependency injection
        return await f(*args, **kwargs)
    return decorated_function

def verify_admin_access(request: Request) -> bool:
    """Verify admin access from request headers."""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return False
    
    try:
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            return False
        
        payload = admin_auth.verify_token(token)
        return payload is not None and payload.get("type") == "admin"
    except Exception:
        return False