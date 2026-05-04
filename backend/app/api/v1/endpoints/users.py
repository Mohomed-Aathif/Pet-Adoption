from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserResponse, UserLogin
from app.crud.user import UserCRUD
from app.database import get_db

router = APIRouter(tags=["users"])

@router.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    existing_user = UserCRUD.get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return UserCRUD.create_user(db, user)

@router.post("/users/login")
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return token"""
    user = UserCRUD.authenticate_user(db, user_login.email, user_login.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # TODO: Generate and return JWT token
    return {"user_id": user.id, "email": user.email}

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get a specific user"""
    user = UserCRUD.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
