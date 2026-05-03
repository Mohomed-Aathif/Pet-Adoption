from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_adopter, get_user_with_roles
from app.crud.adoption import AdoptionCRUD
from app.crud.pet import PetCRUD
from app.database import get_db
from app.models.adoption import Adoption
from app.models.pet import PetStatus
from app.models.user import User
from app.models.pet import Pet
from app.schemas.adoption import (
    AdoptionCreate,
    AdoptionRequestCreate,
    AdoptionResponse,
    AdoptionStatusUpdate,
    AdoptionUpdate,
    AdoptionPickupRequestUpdate,
    AdoptionPickupSuggestionUpdate,
)

router = APIRouter(prefix="/adoptions", tags=["adoptions"])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_adoption_status(adoption: Adoption) -> str:
    current_status = str(adoption.status or "").lower()
    if current_status == "owner_marked_completed":
        return "completed"
    if current_status == "completed" and not adoption.completed_at:
        return "approved"
    return current_status


def _timeline_for_adoption(adoption: Adoption):
    events = [
        {"key": "request_sent", "label": "Request Sent", "timestamp": adoption.created_at},
    ]

    normalized = _normalize_adoption_status(adoption)
    if normalized in {"approved", "pickup_requested", "pickup_scheduled", "completed"}:
        events.append(
            {
                "key": "approved",
                "label": "Approved",
                "timestamp": adoption.updated_at or adoption.created_at,
            }
        )

    if adoption.pickup_requested_datetime:
        events.append(
            {
                "key": "pickup_requested",
                "label": "Pickup Requested",
                "timestamp": adoption.pickup_requested_datetime,
            }
        )

    if adoption.pickup_suggested_datetime:
        events.append(
            {
                "key": "pickup_suggested",
                "label": "Pickup Suggestion",
                "timestamp": adoption.pickup_suggested_datetime,
            }
        )

    if adoption.pickup_scheduled_datetime:
        events.append(
            {
                "key": "pickup_scheduled",
                "label": "Pickup Scheduled",
                "timestamp": adoption.pickup_scheduled_datetime,
            }
        )

    completion_timestamp = adoption.completed_at or adoption.owner_marked_completed_at
    if completion_timestamp:
        events.append(
            {
                "key": "completed",
                "label": "Completed",
                "timestamp": completion_timestamp,
            }
        )

    return events


def _ensure_future_datetime(value: datetime, message: str):
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    if value <= _utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    return value


def _append_notes(existing: str | None, incoming: str | None) -> str | None:
    if not incoming:
        return existing
    if not existing:
        return incoming
    return f"{existing}\n{incoming}"


