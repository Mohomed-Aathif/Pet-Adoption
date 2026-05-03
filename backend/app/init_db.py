"""
Database initialization and admin user setup utilities
Run this script to initialize the database with a default admin user
"""

import sys
import os
from pathlib import Path
import logging

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import init_db, SessionLocal
from app.models.user import User, UserRole
from app.crud.user import UserCRUD
from app.utils.security import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_admin_user(
    email: str,
    username: str,
    password: str,
    full_name: str
):
    """Create admin user if it doesn't exist"""
    db = SessionLocal()
    try:
        existing = UserCRUD.get_user_by_email(db, email)
        if existing:
            logger.warning(f"Admin user '{email}' already exists")
            return existing

        admin_user = User(
            email=email,
            username=username,
            hashed_password=hash_password(password),
            full_name=full_name,
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        logger.info("Admin user created successfully")
        logger.info(f"Email: {email}")
        logger.info(f"Username: {username}")

        return admin_user

    except Exception as e:
        logger.error(f"Error creating admin user: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


def create_default_roles():
    """Log available roles"""
    roles = [role.value for role in UserRole]
    logger.info(f"Available user roles: {', '.join(roles)}")
    return roles


def initialize_database():
    """Initialize database with tables and roles"""
    try:
        logger.info("=" * 50)
        logger.info("Database Initialization")
        logger.info("=" * 50)

        logger.info("Creating database tables...")
        init_db()

        logger.info("Initializing user roles...")
        create_default_roles()

        logger.info("Database setup complete")

    except Exception as e:
        logger.error("Database initialization failed!")
        logger.error(str(e))
        sys.exit(1)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Database initialization")

    parser.add_argument("--email", default=os.getenv("ADMIN_EMAIL", "admin@petadoption.com"))
    parser.add_argument("--username", default=os.getenv("ADMIN_USERNAME", "admin"))
    parser.add_argument("--password", default=os.getenv("ADMIN_PASSWORD"))
    parser.add_argument("--full-name", default=os.getenv("ADMIN_FULL_NAME", "System Administrator"))

    args = parser.parse_args()

    # Enforce password requirement
    if not args.password:
        raise ValueError("ADMIN_PASSWORD environment variable is required")

    # Prevent unsafe default in production
    if os.getenv("ENV") == "production" and args.password == "AdminPassword123":
        raise ValueError("Default password not allowed in production")

    initialize_database()

    create_admin_user(
        email=args.email,
        username=args.username,
        password=args.password,
        full_name=args.full_name
    )