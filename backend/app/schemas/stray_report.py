import re
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


CONTACT_NUMBER_PATTERN = re.compile(r"^[+]?[-() 0-9]{7,20}$")


class StrayReportStatus(str, Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


class StrayReportCreate(BaseModel):
    reporter_name: str = Field(..., min_length=1, max_length=150)
    contact_number: str = Field(..., min_length=7, max_length=25)
    location: str = Field(..., min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    description: Optional[str] = Field(default=None, max_length=2000)
    image_url: Optional[str] = Field(default=None, max_length=500)

    @field_validator("reporter_name")
    @classmethod
    def validate_reporter_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Reporter name is required")
        return cleaned

    @field_validator("location")
    @classmethod
    def validate_location(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Location is required")
        return cleaned

    @field_validator("contact_number")
    @classmethod
    def validate_contact_number(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Contact number is required")
        if not CONTACT_NUMBER_PATTERN.match(cleaned):
            raise ValueError("Contact number format is invalid")
        return cleaned

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        cleaned = value.strip()
        return cleaned or None


class StrayReportCreateResponse(BaseModel):
    message: str
    report_id: int


class StrayReportPublicResponse(BaseModel):
    id: int
    location: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    status: StrayReportStatus
    created_at: datetime

    class Config:
        from_attributes = True


class StrayReportAdminResponse(BaseModel):
    id: int
    reporter_name: str
    contact_number: str
    email: Optional[str] = None
    location: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    status: StrayReportStatus
    created_at: datetime

    class Config:
        from_attributes = True


class StrayReportAdminListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[StrayReportAdminResponse]


class StrayReportStatusUpdate(BaseModel):
    status: StrayReportStatus
