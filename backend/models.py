"""
SQLAlchemy Database Models for FleetOps
"""
from datetime import datetime, timezone
import json
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)
    contact_email = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    users = relationship("User", back_populates="organization")
    depots = relationship("Depot", back_populates="organization")
    vehicles = relationship("Vehicle", back_populates="organization")
    drivers = relationship("Driver", back_populates="organization")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    # Role: 'fleet_manager', 'technician', 'dispatcher', 'driver'
    role = Column(String(30), default="fleet_manager", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user")


class Depot(Base):
    __tablename__ = "depots"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    code = Column(String(10), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    location_name = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity_vehicles = Column(Integer, default=50)

    organization = relationship("Organization", back_populates="depots")
    vehicles = relationship("Vehicle", back_populates="home_depot")


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    from_depot_code = Column(String(10), nullable=False)
    to_depot_code = Column(String(10), nullable=False)
    distance_km = Column(Float, nullable=False)
    estimated_minutes = Column(Integer, default=60)
    corridor_name = Column(String(100), nullable=True)


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    vehicle_code = Column(String(20), unique=True, index=True, nullable=False) # e.g. V1, V2
    registration_no = Column(String(20), unique=True, index=True, nullable=False) # e.g. UP32AB1234
    vehicle_type = Column(String(50), nullable=False) # Heavy Truck, Medium Duty, Light Van
    make_model = Column(String(100), nullable=False) # Tata Prima 5530.S, Ashok Leyland Ecomet
    year = Column(Integer, default=2023)
    load_capacity_kg = Column(Float, nullable=False)
    odometer_km = Column(Float, default=0.0)
    fuel_type = Column(String(20), default="Diesel") # Diesel, CNG, Electric
    expected_mileage = Column(Float, default=4.5) # km per litre
    service_interval_km = Column(Float, default=10000.0)
    last_service_km = Column(Float, default=0.0)
    # Status: 'active', 'available', 'maintenance', 'archived'
    status = Column(String(30), default="available", nullable=False)
    insurance_expiry = Column(String(20), nullable=True) # YYYY-MM-DD
    permit_expiry = Column(String(20), nullable=True)
    pollution_expiry = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)
    home_depot_id = Column(Integer, ForeignKey("depots.id"), nullable=True)
    assigned_driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="vehicles")
    home_depot = relationship("Depot", back_populates="vehicles")
    assigned_driver = relationship("Driver", back_populates="assigned_vehicle_rel", foreign_keys=[assigned_driver_id])
    trips = relationship("Trip", back_populates="vehicle")
    telemetry = relationship("Telemetry", back_populates="vehicle")
    fuel_records = relationship("FuelRecord", back_populates="vehicle")
    maintenance_records = relationship("MaintenanceRecord", back_populates="vehicle")
    maintenance_alerts = relationship("MaintenanceAlert", back_populates="vehicle")


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    driver_code = Column(String(20), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    licence_no = Column(String(50), nullable=False)
    licence_expiry = Column(String(20), nullable=False) # YYYY-MM-DD
    # Status: 'available', 'on_trip', 'inactive'
    status = Column(String(30), default="available", nullable=False)
    total_trips = Column(Integer, default=0)
    safety_score = Column(Float, default=95.0) # 0 to 100
    incidents_count = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="drivers")
    assigned_vehicle_rel = relationship("Vehicle", back_populates="assigned_driver", foreign_keys="Vehicle.assigned_driver_id")
    trips = relationship("Trip", back_populates="driver")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    trip_code = Column(String(30), unique=True, index=True, nullable=False) # e.g. TRP-2026-001
    origin_depot_code = Column(String(10), nullable=False)
    destination_depot_code = Column(String(10), nullable=False)
    route_stops_json = Column(Text, default="[]") # JSON list of stops
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    planned_departure = Column(String(30), nullable=False) # ISO format string
    expected_arrival = Column(String(30), nullable=False)
    actual_departure = Column(String(30), nullable=True)
    actual_arrival = Column(String(30), nullable=True)
    cargo_description = Column(String(255), nullable=False)
    cargo_weight_kg = Column(Float, nullable=False)
    distance_km = Column(Float, default=0.0)
    # Status: 'planned', 'assigned', 'in_progress', 'completed', 'delayed', 'cancelled'
    status = Column(String(30), default="planned", nullable=False)
    fuel_cost = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")
    fuel_records = relationship("FuelRecord", back_populates="trip")


class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed_kmph = Column(Float, default=0.0)
    fuel_level_l = Column(Float, default=100.0)
    heading = Column(Float, default=0.0)
    status_text = Column(String(50), default="Normal Operation")
    is_simulated = Column(Boolean, default=True)

    vehicle = relationship("Vehicle", back_populates="telemetry")


class FuelRecord(Base):
    __tablename__ = "fuel_records"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    date_str = Column(String(20), nullable=False) # YYYY-MM-DD
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    odometer_km = Column(Float, nullable=False)
    litres = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    price_per_litre = Column(Float, nullable=False)
    fuel_station = Column(String(100), nullable=False)
    payment_ref = Column(String(50), nullable=True)
    mileage_calculated = Column(Float, nullable=True) # km / L
    cost_per_km = Column(Float, nullable=True) # INR / km
    anomaly_flag = Column(Boolean, default=False)
    anomaly_details = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    vehicle = relationship("Vehicle", back_populates="fuel_records")
    trip = relationship("Trip", back_populates="fuel_records")


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    work_order_no = Column(String(50), unique=True, index=True, nullable=False)
    category = Column(String(50), nullable=False) # Preventive, Engine, Brake, Electrical, Tyres
    description = Column(String(255), nullable=False)
    service_date = Column(String(20), nullable=False) # YYYY-MM-DD
    odometer_km = Column(Float, nullable=False)
    estimated_cost = Column(Float, default=0.0)
    actual_cost = Column(Float, default=0.0)
    workshop_name = Column(String(100), nullable=False)
    downtime_hours = Column(Float, default=4.0)
    parts_notes = Column(Text, nullable=True)
    # Status: 'scheduled', 'in_progress', 'completed'
    status = Column(String(30), default="scheduled", nullable=False)
    urgency = Column(Integer, default=5) # 1 - 10
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    vehicle = relationship("Vehicle", back_populates="maintenance_records")


class MaintenanceAlert(Base):
    __tablename__ = "maintenance_alerts"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    urgency = Column(Integer, nullable=False) # 1 - 10 for Max Heap
    # Priority: 'critical', 'high', 'medium', 'low'
    priority = Column(String(20), default="medium", nullable=False)
    category = Column(String(50), default="Maintenance")
    reason = Column(String(255), nullable=False)
    evidence = Column(Text, nullable=True)
    # Status: 'open', 'acknowledged', 'resolved'
    status = Column(String(30), default="open", nullable=False)
    resolution_notes = Column(Text, nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)

    vehicle = relationship("Vehicle", back_populates="maintenance_alerts")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False) # e.g. "CREATE_VEHICLE", "UPDATE_STATUS"
    entity_type = Column(String(50), nullable=False) # e.g. "Vehicle", "Trip", "Alert"
    entity_id = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="audit_logs")


class AppSetting(Base):
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    key = Column(String(50), nullable=False)
    value = Column(Text, nullable=False)
