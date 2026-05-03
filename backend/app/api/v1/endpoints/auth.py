from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.schemas.user import (
    UserCreate, UserLogin, UserResponse, UserRegister, 
    UserPasswordChange, UserDetailResponse
)
from app.schemas.token import Token, TokenRefreshRequest, TokenResponse
from app.crud.user import UserCRUD
from app.utils.security import (
    hash_password, verify_password, create_token_pair, 
    verify_refresh_token, create_access_token
)
from app.core.dependencies import get_current_user, get_current_active_user
from app.config.settings import settings

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """
    Register a new user
    
    - **email**: User email address
    - **username**: Unique username (3-50 characters)
    - **password**: Password (minimum 8 characters)
    - **full_name**: Full name (optional)
    - **role**: User role (adopter, owner) - defaults to adopter
    """
    # Validate passwords match
    if user_data.password != user_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    # Check if email already exists
    if UserCRUD.get_user_by_email(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    if UserCRUD.get_user_by_username(db, user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create user
    try:
        user = UserCRUD.create_user(db, user_data)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    User login endpoint
    
    Returns access token and refresh token
    """
    # Authenticate user
    user = UserCRUD.authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create tokens
    access_token, refresh_token = create_token_pair(
        user_id=user.id,
        email=user.email,
        role=user.role.value
    )
    
    # Update last login
    UserCRUD.update_last_login(db, user.id)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user_id": user.id,
        "email": user.email,
        "role": user.role.value
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_request: TokenRefreshRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token
    """
    payload = verify_refresh_token(token_request.refresh_token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("user_id")
    user = UserCRUD.get_user(db, user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new token pair
    access_token, refresh_token = create_token_pair(
        user_id=user.id,
        email=user.email,
        role=user.role.value
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserDetailResponse)
async def get_current_user_info(
    current_user = Depends(get_current_active_user)
):
    """
    Get current authenticated user information
    """
    return current_user

@router.put("/me", response_model=UserDetailResponse)
async def update_current_user(
    user_update: dict,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update current user information
    """
    from app.schemas.user import UserUpdate
    update_data = UserUpdate(**user_update)
    
    updated_user = UserCRUD.update_user(db, current_user.id, update_data)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return updated_user

@router.post("/change-password")
async def change_password(
    password_change: UserPasswordChange,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Change user password
    """
    # Validate new passwords match
    if password_change.new_password != password_change.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match"
        )
    
    # Change password
    success = UserCRUD.change_password(
        db,
        current_user.id,
        password_change.current_password,
        password_change.new_password
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    return {"message": "Password changed successfully"}

@router.post("/logout")
async def logout(
    current_user = Depends(get_current_active_user)
):
    """
    Logout user (client should delete token)
    """
    return {"message": "Logged out successfully"}
