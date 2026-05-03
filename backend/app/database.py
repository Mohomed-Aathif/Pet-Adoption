from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi import HTTPException
from app.config.settings import settings
import logging
from typing import Generator

logger = logging.getLogger(__name__)

# Create engine with connection pool
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,  # Verify connections before using them
    pool_recycle=3600,   # Recycle connections after 1 hour
    connect_args=(
        {"check_same_thread": False}
        if "sqlite" in settings.DATABASE_URL
        else {}
    ),
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Base class for all models
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:

    db = SessionLocal()
    try:
        yield db
    except HTTPException:
        # HTTP errors (e.g., 401 from auth endpoints) are expected and should not be logged as DB failures.
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"Database session error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

def init_db():

    try:
        logger.info("Initializing database...")
        Base.metadata.create_all(bind=engine)
        logger.info("✓ Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

def drop_db():

    try:
        logger.warning("Dropping all database tables...")
        Base.metadata.drop_all(bind=engine)
        logger.info("✓ All tables dropped")
    except Exception as e:
        logger.error(f"Error dropping database: {str(e)}")
        raise

def reset_db():

    try:
        logger.warning("Resetting database...")
        drop_db()
        init_db()
        logger.info("✓ Database reset successfully")
    except Exception as e:
        logger.error(f"Error resetting database: {str(e)}")
        raise


def ensure_pet_owner_column():
    """Best-effort schema patch: add pets.owner_id when missing."""
    try:
        inspector = inspect(engine)
        if "pets" not in inspector.get_table_names():
            return

        pet_columns = {col["name"] for col in inspector.get_columns("pets")}
        if "owner_id" in pet_columns:
            return

        ddl = "ALTER TABLE pets ADD COLUMN owner_id INTEGER"

        with engine.begin() as conn:
            conn.execute(text(ddl))

        logger.info("✓ Added pets.owner_id column")
    except Exception as e:
        logger.warning(f"Could not ensure pets.owner_id column: {str(e)}")


def migrate_shelter_roles_to_owner():
    """Best-effort data migration: normalize legacy shelter users to owner."""
    try:
        with engine.begin() as conn:
            result = conn.execute(
                text("UPDATE users SET role = 'owner' WHERE role = 'shelter'")
            )

        if result.rowcount and result.rowcount > 0:
            logger.info(f"✓ Migrated {result.rowcount} shelter user(s) to owner")
    except Exception as e:
        logger.warning(f"Could not migrate shelter roles to owner: {str(e)}")


def ensure_pet_vaccination_columns():
    """Best-effort schema patch: add pets.vaccines_completed and pets.next_vaccination_date when missing."""
    try:
        inspector = inspect(engine)
        if "pets" not in inspector.get_table_names():
            return

        pet_columns = {col["name"] for col in inspector.get_columns("pets")}
        
        # Add vaccines_completed column if missing
        if "vaccines_completed" not in pet_columns:
            ddl = "ALTER TABLE pets ADD COLUMN vaccines_completed INTEGER DEFAULT 0"
            
            with engine.begin() as conn:
                conn.execute(text(ddl))
            logger.info("✓ Added pets.vaccines_completed column")
        
        # Add next_vaccination_date column if missing
        if "next_vaccination_date" not in pet_columns:
            ddl = "ALTER TABLE pets ADD COLUMN next_vaccination_date DATE"
            
            with engine.begin() as conn:
                conn.execute(text(ddl))
            logger.info("✓ Added pets.next_vaccination_date column")
    except Exception as e:
        logger.warning(f"Could not ensure pet vaccination columns: {str(e)}")


def ensure_adoption_workflow_columns():
    """Best-effort schema patch: add new adoptions workflow columns when missing."""
    try:
        inspector = inspect(engine)
        if "adoptions" not in inspector.get_table_names():
            return

        adoption_columns = {col["name"] for col in inspector.get_columns("adoptions")}
        timestamp_type = "TIMESTAMP"
        if engine.dialect.name == "sqlite":
            timestamp_type = "DATETIME"
        missing_columns = [
            "pickup_requested_datetime",
            "pickup_suggested_datetime",
            "pickup_scheduled_datetime",
            "owner_marked_completed_at",
            "completed_at",
        ]

        if not any(column not in adoption_columns for column in missing_columns):
            return

        for column_name in missing_columns:
            if column_name in adoption_columns:
                continue

            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE adoptions ADD COLUMN {column_name} {timestamp_type}"))
            logger.info(f"✓ Added adoptions.{column_name} column")
    except Exception as e:
        logger.warning(f"Could not ensure adoption workflow columns: {str(e)}")

