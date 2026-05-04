from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum as SQLEnum, Index
from sqlalchemy.sql import func
from app.database import Base
import enum
from datetime import datetime


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    ADOPTER = "adopter"
    OWNER = "owner"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(String(500), nullable=True)
    
    # Role-based access control
    role = Column(
        SQLEnum(
            UserRole,
            name="userrole",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        default=UserRole.ADOPTER,
        nullable=False,
    )
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(255), nullable=True)
    
    # Profile info
    profile_picture_url = Column(String(500), nullable=True)
    bio = Column(String(1000), nullable=True)
    
    # Timestamps
    from datetime import datetime
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Indices for performance
    __table_args__ = (
        Index('ix_user_email_active', 'email', 'is_active'),
        Index('ix_user_role', 'role'),
    )

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"

