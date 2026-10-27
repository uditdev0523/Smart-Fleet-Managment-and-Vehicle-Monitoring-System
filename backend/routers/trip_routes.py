"""
Trip & Dispatch Management API Routes
Validates resource conflicts and state machine transitions.
"""
import json
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Trip, Vehicle, Driver, Depot, AuditLog, User
from auth import get_current_user, require_role

router = APIRouter(prefix="/api/trips", tags=["Trips"])

VALID_TRANSITIONS = {
    "planned": ["assigned", "cancelled"],
    "assigned": ["in_progress", "delayed", "cancelled"],
    "in_progress": ["completed", "delayed", "cancelled"],
    "delayed": ["in_progress", "completed", "cancelled"],
    "completed": [], # Terminal state
    "cancelled": []  # Terminal state
}


class TripCreateSchema(BaseModel):
    trip_code: str
    origin_depot_code: str
    destination_depot_code: str
    route_stops: List[str] = []
    vehicle_id: int
    driver_id: int
    planned_departure: str
    expected_arrival: str
    cargo_description: str
    cargo_weight_kg: float
    distance_km: float = 0.0
    notes: Optional[str] = None


class TripStatusUpdateSchema(BaseModel):
    status: str
    notes: Optional[str] = None


def serialize_trip(t: Trip):
    stops = []
    try:
        stops = json.loads(t.route_stops_json) if t.route_stops_json else []
    except Exception:
        stops = []

    return {
        "id": t.id,
        "trip_code": t.trip_code,
        "origin_depot_code": t.origin_depot_code,
        "destination_depot_code": t.destination_depot_code,
        "route_stops": stops,
        "vehicle": {
            "id": t.vehicle.id,
            "vehicle_code": t.vehicle.vehicle_code,
            "registration_no": t.vehicle.registration_no,
            "make_model": t.vehicle.make_model,
            "capacity_kg": t.vehicle.load_capacity_kg,
            "status": t.vehicle.status
        } if t.vehicle else None,
        "driver": {
            "id": t.driver.id,
            "driver_code": t.driver.driver_code,
            "full_name": t.driver.full_name,
            "phone": t.driver.phone,
            "licence_no": t.driver.licence_no
        } if t.driver else None,
        "planned_departure": t.planned_departure,
        "expected_arrival": t.expected_arrival,
        "actual_departure": t.actual_departure,
        "actual_arrival": t.actual_arrival,
        "cargo_description": t.cargo_description,
        "cargo_weight_kg": t.cargo_weight_kg,
        "distance_km": t.distance_km,
        "status": t.status,
        "fuel_cost": t.fuel_cost,
        "notes": t.notes,
        "created_at": t.created_at.isoformat()
    }


@router.get("")
def list_trips(
    status: Optional[str] = None,
    vehicle_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Trip).filter(Trip.organization_id == current_user.organization_id)
    if status and status != "all":
        q = q.filter(Trip.status == status)
    if vehicle_id:
        q = q.filter(Trip.vehicle_id == vehicle_id)
    if driver_id:
        q = q.filter(Trip.driver_id == driver_id)

    trips = q.order_by(Trip.created_at.desc()).all()
    return [serialize_trip(t) for t in trips]


