"""
Vehicle Management API Routes with DSA BST, AVL, and Trie Integrations
"""
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models import (
    Vehicle, Driver, Depot, Trip, Telemetry, FuelRecord,
    MaintenanceRecord, MaintenanceAlert, User, AuditLog
)
from auth import get_current_user, require_role
from fleet_dsa import VehicleBST, VehicleAVLTree, RegistrationTrie
from anomaly_detector import compute_vehicle_maintenance_risk

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])


class VehicleCreateSchema(BaseModel):
    vehicle_code: str
    registration_no: str
    vehicle_type: str
    make_model: str
    year: int = 2023
    load_capacity_kg: float
    odometer_km: float = 0.0
    fuel_type: str = "Diesel"
    expected_mileage: float = 4.5
    service_interval_km: float = 10000.0
    last_service_km: float = 0.0
    status: str = "available"
    insurance_expiry: Optional[str] = None
    permit_expiry: Optional[str] = None
    pollution_expiry: Optional[str] = None
    notes: Optional[str] = None
    home_depot_id: Optional[int] = None
    assigned_driver_id: Optional[int] = None


class VehicleUpdateSchema(BaseModel):
    vehicle_type: Optional[str] = None
    make_model: Optional[str] = None
    load_capacity_kg: Optional[float] = None
    odometer_km: Optional[float] = None
    expected_mileage: Optional[float] = None
    service_interval_km: Optional[float] = None
    last_service_km: Optional[float] = None
    status: Optional[str] = None
    insurance_expiry: Optional[str] = None
    permit_expiry: Optional[str] = None
    pollution_expiry: Optional[str] = None
    notes: Optional[str] = None
    home_depot_id: Optional[int] = None
    assigned_driver_id: Optional[int] = None


def serialize_vehicle(v: Vehicle, db: Session):
    open_alerts = (
        db.query(MaintenanceAlert)
        .filter(MaintenanceAlert.vehicle_id == v.id, MaintenanceAlert.status == "open")
        .count()
    )
    risk_info = compute_vehicle_maintenance_risk(v, open_alerts)
    latest_telemetry = (
        db.query(Telemetry)
        .filter(Telemetry.vehicle_id == v.id)
        .order_by(Telemetry.timestamp.desc())
        .first()
    )

    return {
        "id": v.id,
        "vehicle_code": v.vehicle_code,
        "registration_no": v.registration_no,
        "vehicle_type": v.vehicle_type,
        "make_model": v.make_model,
        "year": v.year,
        "load_capacity_kg": v.load_capacity_kg,
        "odometer_km": v.odometer_km,
        "fuel_type": v.fuel_type,
        "expected_mileage": v.expected_mileage,
        "service_interval_km": v.service_interval_km,
        "last_service_km": v.last_service_km,
        "status": v.status,
        "insurance_expiry": v.insurance_expiry,
        "permit_expiry": v.permit_expiry,
        "pollution_expiry": v.pollution_expiry,
        "notes": v.notes,
        "home_depot": {
            "id": v.home_depot.id,
            "code": v.home_depot.code,
            "name": v.home_depot.name
        } if v.home_depot else None,
        "assigned_driver": {
            "id": v.assigned_driver.id,
            "driver_code": v.assigned_driver.driver_code,
            "full_name": v.assigned_driver.full_name,
            "phone": v.assigned_driver.phone
        } if v.assigned_driver else None,
        "risk_info": risk_info,
        "latest_telemetry": {
            "latitude": latest_telemetry.latitude,
            "longitude": latest_telemetry.longitude,
            "speed_kmph": latest_telemetry.speed_kmph,
            "fuel_level_l": latest_telemetry.fuel_level_l,
            "status_text": latest_telemetry.status_text,
            "timestamp": latest_telemetry.timestamp.isoformat(),
            "is_simulated": latest_telemetry.is_simulated
        } if latest_telemetry else None
    }


@router.get("")
def list_vehicles(
    query: Optional[str] = None,
    status: Optional[str] = None,
    depot_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Vehicle).filter(
        Vehicle.organization_id == current_user.organization_id,
        Vehicle.status != "archived"
    )

    if status and status != "all":
        q = q.filter(Vehicle.status == status)

    if depot_id:
        q = q.filter(Vehicle.home_depot_id == depot_id)

    if query:
        q_str = f"%{query}%"
        q = q.filter(
            (Vehicle.registration_no.ilike(q_str)) |
            (Vehicle.vehicle_code.ilike(q_str)) |
            (Vehicle.make_model.ilike(q_str))
        )

    total_count = q.count()
    vehicles = q.offset(offset).limit(limit).all()

    return {
        "total": total_count,
        "items": [serialize_vehicle(v, db) for v in vehicles]
    }


