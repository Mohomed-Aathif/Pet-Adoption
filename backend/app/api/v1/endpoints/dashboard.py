from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import Annotated
from datetime import datetime, timedelta, timezone

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.adoption import Adoption
from app.models.pet import Pet
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _count_by_adoption_status(db: Session) -> dict:
    rows = (
        db.query(Adoption.status, func.count(Adoption.id))
        .group_by(Adoption.status)
        .all()
    )
    counts = {
        "pending": 0,
        "approved": 0,
        "pickup_requested": 0,
        "pickup_scheduled": 0,
        "completed": 0,
        "cancelled": 0,
    }
    for status, count in rows:
        key = (status or "").lower()
        if key == "owner_marked_completed":
            key = "completed"
        if key in counts:
            counts[key] = int(count)
    return counts


def _count_owner_pet_adoptions(db: Session, owner_id: int) -> dict:
    rows = (
        db.query(Adoption.status, func.count(Adoption.id))
        .join(Pet, Pet.id == Adoption.pet_id)
        .filter(Pet.owner_id == owner_id)
        .group_by(Adoption.status)
        .all()
    )

    counts = {
        "pending": 0,
        "approved": 0,
        "pickup_requested": 0,
        "pickup_scheduled": 0,
        "completed": 0,
        "cancelled": 0,
    }
    for status, count in rows:
        key = (status or "").lower()
        if key == "owner_marked_completed":
            key = "completed"
        if key in counts:
                        counts[key] = int(count)

    return counts


def _count_owner_pets(db: Session, owner_id: int) -> dict:
    total = db.query(func.count(Pet.id)).filter(Pet.owner_id == owner_id).scalar() or 0
    available = (
        db.query(func.count(Pet.id))
        .filter(Pet.owner_id == owner_id, Pet.status == "available")
        .scalar()
        or 0
    )
    adopted = (
        db.query(func.count(Pet.id))
        .filter(Pet.owner_id == owner_id, Pet.status == "adopted")
        .scalar()
        or 0
    )
    pending = (
        db.query(func.count(Pet.id))
        .filter(Pet.owner_id == owner_id, Pet.status == "pending")
        .scalar()
        or 0
    )

    return {
        "total": int(total),
        "active": int(available),
        "adopted": int(adopted),
        "pending": int(pending),
    }


def _build_base_summary(current_user: User, adoption_counts: dict) -> dict:
    role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role).lower()
    approved_or_progress = (
        adoption_counts["approved"]
        + adoption_counts["pickup_requested"]
        + adoption_counts["pickup_scheduled"]
        + adoption_counts["completed"]
    )
    return {
        "role": role_value,
        "profile_summary": {
            "id": current_user.id,
            "email": current_user.email,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "role": role_value,
        },
        "adoption_requests": {
            "pending": adoption_counts["pending"],
            "approved": approved_or_progress,
            "rejected": adoption_counts["cancelled"],
            "total": sum(adoption_counts.values()),
        },
        "reports_or_complaints": 0,
        "alerts": [],
        "notifications": [],
        "messages": [],
    }


def _build_admin_summary(base: dict, total_users: int, total_active_listings: int, pending_pet_approvals: int, success_rate: float, most_adopted_pet_types: list, recent_activity: dict) -> dict:
    return {
        **base,
        "totals": {
            "registered_users": int(total_users),
            "active_pet_listings": int(total_active_listings),
            "pending_pet_listing_approvals": int(pending_pet_approvals),
        },
        "platform_statistics": {
            "adoption_success_rate": success_rate,
            "most_adopted_pet_types": most_adopted_pet_types,
        },
        "recent_activity": recent_activity,
        "features": {
            "suspicious_activity_detection": False,
            "complaints_module": False,
        },
    }


