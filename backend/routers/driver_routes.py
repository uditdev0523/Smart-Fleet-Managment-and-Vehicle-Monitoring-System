"""
Driver Directory and Management API Routes
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Driver, Vehicle, Trip, User, AuditLog
from auth import get_current_user, require_role

router = APIRouter(prefix="/api/drivers", tags=["Drivers"])


class DriverCreateSchema(BaseModel):
    driver_code: str
    full_name: str
    phone: str
    licence_no: str
    licence_expiry: str
    status: str = "available"
    notes: Optional[str] = None


class DriverUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    licence_no: Optional[str] = None
    licence_expiry: Optional[str] = None
    status: Optional[str] = None
    safety_score: Optional[float] = None
    notes: Optional[str] = None


def serialize_driver(d: Driver, db: Session):
    assigned_vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.assigned_driver_id == d.id, Vehicle.status != "archived")
        .first()
    )
    return {
        "id": d.id,
        "driver_code": d.driver_code,
        "full_name": d.full_name,
        "phone": d.phone,
        "licence_no": d.licence_no,
        "licence_expiry": d.licence_expiry,
        "status": d.status,
        "total_trips": d.total_trips,
        "safety_score": d.safety_score,
        "incidents_count": d.incidents_count,
        "notes": d.notes,
        "assigned_vehicle": {
            "id": assigned_vehicle.id,
            "vehicle_code": assigned_vehicle.vehicle_code,
            "registration_no": assigned_vehicle.registration_no,
            "make_model": assigned_vehicle.make_model
        } if assigned_vehicle else None,
        "created_at": d.created_at.isoformat()
    }


@router.get("")
def list_drivers(
    query: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Driver).filter(Driver.organization_id == current_user.organization_id)
    if status and status != "all":
        q = q.filter(Driver.status == status)

    if query:
        q_str = f"%{query}%"
        q = q.filter(
            (Driver.full_name.ilike(q_str)) |
            (Driver.driver_code.ilike(q_str)) |
            (Driver.phone.ilike(q_str)) |
            (Driver.licence_no.ilike(q_str))
        )

    drivers = q.all()
    return [serialize_driver(d, db) for d in drivers]


@router.get("/{id}")
def get_driver(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = db.query(Driver).filter(
        Driver.id == id,
        Driver.organization_id == current_user.organization_id
    ).first()
    if not d:
        raise HTTPException(status_code=404, detail="Driver not found")

    recent_trips = (
        db.query(Trip)
        .filter(Trip.driver_id == d.id)
        .order_by(Trip.created_at.desc())
        .limit(10)
        .all()
    )

    data = serialize_driver(d, db)
    data["recent_trips"] = [
        {
            "id": t.id,
            "trip_code": t.trip_code,
            "origin": t.origin_depot_code,
            "destination": t.destination_depot_code,
            "status": t.status,
            "departure": t.planned_departure
        }
        for t in recent_trips
    ]
    return data


@router.post("")
def create_driver(
    payload: DriverCreateSchema,
    current_user: User = Depends(require_role(["fleet_manager", "dispatcher"])),
    db: Session = Depends(get_db)
):
    driver = Driver(
        organization_id=current_user.organization_id,
        driver_code=payload.driver_code.upper(),
        full_name=payload.full_name,
        phone=payload.phone,
        licence_no=payload.licence_no.upper(),
        licence_expiry=payload.licence_expiry,
        status=payload.status,
        notes=payload.notes
    )
    db.add(driver)
    db.commit()

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="CREATE_DRIVER",
        entity_type="Driver",
        entity_id=str(driver.id),
        details=f"Created driver {driver.full_name} ({driver.driver_code})"
    )
    db.add(audit)
    db.commit()
    return serialize_driver(driver, db)


@router.put("/{id}")
def update_driver(
    id: int,
    payload: DriverUpdateSchema,
    current_user: User = Depends(require_role(["fleet_manager", "dispatcher"])),
    db: Session = Depends(get_db)
):
    driver = db.query(Driver).filter(
        Driver.id == id,
        Driver.organization_id == current_user.organization_id
    ).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(driver, field, val)

    db.commit()
    return serialize_driver(driver, db)


@router.delete("/{id}")
def deactivate_driver(
    id: int,
    current_user: User = Depends(require_role(["fleet_manager"])),
    db: Session = Depends(get_db)
):
    driver = db.query(Driver).filter(
        Driver.id == id,
        Driver.organization_id == current_user.organization_id
    ).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    driver.status = "inactive"
    db.commit()
    return {"message": f"Driver {driver.full_name} deactivated"}
