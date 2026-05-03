from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_user
from app.crud.favorite import FavoriteCRUD
from app.schemas.pet import PetResponse
from typing import List
import logging

router = APIRouter(prefix="/favorites", tags=["favorites"])
logger = logging.getLogger(__name__)


@router.get("/count")
def get_favorites_count(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get count of favorites for current user"""
    count = FavoriteCRUD.get_user_favorites_count(db, current_user.id)
    return {"count": count}


@router.get("", response_model=List[PetResponse])
def get_favorites(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all favorites for current user"""
    favorites = FavoriteCRUD.get_user_favorites(db, current_user.id, skip, limit)
    return favorites


@router.post("/{pet_id}")
def add_favorite(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Add a pet to user's favorites"""
    try:
        FavoriteCRUD.add_favorite(db, current_user.id, pet_id)
        return {"message": "Pet added to favorites", "pet_id": pet_id}
    except ValueError as e:
        logger.exception("Favorite add failed: %s", e)
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected favorite add failure for user_id=%s pet_id=%s", current_user.id, pet_id)
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{pet_id}")
def remove_favorite(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Remove a pet from user's favorites"""
    success = FavoriteCRUD.remove_favorite(db, current_user.id, pet_id)
    if not success:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"message": "Pet removed from favorites", "pet_id": pet_id}


@router.get("/{pet_id}/is-favorite")
def is_favorite(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Check if a pet is favorited by current user"""
    is_fav = FavoriteCRUD.is_favorite(db, current_user.id, pet_id)
    return {"is_favorite": is_fav}
