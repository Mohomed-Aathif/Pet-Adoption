import logging
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from fastapi import HTTPException

from app.config.settings import settings

logger = logging.getLogger(__name__)


# Database Engine

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args=(
        {"check_same_thread": False}
        if settings.DATABASE_URL.startswith("sqlite")
        else {}
    ),
)


# Session Factory

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# Base Model

Base = declarative_base()



# Dependency (FastAPI)

def get_db() -> Generator[Session, None, None]:
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



# Initialization

def init_db():
    """
    Initialize database tables.
    NOTE: In production, use Alembic migrations instead.
    """
    try:
        logger.info("Initializing database...")
        Base.metadata.create_all(bind=engine)
        logger.info("✓ Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise



# Dangerous Operations (Guarded)

def drop_db():
    """
    Drop all database tables.
    Disabled in production for safety.
    """
    if settings.ENVIRONMENT == "production":
        raise RuntimeError("drop_db() is disabled in production")

    try:
        logger.warning("Dropping all database tables...")
        Base.metadata.drop_all(bind=engine)
        logger.info("✓ All tables dropped")
    except Exception as e:
        logger.error(f"Error dropping database: {str(e)}")
        raise


def reset_db():
    """
    Reset database (drop + recreate).
    Disabled in production for safety.
    """
    if settings.ENVIRONMENT == "production":
        raise RuntimeError("reset_db() is disabled in production")

    try:
        logger.warning("Resetting database...")
        drop_db()
        init_db()
        logger.info("✓ Database reset successfully")
    except Exception as e:
        logger.error(f"Error resetting database: {str(e)}")
        raise