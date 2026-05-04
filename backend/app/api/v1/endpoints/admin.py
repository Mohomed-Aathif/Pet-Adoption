from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from app.database import get_db
from app.schemas.user import UserResponse, UserListResponse
from app.crud.user import UserCRUD
from app.core.dependencies import get_current_user
from app.models.user import UserRole

router = APIRouter(prefix="/admin", tags=["admin"])

async def verify_admin(current_user = Depends(get_current_user)):
    """Verify user is admin"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.get("/users", response_model=UserListResponse)
async def list_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=100),
    role: str | None = Query(None),
    _admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """
    List all users with optional role filter (Admin only)
    """
    if role:
        try:
            UserRole(role)
            users = UserCRUD.get_users_by_role(db, role, skip=skip, limit=limit)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {', '.join([r.value for r in UserRole])}"
            )
    else:
        users = UserCRUD.get_all_users(db, skip=skip, limit=limit)
    
    total = UserCRUD.count_users(db)
    
    return {
        "total": total,
        "page": skip // limit + 1 if limit > 0 else 1,
        "page_size": limit,
        "users": users
    }

@router.get("/users/role/{role_name}")
async def get_users_by_role(
    role_name: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=100),
    _admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """
    Get all users with a specific role (Admin only)
    """
    try:
        UserRole(role_name)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join([r.value for r in UserRole])}"
        )
    
    users = UserCRUD.get_users_by_role(db, role_name, skip=skip, limit=limit)
    total = UserCRUD.count_users_by_role(db, role_name)
    
    return {
        "total": total,
        "page": skip // limit + 1 if limit > 0 else 1,
        "page_size": limit,
        "role": role_name,
        "users": users
    }

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_details(
    user_id: int,
    _admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """
    Get specific user details (Admin only)
    """
    user = UserCRUD.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.put("/users/{user_id}/role/{new_role}")
async def update_user_role(
    user_id: int,
    new_role: str,
    _admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """
    Update user role (Admin only)
    
    Valid roles: admin, adopter, owner
    """
    # Validate role
    try:
        UserRole(new_role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join([r.value for r in UserRole])}"
        )
    
    user = UserCRUD.update_role(db, user_id, new_role)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or invalid role"
        )
    
    return {
        "message": "User role updated successfully",
        "user_id": user.id,
        "new_role": user.role.value
    }

@router.put("/users/{user_id}/activate")
async def activate_user(
    user_id: int,
    _admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """
    Activate a user account (Admin only)
    """
    user = UserCRUD.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already active"
        )
    
    user.is_active = True
    db.commit()
    
    return {
        "message": "User activated successfully",
        "user_id": user.id
    }

@router.put("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    current_admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """
    Deactivate a user account (Admin only)
    """
    user = UserCRUD.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already inactive"
        )
    
    # Prevent deactivating self
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    user.is_active = False
    db.commit()
    
    return {
        "message": "User deactivated successfully",
        "user_id": user.id
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Permanently delete a user account (Admin only)."""
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    user = UserCRUD.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    try:
        UserCRUD.hard_delete_user(db, user_id)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User cannot be deleted because related records exist"
        )

    return {
        "message": "User deleted successfully",
        "user_id": user_id
    }

@router.get("/stats/users")
async def get_user_statistics(
    _admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """
    Get user statistics (Admin only)
    """
    stats = {}
    total = UserCRUD.count_users(db)
    
    for role in UserRole:
        count = UserCRUD.count_users_by_role(db, role.value)
        stats[role.value] = count
    
    return {
        "total_users": total,
        "by_role": stats
    }

@router.get("/stats/dashboard")
async def get_admin_dashboard(
    _admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """
    Get admin dashboard statistics
    """
    total_users = UserCRUD.count_users(db)
    active_users = len(UserCRUD.get_active_users(db, skip=0, limit=10000))
    
    role_stats = {}
    for role in UserRole:
        role_stats[role.value] = UserCRUD.count_users_by_role(db, role.value)
    
    return {
        "timestamp": __import__('datetime').datetime.utcnow().isoformat(),
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "users_by_role": role_stats
    }
