from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from sqlalchemy.sql import func
from app.database import Base

class Adoption(Base):
    __tablename__ = "adoptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    adoption_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50), default="pending")  # pending, approved, pickup_requested, pickup_scheduled, owner_marked_completed, completed, cancelled
    notes = Column(String(500))
    pickup_requested_datetime = Column(DateTime(timezone=True), nullable=True)
    pickup_suggested_datetime = Column(DateTime(timezone=True), nullable=True)
    pickup_scheduled_datetime = Column(DateTime(timezone=True), nullable=True)
    owner_marked_completed_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