def _serialize_adoptions_with_names(db: Session, adoptions, viewer: User | None = None):
    if not adoptions:
        return []

    user_ids = {a.user_id for a in adoptions}
    pet_ids = {a.pet_id for a in adoptions}

    users = db.query(User.id, User.full_name, User.username, User.email, User.phone).filter(User.id.in_(user_ids)).all()
    pets = db.query(Pet.id, Pet.name, Pet.owner_id).filter(Pet.id.in_(pet_ids)).all()
    owner_ids = {p.owner_id for p in pets if p.owner_id is not None}
    owners = (
        db.query(User.id, User.full_name, User.username, User.email, User.phone, User.address)
        .filter(User.id.in_(owner_ids))
        .all()
        if owner_ids
        else []
    )

    user_map = {
        u.id: (u.full_name or u.username or u.email or f"User {u.id}")
        for u in users
    }
    user_contact_map = {
        u.id: {
            "email": u.email,
            "phone": u.phone,
        }
        for u in users
    }
    pet_map = {p.id: p.name or f"Pet {p.id}" for p in pets}
    owner_name_map = {
        o.id: (o.full_name or o.username or o.email or f"User {o.id}")
        for o in owners
    }
    owner_detail_map = {
        o.id: {
            "phone": o.phone,
            "address": o.address,
        }
        for o in owners
    }
    pet_owner_map = {p.id: p.owner_id for p in pets}

    viewer_role = str(viewer.role.value if hasattr(viewer.role, "value") else viewer.role).lower() if viewer else ""

    rows = []
    for a in adoptions:
        normalized_status = _normalize_adoption_status(a)
        pet_owner_id = pet_owner_map.get(a.pet_id)
        adopter_contact = user_contact_map.get(a.user_id, {})

        can_view_owner_private = (
            viewer is not None
            and viewer_role == "adopter"
            and a.user_id == viewer.id
            and normalized_status in {"approved", "pickup_requested", "pickup_scheduled", "completed"}
        )

        owner_details = owner_detail_map.get(pet_owner_id or -1, {})

        rows.append(
            {
                "id": a.id,
                "user_id": a.user_id,
                "user_name": user_map.get(a.user_id, f"User {a.user_id}"),
                "user_email": adopter_contact.get("email"),
                "user_phone": adopter_contact.get("phone"),
                "pet_id": a.pet_id,
                "pet_name": pet_map.get(a.pet_id, f"Pet {a.pet_id}"),
                "pet_owner_name": owner_name_map.get(pet_owner_id, f"User {pet_owner_id}") if pet_owner_id is not None else None,
                "pet_owner_phone": owner_details.get("phone") if can_view_owner_private else None,
                "pet_owner_address": owner_details.get("address") if can_view_owner_private else None,
                "status": normalized_status,
                "notes": a.notes,
                "adoption_date": a.adoption_date,
                "pickup_requested_datetime": a.pickup_requested_datetime,
                "pickup_suggested_datetime": a.pickup_suggested_datetime,
                "pickup_scheduled_datetime": a.pickup_scheduled_datetime,
                "owner_marked_completed_at": a.owner_marked_completed_at,
                "completed_at": a.completed_at,
                "timeline": _timeline_for_adoption(a),
                "created_at": a.created_at,
                "updated_at": a.updated_at,
            }
        )

    return rows


@router.post("/requests", response_model=AdoptionResponse, status_code=status.HTTP_201_CREATED)
async def create_adoption_request(
    payload: AdoptionRequestCreate,
    current_user=Depends(get_adopter),
    db: Session = Depends(get_db),
):
    """Create an adoption request (adopter/admin)."""
    pet = PetCRUD.get_pet(db, payload.pet_id)
    if not pet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")

    pet_status = pet.status.value if hasattr(pet.status, "value") else str(pet.status).lower()
    if pet_status != "available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Adoption requests can only be created for available pets",
        )

    adoption = AdoptionCreate(
        user_id=current_user.id,
        pet_id=payload.pet_id,
        status="pending",
        notes=payload.notes,
    )
    created = AdoptionCRUD.create_adoption(db, adoption)

    pet.status = PetStatus.PENDING
    db.commit()

    return _serialize_adoptions_with_names(db, [created], viewer=current_user)[0]


@router.get("/me", response_model=List[AdoptionResponse])
async def list_my_adoptions(
    current_user=Depends(get_adopter),
    db: Session = Depends(get_db),
):
    """Get current adopter/admin adoption requests."""
    adoptions = AdoptionCRUD.get_adoptions_by_user(db, current_user.id)
    return _serialize_adoptions_with_names(db, adoptions, viewer=current_user)


@router.get("/requests", response_model=List[AdoptionResponse])
async def list_adoption_requests(
    status_filter: str | None = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user=Depends(get_user_with_roles(["owner", "admin"])),
    db: Session = Depends(get_db),
):
    """List adoption requests for admin or for pets owned by the current user."""

    role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role == "admin":
        if status_filter:
            adoptions = AdoptionCRUD.get_adoptions_by_status(db, status_filter, skip=skip, limit=limit)
            return _serialize_adoptions_with_names(db, adoptions, viewer=current_user)
        adoptions = AdoptionCRUD.get_adoptions(db, skip=skip, limit=limit)
        return _serialize_adoptions_with_names(db, adoptions, viewer=current_user)

    if status_filter:
        adoptions = AdoptionCRUD.get_adoptions_for_pet_owner_by_status(
            db,
            current_user.id,
            status_filter,
            skip=skip,
            limit=limit,
        )
        return _serialize_adoptions_with_names(db, adoptions, viewer=current_user)

    adoptions = AdoptionCRUD.get_adoptions_for_pet_owner(db, current_user.id, skip=skip, limit=limit)
    return _serialize_adoptions_with_names(db, adoptions, viewer=current_user)