@router.get("/document-expirations")
def get_document_expirations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vehicles = db.query(Vehicle).filter(
        Vehicle.organization_id == current_user.organization_id,
        Vehicle.status != "archived"
    ).all()

    docs = []
    for v in vehicles:
        if v.insurance_expiry:
            docs.append({
                "vehicle_code": v.vehicle_code,
                "registration_no": v.registration_no,
                "doc_type": "Insurance",
                "expiry_date": v.insurance_expiry,
                "status": "expiring_soon" if v.insurance_expiry < "2027-01-01" else "valid"
            })
        if v.pollution_expiry:
            docs.append({
                "vehicle_code": v.vehicle_code,
                "registration_no": v.registration_no,
                "doc_type": "Pollution (PUCC)",
                "expiry_date": v.pollution_expiry,
                "status": "expiring_soon" if v.pollution_expiry < "2027-01-01" else "valid"
            })
        if v.permit_expiry:
            docs.append({
                "vehicle_code": v.vehicle_code,
                "registration_no": v.registration_no,
                "doc_type": "National Permit",
                "expiry_date": v.permit_expiry,
                "status": "valid"
            })

    docs.sort(key=lambda x: x["expiry_date"])
    return docs


@router.get("/search/trie")
def search_registration_trie(
    prefix: str = Query("UP", min_length=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Demonstrates Unit 5 Trie prefix search on vehicle registrations."""
    vehicles = db.query(Vehicle).filter(
        Vehicle.organization_id == current_user.organization_id,
        Vehicle.status != "archived"
    ).all()

    trie = RegistrationTrie()
    for v in vehicles:
        trie.insert(v.registration_no, {"id": v.id, "code": v.vehicle_code, "model": v.make_model})

    matches = trie.starts_with(prefix)
    is_exact, exact_payload = trie.search_exact(prefix)

    return {
        "algorithm": "Trie Prefix Autocomplete (Unit 5)",
        "prefix_query": prefix.upper(),
        "matches_count": len(matches),
        "matches": matches,
        "is_exact_match": is_exact,
        "exact_payload": exact_payload
    }


@router.get("/search/tree")
def search_tree_lookup(
    vehicle_id: int = Query(1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Demonstrates Unit 1 BST and AVL tree lookup."""
    vehicles = db.query(Vehicle).filter(
        Vehicle.organization_id == current_user.organization_id,
        Vehicle.status != "archived"
    ).order_by(Vehicle.id.asc()).all()

    bst = VehicleBST()
    avl = VehicleAVLTree()
    for v in vehicles:
        bst.insert(v.id, f"{v.vehicle_code} ({v.registration_no})")
        avl.insert(v.id, f"{v.vehicle_code} ({v.registration_no})")

    bst_result = bst.search(vehicle_id)
    avl_result = avl.search(vehicle_id)

    return {
        "algorithm_bst": "Binary Search Tree (Unit 1)",
        "algorithm_avl": "Self-Balancing AVL Tree (Unit 1)",
        "queried_id": vehicle_id,
        "bst_found": bst_result,
        "avl_found": avl_result,
        "avl_height": avl.get_height(),
        "total_nodes": len(vehicles),
        "sorted_keys": bst.in_order_keys()
    }


@router.get("/{id}")
def get_vehicle_details(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    v = db.query(Vehicle).filter(
        Vehicle.id == id,
        Vehicle.organization_id == current_user.organization_id
    ).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    trips = (
        db.query(Trip)
        .filter(Trip.vehicle_id == v.id)
        .order_by(Trip.created_at.desc())
        .limit(10)
        .all()
    )
    maintenance = (
        db.query(MaintenanceRecord)
        .filter(MaintenanceRecord.vehicle_id == v.id)
        .order_by(MaintenanceRecord.created_at.desc())
        .limit(10)
        .all()
    )
    fuel_records = (
        db.query(FuelRecord)
        .filter(FuelRecord.vehicle_id == v.id)
        .order_by(FuelRecord.timestamp.desc())
        .limit(10)
        .all()
    )

    data = serialize_vehicle(v, db)
    data["recent_trips"] = [
        {
            "id": t.id,
            "trip_code": t.trip_code,
            "origin": t.origin_depot_code,
            "destination": t.destination_depot_code,
            "status": t.status,
            "distance_km": t.distance_km,
            "cargo": t.cargo_description,
            "departure": t.planned_departure
        }
        for t in trips
    ]
    data["maintenance_history"] = [
        {
            "id": m.id,
            "work_order_no": m.work_order_no,
            "category": m.category,
            "description": m.description,
            "status": m.status,
            "service_date": m.service_date,
            "cost": m.actual_cost or m.estimated_cost
        }
        for m in maintenance
    ]
    data["fuel_history"] = [
        {
            "id": f.id,
            "date": f.date_str,
            "litres": f.litres,
            "total_cost": f.total_cost,
            "mileage": f.mileage_calculated,
            "anomaly_flag": f.anomaly_flag
        }
        for f in fuel_records
    ]
    return data


@router.post("")
def create_vehicle(
    payload: VehicleCreateSchema,
    current_user: User = Depends(require_role(["fleet_manager", "dispatcher"])),
    db: Session = Depends(get_db)
):
    # Check duplicate registration
    existing = db.query(Vehicle).filter(
        Vehicle.organization_id == current_user.organization_id,
        Vehicle.registration_no == payload.registration_no.upper()
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle with this registration number already exists")

    vehicle = Vehicle(
        organization_id=current_user.organization_id,
        vehicle_code=payload.vehicle_code.upper(),
        registration_no=payload.registration_no.upper(),
        vehicle_type=payload.vehicle_type,
        make_model=payload.make_model,
        year=payload.year,
        load_capacity_kg=payload.load_capacity_kg,
        odometer_km=payload.odometer_km,
        fuel_type=payload.fuel_type,
        expected_mileage=payload.expected_mileage,
        service_interval_km=payload.service_interval_km,
        last_service_km=payload.last_service_km,
        status=payload.status,
        insurance_expiry=payload.insurance_expiry,
        permit_expiry=payload.permit_expiry,
        pollution_expiry=payload.pollution_expiry,
        notes=payload.notes,
        home_depot_id=payload.home_depot_id,
        assigned_driver_id=payload.assigned_driver_id
    )
    db.add(vehicle)
    db.flush()

    # Initial telemetry record
    depot = db.query(Depot).filter(Depot.id == payload.home_depot_id).first() if payload.home_depot_id else None
    lat = depot.latitude if depot else 28.4744
    lng = depot.longitude if depot else 77.5040

    init_telemetry = Telemetry(
        vehicle_id=vehicle.id,
        latitude=lat,
        longitude=lng,
        speed_kmph=0.0,
        fuel_level_l=100.0,
        heading=0.0,
        status_text="Registered & Available",
        is_simulated=True
    )
    db.add(init_telemetry)

    # Audit log
    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="CREATE_VEHICLE",
        entity_type="Vehicle",
        entity_id=str(vehicle.id),
        details=f"Created vehicle {vehicle.vehicle_code} ({vehicle.registration_no})"
    )
    db.add(audit)
    db.commit()

    return serialize_vehicle(vehicle, db)


@router.put("/{id}")
def update_vehicle(
    id: int,
    payload: VehicleUpdateSchema,
    current_user: User = Depends(require_role(["fleet_manager", "dispatcher", "technician"])),
    db: Session = Depends(get_db)
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == id,
        Vehicle.organization_id == current_user.organization_id
    ).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(vehicle, field, val)

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="UPDATE_VEHICLE",
        entity_type="Vehicle",
        entity_id=str(vehicle.id),
        details=f"Updated vehicle {vehicle.vehicle_code} fields: {list(update_data.keys())}"
    )
    db.add(audit)
    db.commit()
    return serialize_vehicle(vehicle, db)


@router.delete("/{id}")
def archive_vehicle(
    id: int,
    current_user: User = Depends(require_role(["fleet_manager"])),
    db: Session = Depends(get_db)
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == id,
        Vehicle.organization_id == current_user.organization_id
    ).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    # Safe archival
    vehicle.status = "archived"
    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="ARCHIVE_VEHICLE",
        entity_type="Vehicle",
        entity_id=str(vehicle.id),
        details=f"Safely archived vehicle {vehicle.vehicle_code}"
    )
    db.add(audit)
    db.commit()
    return {"message": f"Vehicle {vehicle.vehicle_code} archived successfully"}
