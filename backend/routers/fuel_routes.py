"""
Fuel Management and Cost Analytics API Routes
Includes explainable anomaly detection and Unit 5 Segment Tree range queries.
"""
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import FuelRecord, Vehicle, Trip, User, AuditLog
from auth import get_current_user, require_role
from anomaly_detector import evaluate_fuel_record_anomalies
from fleet_dsa import FuelSegmentTree

router = APIRouter(prefix="/api/fuel", tags=["Fuel & Expenses"])


class FuelEntryCreateSchema(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    date_str: str # YYYY-MM-DD
    odometer_km: float
    litres: float
    total_cost: float
    fuel_station: str
    payment_ref: Optional[str] = None
    notes: Optional[str] = None


def serialize_fuel(f: FuelRecord):
    return {
        "id": f.id,
        "vehicle_id": f.vehicle_id,
        "vehicle_code": f.vehicle.vehicle_code if f.vehicle else None,
        "registration_no": f.vehicle.registration_no if f.vehicle else None,
        "trip_id": f.trip_id,
        "date_str": f.date_str,
        "timestamp": f.timestamp.isoformat(),
        "odometer_km": f.odometer_km,
        "litres": f.litres,
        "total_cost": f.total_cost,
        "price_per_litre": f.price_per_litre,
        "fuel_station": f.fuel_station,
        "payment_ref": f.payment_ref,
        "mileage_calculated": f.mileage_calculated,
        "cost_per_km": f.cost_per_km,
        "anomaly_flag": f.anomaly_flag,
        "anomaly_details": f.anomaly_details,
        "notes": f.notes
    }


@router.get("")
def list_fuel_records(
    vehicle_id: Optional[int] = None,
    anomaly_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(FuelRecord).filter(FuelRecord.organization_id == current_user.organization_id)
    if vehicle_id:
        q = q.filter(FuelRecord.vehicle_id == vehicle_id)
    if anomaly_only:
        q = q.filter(FuelRecord.anomaly_flag == True)

    records = q.order_by(FuelRecord.timestamp.desc()).all()
    return [serialize_fuel(r) for r in records]


@router.post("")
def add_fuel_entry(
    payload: FuelEntryCreateSchema,
    current_user: User = Depends(require_role(["fleet_manager", "dispatcher", "technician"])),
    db: Session = Depends(get_db)
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == payload.vehicle_id,
        Vehicle.organization_id == current_user.organization_id
    ).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    # Fetch previous log for this vehicle
    prev_record = (
        db.query(FuelRecord)
        .filter(FuelRecord.vehicle_id == vehicle.id)
        .order_by(FuelRecord.odometer_km.desc())
        .first()
    )

    # Evaluate explainable rules
    eval_res = evaluate_fuel_record_anomalies(
        db, vehicle, payload.odometer_km, payload.litres,
        payload.total_cost, payload.date_str, prev_record
    )

    fuel_rec = FuelRecord(
        organization_id=current_user.organization_id,
        vehicle_id=vehicle.id,
        trip_id=payload.trip_id,
        date_str=payload.date_str,
        timestamp=datetime.now(timezone.utc),
        odometer_km=payload.odometer_km,
        litres=payload.litres,
        total_cost=payload.total_cost,
        price_per_litre=eval_res["price_per_l"],
        fuel_station=payload.fuel_station,
        payment_ref=payload.payment_ref,
        mileage_calculated=eval_res["calculated_mileage"],
        cost_per_km=eval_res["cost_per_km"],
        anomaly_flag=eval_res["is_anomaly"],
        anomaly_details=eval_res["summary"],
        notes=payload.notes
    )
    db.add(fuel_rec)

    # Update vehicle current odometer if higher
    if payload.odometer_km > vehicle.odometer_km:
        vehicle.odometer_km = payload.odometer_km

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="ADD_FUEL_RECORD",
        entity_type="FuelRecord",
        entity_id=str(fuel_rec.id),
        details=f"Logged {payload.litres}L fuel for {vehicle.vehicle_code} at ₹{payload.total_cost}. Anomaly: {eval_res['is_anomaly']}"
    )
    db.add(audit)
    db.commit()

    return {
        "record": serialize_fuel(fuel_rec),
        "anomaly_analysis": eval_res
    }


@router.get("/segment-tree-query")
def segment_tree_fuel_range_query(
    start_day: int = Query(0, description="0-indexed start day"),
    end_day: int = Query(3, description="0-indexed end day"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Demonstrates Unit 5 Segment Tree:
    Performs O(log n) range sum query of daily fuel consumption.
    """
    records = (
        db.query(FuelRecord)
        .filter(FuelRecord.organization_id == current_user.organization_id)
        .order_by(FuelRecord.date_str.asc())
        .all()
    )

    daily_volumes = [r.litres for r in records] or [5.0, 10.0, 7.0, 8.0, 19.0]
    st = FuelSegmentTree(daily_volumes)

    total_in_range = st.query_range(start_day, end_day)

    return {
        "algorithm": "Fuel Segment Tree (Unit 5)",
        "query_range": [start_day, end_day],
        "daily_readings": daily_volumes,
        "total_litres_in_range": round(total_in_range, 2),
        "days_queried": max(0, min(len(daily_volumes) - 1, end_day) - max(0, start_day) + 1),
        "time_complexity": "O(log n) range query vs O(n) linear scan",
        "update_complexity": "O(log n) point update"
    }


@router.get("/anomalies")
def get_fuel_anomalies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = (
        db.query(FuelRecord)
        .filter(
            FuelRecord.organization_id == current_user.organization_id,
            FuelRecord.anomaly_flag == True
        )
        .order_by(FuelRecord.timestamp.desc())
        .all()
    )

    return {
        "total_anomalies": len(records),
        "disclaimer": "Rule-based anomaly detection identifies operational statistical variance, not verified misconduct.",
        "items": [
            {
                "id": r.id,
                "vehicle_code": r.vehicle.vehicle_code if r.vehicle else None,
                "registration_no": r.vehicle.registration_no if r.vehicle else None,
                "date": r.date_str,
                "litres": r.litres,
                "total_cost": r.total_cost,
                "odometer_km": r.odometer_km,
                "mileage": r.mileage_calculated,
                "rule_details": r.anomaly_details,
                "recommended_action": "Schedule fuel line and injector check-up at depot."
            }
            for r in records
        ]
    }
