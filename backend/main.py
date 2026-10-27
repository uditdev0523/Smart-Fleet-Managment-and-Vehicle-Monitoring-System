"""
FleetOps - Smart Fleet Management and Vehicle Monitoring System
FastAPI Backend Application Entry Point
"""
import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import init_db
from routers.auth_routes import router as auth_router
from routers.vehicle_routes import router as vehicle_router
from routers.driver_routes import router as driver_router
from routers.trip_routes import router as trip_router
from routers.dsa_routes import router as dsa_router
from routers.fuel_routes import router as fuel_router
from routers.maintenance_routes import router as maintenance_router
from routers.alert_routes import router as alert_router
from routers.report_routes import router as report_router
from routers.simulator_routes import router as simulator_router
from routers.settings_routes import router as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed data
    init_db()
    yield


app = FastAPI(
    title="FleetOps API — Smart Fleet Management and Vehicle Monitoring System",
    description=(
        "Production-style backend for academic project B.Tech CSE — Data Structures and Algorithms II "
        "(NIET Greater Noida, Shamshad Ali, Udit Pratap Singh, Roll No. 2501330100392, SDG 9)."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup for Vite frontend running on localhost:5173 or other ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all feature routers
app.include_router(auth_router)
app.include_router(vehicle_router)
app.include_router(driver_router)
app.include_router(trip_router)
app.include_router(dsa_router)
app.include_router(fuel_router)
app.include_router(maintenance_router)
app.include_router(alert_router)
app.include_router(report_router)
app.include_router(simulator_router)
app.include_router(settings_router)


from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Mount static frontend build
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

@app.get("/health")
def health():
    return {"status": "healthy", "service": "fleetops-backend"}

if os.path.isdir(dist_dir):
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Ignore docs, openapi, and api requests
        if full_path in ("docs", "redoc", "openapi.json") or full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Endpoint not found")
        file_path = os.path.join(dist_dir, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(dist_dir, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return {"error": "Frontend build not found"}
else:
    @app.get("/")
    def root():
        return {
            "project": "FleetOps — Smart Fleet Management and Vehicle Monitoring System",
            "academic_course": "Data Structures & Algorithms II (CCSE0301)",
            "sdg": "SDG 9: Industry, Innovation & Infrastructure",
            "author": "Udit Pratap Singh (Roll No. 2501330100392)",
            "status": "OPERATIONAL",
            "docs_url": "/docs"
        }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

