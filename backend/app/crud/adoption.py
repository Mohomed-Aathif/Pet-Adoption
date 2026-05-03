from sqlalchemy.orm import Session
from app.models.adoption import Adoption
from app.models.pet import Pet
from app.schemas.adoption import AdoptionCreate, AdoptionUpdate
from typing import List, Optional

class AdoptionCRUD:
    @staticmethod
    def get_adoption(db: Session, adoption_id: int) -> Optional[Adoption]:
        return db.query(Adoption).filter(Adoption.id == adoption_id).first()

    @staticmethod
    def get_adoptions_by_user(db: Session, user_id: int) -> List[Adoption]:
        return db.query(Adoption).filter(Adoption.user_id == user_id).all()

    @staticmethod
    def get_adoptions(db: Session, skip: int = 0, limit: int = 100) -> List[Adoption]:
        return db.query(Adoption).offset(skip).limit(limit).all()

    @staticmethod
    def get_adoptions_by_status(db: Session, status: str, skip: int = 0, limit: int = 100) -> List[Adoption]:
        return (
            db.query(Adoption)
            .filter(Adoption.status == status)
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_adoptions_for_pet_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100) -> List[Adoption]:
        return (
            db.query(Adoption)
            .join(Pet, Pet.id == Adoption.pet_id)
            .filter(Pet.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_adoptions_for_pet_owner_by_status(
        db: Session,
        owner_id: int,
        status: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Adoption]:
        return (
            db.query(Adoption)
            .join(Pet, Pet.id == Adoption.pet_id)
            .filter(Pet.owner_id == owner_id, Adoption.status == status)
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def create_adoption(db: Session, adoption: AdoptionCreate) -> Adoption:
        db_adoption = Adoption(**adoption.dict())
        db.add(db_adoption)
        db.commit()
        db.refresh(db_adoption)
        return db_adoption

    @staticmethod
    def update_adoption(db: Session, adoption_id: int, adoption_update: AdoptionUpdate) -> Optional[Adoption]:
        db_adoption = db.query(Adoption).filter(Adoption.id == adoption_id).first()
        if db_adoption:
            update_data = adoption_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_adoption, field, value)
            db.commit()
            db.refresh(db_adoption)
        return db_adoption

    @staticmethod
    def delete_adoption(db: Session, adoption_id: int) -> bool:
        db_adoption = db.query(Adoption).filter(Adoption.id == adoption_id).first()
        if not db_adoption:
            return False

        db.delete(db_adoption)
        db.commit()
        return True
