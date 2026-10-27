"""
System Settings, Database Re-seed, and Audit Log API Routes
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db, seed_database, Base, engine
from models import AuditLog, AppSetting, User
from auth import get_current_user, require_role

router = APIRouter(prefix="/api/settings", tags=["Settings & Administration"])


@router.get("")
def get_settings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    settings = db.query(AppSetting).filter(AppSetting.organization_id == current_user.organization_id).all()
    return {s.key: s.value for s in settings}


@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 50,
    current_user: User = Depends(require_role(["fleet_manager"])),
    db: Session = Depends(get_db)
):
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.organization_id == current_user.organization_id)
        .order_by(AuditLog.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": l.id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": l.details,
            "user": l.user.username if l.user else "System",
            "timestamp": l.timestamp.isoformat()
        }
        for l in logs
    ]


@router.post("/reseed")
def reseed_database(
    current_user: User = Depends(require_role(["fleet_manager"])),
    db: Session = Depends(get_db)
):
    """Resets and reseeds demo database with pristine initial state."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_database(db)
    return {"message": "Database successfully reseeded with pristine Indian logistics dataset."}