def _serialize_public_adoption_feed(db: Session, adoptions: list[Adoption]) -> list[dict]:
    if not adoptions:
        return []

    pet_ids = {adoption.pet_id for adoption in adoptions}
    adopter_ids = {adoption.user_id for adoption in adoptions}

    pets = db.query(Pet.id, Pet.name, Pet.species, Pet.breed, Pet.age, Pet.image_url, Pet.owner_id).filter(Pet.id.in_(pet_ids)).all()
    pet_map = {pet.id: pet for pet in pets}

    owner_ids = {pet.owner_id for pet in pets if pet.owner_id is not None}
    owners = (
        db.query(User.id, User.full_name, User.username, User.email)
        .filter(User.id.in_(owner_ids))
        .all()
        if owner_ids
        else []
    )
    owner_map = {
        owner.id: (owner.full_name or owner.username or owner.email or f"User {owner.id}")
        for owner in owners
    }

    adopters = db.query(User.id, User.full_name, User.username, User.email).filter(User.id.in_(adopter_ids)).all()
    adopter_map = {
        adopter.id: (adopter.full_name or adopter.username or adopter.email or f"User {adopter.id}")
        for adopter in adopters
    }

    items = []
    for adoption in adoptions:
        pet = pet_map.get(adoption.pet_id)
        if not pet:
            continue

        items.append(
            {
                "adoption_id": adoption.id,
                "pet_id": pet.id,
                "pet_name": pet.name,
                "species": pet.species,
                "breed": pet.breed,
                "age": pet.age,
                "image_url": pet.image_url,
                "owner_name": owner_map.get(pet.owner_id) if pet.owner_id is not None else None,
                "adopted_by": adopter_map.get(adoption.user_id),
                "adoption_date": adoption.adoption_date.isoformat() if adoption.adoption_date else None,
            }
        )

    return items


@router.get("/public-home")
async def get_public_home_feed(db: Annotated[Session, Depends(get_db)]):
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)

    last_week_adoptions = (
        db.query(Adoption)
        .filter(Adoption.status == "completed", Adoption.adoption_date >= week_ago)
        .order_by(Adoption.adoption_date.desc())
        .limit(5)
        .all()
    )

    all_time_adoptions = (
        db.query(Adoption)
        .filter(Adoption.status == "completed")
        .order_by(Adoption.adoption_date.desc())
        .limit(5)
        .all()
    )

    return {
        "featured_sections": {
            "last_week": _serialize_public_adoption_feed(db, last_week_adoptions),
            "all_time": _serialize_public_adoption_feed(db, all_time_adoptions),
        },
        "counts": {
            "last_week": len(last_week_adoptions),
            "all_time": len(all_time_adoptions),
        },
    }


def _build_adopter_summary(base: dict, user_adoptions: list) -> dict:
    approved_or_progress = {
        "approved",
        "pickup_requested",
        "pickup_scheduled",
        "completed",
    }
    return {
        **base,
        "adoption_requests": {
            "pending": len([a for a in user_adoptions if (a.status or "").lower() == "pending"]),
            "approved": len([a for a in user_adoptions if (a.status or "").lower() in approved_or_progress]),
            "rejected": len([a for a in user_adoptions if (a.status or "").lower() == "cancelled"]),
            "total": len(user_adoptions),
        },
        "adoption_history": [
            {
                "id": a.id,
                "pet_id": a.pet_id,
                "status": a.status,
                "created_at": a.created_at.isoformat() if a.created_at else None,
                "notes": a.notes,
            }
            for a in user_adoptions
        ],
        "saved_pets": [],
        "recently_viewed_pets": [],
        "recommended_pets": [],
        "quick_actions": ["browse_pets", "search_pets", "view_requests"],
        "features": {
            "recommendation_engine": False,
            "messaging": False,
        },
    }


