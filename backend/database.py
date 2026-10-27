"""
Database Configuration, Engine, and Seed Data Initialization
"""
import os
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
import bcrypt

from models import (
    Base, Organization, User, Depot, Route, Vehicle, Driver,
    Trip, Telemetry, FuelRecord, MaintenanceRecord, MaintenanceAlert,
    AuditLog, AppSetting
)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fleetops.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Enable foreign keys and WAL mode for SQLite
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Organization).first() is None:
            seed_database(db)
    finally:
        db.close()


def seed_database(db):
    """Seed comprehensive realistic Indian fleet data."""
    # 1. Organization
    org = Organization(
        name="FleetOps India Logistics Pvt Ltd",
        code="FLEETOPS_IN",
        contact_email="operations@fleetops.in"
    )
    db.add(org)
    db.flush()

    # 2. Users (Admin, Dispatcher, Technician, Driver)
    users = [
        User(
            organization_id=org.id,
            username="admin",
            email="manager@fleetops.in",
            full_name="Udit Pratap Singh (Fleet Admin)",
            password_hash=hash_password("admin123"),
            role="fleet_manager"
        ),
        User(
            organization_id=org.id,
            username="dispatcher",
            email="dispatch@fleetops.in",
            full_name="Rajesh Sharma (Senior Dispatcher)",
            password_hash=hash_password("admin123"),
            role="dispatcher"
        ),
        User(
            organization_id=org.id,
            username="technician",
            email="tech@fleetops.in",
            full_name="Amit Verma (Head Mechanic)",
            password_hash=hash_password("admin123"),
            role="technician"
        ),
        User(
            organization_id=org.id,
            username="driver1",
            email="sunil.driver@fleetops.in",
            full_name="Sunil Kumar (Heavy Vehicle Driver)",
            password_hash=hash_password("admin123"),
            role="driver"
        )
    ]
    db.add_all(users)
    db.flush()

    # 3. Depots (5 Main Depots matching the DSA sample network + 2 Disconnected)
    depots = [
        Depot(
            organization_id=org.id,
            code="D1",
            name="Greater Noida Hub",
            location_name="Pari Chowk Logistics Park, Greater Noida",
            latitude=28.4744,
            longitude=77.5040,
            capacity_vehicles=40
        ),
        Depot(
            organization_id=org.id,
            code="D2",
            name="Noida Sector 62 Freight Depot",
            location_name="Electronic City Hub, Noida",
            latitude=28.6270,
            longitude=77.3725,
            capacity_vehicles=30
        ),
        Depot(
            organization_id=org.id,
            code="D3",
            name="Ghaziabad Express Terminal",
            location_name="Loni Road Freight Centre, Ghaziabad",
            latitude=28.6692,
            longitude=77.4538,
            capacity_vehicles=35
        ),
        Depot(
            organization_id=org.id,
            code="D4",
            name="Delhi Anand Vihar Cargo Base",
            location_name="ISBT Cargo Complex, East Delhi",
            latitude=28.6469,
            longitude=77.3160,
            capacity_vehicles=50
        ),
        Depot(
            organization_id=org.id,
            code="D5",
            name="Meerut Transport Nagar",
            location_name="Delhi-Meerut Expressway Corridor, Meerut",
            latitude=28.9845,
            longitude=77.7064,
            capacity_vehicles=25
        ),
        Depot(
            organization_id=org.id,
            code="X1",
            name="Agra Industrial Depot (Isolated Cluster)",
            location_name="Foundry Nagar, Agra",
            latitude=27.1767,
            longitude=78.0081,
            capacity_vehicles=20
        ),
        Depot(
            organization_id=org.id,
            code="X2",
            name="Mathura Highway Depot (Isolated Cluster)",
            location_name="NH-19 Mathura Bypass",
            latitude=27.4924,
            longitude=77.6737,
            capacity_vehicles=15
        )
    ]
    db.add_all(depots)
    db.flush()

    # 4. Routes (Weights in km, identical to DSA regression test fixture)
    routes = [
        Route(organization_id=org.id, from_depot_code="D1", to_depot_code="D2", distance_km=4.0, estimated_minutes=15, corridor_name="Noida-Gr Noida Expressway"),
        Route(organization_id=org.id, from_depot_code="D1", to_depot_code="D3", distance_km=2.0, estimated_minutes=10, corridor_name="Eastern Peripheral Bypass Link"),
        Route(organization_id=org.id, from_depot_code="D2", to_depot_code="D3", distance_km=1.0, estimated_minutes=6, corridor_name="Hindon Cut Road"),
        Route(organization_id=org.id, from_depot_code="D2", to_depot_code="D4", distance_km=5.0, estimated_minutes=18, corridor_name="NH-24 Delhi Link"),
        Route(organization_id=org.id, from_depot_code="D3", to_depot_code="D4", distance_km=8.0, estimated_minutes=25, corridor_name="GT Road North"),
        Route(organization_id=org.id, from_depot_code="D4", to_depot_code="D5", distance_km=3.0, estimated_minutes=12, corridor_name="Meerut Expressway Spur"),
        Route(organization_id=org.id, from_depot_code="X1", to_depot_code="X2", distance_km=10.0, estimated_minutes=30, corridor_name="Yamuna Expressway Link")
    ]
    db.add_all(routes)
    db.flush()

    # 5. Drivers
    drivers = [
        Driver(
            organization_id=org.id,
            driver_code="DRV-001",
            full_name="Sunil Kumar",
            phone="+91 98112 34567",
            licence_no="DL-1420180054321",
            licence_expiry="2028-11-15",
            status="on_trip",
            total_trips=142,
            safety_score=96.5,
            incidents_count=0,
            notes="Certified heavy truck driver, excellent night driving record."
        ),
        Driver(
            organization_id=org.id,
            driver_code="DRV-002",
            full_name="Vikram Singh",
            phone="+91 98223 45678",
            licence_no="UP-1620190087654",
            licence_expiry="2027-04-20",
            status="available",
            total_trips=98,
            safety_score=92.0,
            incidents_count=1,
            notes="Handles medium cargo trucks and refrigerated trailers."
        ),
        Driver(
            organization_id=org.id,
            driver_code="DRV-003",
            full_name="Mohammad Irfan",
            phone="+91 98334 56789",
            licence_no="UP-3220170011223",
            licence_expiry="2029-08-30",
            status="available",
            total_trips=210,
            safety_score=98.0,
            incidents_count=0,
            notes="Senior driver, high fuel efficiency score."
        ),
        Driver(
            organization_id=org.id,
            driver_code="DRV-004",
            full_name="Ramesh Yadav",
            phone="+91 98445 67890",
            licence_no="HR-2620200099887",
            licence_expiry="2026-12-05",
            status="available",
            total_trips=76,
            safety_score=89.5,
            incidents_count=1,
            notes="Expiring licence due for renewal in two months."
        ),
        Driver(
            organization_id=org.id,
            driver_code="DRV-005",
            full_name="Deepak Joshi",
            phone="+91 98556 78901",
            licence_no="DL-0120210044556",
            licence_expiry="2030-01-10",
            status="inactive",
            total_trips=45,
            safety_score=91.0,
            incidents_count=0,
            notes="On approved medical leave."
        )
    ]
    db.add_all(drivers)
    db.flush()

    # 6. Vehicles (Including keys from Appendix D: V1, V2, V3, V4, UP32AB1234, UP32AB5678)
    vehicles = [
        Vehicle(
            organization_id=org.id,
            vehicle_code="V1",
            registration_no="UP32AB1234",
            vehicle_type="Heavy Commercial Truck (16T)",
            make_model="Tata Prima 5530.S",
            year=2023,
            load_capacity_kg=16000.0,
            odometer_km=48520.0,
            fuel_type="Diesel",
            expected_mileage=4.2,
            service_interval_km=10000.0,
            last_service_km=42000.0,
            status="active",
            insurance_expiry="2027-03-15",
            permit_expiry="2028-06-30",
            pollution_expiry="2027-02-10",
            notes="Primary long-haul tractor unit, GPS unit connected.",
            home_depot_id=depots[0].id,
            assigned_driver_id=drivers[0].id
        ),
        Vehicle(
            organization_id=org.id,
            vehicle_code="V2",
            registration_no="UP32AB5678",
            vehicle_type="Multi-Axle Cargo Truck (25T)",
            make_model="Ashok Leyland 2820",
            year=2022,
            load_capacity_kg=25000.0,
            odometer_km=72150.0,
            fuel_type="Diesel",
            expected_mileage=3.8,
            service_interval_km=12000.0,
            last_service_km=60000.0, # 12,150 km since service -> Urgency 9!
            status="maintenance",
            insurance_expiry="2026-11-20",
            permit_expiry="2027-08-15",
            pollution_expiry="2026-11-05",
            notes="Scheduled for comprehensive engine & brake overhaul.",
            home_depot_id=depots[1].id,
            assigned_driver_id=None
        ),
        Vehicle(
            organization_id=org.id,
            vehicle_code="V3",
            registration_no="DL01CD9999",
            vehicle_type="Medium Duty Cargo (10T)",
            make_model="Eicher Pro 3019",
            year=2023,
            load_capacity_kg=10500.0,
            odometer_km=31200.0,
            fuel_type="Diesel",
            expected_mileage=5.4,
            service_interval_km=10000.0,
            last_service_km=26500.0,
            status="available",
            insurance_expiry="2027-09-12",
            permit_expiry="2028-10-01",
            pollution_expiry="2027-04-18",
            notes="Ideal for inter-city NCR distribution routes.",
            home_depot_id=depots[2].id,
            assigned_driver_id=drivers[1].id
        ),
        Vehicle(
            organization_id=org.id,
            vehicle_code="V4",
            registration_no="HR26EF4321",
            vehicle_type="Heavy Commercial Truck (16T)",
            make_model="BharatBenz 1617R",
            year=2024,
            load_capacity_kg=16200.0,
            odometer_km=19800.0,
            fuel_type="Diesel",
            expected_mileage=4.5,
            service_interval_km=10000.0,
            last_service_km=11000.0,
            status="active",
            insurance_expiry="2027-12-01",
            permit_expiry="2029-01-15",
            pollution_expiry="2027-08-22",
            notes="Equipped with telematics sensor and dashcam.",
            home_depot_id=depots[3].id,
            assigned_driver_id=drivers[2].id
        ),
        Vehicle(
            organization_id=org.id,
            vehicle_code="V5",
            registration_no="UP14GH8877",
            vehicle_type="Light Commercial Van (3.5T)",
            make_model="Tata 407 Gold SFC",
            year=2022,
            load_capacity_kg=3500.0,
            odometer_km=54300.0,
            fuel_type="CNG",
            expected_mileage=9.2,
            service_interval_km=8000.0,
            last_service_km=49000.0,
            status="available",
            insurance_expiry="2026-12-25",
            permit_expiry="2027-05-10",
            pollution_expiry="2026-11-15",
            notes="Last-mile delivery van for urban corridors.",
            home_depot_id=depots[0].id,
            assigned_driver_id=drivers[3].id
        ),
        Vehicle(
            organization_id=org.id,
            vehicle_code="V6",
            registration_no="UP16JK5544",
            vehicle_type="Heavy Tipper (20T)",
            make_model="Ashok Leyland 3518",
            year=2021,
            load_capacity_kg=20000.0,
            odometer_km=89400.0,
            fuel_type="Diesel",
            expected_mileage=3.2,
            service_interval_km=10000.0,
            last_service_km=82000.0,
            status="available",
            insurance_expiry="2027-05-18",
            permit_expiry="2028-02-28",
            pollution_expiry="2027-01-30",
            notes="Bulk aggregate and construction supply hauler.",
            home_depot_id=depots[4].id,
            assigned_driver_id=None
        )
    ]
    db.add_all(vehicles)
    db.flush()

    # 7. Telemetry Initial Seed (GPS coords near depots/routes, labelled simulated)
    now = datetime.now(timezone.utc)
    telemetry_records = [
        Telemetry(
            vehicle_id=vehicles[0].id,
            timestamp=now - timedelta(minutes=2),
            latitude=28.5200,
            longitude=77.4500,
            speed_kmph=52.0,
            fuel_level_l=185.0,
            heading=45.0,
            status_text="In Transit on Expressway",
            is_simulated=True
        ),
        Telemetry(
            vehicle_id=vehicles[1].id,
            timestamp=now - timedelta(minutes=5),
            latitude=28.6270,
            longitude=77.3725,
            speed_kmph=0.0,
            fuel_level_l=75.0,
            heading=0.0,
            status_text="Parked at Workshop Bay",
            is_simulated=True
        ),
        Telemetry(
            vehicle_id=vehicles[2].id,
            timestamp=now - timedelta(minutes=10),
            latitude=28.6692,
            longitude=77.4538,
            speed_kmph=0.0,
            fuel_level_l=140.0,
            heading=180.0,
            status_text="Available at Depot",
            is_simulated=True
        ),
        Telemetry(
            vehicle_id=vehicles[3].id,
            timestamp=now - timedelta(minutes=1),
            latitude=28.7200,
            longitude=77.5200,
            speed_kmph=64.0,
            fuel_level_l=210.0,
            heading=35.0,
            status_text="Cruising towards Meerut",
            is_simulated=True
        ),
        Telemetry(
            vehicle_id=vehicles[4].id,
            timestamp=now - timedelta(minutes=15),
            latitude=28.4744,
            longitude=77.5040,
            speed_kmph=0.0,
            fuel_level_l=42.0,
            heading=90.0,
            status_text="Staged for Morning Dispatch",
            is_simulated=True
        ),
        Telemetry(
            vehicle_id=vehicles[5].id,
            timestamp=now - timedelta(minutes=20),
            latitude=28.9845,
            longitude=77.7064,
            speed_kmph=0.0,
            fuel_level_l=165.0,
            heading=270.0,
            status_text="Available at Depot",
            is_simulated=True
        )
    ]
    db.add_all(telemetry_records)
    db.flush()

    # 8. Trips
    trips = [
        Trip(
            organization_id=org.id,
            trip_code="TRP-2026-001",
            origin_depot_code="D1",
            destination_depot_code="D4",
            route_stops_json='["D1", "D3", "D2", "D4"]', # Optimal Dijkstra 8 km route
            vehicle_id=vehicles[0].id,
            driver_id=drivers[0].id,
            planned_departure=(now - timedelta(hours=2)).isoformat(),
            expected_arrival=(now + timedelta(hours=1)).isoformat(),
            actual_departure=(now - timedelta(hours=2)).isoformat(),
            cargo_description="High-Value Automotive Parts & Electronics",
            cargo_weight_kg=11500.0,
            distance_km=8.0,
            status="in_progress",
            fuel_cost=195.0,
            notes="Urgent shipment to East Delhi assembly plant."
        ),
        Trip(
            organization_id=org.id,
            trip_code="TRP-2026-002",
            origin_depot_code="D4",
            destination_depot_code="D5",
            route_stops_json='["D4", "D5"]',
            vehicle_id=vehicles[3].id,
            driver_id=drivers[2].id,
            planned_departure=(now - timedelta(hours=1)).isoformat(),
            expected_arrival=(now + timedelta(minutes=30)).isoformat(),
            actual_departure=(now - timedelta(hours=1)).isoformat(),
            cargo_description="FMCG Retail Consignments",
            cargo_weight_kg=8400.0,
            distance_km=3.0,
            status="in_progress",
            fuel_cost=80.0,
            notes="Regular morning corridor run."
        ),
        Trip(
            organization_id=org.id,
            trip_code="TRP-2026-003",
            origin_depot_code="D3",
            destination_depot_code="D1",
            route_stops_json='["D3", "D1"]',
            vehicle_id=vehicles[2].id,
            driver_id=drivers[1].id,
            planned_departure=(now + timedelta(hours=3)).isoformat(),
            expected_arrival=(now + timedelta(hours=4, minutes=30)).isoformat(),
            cargo_description="Palletized Industrial Textiles",
            cargo_weight_kg=6200.0,
            distance_km=2.0,
            status="planned",
            fuel_cost=0.0,
            notes="Waiting for loading bay clear."
        ),
        Trip(
            organization_id=org.id,
            trip_code="TRP-2026-004",
            origin_depot_code="D2",
            destination_depot_code="D3",
            route_stops_json='["D2", "D3"]',
            vehicle_id=vehicles[4].id,
            driver_id=drivers[3].id,
            planned_departure=(now - timedelta(days=1)).isoformat(),
            expected_arrival=(now - timedelta(days=1, hours=-1)).isoformat(),
            actual_departure=(now - timedelta(days=1)).isoformat(),
            actual_arrival=(now - timedelta(days=1, hours=-1)).isoformat(),
            cargo_description="E-Commerce Packages",
            cargo_weight_kg=1200.0,
            distance_km=1.0,
            status="completed",
            fuel_cost=25.0,
            notes="On-time delivery completed yesterday."
        )
    ]
    db.add_all(trips)
    db.flush()

    # 9. Fuel Records (with realistic numbers + 1 explainable anomaly flag for vehicle V2)
    fuel_records = [
        FuelRecord(
            organization_id=org.id,
            vehicle_id=vehicles[0].id,
            trip_id=trips[0].id,
            date_str=(now - timedelta(days=3)).strftime("%Y-%m-%d"),
            timestamp=now - timedelta(days=3),
            odometer_km=48100.0,
            litres=45.0,
            total_cost=4050.0,
            price_per_litre=90.0,
            fuel_station="IndianOil Pari Chowk Auto Fuel",
            payment_ref="IOCL-TXN-88392",
            mileage_calculated=4.3,
            cost_per_km=20.93,
            anomaly_flag=False,
            notes="Standard routine fill-up."
        ),
        FuelRecord(
            organization_id=org.id,
            vehicle_id=vehicles[0].id,
            trip_id=trips[0].id,
            date_str=(now - timedelta(days=1)).strftime("%Y-%m-%d"),
            timestamp=now - timedelta(days=1),
            odometer_km=48420.0,
            litres=74.0,
            total_cost=6660.0,
            price_per_litre=90.0,
            fuel_station="HPCL Noida Expressway Hub",
            payment_ref="HPCL-TXN-49102",
            mileage_calculated=4.32,
            cost_per_km=20.81,
            anomaly_flag=False,
            notes="Trip pre-departure full tank."
        ),
        FuelRecord(
            organization_id=org.id,
            vehicle_id=vehicles[1].id,
            date_str=(now - timedelta(days=2)).strftime("%Y-%m-%d"),
            timestamp=now - timedelta(days=2),
            odometer_km=72050.0,
            litres=92.0,
            total_cost=8280.0,
            price_per_litre=90.0,
            fuel_station="BPCL Ghaziabad Commercial Stn",
            payment_ref="BPCL-TXN-11204",
            mileage_calculated=2.4, # Far below 3.8 km/L expected!
            cost_per_km=37.5,
            anomaly_flag=True,
            anomaly_details="Mileage 2.4 km/L is 36.8% below expected target (3.8 km/L). Possible fuel line leak or idling.",
            notes="Flagged by FleetOps rule engine for technician review."
        ),
        FuelRecord(
            organization_id=org.id,
            vehicle_id=vehicles[3].id,
            trip_id=trips[1].id,
            date_str=(now - timedelta(days=2)).strftime("%Y-%m-%d"),
            timestamp=now - timedelta(days=2),
            odometer_km=19600.0,
            litres=44.0,
            total_cost=3960.0,
            price_per_litre=90.0,
            fuel_station="IndianOil Anand Vihar Terminal",
            payment_ref="IOCL-TXN-55410",
            mileage_calculated=4.55,
            cost_per_km=19.8,
            anomaly_flag=False,
            notes="Normal consumption pattern."
        )
    ]
    db.add_all(fuel_records)
    db.flush()

    # 10. Maintenance Records and Work Orders
    maintenance_records = [
        MaintenanceRecord(
            organization_id=org.id,
            vehicle_id=vehicles[1].id,
            work_order_no="WO-2026-089",
            category="Engine & Brakes",
            description="Major 60,000 km scheduled overhaul: turbocharger inspection, brake liner replacement.",
            service_date=now.strftime("%Y-%m-%d"),
            odometer_km=72150.0,
            estimated_cost=28500.0,
            actual_cost=0.0,
            workshop_name="Noida Central Auto Workshop",
            downtime_hours=12.0,
            parts_notes="Brake shoe set, air filters, engine oil synthetic 15W40.",
            status="in_progress",
            urgency=9
        ),
        MaintenanceRecord(
            organization_id=org.id,
            vehicle_id=vehicles[3].id,
            work_order_no="WO-2026-072",
            category="Preventive",
            description="20,000 km standard periodic inspection & tyre rotation.",
            service_date=(now - timedelta(days=14)).strftime("%Y-%m-%d"),
            odometer_km=19000.0,
            estimated_cost=6500.0,
            actual_cost=6200.0,
            workshop_name="East Delhi Commercial Service Centre",
            downtime_hours=4.0,
            parts_notes="Oil filter replacement and wheel alignment.",
            status="completed",
            urgency=4
        )
    ]
    db.add_all(maintenance_records)
    db.flush()

    # 11. Maintenance Alerts (Matching Appendix D urgencies: 3, 9, 5, 7)
    alerts = [
        MaintenanceAlert(
            organization_id=org.id,
            vehicle_id=vehicles[1].id, # V2
            urgency=9,
            priority="critical",
            category="Overdue Service",
            reason="Vehicle V2 (UP32AB5678) exceeded service interval by 2,150 km",
            evidence="Odometer is 72,150 km; last service was 60,000 km (interval: 12,000 km).",
            status="open"
        ),
        MaintenanceAlert(
            organization_id=org.id,
            vehicle_id=vehicles[3].id, # V4
            urgency=7,
            priority="high",
            category="Brake Sensor Warning",
            reason="Vehicle V4 (HR26EF4321) brake pad wear indicator at 85%",
            evidence="Telematics diagnostics reported brake pad threshold exceeded on front axle.",
            status="open"
        ),
        MaintenanceAlert(
            organization_id=org.id,
            vehicle_id=vehicles[2].id, # V3
            urgency=5,
            priority="medium",
            category="Upcoming Document Expiry",
            reason="Vehicle V3 (DL01CD9999) pollution certificate expires in 25 days",
            evidence="Expiry date on record is 2027-04-18.",
            status="open"
        ),
        MaintenanceAlert(
            organization_id=org.id,
            vehicle_id=vehicles[0].id, # V1
            urgency=3,
            priority="low",
            category="Routine Filter Inspection",
            reason="Vehicle V1 (UP32AB1234) due for cabin air filter check",
            evidence="Last inspected 6 months ago during rainy season.",
            status="open"
        )
    ]
    db.add_all(alerts)
    db.flush()

    # 12. Audit Logs
    audit = AuditLog(
        organization_id=org.id,
        user_id=users[0].id,
        action="SYSTEM_INITIALIZE",
        entity_type="Organization",
        entity_id=str(org.id),
        details="Initial system deployment and enterprise dataset bootstrap."
    )
    db.add(audit)

    # 13. App Settings
    settings = [
        AppSetting(organization_id=org.id, key="simulation_active", value="true"),
        AppSetting(organization_id=org.id, key="simulation_speed", value="1.0"),
        AppSetting(organization_id=org.id, key="fuel_currency", value="INR"),
        AppSetting(organization_id=org.id, key="distance_unit", value="km")
    ]
    db.add_all(settings)
    db.commit()
