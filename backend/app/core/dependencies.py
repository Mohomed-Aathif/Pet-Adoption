from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.security import verify_access_token
from app.crud.user import UserCRUD
from typing import Optional, Any

security = HTTPBearer()


def _role_value(user) -> str:
    role = user.role.value if hasattr(user.role, "value") else str(user.role)
    return "owner" if role == "shelter" else role

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    token = credentials.credentials
    
    # Verify token
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: int = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user = UserCRUD.get_user(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    
    return user

async def get_current_active_user(
    current_user = Depends(get_current_user)
):

    return current_user

async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[Any]:

    if not credentials:
        return None
    
    token = credentials.credentials
    payload = verify_access_token(token)
    
    if not payload:
        return None
    
    user_id: int = payload.get("user_id")
    if user_id:
        user = UserCRUD.get_user(db, user_id)
        return user if user and user.is_active else None
    
    return None

def get_admin_user(
    current_user = Depends(get_current_user)
):

    if _role_value(current_user) != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user

def get_user_with_roles(
    allowed_roles: list[str],
):

    async def check_roles(current_user = Depends(get_current_user)):
        if _role_value(current_user) not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access requires one of these roles: {', '.join(allowed_roles)}",
            )
        return current_user
    
    return check_roles

# Role-specific dependencies
def get_admin(user = Depends(get_current_user)):
    return get_admin_user(user)

def get_adopter(user = Depends(get_current_user)):
    if _role_value(user) not in ["adopter", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Adopter access required",
        )
    return user

def get_owner(user = Depends(get_current_user)):
    if _role_value(user) not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner access required",
        )
    return user
