from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.schemas.pet import PetCreate, PetResponse, PetUpdate
from app.crud.pet import PetCRUD
from app.database import get_db
from app.core.dependencies import get_user_with_roles
from app.models.adoption import Adoption
from app.models.user import User
from typing import List, Optional
import uuid
import os
from pathlib import Path

router = APIRouter(tags=["pets"])

# Upload directory setup
UPLOAD_DIR = Path(__file__).resolve().parents[4] / "uploads" / "pets"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def _is_admin(user) -> bool:
    role = user.role.value if hasattr(user.role, "value") else str(user.role)
    return role == "admin"


def _validate_image(file: UploadFile) -> None:
    """Validate uploaded image file"""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Accepted: {', '.join(ALLOWED_EXTENSIONS)}"
        )


async def _save_image(file: UploadFile) -> str:
    """Save uploaded image and return the URL path"""
    ext = os.path.splitext(file.filename or ".jpg")[1].lower()
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB")

    with open(filepath, "wb") as f:
        f.write(contents)

    return f"/uploads/pets/{filename}"


def _serialize_pet_with_adopter(db: Session, pet):
    adopted_by_name = None
    owner_name = None
    pet_status = pet.status.value if hasattr(pet.status, "value") else str(pet.status).lower()

    if pet.owner_id:
        owner = (
            db.query(User.full_name, User.username, User.email)
            .filter(User.id == pet.owner_id)
            .first()
        )
        if owner:
            owner_name = owner.full_name or owner.username or owner.email

    if pet_status == "adopted":
        adoption = (
            db.query(Adoption.user_id)
            .filter(Adoption.pet_id == pet.id, Adoption.status == "completed")
            .order_by(Adoption.created_at.desc())
            .first()
        )
        if adoption:
            adopter = (
                db.query(User.full_name, User.username, User.email)
                .filter(User.id == adoption.user_id)
                .first()
            )
            if adopter:
                adopted_by_name = adopter.full_name or adopter.username or adopter.email

    payload = PetResponse.model_validate(pet).model_dump()
    payload["owner_name"] = owner_name
    payload["adopted_by_name"] = adopted_by_name
    return payload


@router.get("/pets", response_model=List[PetResponse])
async def list_pets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all available pets"""
    pets = PetCRUD.get_pets(db, skip=skip, limit=limit)
    return [_serialize_pet_with_adopter(db, pet) for pet in pets]

@router.get("/pets/{pet_id}", response_model=PetResponse)
async def get_pet(pet_id: int, db: Session = Depends(get_db)):
    """Get a specific pet by ID"""
    pet = PetCRUD.get_pet(db, pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return _serialize_pet_with_adopter(db, pet)

@router.post("/pets", response_model=PetResponse)
async def create_pet(
    pet: PetCreate,
    current_user=Depends(get_user_with_roles(["owner"])),
    db: Session = Depends(get_db),
):
    """Create a new pet (JSON body, no image)"""
    return PetCRUD.create_pet(db, pet, owner_id=current_user.id)

@router.post("/pets/with-image", response_model=PetResponse)
async def create_pet_with_image(
    name: str = Form(...),
    species: str = Form(...),
    breed: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    description: Optional[str] = Form(None),
    status: str = Form("available"),
    image: Optional[UploadFile] = File(None),
    current_user=Depends(get_user_with_roles(["owner"])),
    db: Session = Depends(get_db),
):
    """Create a new pet with an optional image upload"""
    image_url = None
    if image and image.filename:
        _validate_image(image)
        image_url = await _save_image(image)

    pet_data = PetCreate(
        name=name,
        species=species,
        breed=breed,
        age=age,
        description=description,
        status=status,
        image_url=image_url,
    )
    return PetCRUD.create_pet(db, pet_data, owner_id=current_user.id)


@router.post("/pets/{pet_id}/upload-image", response_model=PetResponse)
async def upload_pet_image(
    pet_id: int,
    image: UploadFile = File(...),
    _editor=Depends(get_user_with_roles(["owner", "admin"])),
    db: Session = Depends(get_db),
):
    """Upload or replace a pet's photo"""
    pet = PetCRUD.get_pet(db, pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    _validate_image(image)

    # Delete old image file if it exists
    if pet.image_url:
        old_path = UPLOAD_DIR / os.path.basename(pet.image_url)
        if old_path.exists():
            old_path.unlink()

    image_url = await _save_image(image)

    pet_update = PetUpdate(image_url=image_url)
    updated_pet = PetCRUD.update_pet(db, pet_id, pet_update)
    return updated_pet


@router.put("/pets/{pet_id}", response_model=PetResponse)
async def update_pet(
    pet_id: int,
    pet_update: PetUpdate,
    current_user=Depends(get_user_with_roles(["owner", "admin"])),
    db: Session = Depends(get_db),
):
    """Update a pet"""
    existing_pet = PetCRUD.get_pet(db, pet_id)
    if not existing_pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    if not _is_admin(current_user) and existing_pet.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update pets you added")

    pet = PetCRUD.update_pet(db, pet_id, pet_update)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return pet

@router.delete("/pets/{pet_id}")
async def delete_pet(
    pet_id: int,
    current_user=Depends(get_user_with_roles(["owner", "admin"])),
    db: Session = Depends(get_db),
):
    """Delete a pet"""
    existing_pet = PetCRUD.get_pet(db, pet_id)
    if not existing_pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    if not _is_admin(current_user) and existing_pet.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete pets you added")

    if not PetCRUD.delete_pet(db, pet_id):
        raise HTTPException(status_code=404, detail="Pet not found")
    return {"detail": "Pet deleted"}
