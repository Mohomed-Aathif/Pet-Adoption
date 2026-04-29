# Application initialization

from .main import app
from app.config.settings import settings
print("DATABASE_URL:", settings.DATABASE_URL)
__all__ = ["app"]
