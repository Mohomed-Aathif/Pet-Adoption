from fastapi import APIRouter
from .endpoints import pets, users, auth, admin, adoptions, dashboard, favorites, donations, stray_reports

router = APIRouter()

# Include all routers
router.include_router(auth.router)
router.include_router(pets.router)
router.include_router(users.router)
router.include_router(admin.router)
router.include_router(adoptions.router)
router.include_router(dashboard.router)
router.include_router(favorites.router)
router.include_router(donations.router)
router.include_router(stray_reports.router)