@router.put("/requests/{adoption_id}/status", response_model=AdoptionResponse)
async def update_adoption_request_status(
    adoption_id: int,
    payload: AdoptionStatusUpdate,
    current_user=Depends(get_user_with_roles(["owner"])),
    db: Session = Depends(get_db),
):
    """Owner updates request state: approve/reject and scheduling milestones."""
    normalized_status = payload.status.lower()
    if normalized_status == "completed":
        normalized_status = "approved"

    allowed_statuses = {"approved", "cancelled", "pickup_scheduled"}
    if normalized_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Allowed values: approved, cancelled, pickup_scheduled",
        )

    adoption = AdoptionCRUD.get_adoption(db, adoption_id)
    if not adoption:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adoption request not found")

    pet = PetCRUD.get_pet(db, adoption.pet_id)
    if not pet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")

    if pet.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only review requests for pets you own",
        )

    current_status = _normalize_adoption_status(adoption)
    if current_status in {"completed", "cancelled"} and normalized_status != current_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Finalized adoption requests cannot be changed",
        )

    if current_status == normalized_status:
        return _serialize_adoptions_with_names(db, [adoption], viewer=current_user)[0]

    if normalized_status == "approved" and current_status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending requests can be approved")

    if normalized_status == "pickup_scheduled":
        if current_status != "pickup_requested":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pickup can only be scheduled after a pickup request")
        if not adoption.pickup_requested_datetime and not adoption.pickup_suggested_datetime:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No pickup time is available to schedule")

    update_data = {"status": normalized_status, "notes": _append_notes(adoption.notes, payload.notes)}

    if normalized_status == "pickup_scheduled":
        update_data["pickup_scheduled_datetime"] = adoption.pickup_suggested_datetime or adoption.pickup_requested_datetime
    updated = AdoptionCRUD.update_adoption(
        db,
        adoption_id,
        AdoptionUpdate(**update_data),
    )

    if normalized_status == "approved":
        pet.status = PetStatus.PENDING
    elif normalized_status == "cancelled":
        pet.status = PetStatus.AVAILABLE
    elif normalized_status in {"pickup_requested", "pickup_scheduled"}:
        pet.status = PetStatus.PENDING
    db.commit()

    return _serialize_adoptions_with_names(db, [updated], viewer=current_user)[0]


