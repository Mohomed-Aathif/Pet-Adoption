from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class PetBase(BaseModel):
    name: str
    species: str
    breed: Optional[str] = None
    age: Optional[int] = None
    description: Optional[str] = None
    status: str = "available"
    image_url: Optional[str] = None
    vaccines_completed: Optional[int] = None
    next_vaccination_date: Optional[date] = None

class PetCreate(PetBase):
    pass

class PetUpdate(BaseModel):
    name: Optional[str] = None
    breed: Optional[str] = None
    age: Optional[int] = None
    description: Optional[str] = None
    status: Optional[str] = None
    image_url: Optional[str] = None
    vaccines_completed: Optional[int] = None
    next_vaccination_date: Optional[date] = None

class PetResponse(PetBase):
    id: int
    owner_id: Optional[int] = None
    owner_name: Optional[str] = None
    adopted_by_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
