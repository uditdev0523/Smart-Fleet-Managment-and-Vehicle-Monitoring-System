"""
FleetOps - Deterministic Vehicle Location & Telemetry Simulator
Produces reproducible, simulated GPS telemetry along depot corridors for demonstration.
VISIBLY LABELED AS SIMULATED GPS DATA.
"""
from datetime import datetime, timezone
import math
from sqlalchemy.orm import Session
from models import Vehicle, Trip, Telemetry, Depot, AppSetting


class GPSSimulator:
    def __init__(self):
        self.is_running = True
        self.speed_multiplier = 1.0
        self.tick_count = 0
        # Cache depot coordinates
        self.depot_coords = {
            "D1": (28.4744, 77.5040),
            "D2": (28.6270, 77.3725),
            "D3": (28.6692, 77.4538),
            "D4": (28.6469, 77.3160),
            "D5": (28.9845, 77.7064),
            "X1": (27.1767, 78.0081),
            "X2": (27.4924, 77.6737)
        }

    def interpolate(self, p1, p2, fraction):
        lat = p1[0] + (p2[0] - p1[0]) * fraction
        lng = p1[1] + (p2[1] - p1[1]) * fraction
        return lat, lng

    def calculate_heading(self, p1, p2):
        d_lat = p2[0] - p1[0]
        d_lng = p2[1] - p1[1]
        angle = math.degrees(math.atan2(d_lng, d_lat))
        return (angle + 360) % 360

    def tick(self, db: Session):
        """Advances simulation by 1 step for all active vehicles."""
        self.tick_count += 1
        updated = []

        # Find in-progress trips
        active_trips = db.query(Trip).filter(Trip.status == "in_progress").all()
        active_vehicle_ids = {t.vehicle_id: t for t in active_trips}

        vehicles = db.query(Vehicle).all()
        now = datetime.now(timezone.utc)

        for vehicle in vehicles:
            if vehicle.status == "archived":
                continue

            last_telemetry = (
                db.query(Telemetry)
                .filter(Telemetry.vehicle_id == vehicle.id)
                .order_by(Telemetry.timestamp.desc())
                .first()
            )

            if vehicle.id in active_vehicle_ids:
                trip = active_vehicle_ids[vehicle.id]
                origin = self.depot_coords.get(trip.origin_depot_code, (28.4744, 77.5040))
                destination = self.depot_coords.get(trip.destination_depot_code, (28.6469, 77.3160))

                # Smooth harmonic oscillation along route corridor based on tick
                # fraction between 0.05 and 0.95
                cycle_len = max(20 // max(int(self.speed_multiplier), 1), 5)
                phase = (self.tick_count + vehicle.id * 3) % cycle_len
                fraction = phase / cycle_len

                new_lat, new_lng = self.interpolate(origin, destination, fraction)
                heading = self.calculate_heading(origin, destination)
                speed = 45.0 + (vehicle.id * 5 % 20) + (math.sin(phase) * 6)
                fuel_level = max(20.0, 180.0 - (phase * 1.5))
                status_text = f"In Transit [{trip.origin_depot_code} -> {trip.destination_depot_code}]"
            else:
                # Stationary at depot or workshop
                home_code = "D1"
                if vehicle.home_depot:
                    home_code = vehicle.home_depot.code
                base_lat, base_lng = self.depot_coords.get(home_code, (28.4744, 77.5040))
                # Micro-jitter (+- 0.0002) for realism
                offset = (vehicle.id % 5) * 0.0005
                new_lat = base_lat + offset
                new_lng = base_lng + offset
                heading = (vehicle.id * 60) % 360
                speed = 0.0
                fuel_level = 150.0 if not last_telemetry else last_telemetry.fuel_level_l
                status_text = "Parked at Depot" if vehicle.status == "available" else "In Maintenance Bay"

            new_record = Telemetry(
                vehicle_id=vehicle.id,
                timestamp=now,
                latitude=round(new_lat, 6),
                longitude=round(new_lng, 6),
                speed_kmph=round(speed, 1),
                fuel_level_l=round(fuel_level, 1),
                heading=round(heading, 1),
                status_text=status_text,
                is_simulated=True
            )
            db.add(new_record)
            updated.append({
                "vehicle_id": vehicle.id,
                "vehicle_code": vehicle.vehicle_code,
                "registration_no": vehicle.registration_no,
                "latitude": new_record.latitude,
                "longitude": new_record.longitude,
                "speed_kmph": new_record.speed_kmph,
                "status_text": new_record.status_text,
                "is_simulated": True,
                "timestamp": new_record.timestamp.isoformat()
            })

        db.commit()
        return updated


# Global simulator singleton
simulator = GPSSimulator()
