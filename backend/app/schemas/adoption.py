from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AdoptionBase(BaseModel):
    user_id: int
    pet_id: int
    status: str = "pending"
    notes: Optional[str] = None

class AdoptionCreate(AdoptionBase):
    pass


class AdoptionRequestCreate(BaseModel):
    pet_id: int
    notes: Optional[str] = None


class AdoptionStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class AdoptionPickupRequestUpdate(BaseModel):
    pickup_datetime: datetime
    notes: Optional[str] = None


class AdoptionPickupSuggestionUpdate(BaseModel):
    pickup_datetime: datetime
    notes: Optional[str] = None

class AdoptionUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    pickup_requested_datetime: Optional[datetime] = None
    pickup_suggested_datetime: Optional[datetime] = None
    pickup_scheduled_datetime: Optional[datetime] = None
    owner_marked_completed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class AdoptionTimelineEvent(BaseModel):
    key: str
    label: str
    timestamp: Optional[datetime] = None

class AdoptionResponse(AdoptionBase):
    id: int
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_phone: Optional[str] = None
    pet_name: Optional[str] = None
    pet_owner_name: Optional[str] = None
    pet_owner_phone: Optional[str] = None
    pet_owner_address: Optional[str] = None
    adoption_date: datetime
    pickup_requested_datetime: Optional[datetime] = None
    pickup_suggested_datetime: Optional[datetime] = None
    pickup_scheduled_datetime: Optional[datetime] = None
    owner_marked_completed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    timeline: list[AdoptionTimelineEvent] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
