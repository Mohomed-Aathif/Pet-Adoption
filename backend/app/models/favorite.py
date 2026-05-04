from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    
    # Ensure each user can only favorite a pet once
    __table_args__ = (
        UniqueConstraint('user_id', 'pet_id', name='uq_user_pet_favorite'),
    )

    def __repr__(self):
        return f"<Favorite(user_id={self.user_id}, pet_id={self.pet_id})>"
