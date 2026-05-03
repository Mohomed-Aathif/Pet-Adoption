from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.models.favorite import Favorite
from app.models.pet import Pet


class FavoriteCRUD:
    """CRUD operations for favorites"""
    
    @staticmethod
    def add_favorite(db: Session, user_id: int, pet_id: int) -> Favorite:
        """Add a pet to user's favorites"""
        pet = db.query(Pet).filter(Pet.id == pet_id).first()
        if not pet:
            raise ValueError("Pet not found")

        # Check if already favorited
        existing = db.query(Favorite).filter(
            Favorite.user_id == user_id,
            Favorite.pet_id == pet_id
        ).first()
        
        if existing:
            return existing
        
        favorite = Favorite(user_id=user_id, pet_id=pet_id)
        try:
            db.add(favorite)
            db.commit()
            db.refresh(favorite)
            return favorite
        except IntegrityError:
            db.rollback()
            existing = db.query(Favorite).filter(
                Favorite.user_id == user_id,
                Favorite.pet_id == pet_id
            ).first()
            if existing:
                return existing
            raise
    
    @staticmethod
    def remove_favorite(db: Session, user_id: int, pet_id: int) -> bool:
        """Remove a pet from user's favorites"""
        favorite = db.query(Favorite).filter(
            Favorite.user_id == user_id,
            Favorite.pet_id == pet_id
        ).first()
        
        if favorite:
            db.delete(favorite)
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_user_favorites(db: Session, user_id: int, skip: int = 0, limit: int = 100):
        """Get all favorites for a user with pet details"""
        return db.query(Pet).join(
            Favorite, Pet.id == Favorite.pet_id
        ).filter(
            Favorite.user_id == user_id
        ).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_user_favorites_count(db: Session, user_id: int) -> int:
        """Get count of favorites for a user"""
        return db.query(Favorite).filter(
            Favorite.user_id == user_id
        ).count()
    
    @staticmethod
    def is_favorite(db: Session, user_id: int, pet_id: int) -> bool:
        """Check if a pet is favorited by user"""
        return db.query(Favorite).filter(
            Favorite.user_id == user_id,
            Favorite.pet_id == pet_id
        ).first() is not None