def _build_owner_summary(base: dict, owner_adoption_counts: dict, owner_pets_summary: dict, owner_success_rate: float, recent_activity: dict) -> dict:
    approved_or_progress = (
        owner_adoption_counts["approved"]
        + owner_adoption_counts["pickup_requested"]
        + owner_adoption_counts["pickup_scheduled"]
        + owner_adoption_counts["completed"]
    )
    return {
        **base,
        "adoption_requests": {
            "pending": owner_adoption_counts["pending"],
            "approved": approved_or_progress,
            "rejected": owner_adoption_counts["cancelled"],
            "total": sum(owner_adoption_counts.values()),
        },
        "pets_summary": owner_pets_summary,
        "incoming_adoption_requests": owner_adoption_counts["pending"],
        "adoption_statistics": {
            "approved": approved_or_progress,
            "rejected": owner_adoption_counts["cancelled"],
            "pending": owner_adoption_counts["pending"],
            "success_rate": owner_success_rate,
        },
        "recent_activity": recent_activity,
        "quick_actions": ["add_pet", "edit_pet", "review_requests"],
        "features": {
            "views_per_pet": False,
            "team_activity": False,
        },
        "notes": [
            "Showing only pets and adoption requests for your account.",
        ],
    }


@router.get("/summary")
async def get_dashboard_summary(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role).lower()

    total_users = db.query(func.count(User.id)).scalar() or 0
    total_active_listings = db.query(func.count(Pet.id)).filter(Pet.status == "available").scalar() or 0
    pending_pet_approvals = db.query(func.count(Pet.id)).filter(Pet.status == "pending").scalar() or 0

    adoption_counts = _count_by_adoption_status(db)
    total_adoptions = sum(adoption_counts.values())
    success_rate = round((adoption_counts["completed"] / total_adoptions) * 100, 2) if total_adoptions else 0.0

    top_species_rows = (
        db.query(Pet.species, func.count(Pet.id).label("count"))
        .join(Adoption, Adoption.pet_id == Pet.id)
        .filter(Adoption.status == "completed")
        .group_by(Pet.species)
        .order_by(func.count(Pet.id).desc())
        .limit(3)
        .all()
    )

    most_adopted_pet_types = [
        {"species": species or "unknown", "count": int(count)}
        for species, count in top_species_rows
    ]

    recent_users = (
        db.query(User.id, User.email, User.role, User.created_at)
        .order_by(User.created_at.desc())
        .limit(5)
        .all()
    )
    recent_pets = (
        db.query(Pet.id, Pet.name, Pet.species, Pet.created_at)
        .order_by(Pet.created_at.desc())
        .limit(5)
        .all()
    )
    recent_adoptions = (
        db.query(Adoption.id, Adoption.user_id, Adoption.pet_id, Adoption.status, Adoption.created_at)
        .order_by(Adoption.created_at.desc())
        .limit(5)
        .all()
    )

    recent_activity = {
        "new_users": [
            {
                "id": row.id,
                "email": row.email,
                "role": row.role.value if hasattr(row.role, "value") else str(row.role),
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in recent_users
        ],
        "new_listings": [
            {
                "id": row.id,
                "name": row.name,
                "species": row.species,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in recent_pets
        ],
        "recent_adoptions": [
            {
                "id": row.id,
                "user_id": row.user_id,
                "pet_id": row.pet_id,
                "status": row.status,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in recent_adoptions
        ],
    }

    base = _build_base_summary(current_user, adoption_counts)

    if role_value == "admin":
        return _build_admin_summary(base, total_users, total_active_listings, pending_pet_approvals, success_rate, most_adopted_pet_types, recent_activity)

    user_adoptions = (
        db.query(Adoption)
        .filter(Adoption.user_id == current_user.id)
        .order_by(Adoption.created_at.desc())
        .limit(20)
        .all()
    )

    if role_value == "adopter":
        return _build_adopter_summary(base, user_adoptions)

    owner_adoption_counts = _count_owner_pet_adoptions(db, current_user.id)
    owner_pets_summary = _count_owner_pets(db, current_user.id)
    owner_total_adoptions = sum(owner_adoption_counts.values())
    owner_success_rate = (
        round((owner_adoption_counts["completed"] / owner_total_adoptions) * 100, 2)
        if owner_total_adoptions
        else 0.0
    )

    return _build_owner_summary(base, owner_adoption_counts, owner_pets_summary, owner_success_rate, recent_activity)
