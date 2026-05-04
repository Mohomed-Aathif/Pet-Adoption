from datetime import UTC, date, datetime, time
import re
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


CONTACT_NUMBER_PATTERN = re.compile(r"^[+]?[-() 0-9]{7,20}$")


class PaymentDetails(BaseModel):
    card_number: str = Field(..., pattern=r"^\d{16}$")
    card_holder_name: str = Field(..., min_length=1, max_length=120)
    expiry_month: int = Field(..., ge=1, le=12)
    expiry_year: int = Field(..., ge=2026, le=2031)
    cvv: str = Field(..., pattern=r"^\d{3}$")

    @field_validator("card_holder_name")
    @classmethod
    def validate_card_holder_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Card holder name is required")
        return cleaned

    @model_validator(mode="after")
    def validate_expiry(self):
        today = datetime.now(UTC).date()
        if (self.expiry_year, self.expiry_month) < (today.year, today.month):
            raise ValueError("Card expiry date cannot be in the past")
        return self


class DonationPaymentRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    email: Optional[EmailStr] = None
    contact_number: Optional[str] = Field(default=None, max_length=25)
    amount: float = Field(..., gt=0)
    payment: PaymentDetails

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Name is required")
        return cleaned

    @field_validator("contact_number")
    @classmethod
    def validate_contact_number(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        cleaned = value.strip()
        if not cleaned:
            return None

        if not CONTACT_NUMBER_PATTERN.match(cleaned):
            raise ValueError("Contact number format is invalid")
        return cleaned


class DonationAdminResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    contact_number: Optional[str] = None
    amount: float
    donation_date: date
    donation_time: time

    class Config:
        from_attributes = True


class DonationAdminListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[DonationAdminResponse]


class DonationSummaryResponse(BaseModel):
    total_donations: int
    total_amount: float
    donations_last_30_days: int
    amount_last_30_days: float


class DonationPaymentResponse(BaseModel):
    message: str
    donation_id: int
    confirmation_email_sent: bool
