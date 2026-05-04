from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from app.database import Base
import enum


class StrayReportStatus(str, enum.Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


class StrayReport(Base):
    __tablename__ = "stray_reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_name = Column(String(150), nullable=False)
    contact_number = Column(String(25), nullable=False)
    email = Column(String(255), nullable=True)
    location = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    status = Column(
        SQLEnum(
            StrayReportStatus,
            name="strayreportstatus",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        default=StrayReportStatus.NEW,
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
