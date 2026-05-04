from typing import Optional

from sqlalchemy.orm import Session

from app.models.stray_report import StrayReport
from app.schemas.stray_report import StrayReportCreate, StrayReportStatus


class StrayReportCRUD:
    @staticmethod
    def create_report(db: Session, payload: StrayReportCreate) -> StrayReport:
        db_report = StrayReport(**payload.model_dump())
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        return db_report

    @staticmethod
    def get_public_reports(db: Session, limit: int = 5, unresolved_only: bool = True) -> list[StrayReport]:
        query = db.query(StrayReport)
        if unresolved_only:
            query = query.filter(StrayReport.status.in_(["new", "in_progress"]))

        return query.order_by(StrayReport.created_at.desc(), StrayReport.id.desc()).limit(limit).all()

    @staticmethod
    def get_admin_reports(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        status: Optional[StrayReportStatus] = None,
    ) -> list[StrayReport]:
        query = db.query(StrayReport)
        if status:
            query = query.filter(StrayReport.status == status.value)

        return query.order_by(StrayReport.created_at.desc(), StrayReport.id.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def count_admin_reports(db: Session, status: Optional[StrayReportStatus] = None) -> int:
        query = db.query(StrayReport)
        if status:
            query = query.filter(StrayReport.status == status.value)

        return query.count()

    @staticmethod
    def get_report_by_id(db: Session, report_id: int) -> Optional[StrayReport]:
        return db.query(StrayReport).filter(StrayReport.id == report_id).first()

    @staticmethod
    def update_status(db: Session, report: StrayReport, status: StrayReportStatus) -> StrayReport:
        report.status = status.value
        db.commit()
        db.refresh(report)
        return report
