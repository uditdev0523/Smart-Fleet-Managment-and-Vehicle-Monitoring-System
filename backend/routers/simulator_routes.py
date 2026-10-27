"""
Vehicle Location Simulator & Hardware Ingestion API Routes
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Telemetry, Vehicle, User
from auth import get_current_user, require_role
from simulator import simulator

router = APIRouter(prefix="/api/simulator", tags=["GPS Simulator & Telemetry Ingestion"])


class HardwareIngestSchema(BaseModel):
    device_imei: str
    vehicle_registration: str
    latitude: float
    longitude: float
    speed_kmph: float
    fuel_level_l: float
    heading: float
    timestamp: str


@router.get("/status")
def get_simulator_status():
    return {
        "status": "SIMULATED GPS DATA",
        "is_running": simulator.is_running,
        "speed_multiplier": simulator.speed_multiplier,
        "tick_count": simulator.tick_count,
        "label": "SIMULATED GPS DATA - Deterministic Test Harness",
        "description": "Calculates realistic vehicle positions along depot corridors for demonstration."
    }


@router.post("/toggle")
def toggle_simulator(current_user: User = Depends(get_current_user)):
    simulator.is_running = not simulator.is_running
    return {
        "is_running": simulator.is_running,
        "message": f"Simulator {'resumed' if simulator.is_running else 'paused'}"
    }


@router.post("/speed")
def set_speed(multiplier: float, current_user: User = Depends(get_current_user)):
    simulator.speed_multiplier = max(0.5, min(10.0, multiplier))
    return {
        "speed_multiplier": simulator.speed_multiplier,
        "message": f"Simulation speed set to {simulator.speed_multiplier}x"
    }


@router.post("/tick")
def trigger_tick(db: Session = Depends(get_db)):
    """Advances simulation by one deterministic step and updates telemetry."""
    updated = simulator.tick(db)
    return {
        "status": "SIMULATED GPS DATA",
        "tick": simulator.tick_count,
        "updated_vehicles_count": len(updated),
        "telemetry_updates": updated
    }


@router.post("/ingest-telemetry")
def ingest_hardware_telemetry(
    payload: HardwareIngestSchema,
    x_device_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Dedicated endpoint for physical GPS tracker hardware (OBD-II, AIS-140 devices).
    If no real device is connected or key is absent, returns clear unavailable state.
    """
    if not x_device_api_key or x_device_api_key != "FLEETOPS_HARDWARE_INTEGRATION_KEY":
        raise HTTPException(
            status_code=401,
            detail="Hardware Ingestion Interface: Real device API key required. In demo mode, live telemetry is simulated via the deterministic GPS harness."
        )

    vehicle = db.query(Vehicle).filter(Vehicle.registration_no == payload.vehicle_registration).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle registration not recognized in fleet database")

    record = Telemetry(
        vehicle_id=vehicle.id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        speed_kmph=payload.speed_kmph,
        fuel_level_l=payload.fuel_level_l,
        heading=payload.heading,
        status_text="Live Hardware Telemetry",
        is_simulated=False
    )
    db.add(record)
    db.commit()

    return {"status": "SUCCESS", "telemetry_id": record.id, "source": "REAL_HARDWARE_INGESTION"}
