from passlib.context import CryptContext
from passlib.exc import UnknownHashError
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional
from app.config.settings import settings
import secrets

# Password hashing
# Keep bcrypt first for new hashes while still validating older pbkdf2 hashes.
pwd_context = CryptContext(schemes=["bcrypt", "pbkdf2_sha256"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (UnknownHashError, ValueError, TypeError):
        # Invalid/unknown hash should behave like failed auth, not a server error.
        return False

# JWT Token Management
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token
    
    Args:
        data: Dictionary with token claims (user_id, email, role, etc.)
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """
    Create JWT refresh token
    
    Args:
        data: Dictionary with token claims (user_id, email, etc.)
        
    Returns:
        Encoded refresh JWT token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def create_token_pair(user_id: int, email: str, role: str) -> tuple[str, str]:
    """
    Create both access and refresh tokens
    
    Args:
        user_id: User ID
        email: User email
        role: User role
        
    Returns:
        Tuple of (access_token, refresh_token)
    """
    token_data = {
        "user_id": user_id,
        "email": email,
        "role": role
    }
    
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)
    
    return access_token, refresh_token

def verify_token(token: str) -> Optional[dict]:
    """
    Verify and decode JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        Token payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None

def verify_access_token(token: str) -> Optional[dict]:
    """Verify token is an access token"""
    payload = verify_token(token)
    if payload and payload.get("type") == "access":
        return payload
    return None

def verify_refresh_token(token: str) -> Optional[dict]:
    """Verify token is a refresh token"""
    payload = verify_token(token)
    if payload and payload.get("type") == "refresh":
        return payload
    return None

def generate_verification_token(length: int = 32) -> str:
    """Generate a random verification token"""
    return secrets.token_urlsafe(length)

def get_token_payload(token: str) -> Optional[dict]:
    """
    Extract payload from token without verification
    Use only for debugging/logging
    """
    try:
        payload = jwt.decode(
            token,
            options={"verify_signature": False}
        )
        return payload
    except JWTError:
        return None

