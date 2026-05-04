import os
import uuid
from pathlib import Path
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.core.dependencies import get_admin_user
from app.crud.stray_report import StrayReportCRUD
from app.database import get_db
from app.models.stray_report import StrayReportStatus as ModelStrayReportStatus
from app.schemas.stray_report import (
    StrayReportAdminListResponse,
    StrayReportAdminResponse,
    StrayReportCreate,
    StrayReportCreateResponse,
    StrayReportPublicResponse,
    StrayReportStatus,
    StrayReportStatusUpdate,
)

router = APIRouter(prefix="/stray-reports", tags=["stray-reports"])

UPLOAD_DIR = Path(__file__).resolve().parents[4] / "uploads" / "stray_reports"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def _validate_image(file: UploadFile) -> None:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Accepted: {', '.join(ALLOWED_EXTENSIONS)}",
        )


def _save_image(filename: str, contents: bytes) -> str:
    ext = os.path.splitext(filename or ".jpg")[1].lower()
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename

    with open(filepath, "wb") as file_buffer:
        file_buffer.write(contents)

    return f"/uploads/stray_reports/{filename}"


def _validate_status_transition(current: StrayReportStatus, target: StrayReportStatus) -> None:
    if current == target:
        return

    allowed_transitions = {
        StrayReportStatus.NEW: {StrayReportStatus.IN_PROGRESS},
        StrayReportStatus.IN_PROGRESS: {StrayReportStatus.RESOLVED},
        StrayReportStatus.RESOLVED: set(),
    }

    if target not in allowed_transitions[current]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition from '{current.value}' to '{target.value}'",
        )


@router.post(
    "",
    response_model=StrayReportCreateResponse,
    responses={400: {"description": "Validation or file upload error"}},
)
async def create_stray_report(
    db: Annotated[Session, Depends(get_db)],
    reporter_name: Annotated[str, Form(...)],
    contact_number: Annotated[str, Form(...)],
    location: Annotated[str, Form(...)],
    email: Annotated[Optional[str], Form()] = None,
    description: Annotated[Optional[str], Form()] = None,
    image: Annotated[Optional[UploadFile], File()] = None,
):
    image_url = None
    if image and image.filename:
        _validate_image(image)
        contents = await image.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB")
        image_url = _save_image(image.filename, contents)

    payload = StrayReportCreate(
        reporter_name=reporter_name,
        contact_number=contact_number,
        location=location,
        email=email,
        description=description,
        image_url=image_url,
    )

    report = StrayReportCRUD.create_report(db, payload)
    return {
        "message": "Stray reported successfully. Thank you for helping!",
        "report_id": report.id,
    }


@router.get("/public", response_model=list[StrayReportPublicResponse])
def get_public_stray_reports(
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=20)] = 5,
    unresolved_only: Annotated[bool, Query()] = True,
):
    return StrayReportCRUD.get_public_reports(db, limit=limit, unresolved_only=unresolved_only)


@router.get("/admin", response_model=StrayReportAdminListResponse)
def get_admin_stray_reports(
    _admin: Annotated[object, Depends(get_admin_user)],
    db: Annotated[Session, Depends(get_db)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    status: Annotated[StrayReportStatus | None, Query()] = None,
):
    items = StrayReportCRUD.get_admin_reports(db, skip=skip, limit=limit, status=status)
    total = StrayReportCRUD.count_admin_reports(db, status=status)

    return {
        "total": total,
        "page": (skip // limit) + 1,
        "page_size": limit,
        "items": items,
    }


@router.get(
    "/admin/{report_id}",
    response_model=StrayReportAdminResponse,
    responses={404: {"description": "Stray report not found"}},
)
def get_admin_stray_report_detail(
    report_id: int,
    _admin: Annotated[object, Depends(get_admin_user)],
    db: Annotated[Session, Depends(get_db)],
):
    report = StrayReportCRUD.get_report_by_id(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Stray report not found")

    return report


@router.put(
    "/admin/{report_id}/status",
    response_model=StrayReportAdminResponse,
    responses={
        400: {"description": "Invalid status transition"},
        404: {"description": "Stray report not found"},
    },
)
def update_admin_stray_report_status(
    report_id: int,
    payload: StrayReportStatusUpdate,
    _admin: Annotated[object, Depends(get_admin_user)],
    db: Annotated[Session, Depends(get_db)],
):
    report = StrayReportCRUD.get_report_by_id(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Stray report not found")

    current_status = StrayReportStatus(
        report.status.value if isinstance(report.status, ModelStrayReportStatus) else str(report.status)
    )
    _validate_status_transition(current_status, payload.status)

    return StrayReportCRUD.update_status(db, report, payload.status)
