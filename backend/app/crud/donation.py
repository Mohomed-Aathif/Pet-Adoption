from datetime import UTC, date, datetime, timedelta
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Query, Session

from app.models.donation import Donation
from app.schemas.donation import DonationPaymentRequest


class DonationCRUD:
    @staticmethod
    def _apply_filters(
        query: Query,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
    ) -> Query:
        if start_date is not None:
            query = query.filter(Donation.donation_date >= start_date)
        if end_date is not None:
            query = query.filter(Donation.donation_date <= end_date)
        if min_amount is not None:
            query = query.filter(Donation.amount >= min_amount)
        if max_amount is not None:
            query = query.filter(Donation.amount <= max_amount)
        return query

    @staticmethod
    def create_donation(db: Session, payload: DonationPaymentRequest) -> Donation:
        now = datetime.now(UTC)

        db_donation = Donation(
            name=payload.name,
            email=payload.email,
            contact_number=payload.contact_number,
            amount=payload.amount,
            donation_date=now.date(),
            donation_time=now.time().replace(microsecond=0),
        )
        db.add(db_donation)
        db.commit()
        db.refresh(db_donation)
        return db_donation

    @staticmethod
    def get_donations(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
    ) -> list[Donation]:
        query = DonationCRUD._apply_filters(
            db.query(Donation),
            start_date=start_date,
            end_date=end_date,
            min_amount=min_amount,
            max_amount=max_amount,
        )

        return (
            query
            .order_by(Donation.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def count_donations(
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
    ) -> int:
        query = DonationCRUD._apply_filters(
            db.query(Donation),
            start_date=start_date,
            end_date=end_date,
            min_amount=min_amount,
            max_amount=max_amount,
        )
        return query.count()

    @staticmethod
    def get_summary(db: Session) -> dict[str, float | int]:
        total_donations = db.query(func.count(Donation.id)).scalar() or 0
        total_amount = db.query(func.coalesce(func.sum(Donation.amount), 0.0)).scalar() or 0.0

        last_30_days = datetime.now(UTC).date() - timedelta(days=30)
        donations_last_30_days = (
            db.query(func.count(Donation.id))
            .filter(Donation.donation_date >= last_30_days)
            .scalar()
            or 0
        )
        amount_last_30_days = (
            db.query(func.coalesce(func.sum(Donation.amount), 0.0))
            .filter(Donation.donation_date >= last_30_days)
            .scalar()
            or 0.0
        )

        return {
            "total_donations": int(total_donations),
            "total_amount": float(total_amount),
            "donations_last_30_days": int(donations_last_30_days),
            "amount_last_30_days": float(amount_last_30_days),
        }
