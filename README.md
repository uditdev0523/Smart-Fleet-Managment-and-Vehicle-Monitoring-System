# 🚛 FleetOps — Smart Fleet Management and Vehicle Monitoring System

> **A Production-Grade, Algorithmic Fleet Telematics & Vehicle Monitoring Platform**  
> *Academic Project for B.Tech Computer Science & Engineering — Data Structures & Algorithms II (CCSE0301)*  
> **Aligned with UN Sustainable Development Goal 9 (Industry, Innovation & Infrastructure)**

---

## 📌 Project Overview

**FleetOps** is an end-to-end Smart Fleet Management and Real-Time Telematics Monitoring System designed to optimize commercial freight corridors, predict vehicle maintenance risks, monitor fuel efficiency, and automate dispatch operations through real-world **Data Structures and Algorithms (DSA)**.

Built with a high-performance **FastAPI (Python)** backend and an interactive **React + TypeScript + Tailwind CSS + Leaflet GIS** frontend, the system processes simulated deterministic GPS telemetry streams, spatial asset tracking, and mathematical cargo/corridor optimizations.

---

## 👤 Academic Details

* **Author:** Udit Pratap Singh
* **University Roll No:** `2501330100392`
* **Faculty Supervisor:** Shamshad Ali
* **Institution:** Noida Institute of Engineering and Technology (NIET), Greater Noida
* **Course:** Data Structures & Algorithms II (`CCSE0301`)
* **Target SDG:** **UN SDG 9** — Industry, Innovation, and Infrastructure (Target 9.1: Sustainable transport systems; Target 9.4: Upgraded technological capabilities and resource-use efficiency)

---

## 🌐 Live & Local Access

