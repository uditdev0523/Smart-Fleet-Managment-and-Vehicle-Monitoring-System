"""
Alert Centre & Notification API Routes
"""
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import MaintenanceAlert, Vehicle, User, AuditLog
from auth import get_current_user, require_role

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


class AlertCreateSchema(BaseModel):
    vehicle_id: int
    urgency: int = 5
    priority: str = "medium"
    category: str = "Operational"
    reason: str
    evidence: Optional[str] = None


class ResolveAlertSchema(BaseModel):
    resolution_notes: str


def serialize_alert(a: MaintenanceAlert):
    return {
        "id": a.id,
        "vehicle_id": a.vehicle_id,
        "vehicle_code": a.vehicle.vehicle_code if a.vehicle else None,
        "registration_no": a.vehicle.registration_no if a.vehicle else None,
        "urgency": a.urgency,
        "priority": a.priority,
        "category": a.category,
        "reason": a.reason,
        "evidence": a.evidence,
        "status": a.status,
        "resolution_notes": a.resolution_notes,
        "created_at": a.created_at.isoformat(),
        "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None
    }


@router.get("")
def list_alerts(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(MaintenanceAlert).filter(
        MaintenanceAlert.organization_id == current_user.organization_id
    )
    if status and status != "all":
        q = q.filter(MaintenanceAlert.status == status)
    if priority and priority != "all":
        q = q.filter(MaintenanceAlert.priority == priority)

    alerts = q.order_by(MaintenanceAlert.urgency.desc(), MaintenanceAlert.created_at.desc()).all()
    return [serialize_alert(a) for a in alerts]


@router.post("")
def create_alert(
    payload: AlertCreateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == payload.vehicle_id,
        Vehicle.organization_id == current_user.organization_id
    ).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    alert = MaintenanceAlert(
        organization_id=current_user.organization_id,
        vehicle_id=vehicle.id,
        urgency=payload.urgency,
        priority=payload.priority,
        category=payload.category,
        reason=payload.reason,
        evidence=payload.evidence,
        status="open"
    )
    db.add(alert)
    db.commit()
    return serialize_alert(alert)


@router.post("/{id}/acknowledge")
def acknowledge_alert(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(MaintenanceAlert).filter(
        MaintenanceAlert.id == id,
        MaintenanceAlert.organization_id == current_user.organization_id
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "acknowledged"
    alert.reviewer_id = current_user.id
    db.commit()
    return serialize_alert(alert)


@router.post("/{id}/resolve")
def resolve_alert(
    id: int,
    payload: ResolveAlertSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(MaintenanceAlert).filter(
        MaintenanceAlert.id == id,
        MaintenanceAlert.organization_id == current_user.organization_id
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "resolved"
    alert.resolution_notes = payload.resolution_notes
    alert.resolved_at = datetime.now(timezone.utc)
    alert.reviewer_id = current_user.id

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="RESOLVE_ALERT",
        entity_type="MaintenanceAlert",
        entity_id=str(alert.id),
        details=f"Alert '{alert.reason}' resolved: {payload.resolution_notes}"
    )
    db.add(audit)
    db.commit()

    return serialize_alert(alert)
