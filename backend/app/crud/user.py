from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.utils.security import hash_password, verify_password
from typing import Optional, List
from datetime import datetime


def _normalize_role(role: str | None) -> str:
    role_value = (role or "adopter").lower()
    return "owner" if role_value == "shelter" else role_value

class UserCRUD:
    """CRUD operations for User model"""
    
    @staticmethod
    def get_user(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """Get user by username"""
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_users_by_role(db: Session, role: str, skip: int = 0, limit: int = 100) -> List[User]:
        """Get users filtered by role"""
        return db.query(User).filter(User.role == role).order_by(User.created_at.asc(), User.id.asc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_active_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all active users"""
        return db.query(User).filter(User.is_active == True).order_by(User.created_at.asc(), User.id.asc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users with pagination"""
        return db.query(User).order_by(User.created_at.asc(), User.id.asc()).offset(skip).limit(limit).all()

    @staticmethod
    def create_user(db: Session, user: UserCreate) -> User:
        """Create a new user"""
        # Validate unique constraints
        if UserCRUD.get_user_by_email(db, user.email):
            raise ValueError("Email already registered")
        if UserCRUD.get_user_by_username(db, user.username):
            raise ValueError("Username already taken")
        
        hashed_password = hash_password(user.password)
        normalized_role = _normalize_role(user.role)

        db_user = User(
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            phone=user.phone,
            address=user.address,
            hashed_password=hashed_password,
            role=UserRole(normalized_role)
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
        """Update user information"""
        db_user = UserCRUD.get_user(db, user_id)
        if not db_user:
            return None
        
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(db_user, field, value)
        
        db_user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        """Soft delete a user (mark as inactive)"""
        db_user = UserCRUD.get_user(db, user_id)
        if db_user:
            db_user.is_active = False
            db_user.updated_at = datetime.utcnow()
            db.commit()
            return True
        return False

    @staticmethod
    def hard_delete_user(db: Session, user_id: int) -> bool:
        """Permanently delete a user"""
        db_user = UserCRUD.get_user(db, user_id)
        if not db_user:
            return False

        db.delete(db_user)
        db.commit()
        return True

    @staticmethod
    def authenticate_user(db, email: str, password: str):
        user = UserCRUD.get_user_by_email(db, email)

        if not user:
            print("User not found")
            return None

        print("RAW INPUT PASSWORD:", repr(password))
        print("HASH FROM DB:", user.hashed_password)

        result = verify_password(password, user.hashed_password)

        print("VERIFY RESULT:", result)

        return user if result else None

    @staticmethod
    def authenticate_user_by_username(db: Session, username: str, password: str) -> Optional[User]:
        """Authenticate user with username and password"""
        user = UserCRUD.get_user_by_username(db, username)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    def change_password(db: Session, user_id: int, old_password: str, new_password: str) -> bool:
        """Change user password"""
        user = UserCRUD.get_user(db, user_id)
        if not user or not verify_password(old_password, user.hashed_password):
            return False
        
        user.hashed_password = hash_password(new_password)
        user.updated_at = datetime.utcnow()
        db.commit()
        return True

    @staticmethod
    def update_last_login(db: Session, user_id: int) -> Optional[User]:
        """Update user's last login timestamp"""
        user = UserCRUD.get_user(db, user_id)
        if user:
            user.last_login = datetime.utcnow()
            db.commit()
            db.refresh(user)
        return user

    @staticmethod
    def verify_email(db: Session, user_id: int) -> Optional[User]:
        """Mark user email as verified"""
        user = UserCRUD.get_user(db, user_id)
        if user:
            user.is_verified = True
            user.verification_token = None
            user.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(user)
        return user

    @staticmethod
    def set_verification_token(db: Session, user_id: int, token: str) -> Optional[User]:
        """Set verification token for user"""
        user = UserCRUD.get_user(db, user_id)
        if user:
            user.verification_token = token
            db.commit()
            db.refresh(user)
        return user

    @staticmethod
    def update_role(db: Session, user_id: int, new_role: str) -> Optional[User]:
        """Update user role (admin only)"""
        user = UserCRUD.get_user(db, user_id)
        if user:
            try:
                user.role = UserRole(_normalize_role(new_role))
                user.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(user)
            except ValueError:
                return None
        return user

    @staticmethod
    def count_users(db: Session) -> int:
        """Get total count of users"""
        return db.query(User).count()

    @staticmethod
    def count_users_by_role(db: Session, role: str) -> int:
        """Get count of users by role"""
        return db.query(User).filter(User.role == role).count()

