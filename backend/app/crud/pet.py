from sqlalchemy.orm import Session
from app.models.pet import Pet
from app.schemas.pet import PetCreate, PetUpdate
from typing import List, Optional

class PetCRUD:
    @staticmethod
    def get_pet(db: Session, pet_id: int) -> Optional[Pet]:
        return db.query(Pet).filter(Pet.id == pet_id).first()

    @staticmethod
    def get_pets(db: Session, skip: int = 0, limit: int = 100) -> List[Pet]:
        return db.query(Pet).order_by(Pet.created_at.asc(), Pet.id.asc()).offset(skip).limit(limit).all()

    @staticmethod
    def create_pet(db: Session, pet: PetCreate, owner_id: int | None = None) -> Pet:
        db_pet = Pet(**pet.dict(), owner_id=owner_id)
        db.add(db_pet)
        db.commit()
        db.refresh(db_pet)
        return db_pet

    @staticmethod
    def update_pet(db: Session, pet_id: int, pet_update: PetUpdate) -> Optional[Pet]:
        db_pet = db.query(Pet).filter(Pet.id == pet_id).first()
        if db_pet:
            update_data = pet_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_pet, field, value)
            db.commit()
            db.refresh(db_pet)
        return db_pet

    @staticmethod
    def delete_pet(db: Session, pet_id: int) -> bool:
        db_pet = db.query(Pet).filter(Pet.id == pet_id).first()
        if db_pet:
            db.delete(db_pet)
            db.commit()
            return True
        return False