@router.get("/{id}")
def get_trip(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = db.query(Trip).filter(
        Trip.id == id,
        Trip.organization_id == current_user.organization_id
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Trip not found")
    return serialize_trip(t)


@router.post("")
def create_trip(
    payload: TripCreateSchema,
    current_user: User = Depends(require_role(["fleet_manager", "dispatcher"])),
    db: Session = Depends(get_db)
):
    # 1. Verify vehicle exists and is not under maintenance
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == payload.vehicle_id,
        Vehicle.organization_id == current_user.organization_id
    ).first()
    if not vehicle:
        raise HTTPException(status_code=400, detail="Selected vehicle does not exist")
    if vehicle.status == "maintenance":
        raise HTTPException(status_code=400, detail="Cannot assign vehicle: currently in Maintenance Bay")
    if vehicle.status == "archived":
        raise HTTPException(status_code=400, detail="Cannot assign archived vehicle")

    # 2. Check vehicle payload capacity
    if payload.cargo_weight_kg > vehicle.load_capacity_kg:
        raise HTTPException(
            status_code=400,
            detail=f"Cargo weight ({payload.cargo_weight_kg} kg) exceeds vehicle payload capacity ({vehicle.load_capacity_kg} kg)"
        )

    # 3. Check Driver availability
    driver = db.query(Driver).filter(
        Driver.id == payload.driver_id,
        Driver.organization_id == current_user.organization_id
    ).first()
    if not driver:
        raise HTTPException(status_code=400, detail="Selected driver does not exist")
    if driver.status == "inactive":
        raise HTTPException(status_code=400, detail="Cannot assign driver: status is inactive")

    # 4. Check double-booking conflicts (active trips)
    active_vehicle_trip = db.query(Trip).filter(
        Trip.vehicle_id == payload.vehicle_id,
        Trip.status.in_(["assigned", "in_progress"])
    ).first()
    if active_vehicle_trip:
        raise HTTPException(
            status_code=400,
            detail=f"Resource Conflict: Vehicle {vehicle.vehicle_code} is already assigned to active trip {active_vehicle_trip.trip_code}"
        )

    active_driver_trip = db.query(Trip).filter(
        Trip.driver_id == payload.driver_id,
        Trip.status.in_(["assigned", "in_progress"])
    ).first()
    if active_driver_trip:
        raise HTTPException(
            status_code=400,
            detail=f"Resource Conflict: Driver {driver.full_name} is already committed to active trip {active_driver_trip.trip_code}"
        )

    new_trip = Trip(
        organization_id=current_user.organization_id,
        trip_code=payload.trip_code.upper(),
        origin_depot_code=payload.origin_depot_code,
        destination_depot_code=payload.destination_depot_code,
        route_stops_json=json.dumps(payload.route_stops or [payload.origin_depot_code, payload.destination_depot_code]),
        vehicle_id=payload.vehicle_id,
        driver_id=payload.driver_id,
        planned_departure=payload.planned_departure,
        expected_arrival=payload.expected_arrival,
        cargo_description=payload.cargo_description,
        cargo_weight_kg=payload.cargo_weight_kg,
        distance_km=payload.distance_km,
        status="assigned",
        notes=payload.notes
    )
    db.add(new_trip)

    # Update statuses
    vehicle.status = "active"
    driver.status = "on_trip"

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="CREATE_TRIP",
        entity_type="Trip",
        entity_id=new_trip.trip_code,
        details=f"Dispatched trip {new_trip.trip_code} with Vehicle {vehicle.vehicle_code} and Driver {driver.full_name}"
    )
    db.add(audit)
    db.commit()

    return serialize_trip(new_trip)


@router.post("/{id}/transition")
def transition_trip_status(
    id: int,
    payload: TripStatusUpdateSchema,
    current_user: User = Depends(require_role(["fleet_manager", "dispatcher", "driver"])),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(
        Trip.id == id,
        Trip.organization_id == current_user.organization_id
    ).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    new_status = payload.status.lower()
    allowed = VALID_TRANSITIONS.get(trip.status, [])

    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid state transition: Cannot move trip from '{trip.status}' to '{new_status}'. Allowed transitions: {allowed}"
        )

    old_status = trip.status
    trip.status = new_status
    now_iso = datetime.now(timezone.utc).isoformat()

    if new_status == "in_progress" and not trip.actual_departure:
        trip.actual_departure = now_iso

    if new_status in ["completed", "cancelled"]:
        trip.actual_arrival = now_iso
        # Free vehicle and driver
        if trip.vehicle and trip.vehicle.status != "maintenance":
            trip.vehicle.status = "available"
        if trip.driver:
            trip.driver.status = "available"
            if new_status == "completed":
                trip.driver.total_trips += 1

    if payload.notes:
        trip.notes = (trip.notes or "") + f"\n[{now_iso}] {payload.notes}"

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="TRANSITION_TRIP_STATUS",
        entity_type="Trip",
        entity_id=trip.trip_code,
        details=f"Trip {trip.trip_code} status transitioned from {old_status} to {new_status}"
    )
    db.add(audit)
    db.commit()

    return serialize_trip(trip)