@router.post("/requests/{adoption_id}/pickup-request", response_model=AdoptionResponse)
async def request_pickup_schedule(
    adoption_id: int,
    payload: AdoptionPickupRequestUpdate,
    current_user=Depends(get_user_with_roles(["adopter"])),
    db: Session = Depends(get_db),
):
    """Adopter requests a pickup date/time after approval."""
    adoption = AdoptionCRUD.get_adoption(db, adoption_id)
    if not adoption:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adoption request not found")

    if adoption.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only schedule your own adoption request")

    current_status = _normalize_adoption_status(adoption)
    if current_status not in {"approved", "pickup_requested", "pickup_scheduled"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pickup can be requested only after approval")

    pickup_time = _ensure_future_datetime(payload.pickup_datetime, "Pickup date/time must be in the future")

    updated = AdoptionCRUD.update_adoption(
        db,
        adoption_id,
        AdoptionUpdate(
            status="pickup_requested",
            notes=_append_notes(adoption.notes, payload.notes),
            pickup_requested_datetime=pickup_time,
            pickup_suggested_datetime=None,
            pickup_scheduled_datetime=None,
        ),
    )

    pet = PetCRUD.get_pet(db, adoption.pet_id)
    if pet:
        pet.status = PetStatus.PENDING
        db.commit()

    return _serialize_adoptions_with_names(db, [updated], viewer=current_user)[0]


@router.put("/requests/{adoption_id}/pickup-suggestion", response_model=AdoptionResponse)
async def suggest_pickup_schedule(
    adoption_id: int,
    payload: AdoptionPickupSuggestionUpdate,
    current_user=Depends(get_user_with_roles(["owner"])),
    db: Session = Depends(get_db),
):
    """Owner suggests a different pickup date/time."""
    adoption = AdoptionCRUD.get_adoption(db, adoption_id)
    if not adoption:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adoption request not found")

    pet = PetCRUD.get_pet(db, adoption.pet_id)
    if not pet or pet.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only manage pickup for your own pets")

    current_status = _normalize_adoption_status(adoption)
    if current_status != "pickup_requested":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pickup suggestion is allowed only after a pickup request")

    suggested_time = _ensure_future_datetime(payload.pickup_datetime, "Suggested pickup date/time must be in the future")

    updated = AdoptionCRUD.update_adoption(
        db,
        adoption_id,
        AdoptionUpdate(
            status="pickup_requested",
            notes=_append_notes(adoption.notes, payload.notes),
            pickup_suggested_datetime=suggested_time,
        ),
    )

    return _serialize_adoptions_with_names(db, [updated], viewer=current_user)[0]


@router.post("/requests/{adoption_id}/pickup-suggestion/accept", response_model=AdoptionResponse)
async def accept_pickup_suggestion(
    adoption_id: int,
    current_user=Depends(get_user_with_roles(["adopter"])),
    db: Session = Depends(get_db),
):
    """Adopter accepts owner suggested pickup time."""
    adoption = AdoptionCRUD.get_adoption(db, adoption_id)
    if not adoption:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adoption request not found")

    if adoption.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only confirm your own adoption request")

    current_status = _normalize_adoption_status(adoption)
    if current_status != "pickup_requested" or not adoption.pickup_suggested_datetime:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No owner suggestion available to accept")

    updated = AdoptionCRUD.update_adoption(
        db,
        adoption_id,
        AdoptionUpdate(
            status="pickup_scheduled",
            pickup_scheduled_datetime=adoption.pickup_suggested_datetime,
        ),
    )

    return _serialize_adoptions_with_names(db, [updated], viewer=current_user)[0]


@router.post("/requests/{adoption_id}/pickup-complete", response_model=AdoptionResponse)
async def owner_mark_pickup_completed(
    adoption_id: int,
    payload: AdoptionStatusUpdate,
    current_user=Depends(get_user_with_roles(["owner"])),
    db: Session = Depends(get_db),
):
    """Owner marks physical pickup as completed and finalizes the adoption."""
    adoption = AdoptionCRUD.get_adoption(db, adoption_id)
    if not adoption:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adoption request not found")

    pet = PetCRUD.get_pet(db, adoption.pet_id)
    if not pet or pet.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only complete adoptions for your own pets")

    current_status = _normalize_adoption_status(adoption)
    if current_status == "completed" or adoption.completed_at:
        return _serialize_adoptions_with_names(db, [adoption], viewer=current_user)[0]

    if current_status != "pickup_scheduled":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pickup must be scheduled before completion")

    updated = AdoptionCRUD.update_adoption(
        db,
        adoption_id,
        AdoptionUpdate(
            status="completed",
            notes=_append_notes(adoption.notes, payload.notes),
            completed_at=_utcnow(),
        ),
    )

    pet.status = PetStatus.ADOPTED
    db.commit()

    return _serialize_adoptions_with_names(db, [updated], viewer=current_user)[0]


@router.delete("/requests/{adoption_id}")
async def delete_my_adoption_request(
    adoption_id: int,
    current_user=Depends(get_user_with_roles(["adopter"])),
    db: Session = Depends(get_db),
):
    """Delete a pending adoption request created by the current adopter."""
    adoption = AdoptionCRUD.get_adoption(db, adoption_id)
    if not adoption:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adoption request not found")

    if adoption.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own adoption requests",
        )

    current_status = _normalize_adoption_status(adoption)
    if current_status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending adoption requests can be deleted",
        )

    pet = PetCRUD.get_pet(db, adoption.pet_id)
    deleted = AdoptionCRUD.delete_adoption(db, adoption_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adoption request not found")

    if pet:
        remaining_finalized = (
            db.query(Adoption.id)
            .filter(Adoption.pet_id == pet.id, Adoption.status == "completed")
            .first()
        )
        remaining_active = (
            db.query(Adoption.id)
            .filter(Adoption.pet_id == pet.id, Adoption.status.in_(["pending", "approved", "pickup_requested", "pickup_scheduled"]))
            .first()
        )

        if remaining_finalized:
            pet.status = PetStatus.ADOPTED
        elif remaining_active:
            pet.status = PetStatus.PENDING
        else:
            pet.status = PetStatus.AVAILABLE
        db.commit()

    return {"detail": "Adoption request deleted successfully"}
