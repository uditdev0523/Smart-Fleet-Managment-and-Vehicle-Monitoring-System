"""
FleetOps - Explainable Rule-Based Anomaly Detection & Risk Engine
Transparent, rule-based auditing for fuel consumption, odometer consistency, and maintenance risks.
Does not claim black-box machine learning without ground truth.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from models import Vehicle, FuelRecord, MaintenanceAlert, MaintenanceRecord


def evaluate_fuel_record_anomalies(
    db: Session,
    vehicle: Vehicle,
    odometer: float,
    litres: float,
    total_cost: float,
    date_str: str,
    prev_record: Optional[FuelRecord] = None
) -> Dict[str, Any]:
    """
    Evaluates transparent business rules on a new or updated fuel log.
    Returns anomaly metadata dictionary.
    """
    rules_triggered = []
    severity = "low"
    is_anomaly = False
    calculated_mileage = None
    cost_per_km = None

    price_per_l = round(total_cost / max(litres, 0.1), 2)

    if prev_record:
        distance_run = odometer - prev_record.odometer_km
        if distance_run < 0:
            rules_triggered.append({
                "rule_id": "RULE_ODO_REVERSAL",
                "name": "Odometer Rollback or Data Inconsistency",
                "severity": "critical",
                "details": f"Entered odometer ({odometer} km) is lower than preceding log ({prev_record.odometer_km} km).",
                "recommendation": "Inspect physical dashboard odometer and verify driver submission."
            })
            severity = "critical"
            is_anomaly = True
        elif distance_run == 0:
            rules_triggered.append({
                "rule_id": "RULE_ZERO_KM_FILL",
                "name": "Stationary Fuel Purchase",
                "severity": "medium",
                "details": f"Fuel purchased without recorded distance since previous entry ({prev_record.odometer_km} km).",
                "recommendation": "Confirm whether vehicle was running aux generator or if log is duplicate."
            })
            if severity != "critical":
                severity = "medium"
            is_anomaly = True
        else:
            calculated_mileage = round(distance_run / max(litres, 0.1), 2)
            cost_per_km = round(total_cost / max(distance_run, 0.1), 2)

            # Rule: Low Mileage (< 70% of vehicle's expected mileage)
            threshold = vehicle.expected_mileage * 0.70
            if calculated_mileage < threshold:
                rules_triggered.append({
                    "rule_id": "RULE_LOW_MILEAGE",
                    "name": "Sub-Threshold Fuel Efficiency",
                    "severity": "high",
                    "details": f"Calculated mileage ({calculated_mileage} km/L) is below 70% of baseline ({vehicle.expected_mileage} km/L).",
                    "recommendation": "Perform injector, fuel filter, and tyre pressure inspection."
                })
                if severity not in ["critical"]:
                    severity = "high"
                is_anomaly = True

            # Rule: Spike in Cost per KM (> 35 INR/km for heavy, > 25 for medium)
            if cost_per_km > 35.0:
                rules_triggered.append({
                    "rule_id": "RULE_HIGH_KM_COST",
                    "name": "High Operational Cost per Kilometre",
                    "severity": "medium",
                    "details": f"Operating cost reached ₹{cost_per_km}/km on this corridor.",
                    "recommendation": "Audit route congestion and fuel invoice pricing."
                })
                is_anomaly = True

    # Rule: Fuel volume exceeding reasonable single-refill capacity (> 400 L)
    if litres > 400.0:
        rules_triggered.append({
            "rule_id": "RULE_EXCESSIVE_VOLUME",
            "name": "Refill Exceeds Maximum Tank Capacity",
            "severity": "critical",
            "details": f"Purchased volume ({litres} L) exceeds maximum 400 L tank configuration.",
            "recommendation": "Verify receipt for billing error or multi-vehicle bulk fueling."
        })
        severity = "critical"
        is_anomaly = True

    return {
        "is_anomaly": is_anomaly,
        "severity": severity,
        "calculated_mileage": calculated_mileage,
        "cost_per_km": cost_per_km,
        "price_per_l": price_per_l,
        "rules_triggered": rules_triggered,
        "summary": "; ".join(r["name"] for r in rules_triggered) if rules_triggered else None
    }


def compute_vehicle_maintenance_risk(vehicle: Vehicle, open_alerts_count: int) -> Dict[str, Any]:
    """
    Computes explainable maintenance risk score (0-100) and urgency (1-10) for Max Heap.
    """
    km_since_service = max(0.0, vehicle.odometer_km - vehicle.last_service_km)
    service_interval = max(vehicle.service_interval_km, 1000.0)
    ratio = km_since_service / service_interval

    risk_factors = []
    base_score = 20.0

    if ratio >= 1.0:
        overdue_km = km_since_service - service_interval
        base_score += min(50.0, 30.0 + (overdue_km / 100.0))
        risk_factors.append(f"Service overdue by {int(overdue_km)} km")
    elif ratio >= 0.85:
        base_score += 25.0
        risk_factors.append("Service due within 15% of interval threshold")

    if open_alerts_count > 0:
        base_score += min(30.0, open_alerts_count * 15.0)
        risk_factors.append(f"{open_alerts_count} open maintenance alerts logged")

    risk_score = round(min(100.0, max(5.0, base_score)), 1)

    # Urgency 1 to 10 for Max Heap
    urgency = min(10, max(1, int(risk_score / 10)))

    if risk_score >= 75.0:
        status_label = "Critical Risk"
    elif risk_score >= 50.0:
        status_label = "Elevated Risk"
    else:
        status_label = "Normal / Nominal"

    return {
        "risk_score": risk_score,
        "urgency": urgency,
        "status_label": status_label,
        "km_since_service": km_since_service,
        "service_interval": service_interval,
        "risk_factors": risk_factors
    }
