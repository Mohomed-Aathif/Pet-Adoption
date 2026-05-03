from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import Annotated

from app.core.dependencies import get_admin_user
from app.crud.donation import DonationCRUD
from app.database import get_db
from app.schemas.donation import (
    DonationAdminListResponse,
    DonationPaymentRequest,
    DonationPaymentResponse,
    DonationSummaryResponse,
)

router = APIRouter(prefix="/donations", tags=["donations"])


@router.post("/pay", response_model=DonationPaymentResponse)
def process_donation_payment(
    payload: DonationPaymentRequest,
    db: Annotated[Session, Depends(get_db)],
):
    # Card validation is handled by request schema constraints.
    donation = DonationCRUD.create_donation(db, payload)

    # Simulated email send result.
    return {
        "message": "Donation successful. A confirmation email has been sent to you.",
        "donation_id": donation.id,
        "confirmation_email_sent": True,
    }


@router.get("/admin", response_model=DonationAdminListResponse)
def get_admin_donations(
    _admin: Annotated[object, Depends(get_admin_user)],
    db: Annotated[Session, Depends(get_db)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    start_date: Annotated[date | None, Query()] = None,
    end_date: Annotated[date | None, Query()] = None,
    min_amount: Annotated[float | None, Query(gt=0)] = None,
    max_amount: Annotated[float | None, Query(gt=0)] = None,
):
    items = DonationCRUD.get_donations(
        db,
        skip=skip,
        limit=limit,
        start_date=start_date,
        end_date=end_date,
        min_amount=min_amount,
        max_amount=max_amount,
    )
    total = DonationCRUD.count_donations(
        db,
        start_date=start_date,
        end_date=end_date,
        min_amount=min_amount,
        max_amount=max_amount,
    )

    return {
        "total": total,
        "page": (skip // limit) + 1,
        "page_size": limit,
        "items": items,
    }


@router.get("/admin/summary", response_model=DonationSummaryResponse)
def get_admin_donations_summary(
    _admin: Annotated[object, Depends(get_admin_user)],
    db: Annotated[Session, Depends(get_db)],
):
    return DonationCRUD.get_summary(db)
