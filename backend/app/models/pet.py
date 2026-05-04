from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Enum as SQLEnum, ForeignKey, Date
from sqlalchemy.sql import func
from app.database import Base
import enum

class PetStatus(str, enum.Enum):
    AVAILABLE = "available"
    ADOPTED = "adopted"
    PENDING = "pending"

class Pet(Base):
    __tablename__ = "pets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    species = Column(String(50), nullable=False)  # dog, cat, rabbit, etc.
    breed = Column(String(100))
    age = Column(Integer)  # in years
    description = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    status = Column(
        SQLEnum(
            PetStatus,
            name="petstatus",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        default=PetStatus.AVAILABLE,
    )
    image_url = Column(String(500))
    vaccines_completed = Column(Integer, default=0)  # Number of vaccines completed
    next_vaccination_date = Column(Date, nullable=True)  # Next vaccination date
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
