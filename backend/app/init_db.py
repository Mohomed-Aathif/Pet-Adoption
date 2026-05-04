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


def create_admin_user(email: str, username: str, password: str, full_name: str):
    if not password:
        raise ValueError("Admin password must be provided via environment variable or CLI")

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

        logger.info("✓ Admin user created successfully")
        logger.info(f"  Email: {email}")
        logger.info(f"  Username: {username}")

        return admin_user

    except Exception as e:
        logger.error(f"Error creating admin user: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


def create_default_roles():
    roles = [role.value for role in UserRole]
    logger.info(f"✓ Available user roles: {', '.join(roles)}")
    return roles


def initialize_database():
    try:
        logger.info("=" * 50)
        logger.info("Database Initialization")
        logger.info("=" * 50)

        logger.info("\nCreating database tables...")
        init_db()

        logger.info("\nInitializing user roles...")
        create_default_roles()

        logger.info("\n" + "=" * 50)
        logger.info("Database initialization complete!")
        logger.info("=" * 50)

    except Exception as e:
        logger.error("\nDatabase initialization failed!")
        logger.error(str(e))
        sys.exit(1)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Database initialization")

    parser.add_argument("--email", help="Admin email")
    parser.add_argument("--username", help="Admin username")
    parser.add_argument("--password", help="Admin password")
    parser.add_argument("--full-name", help="Admin full name")

    args = parser.parse_args()

    # Load from environment if not provided via CLI
    email = args.email or os.getenv("ADMIN_EMAIL")
    username = args.username or os.getenv("ADMIN_USERNAME")
    password = args.password or os.getenv("ADMIN_PASSWORD")
    full_name = args.full_name or os.getenv("ADMIN_FULL_NAME", "System Administrator")

    initialize_database()

    # Only create admin if explicitly enabled
    if os.getenv("CREATE_ADMIN", "false").lower() == "true":
        if not email or not username or not password:
            raise ValueError(
                "ADMIN_EMAIL, ADMIN_USERNAME, and ADMIN_PASSWORD must be set "
                "via environment variables or CLI when CREATE_ADMIN=true"
            )

        create_admin_user(
            email=email,
            username=username,
            password=password,
            full_name=full_name,
        )