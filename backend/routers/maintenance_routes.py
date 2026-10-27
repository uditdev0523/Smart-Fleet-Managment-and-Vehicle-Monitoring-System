"""
Maintenance Management & Max Heap Priority Queue API Routes
"""
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import MaintenanceRecord, MaintenanceAlert, Vehicle, User, AuditLog
from auth import get_current_user, require_role
from fleet_dsa import MaintenanceMaxHeap, allocate_workshop_hours

router = APIRouter(prefix="/api/maintenance", tags=["Maintenance"])


class WorkOrderCreateSchema(BaseModel):
    vehicle_id: int
    work_order_no: str
    category: str
    description: str
    service_date: str
    odometer_km: float
    estimated_cost: float
    workshop_name: str
    downtime_hours: float = 4.0
    urgency: int = 5 # 1 to 10
    parts_notes: Optional[str] = None


class WorkshopAllocationRequest(BaseModel):
    available_hours: int
    jobs: List[dict] # [{"id": 1, "description": "Brake Job", "hours": 2, "priority": 3}]


def serialize_work_order(m: MaintenanceRecord):
    return {
        "id": m.id,
        "vehicle_id": m.vehicle_id,
        "vehicle_code": m.vehicle.vehicle_code if m.vehicle else None,
        "registration_no": m.vehicle.registration_no if m.vehicle else None,
        "work_order_no": m.work_order_no,
        "category": m.category,
        "description": m.description,
        "service_date": m.service_date,
        "odometer_km": m.odometer_km,
        "estimated_cost": m.estimated_cost,
        "actual_cost": m.actual_cost,
        "workshop_name": m.workshop_name,
        "downtime_hours": m.downtime_hours,
        "parts_notes": m.parts_notes,
        "status": m.status,
        "urgency": m.urgency,
        "created_at": m.created_at.isoformat()
    }


@router.get("/work-orders")
def list_work_orders(
    vehicle_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(MaintenanceRecord).filter(
        MaintenanceRecord.organization_id == current_user.organization_id
    )
    if vehicle_id:
        q = q.filter(MaintenanceRecord.vehicle_id == vehicle_id)
    if status and status != "all":
        q = q.filter(MaintenanceRecord.status == status)

    orders = q.order_by(MaintenanceRecord.created_at.desc()).all()
    return [serialize_work_order(o) for o in orders]


@router.post("/work-orders")
def create_work_order(
    payload: WorkOrderCreateSchema,
    current_user: User = Depends(require_role(["fleet_manager", "technician"])),
    db: Session = Depends(get_db)
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == payload.vehicle_id,
        Vehicle.organization_id == current_user.organization_id
    ).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    order = MaintenanceRecord(
        organization_id=current_user.organization_id,
        vehicle_id=vehicle.id,
        work_order_no=payload.work_order_no.upper(),
        category=payload.category,
        description=payload.description,
        service_date=payload.service_date,
        odometer_km=payload.odometer_km,
        estimated_cost=payload.estimated_cost,
        workshop_name=payload.workshop_name,
        downtime_hours=payload.downtime_hours,
        parts_notes=payload.parts_notes,
        status="in_progress",
        urgency=payload.urgency
    )
    db.add(order)

    # Transition vehicle status to maintenance
    vehicle.status = "maintenance"

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="CREATE_WORK_ORDER",
        entity_type="MaintenanceRecord",
        entity_id=order.work_order_no,
        details=f"Created work order {order.work_order_no} for vehicle {vehicle.vehicle_code} (Urgency: {order.urgency})"
    )
    db.add(audit)
    db.commit()

    return serialize_work_order(order)


@router.post("/work-orders/{id}/complete")
def complete_work_order(
    id: int,
    actual_cost: float,
    current_user: User = Depends(require_role(["fleet_manager", "technician"])),
    db: Session = Depends(get_db)
):
    order = db.query(MaintenanceRecord).filter(
        MaintenanceRecord.id == id,
        MaintenanceRecord.organization_id == current_user.organization_id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Work order not found")

    order.status = "completed"
    order.actual_cost = actual_cost

    # Update vehicle service history and restore status to available
    if order.vehicle:
        order.vehicle.status = "available"
        order.vehicle.last_service_km = order.odometer_km

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="COMPLETE_WORK_ORDER",
        entity_type="MaintenanceRecord",
        entity_id=order.work_order_no,
        details=f"Completed work order {order.work_order_no} with actual cost ₹{actual_cost}"
    )
    db.add(audit)
    db.commit()

    return serialize_work_order(order)


@router.get("/max-heap-queue")
def get_max_heap_priority_queue(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Demonstrates Unit 1 MaintenanceMaxHeap:
    Loads all open maintenance alerts and schedules, pushes into Max-Heap,
    and extracts them in strictly prioritized urgency order.
    """
    alerts = (
        db.query(MaintenanceAlert)
        .filter(
            MaintenanceAlert.organization_id == current_user.organization_id,
            MaintenanceAlert.status == "open"
        )
        .all()
    )

    heap = MaintenanceMaxHeap()
    alert_map = {}
    for a in alerts:
        v_code = a.vehicle.vehicle_code if a.vehicle else "Unknown"
        heap.push(a.urgency, v_code, {"alert_id": a.id, "reason": a.reason, "priority": a.priority})
        alert_map[v_code] = a

    prioritized_list = []
    # Pop from heap in order
    while not heap.is_empty():
        urgency, v_code = heap.pop()
        a = alert_map.get(v_code)
        prioritized_list.append({
            "urgency_score": urgency,
            "vehicle_code": v_code,
            "registration_no": a.vehicle.registration_no if a and a.vehicle else None,
            "priority": a.priority if a else "medium",
            "reason": a.reason if a else "General maintenance",
            "evidence": a.evidence if a else None,
            "created_at": a.created_at.isoformat() if a else None
        })

    return {
        "algorithm": "Maintenance Max-Heap Priority Queue (Unit 1)",
        "queue_length": len(prioritized_list),
        "most_urgent": prioritized_list[0] if prioritized_list else None,
        "prioritized_jobs": prioritized_list,
        "explanation": "Max-Heap guarantees that vehicles with highest urgency scores are always dequeued first, regardless of arrival order."
    }


@router.post("/allocate-workshop")
def allocate_workshop(req: WorkshopAllocationRequest):
    """Demonstrates Unit 3 Knapsack for allocating technician hours."""
    job_hours = [int(j["hours"]) for j in req.jobs]
    job_priorities = [int(j["priority"]) for j in req.jobs]
    hours = int(req.available_hours)

    max_val, chosen_indices = allocate_workshop_hours(hours, job_hours, job_priorities)
    chosen_jobs = [req.jobs[i] for i in chosen_indices]
    used_hours = sum(j["hours"] for j in chosen_jobs)

    return {
        "algorithm": "Workshop Hours Allocation via 0/1 Knapsack (Unit 3)",
        "available_hours": req.available_hours,
        "max_priority_achieved": max_val,
        "allocated_hours": used_hours,
        "idle_hours": req.available_hours - used_hours,
        "chosen_jobs": chosen_jobs
    }
