from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from fastapi import HTTPException
from app.config.settings import settings
import logging
from typing import Generator

logger = logging.getLogger(__name__)

# Create engine
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args=(
        {"check_same_thread": False}
        if "sqlite" in settings.DATABASE_URL
        else {}
    ),
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Base model
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI DB dependency"""
    db = SessionLocal()
    try:
        yield db
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"Database session error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    """Initialize tables"""
    try:
        logger.info("Initializing database...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise


def drop_db():
    """Drop all tables (DEV ONLY)"""
    if getattr(settings, "ENV", "development") == "production":
        raise RuntimeError("drop_db is not allowed in production")

    try:
        logger.warning("Dropping all database tables...")
        Base.metadata.drop_all(bind=engine)
        logger.info("All tables dropped")
    except Exception as e:
        logger.error(f"Error dropping database: {str(e)}")
        raise


def reset_db():
    """Reset DB (DEV ONLY)"""
    if getattr(settings, "ENV", "development") == "production":
        raise RuntimeError("reset_db is not allowed in production")

    try:
        logger.warning("Resetting database...")
        drop_db()
        init_db()
        logger.info("Database reset successfully")
    except Exception as e:
        logger.error(f"Error resetting database: {str(e)}")
        raise


def ensure_pet_owner_column():
    """Add pets.owner_id if missing"""
    try:
        inspector = inspect(engine)

        if "pets" not in inspector.get_table_names():
            return

        columns = {col["name"] for col in inspector.get_columns("pets")}
        if "owner_id" in columns:
            return

        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE pets ADD COLUMN owner_id INTEGER"))

        logger.info("Added pets.owner_id column")

    except Exception as e:
        logger.warning(f"Schema patch failed (pets.owner_id): {str(e)}")
        if getattr(settings, "ENV", "development") == "production":
            raise RuntimeError("Critical schema migration failed")


def migrate_shelter_roles_to_owner():
    """Normalize legacy roles"""
    try:
        with engine.begin() as conn:
            result = conn.execute(
                text("UPDATE users SET role = 'owner' WHERE role = 'shelter'")
            )

        if result.rowcount and result.rowcount > 0:
            logger.info(f"Migrated {result.rowcount} user(s) to owner")

    except Exception as e:
        logger.warning(f"Role migration failed: {str(e)}")
        if getattr(settings, "ENV", "development") == "production":
            raise RuntimeError("Critical data migration failed")


def ensure_pet_vaccination_columns():
    """Add vaccination fields if missing"""
    try:
        inspector = inspect(engine)

        if "pets" not in inspector.get_table_names():
            return

        columns = {col["name"] for col in inspector.get_columns("pets")}

        with engine.begin() as conn:
            if "vaccines_completed" not in columns:
                conn.execute(
                    text(
                        "ALTER TABLE pets ADD COLUMN vaccines_completed INTEGER DEFAULT 0"
                    )
                )
                logger.info("Added pets.vaccines_completed")

            if "next_vaccination_date" not in columns:
                conn.execute(
                    text(
                        "ALTER TABLE pets ADD COLUMN next_vaccination_date DATE"
                    )
                )
                logger.info("Added pets.next_vaccination_date")

    except Exception as e:
        logger.warning(f"Vaccination schema patch failed: {str(e)}")
        if getattr(settings, "ENV", "development") == "production":
            raise RuntimeError("Critical schema migration failed")


def ensure_adoption_workflow_columns():
    """Add adoption workflow columns if missing"""
    try:
        inspector = inspect(engine)

        if "adoptions" not in inspector.get_table_names():
            return

        columns = {col["name"] for col in inspector.get_columns("adoptions")}

        timestamp_type = (
            "DATETIME" if engine.dialect.name == "sqlite" else "TIMESTAMP"
        )

        required = [
            "pickup_requested_datetime",
            "pickup_suggested_datetime",
            "pickup_scheduled_datetime",
            "owner_marked_completed_at",
            "completed_at",
        ]

        with engine.begin() as conn:
            for col in required:
                if col not in columns:
                    conn.execute(
                        text(f"ALTER TABLE adoptions ADD COLUMN {col} {timestamp_type}")
                    )
                    logger.info(f"Added adoptions.{col}")

    except Exception as e:
        logger.warning(f"Adoption workflow migration failed: {str(e)}")
        if getattr(settings, "ENV", "development") == "production":
            raise RuntimeError("Critical schema migration failed")