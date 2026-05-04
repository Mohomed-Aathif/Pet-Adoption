from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    """JWT Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    """Token payload data"""
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None
    type: str = "access"  # access or refresh

class TokenRefreshRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str

class TokenResponse(BaseModel):
    """Extended token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: int
    email: str
    role: str
