"""
// Seed script to create demo users for development/testing only
"""

import sys
import os
from pathlib import Path
import logging

sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal
from app.models.user import User, UserRole
from app.crud.user import UserCRUD
from app.utils.security import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_demo_users():
    """Create demo users (development only)"""

    if os.getenv("ENVIRONMENT") == "production":
        raise RuntimeError("Demo seeding is disabled in production")

    db = SessionLocal()
    try:
        demo_users = [
            {
                "email": "admin_demo@example.com",
                "username": "admin_demo",
                "password": os.getenv("DEMO_ADMIN_PASSWORD", "change_me"),
                "full_name": "Demo Admin",
                "role": UserRole.ADMIN,
            },
            {
                "email": "adopter_demo@example.com",
                "username": "adopter_demo",
                "password": os.getenv("DEMO_USER_PASSWORD", "change_me"),
                "full_name": "Demo Adopter",
                "role": UserRole.ADOPTER,
            },
        ]

        logger.info("Seeding demo users...")

        for user_data in demo_users:
            existing = UserCRUD.get_user_by_email(db, user_data["email"])
            if existing:
                continue

            user = User(
                email=user_data["email"],
                username=user_data["username"],
                hashed_password=hash_password(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"],
                is_active=True,
                is_verified=True,
            )

            db.add(user)
            db.commit()

        logger.info("✓ Demo users seeded successfully")

    except Exception as e:
        logger.error(f"Error creating demo users: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_users()