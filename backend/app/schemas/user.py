from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    """User base schema"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = None
    address: Optional[str] = None

class UserCreate(UserBase):
    """User creation schema"""
    password: str = Field(..., min_length=8, max_length=100)
    role: Optional[str] = "adopter"

class UserUpdate(BaseModel):
    """User update schema"""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None

class UserPasswordChange(BaseModel):
    """Password change request"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str

class UserResponse(UserBase):
    """User response schema"""
    id: int
    role: str
    is_active: bool
    is_verified: bool
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserDetailResponse(UserResponse):
    """Detailed user response with all info"""
    phone: Optional[str] = None
    address: Optional[str] = None

class UserLogin(BaseModel):
    """User login request"""
    email: EmailStr
    password: str

class UserRegister(UserCreate):
    """User registration request"""
    confirm_password: str

class UserListResponse(BaseModel):
    """Paginated user list response"""
    total: int
    page: int
    page_size: int
    users: list[UserResponse]