* **Live Public HTTPS URL:** [https://moody-frogs-cough.loca.lt](https://moody-frogs-cough.loca.lt) *(Tunnel Password if prompted: `45.117.203.133`)*
* **Local Web Application:** [http://localhost:5173/](http://localhost:5173/)
* **Backend REST API:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
* **Interactive Swagger API Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🧠 Core Data Structures & Algorithms (DSA) Matrix

The system implements 5 specialized curricular units directly mapped to real-world logistics challenges:

| Unit | Algorithmic Paradigm | Data Structure / Algorithm | Practical Logistics Application | Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **Unit 1** | Self-Balancing Trees & Heaps | **AVL Tree & BST** | Fast $O(\log n)$ lookup and range queries of vehicle telemetry by ID | Search: $O(\log n)$ |
| **Unit 1** | Priority Queues | **Maintenance Max-Heap** | Instant extraction of critical vehicle breakdowns and urgent repair scheduling | Extract-Max: $O(\log n)$ |
| **Unit 2** | Graph Shortest Path | **Dijkstra’s Algorithm (Min-Heap)** | Minimum transit time routing across Northern Indian highway corridors | $O((V + E) \log V)$ |
| **Unit 2** | Graph Anomaly Detection | **Bellman-Ford Algorithm** | Negative cycle detection for dynamic toll rebates and fuel fraud corridors | $O(V \cdot E)$ |
| **Unit 2** | All-Pairs Shortest Path | **Floyd-Warshall Algorithm** | Precomputing multi-hub distance matrices across regional transport depots | $O(V^3)$ |
| **Unit 2** | Minimum Spanning Tree | **Prim's & Kruskal's MST** | Optimal optical fiber / IoT sensor interconnection cabling among regional hubs | $O(E \log V)$ |
| **Unit 3** | Dynamic Programming | **0/1 Knapsack Problem** | Maximizing cargo value given strict commercial truck axle weight constraints | $O(n \cdot W)$ |
| **Unit 3** | Dynamic Programming | **Longest Common Subsequence (LCS)**| Comparing historical driver GPS paths against approved highway corridors | $O(m \cdot n)$ |
| **Unit 4** | Backtracking | **Exact Payload Subset Sum** | Verifying if a subset of cargo consignments perfectly balances a container | $O(2^n)$ with pruning |
| **Unit 4** | Branch and Bound | **Travelling Salesperson Tour (TSP)**| Multi-stop depot dispatch sequence minimizing deadhead mileage | $O(n!)$ bounded |
| **Unit 5** | Disjoint Sets | **Disjoint Set Union (DSU with Path Compression)** | Dynamic depot cluster connectivity and regional fleet partition tracking | $\approx O(\alpha(n))$ |
| **Unit 5** | String Search Tree | **Registration Prefix Trie** | Instant sub-millisecond vehicle plate auto-complete (`UP32...`, `DL01...`) | $O(L)$ where $L = \text{length}$ |
| **Unit 5** | Range Query Trees | **Segment Tree** | Fast range-sum and range-min queries for odometer and fuel consumption logs | Query: $O(\log n)$ |

---

## 🏗️ Architecture & Technology Stack

```
Smart Fleet Management System/
│
├── backend/                  # FastAPI REST Microservice
│   ├── fleet_dsa.py          # Pure Python DSA Library (Units 1-5)
│   ├── anomaly_detector.py   # Statistical Outlier & Predictive Risk Scoring
│   ├── auth.py               # JWT Authentication & Role-Based Access Control
│   ├── database.py           # SQLite & SQLAlchemy Models + Seed Generator
│   ├── main.py               # FastAPI App entrypoint & CORS middleware
│   ├── simulator.py          # Deterministic GPS Telematics Stream Engine
│   └── routers/              # Modular API Endpoints
│       ├── vehicle_routes.py
│       ├── driver_routes.py
│       ├── trip_routes.py
│       ├── dsa_routes.py
│       ├── fuel_routes.py
│       ├── maintenance_routes.py
│       └── simulator_routes.py
│
├── frontend/                 # React 19 + TypeScript + Vite Single Page Application
│   ├── src/
│   │   ├── api.ts            # Typed REST Client and Data Contracts
│   │   ├── App.tsx           # Layout Shell & Active Tab Controller
│   │   ├── components/       # UI Shell (Sidebar, TopNavbar, Status Badges)
│   │   └── views/            # Operational Views
│   │       ├── OverviewView.tsx       # Live KPI metrics and Corridor Alerts
│   │       ├── LiveFleetView.tsx      # Leaflet Interactive Map & Live GPS Pins
│   │       ├── RouteOptimizerView.tsx # Interactive Dijkstra & Knapsack Visualizer
│   │       ├── VehiclesView.tsx       # Fleet Registry with Trie Auto-complete
│   │       ├── DriversView.tsx        # Driver Safety Ratings & Duty Logs
│   │       ├── TripsView.tsx          # Real-time Consignment Dispatches
│   │       ├── FuelView.tsx           # Anomaly Detection & Tank Sensor Charts
│   │       └── MaintenanceView.tsx    # Max-Heap Service Queue
│   ├── tailwind.config.js    # Custom Editorial Color Palette (Ivory, Forest, Terracotta)
│   └── vite.config.ts        # Vite Dev Server with Backend Reverse Proxy
```

---

## 🚀 Quickstart & Installation

### Prerequisites
* **Python 3.10+**
* **Node.js 18+** and **npm**
* **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/uditdev0523/Smart-Fleet-Managment-and-Vehicle-Monitoring-System.git
cd Smart-Fleet-Managment-and-Vehicle-Monitoring-System
```

### 2. Set Up and Run the Backend
```bash
cd backend
python -m pip install -r requirements.txt  # (fastapi, uvicorn, sqlalchemy, pydantic)
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
* The backend automatically initializes and seeds `fleetops.db` on first run with 6 vehicles, 6 drivers, 6 depots, and simulated corridor telemetry.

### 3. Set Up and Run the Frontend
```bash
cd ../frontend
npm install
npm run dev
```
* Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## 📊 Key Operational Features

1. **Live GPS Corridor Tracking:**
   * Interactive Leaflet map displaying real-time vehicle positions along simulated highway corridors (Delhi ↔ Agra ↔ Jaipur ↔ Lucknow ↔ Kanpur).
2. **Deterministic Telemetry Simulator:**
   * Built-in multi-speed tick generator updating engine RPM, speed (km/h), fuel level (%), coolant temperature (°C), and battery voltage.
3. **Algorithmic Route & Cargo Dispatcher:**
   * Compare Dijkstra vs. Bellman-Ford paths in real-time.
   * Run 0/1 Knapsack optimizations to select high-value cargo packages within truck payload limits.
4. **Predictive Maintenance Max-Heap:**
   * Vehicles with elevated engine temperatures or mileage thresholds are dynamically prioritized for workshop bays.
5. **Fuel Theft & Siphon Anomaly Detector:**
   * Identifies sudden negative fuel anomalies using statistical thresholds and rolling segment averages.

---

## 📜 License & Acknowledgments

Developed as an academic research and engineering implementation under the guidance of **Prof. Shamshad Ali**, Department of Computer Science & Engineering, **Noida Institute of Engineering and Technology (NIET)**.
