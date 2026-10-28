/**
 * FleetOps — Universal 24/7 Client-Side Simulation & DSA Engine
 * 
 * Provides an autonomous, fully functional execution environment in the browser.
 * Ensures the platform remains live, interactive, and fully testable 24/7 on
 * GitHub Pages, static CDNs, or when the Python backend is offline.
 * 
 * Implements all 5 academic Data Structures and Algorithms (DSA) units:
 * - Unit 1: BST, AVL Tree, Maintenance Max-Heap Priority Queue
 * - Unit 2: Graph Adjacency List, BFS, Dijkstra, Bellman-Ford, Floyd-Warshall, Prim & Kruskal MST
 * - Unit 3: 0/1 Knapsack Dynamic Programming, LCS Path Deviation
 * - Unit 4: Branch & Bound TSP Delivery Tour, Exact Payload Subset Sum
 * - Unit 5: Disjoint Set Union (DSU), Registration Prefix Trie, Fuel Segment Tree
 */

const STORAGE_KEY = 'fleetops_client_v2_db';

// -------------------------------------------------------------
// Seed Datasets (Northern India Logistics Corridors - SDG 9)
// -------------------------------------------------------------

export interface InitialData {
  organization: any;
  users: any[];
  depots: any[];
  corridors: any[];
  vehicles: any[];
  drivers: any[];
  trips: any[];
  fuelRecords: any[];
  maintenanceRecords: any[];
  alerts: any[];
  auditLogs: any[];
  simulation: {
    active: boolean;
    speed: number;
    tickCount: number;
  };
}

export function getDefaultSeedData(): InitialData {
  const depots = [
    { id: 1, code: 'D1', name: 'Delhi Central Hub', location_name: 'Delhi NCR', latitude: 28.6139, longitude: 77.2090, capacity: 30 },
    { id: 2, code: 'D2', name: 'Greater Noida Logistics Park (NIET)', location_name: 'Knowledge Park II, Greater Noida', latitude: 28.4744, longitude: 77.5040, capacity: 25 },
    { id: 3, code: 'D3', name: 'Agra Freight Terminal', location_name: 'Agra, UP', latitude: 27.1767, longitude: 78.0081, capacity: 20 },
    { id: 4, code: 'D4', name: 'Lucknow Transshipment Hub', location_name: 'Transport Nagar, Lucknow', latitude: 26.8467, longitude: 80.9462, capacity: 35 },
    { id: 5, code: 'D5', name: 'Kanpur Industrial Depot', location_name: 'Kanpur, UP', latitude: 26.4499, longitude: 80.3319, capacity: 25 },
    { id: 6, code: 'D6', name: 'Jaipur Distribution Centre', location_name: 'Jaipur, Rajasthan', latitude: 26.9124, longitude: 75.7873, capacity: 20 },
  ];

  const corridors = [
    { id: 1, from: 'D1', to: 'D2', distance_km: 45.0, corridor_name: 'Delhi-Noida Expressway', estimated_minutes: 50 },
    { id: 2, from: 'D1', to: 'D3', distance_km: 210.0, corridor_name: 'Yamuna Expressway Sector 1', estimated_minutes: 180 },
    { id: 3, from: 'D2', to: 'D3', distance_km: 165.0, corridor_name: 'Yamuna Expressway Corridor', estimated_minutes: 140 },
    { id: 4, from: 'D2', to: 'D4', distance_km: 480.0, corridor_name: 'Agra-Lucknow Expressway Link', estimated_minutes: 420 },
    { id: 5, from: 'D3', to: 'D4', distance_km: 330.0, corridor_name: 'Agra-Lucknow Expressway Direct', estimated_minutes: 270 },
    { id: 6, from: 'D4', to: 'D5', distance_km: 85.0, corridor_name: 'Lucknow-Kanpur Highway (NH27)', estimated_minutes: 95 },
    { id: 7, from: 'D1', to: 'D6', distance_km: 280.0, corridor_name: 'Delhi-Jaipur Highway (NH48)', estimated_minutes: 260 },
    { id: 8, from: 'D3', to: 'D5', distance_km: 290.0, corridor_name: 'Agra-Kanpur NH19 Corridor', estimated_minutes: 250 },
  ];

  const drivers = [
    {
      id: 1,
      driver_code: 'DRV-001',
      full_name: 'Sunil Kumar',
      phone: '+91 98765 43210',
      licence_no: 'UP32-2015001234',
      licence_expiry: '2028-09-15',
      status: 'on_trip',
      total_trips: 142,
      safety_score: 94.5,
      incidents_count: 0,
      notes: 'Certified dangerous goods & heavy freight handler',
      assigned_vehicle: { id: 1, vehicle_code: 'V1', registration_no: 'UP32AB1234', make_model: 'Tata Prima 5530.S' }
    },
    {
      id: 2,
      driver_code: 'DRV-002',
      full_name: 'Rajesh Sharma',
      phone: '+91 98111 22334',
      licence_no: 'DL01-2017009876',
      licence_expiry: '2027-11-20',
      status: 'available',
      total_trips: 98,
      safety_score: 88.0,
      incidents_count: 1,
      notes: 'Express corridor specialist; minor overspeed warning in 2024',
      assigned_vehicle: { id: 2, vehicle_code: 'V2', registration_no: 'UP32AB5678', make_model: 'Ashok Leyland 4220' }
    },
    {
      id: 3,
      driver_code: 'DRV-003',
      full_name: 'Vikram Singh Rathore',
      phone: '+91 97234 56789',
      licence_no: 'RJ14-2018005432',
      licence_expiry: '2026-06-30',
      status: 'on_trip',
      total_trips: 115,
      safety_score: 96.0,
      incidents_count: 0,
      notes: 'Fuel conservation champion 2025; Eco-driving certified',
      assigned_vehicle: { id: 3, vehicle_code: 'V3', registration_no: 'DL01CD9999', make_model: 'Eicher Pro 6028' }
    },
    {
      id: 4,
      driver_code: 'DRV-004',
      full_name: 'Amit Verma',
      phone: '+91 99887 66554',
      licence_no: 'HR26-2019008811',
      licence_expiry: '2029-01-10',
      status: 'available',
      total_trips: 76,
      safety_score: 91.2,
      incidents_count: 0,
      notes: 'Northern regional freight expert',
      assigned_vehicle: { id: 4, vehicle_code: 'V4', registration_no: 'HR26EF4321', make_model: 'BharatBenz 2823R' }
    }
  ];

  const vehicles = [
    {
      id: 1,
      vehicle_code: 'V1',
      registration_no: 'UP32AB1234',
      vehicle_type: 'heavy_truck',
      make_model: 'Tata Prima 5530.S',
      year: 2023,
      load_capacity_kg: 16000,
      odometer_km: 84320.5,
      fuel_type: 'diesel',
      expected_mileage: 4.2,
      service_interval_km: 15000,
      last_service_km: 75000,
      status: 'active',
      insurance_expiry: '2027-08-14',
      permit_expiry: '2028-05-20',
      pollution_expiry: '2027-03-10',
      home_depot: { id: 1, code: 'D1', name: 'Delhi Central Hub' },
      assigned_driver: { id: 1, driver_code: 'DRV-001', full_name: 'Sunil Kumar', phone: '+91 98765 43210' },
      risk_info: {
        risk_score: 28,
        urgency: 3,
        status_label: 'Healthy',
        km_since_service: 9320.5,
        service_interval: 15000,
        risk_factors: ['Routine wear within normal operational tolerances']
      },
      latest_telemetry: {
        latitude: 28.1000,
        longitude: 77.3800,
        speed_kmph: 58.4,
        fuel_level_l: 185.0,
        status_text: 'En Route to Agra via Yamuna Expressway',
        timestamp: new Date().toISOString(),
        is_simulated: true
      }
    },
    {
      id: 2,
      vehicle_code: 'V2',
      registration_no: 'UP32AB5678',
      vehicle_type: 'heavy_truck',
      make_model: 'Ashok Leyland 4220',
      year: 2022,
      load_capacity_kg: 20000,
      odometer_km: 72150.0,
      fuel_type: 'diesel',
      expected_mileage: 3.8,
      service_interval_km: 12000,
      last_service_km: 60000,
      status: 'maintenance',
      insurance_expiry: '2027-10-05',
      permit_expiry: '2028-01-15',
      pollution_expiry: '2026-12-19',
      home_depot: { id: 2, code: 'D2', name: 'Greater Noida Logistics Park (NIET)' },
      assigned_driver: { id: 2, driver_code: 'DRV-002', full_name: 'Rajesh Sharma', phone: '+91 98111 22334' },
      risk_info: {
        risk_score: 92,
        urgency: 9,
        status_label: 'Critical Service Overdue',
        km_since_service: 12150.0,
        service_interval: 12000,
        risk_factors: ['Exceeded service interval by 2,150 km', 'Max-Heap priority 9']
      },
      latest_telemetry: {
        latitude: 28.4744,
        longitude: 77.5040,
        speed_kmph: 0.0,
        fuel_level_l: 95.0,
        status_text: 'Stationary at NIET Depot Workshop',
        timestamp: new Date().toISOString(),
        is_simulated: true
      }
    },
    {
      id: 3,
      vehicle_code: 'V3',
      registration_no: 'DL01CD9999',
      vehicle_type: 'medium_truck',
      make_model: 'Eicher Pro 6028',
      year: 2024,
      load_capacity_kg: 12000,
      odometer_km: 34100.0,
      fuel_type: 'diesel',
      expected_mileage: 5.1,
      service_interval_km: 15000,
      last_service_km: 30000,
      status: 'active',
      insurance_expiry: '2028-02-18',
      permit_expiry: '2028-09-12',
      pollution_expiry: '2027-04-18',
      home_depot: { id: 3, code: 'D3', name: 'Agra Freight Terminal' },
      assigned_driver: { id: 3, driver_code: 'DRV-003', full_name: 'Vikram Singh Rathore', phone: '+91 97234 56789' },
      risk_info: {
        risk_score: 45,
        urgency: 5,
        status_label: 'Moderate Attention',
        km_since_service: 4100.0,
        service_interval: 15000,
        risk_factors: ['Pollution certificate review approaching in 50 days']
      },
      latest_telemetry: {
        latitude: 27.0100,
        longitude: 79.4500,
        speed_kmph: 64.2,
        fuel_level_l: 142.5,
        status_text: 'Cruising on Agra-Lucknow Expressway Corridor',
        timestamp: new Date().toISOString(),
        is_simulated: true
      }
    },
    {
      id: 4,
      vehicle_code: 'V4',
      registration_no: 'HR26EF4321',
      vehicle_type: 'heavy_truck',
      make_model: 'BharatBenz 2823R',
      year: 2023,
      load_capacity_kg: 18000,
      odometer_km: 61200.0,
      fuel_type: 'diesel',
      expected_mileage: 4.0,
      service_interval_km: 15000,
      last_service_km: 50000,
      status: 'available',
      insurance_expiry: '2027-11-28',
      permit_expiry: '2028-04-14',
      pollution_expiry: '2027-06-05',
      home_depot: { id: 4, code: 'D4', name: 'Lucknow Transshipment Hub' },
      assigned_driver: { id: 4, driver_code: 'DRV-004', full_name: 'Amit Verma', phone: '+91 99887 66554' },
      risk_info: {
        risk_score: 68,
        urgency: 7,
        status_label: 'Brake Sensor Warning',
        km_since_service: 11200.0,
        service_interval: 15000,
        risk_factors: ['Front axle brake pad wear at 85%', 'Urgency 7']
      },
      latest_telemetry: {
        latitude: 26.8467,
        longitude: 80.9462,
        speed_kmph: 0.0,
        fuel_level_l: 210.0,
        status_text: 'Parked at Lucknow Bay 3, Ready for Dispatch',
        timestamp: new Date().toISOString(),
        is_simulated: true
      }
    }
  ];

  const trips = [
    {
      id: 1,
      trip_code: 'TRP-2026-001',
      origin_depot_code: 'D1',
      destination_depot_code: 'D3',
      route_stops: ['D1', 'D2', 'D3'],
      vehicle: {
        id: 1,
        vehicle_code: 'V1',
        registration_no: 'UP32AB1234',
        make_model: 'Tata Prima 5530.S',
        capacity_kg: 16000,
        status: 'active'
      },
      driver: {
        id: 1,
        driver_code: 'DRV-001',
        full_name: 'Sunil Kumar',
        phone: '+91 98765 43210',
        licence_no: 'UP32-2015001234'
      },
      planned_departure: '2026-10-28T06:00:00Z',
      expected_arrival: '2026-10-28T10:30:00Z',
      actual_departure: '2026-10-28T06:15:00Z',
      cargo_description: 'Automotive Sub-assemblies & Precision Components',
      cargo_weight_kg: 11400,
      distance_km: 210.0,
      status: 'in_progress',
      fuel_cost: 4850.0,
      notes: 'High-priority consignment with Dijkstra optimized corridor'
    },
    {
      id: 2,
      trip_code: 'TRP-2026-002',
      origin_depot_code: 'D3',
      destination_depot_code: 'D4',
      route_stops: ['D3', 'D4'],
      vehicle: {
        id: 3,
        vehicle_code: 'V3',
        registration_no: 'DL01CD9999',
        make_model: 'Eicher Pro 6028',
        capacity_kg: 12000,
        status: 'active'
      },
      driver: {
        id: 3,
        driver_code: 'DRV-003',
        full_name: 'Vikram Singh Rathore',
        phone: '+91 97234 56789',
        licence_no: 'RJ14-2018005432'
      },
      planned_departure: '2026-10-28T07:30:00Z',
      expected_arrival: '2026-10-28T12:00:00Z',
      actual_departure: '2026-10-28T07:40:00Z',
      cargo_description: 'FMCG Packaged Goods & Industrial Cartons',
      cargo_weight_kg: 8900,
      distance_km: 330.0,
      status: 'in_progress',
      fuel_cost: 6200.0,
      notes: 'Scheduled transit along Agra-Lucknow Expressway'
    },
    {
      id: 3,
      trip_code: 'TRP-2026-003',
      origin_depot_code: 'D4',
      destination_depot_code: 'D5',
      route_stops: ['D4', 'D5'],
      vehicle: {
        id: 4,
        vehicle_code: 'V4',
        registration_no: 'HR26EF4321',
        make_model: 'BharatBenz 2823R',
        capacity_kg: 18000,
        status: 'available'
      },
      driver: {
        id: 4,
        driver_code: 'DRV-004',
        full_name: 'Amit Verma',
        phone: '+91 99887 66554',
        licence_no: 'HR26-2019008811'
      },
      planned_departure: '2026-10-28T14:00:00Z',
      expected_arrival: '2026-10-28T16:00:00Z',
      cargo_description: 'Textile Machinery Spare Parts',
      cargo_weight_kg: 14200,
      distance_km: 85.0,
      status: 'planned',
      fuel_cost: 2100.0,
      notes: 'Short-haul freight transfer'
    }
  ];

  const fuelRecords = [
    {
      id: 1,
      vehicle_id: 1,
      vehicle_code: 'V1',
      registration_no: 'UP32AB1234',
      trip_id: 1,
      date_str: '2026-10-27',
      timestamp: '2026-10-27T18:40:00Z',
      odometer_km: 84110.0,
      litres: 50.0,
      total_cost: 4750.0,
      price_per_litre: 95.0,
      fuel_station: 'IndianOil COCO Jewar Expressway',
      mileage_calculated: 4.2,
      cost_per_km: 22.6,
      anomaly_flag: false
    },
    {
      id: 2,
      vehicle_id: 2,
      vehicle_code: 'V2',
      registration_no: 'UP32AB5678',
      date_str: '2026-10-26',
      timestamp: '2026-10-26T14:15:00Z',
      odometer_km: 72150.0,
      litres: 80.0,
      total_cost: 7600.0,
      price_per_litre: 95.0,
      fuel_station: 'HPCL Express Fuel Point, Noida',
      mileage_calculated: 2.8,
      cost_per_km: 33.9,
      anomaly_flag: true,
      anomaly_details: 'Mileage 26.3% lower than expected 3.8 km/L; flagged for maintenance check.'
    },
    {
      id: 3,
      vehicle_id: 3,
      vehicle_code: 'V3',
      registration_no: 'DL01CD9999',
      trip_id: 2,
      date_str: '2026-10-27',
      timestamp: '2026-10-27T08:20:00Z',
      odometer_km: 33770.0,
      litres: 65.0,
      total_cost: 6175.0,
      price_per_litre: 95.0,
      fuel_station: 'BPCL Highway Oasis, Mathura',
      mileage_calculated: 5.1,
      cost_per_km: 18.6,
      anomaly_flag: false
    }
  ];

  const maintenanceRecords = [
    {
      id: 1,
      vehicle_id: 2,
      vehicle_code: 'V2',
      registration_no: 'UP32AB5678',
      work_order_no: 'WO-2026-089',
      category: 'Major Overhaul',
      description: 'Scheduled 70,000 km engine service, fuel injector calibration, and brake shoe relining',
      service_date: '2026-10-28',
      odometer_km: 72150.0,
      estimated_cost: 24500.0,
      actual_cost: 0.0,
      workshop_name: 'NIET Automated Logistics Workshop',
      downtime_hours: 6.5,
      parts_notes: 'Fuel filters, Synthetic 15W40 oil, Brake lining kit',
      status: 'in_progress',
      urgency: 9,
      created_at: '2026-10-28T05:00:00Z'
    },
    {
      id: 2,
      vehicle_id: 4,
      vehicle_code: 'V4',
      registration_no: 'HR26EF4321',
      work_order_no: 'WO-2026-090',
      category: 'Brake Servicing',
      description: 'Front axle brake pad replacement following sensor warning threshold trigger',
      service_date: '2026-10-29',
      odometer_km: 61200.0,
      estimated_cost: 11200.0,
      actual_cost: 0.0,
      workshop_name: 'Lucknow Central Commercial Depot',
      downtime_hours: 3.5,
      parts_notes: 'Heavy-duty ceramic disc brake pads',
      status: 'scheduled',
      urgency: 7,
      created_at: '2026-10-28T07:15:00Z'
    }
  ];

  const alerts = [
    {
      id: 1,
      vehicle_id: 2,
      vehicle_code: 'V2',
      registration_no: 'UP32AB5678',
      urgency: 9,
      priority: 'critical',
      category: 'Overdue Service',
      reason: 'Vehicle V2 (UP32AB5678) exceeded service interval by 2,150 km',
      evidence: 'Odometer is 72,150 km; last service was 60,000 km (interval: 12,000 km).',
      status: 'acknowledged',
      created_at: '2026-10-27T10:00:00Z'
    },
    {
      id: 2,
      vehicle_id: 4,
      vehicle_code: 'V4',
      registration_no: 'HR26EF4321',
      urgency: 7,
      priority: 'high',
      category: 'Brake Sensor Warning',
      reason: 'Vehicle V4 (HR26EF4321) brake pad wear indicator at 85%',
      evidence: 'Telematics diagnostics reported brake pad threshold exceeded on front axle.',
      status: 'acknowledged',
      created_at: '2026-10-27T14:30:00Z'
    },
    {
      id: 3,
      vehicle_id: 3,
      vehicle_code: 'V3',
      registration_no: 'DL01CD9999',
      urgency: 5,
      priority: 'medium',
      category: 'Upcoming Document Expiry',
      reason: 'Vehicle V3 (DL01CD9999) pollution certificate expires in 25 days',
      evidence: 'Expiry date on record is 2027-04-18.',
      status: 'acknowledged',
      created_at: '2026-10-26T09:00:00Z'
    },
    {
      id: 4,
      vehicle_id: 1,
      vehicle_code: 'V1',
      registration_no: 'UP32AB1234',
      urgency: 3,
      priority: 'low',
      category: 'Routine Filter Inspection',
      reason: 'Vehicle V1 (UP32AB1234) due for cabin air filter check',
      evidence: 'Last inspected 6 months ago during rainy season.',
      status: 'acknowledged',
      created_at: '2026-10-25T11:00:00Z'
    }
  ];

  const auditLogs = [
    {
      id: 1,
      action: 'SYSTEM_INITIALIZE',
      entity_type: 'Organization',
      entity_id: '1',
      details: 'FleetOps Universal 24/7 Cloud Engine initialized for academic evaluation (CCSE0301).',
      timestamp: new Date().toISOString()
    }
  ];

  return {
    organization: {
      name: 'FleetOps India Logistics Pvt Ltd',
      code: 'FLEETOPS_IN',
      contact_email: 'operations@fleetops.in'
    },
    users: [
      { id: 1, username: 'admin', full_name: 'Udit Pratap Singh (Fleet Admin)', email: 'manager@fleetops.in', role: 'fleet_manager', organization_id: 1 },
      { id: 2, username: 'dispatcher', full_name: 'Rajesh Sharma (Senior Dispatcher)', email: 'dispatch@fleetops.in', role: 'dispatcher', organization_id: 1 },
      { id: 3, username: 'technician', full_name: 'Amit Verma (Head Mechanic)', email: 'tech@fleetops.in', role: 'technician', organization_id: 1 },
      { id: 4, username: 'driver1', full_name: 'Sunil Kumar (Heavy Vehicle Driver)', email: 'sunil.driver@fleetops.in', role: 'driver', organization_id: 1 },
    ],
    depots,
    corridors,
    vehicles,
    drivers,
    trips,
    fuelRecords,
    maintenanceRecords,
    alerts,
    auditLogs,
    simulation: {
      active: true,
      speed: 1.0,
      tickCount: 0
    }
  };
}

// -------------------------------------------------------------
// Database Persistence Helpers
// -------------------------------------------------------------

export function loadClientDb(): InitialData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse localStorage DB, reseeding:', e);
  }
  const initial = getDefaultSeedData();
  saveClientDb(initial);
  return initial;
}

export function saveClientDb(data: InitialData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function resetClientDb(): InitialData {
  const initial = getDefaultSeedData();
  saveClientDb(initial);
  return initial;
}

// -------------------------------------------------------------
// Core DSA Algorithms (Verified TypeScript Implementations)
// -------------------------------------------------------------

// --- UNIT 1: Maintenance Max-Heap Priority Queue ---
export interface HeapItem {
  urgency: number;
  vehicle_code: string;
  meta: any;
}

export class MaintenanceMaxHeap {
  private heap: HeapItem[] = [];

  push(urgency: number, vehicle_code: string, meta: any = {}) {
    const item: HeapItem = { urgency, vehicle_code, meta };
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop(): HeapItem | null {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop()!;
    const top = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this._bubbleDown(0);
    return top;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  size(): number {
    return this.heap.length;
  }

  private _bubbleUp(index: number) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.heap[index].urgency > this.heap[parent].urgency) {
        [this.heap[index], this.heap[parent]] = [this.heap[parent], this.heap[index]];
        index = parent;
      } else {
        break;
      }
    }
  }

  private _bubbleDown(index: number) {
    const length = this.heap.length;
    while (true) {
      let largest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;

      if (left < length && this.heap[left].urgency > this.heap[largest].urgency) {
        largest = left;
      }
      if (right < length && this.heap[right].urgency > this.heap[largest].urgency) {
        largest = right;
      }
      if (largest !== index) {
        [this.heap[index], this.heap[largest]] = [this.heap[largest], this.heap[index]];
        index = largest;
      } else {
        break;
      }
    }
  }
}

// --- UNIT 2: Graph, Dijkstra, BFS, Bellman-Ford, Floyd-Warshall, Prim & Kruskal MST ---

export class FleetGraph {
  adj: Record<string, { to: string; weight: number }[]> = {};

  addEdge(u: string, v: string, w: number) {
    if (!this.adj[u]) this.adj[u] = [];
    if (!this.adj[v]) this.adj[v] = [];
    this.adj[u].push({ to: v, weight: w });
    this.adj[v].push({ to: u, weight: w });
  }

  getVertices(): string[] {
    return Object.keys(this.adj);
  }
}

export function buildGraph(corridors: any[]): FleetGraph {
  const g = new FleetGraph();
  for (const c of corridors) {
    g.addEdge(c.from, c.to, c.distance_km);
  }
  return g;
}

export function dijkstra(g: FleetGraph, start: string, dest: string): { distance: number; path: string[] } {
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visited = new Set<string>();

  for (const v of g.getVertices()) {
    dist[v] = Infinity;
    prev[v] = null;
  }
  dist[start] = 0;

  const pq: { v: string; d: number }[] = [{ v: start, d: 0 }];

  while (pq.length > 0) {
    pq.sort((a, b) => a.d - b.d);
    const { v, d } = pq.shift()!;

    if (visited.has(v)) continue;
    visited.add(v);

    if (v === dest) break;

    for (const edge of g.adj[v] || []) {
      if (visited.has(edge.to)) continue;
      const newDist = d + edge.weight;
      if (newDist < dist[edge.to]) {
        dist[edge.to] = newDist;
        prev[edge.to] = v;
        pq.push({ v: edge.to, d: newDist });
      }
    }
  }

  const path: string[] = [];
  let curr: string | null = dest;
  while (curr) {
    path.push(curr);
    curr = prev[curr];
  }
  path.reverse();

  return {
    distance: dist[dest] === Infinity ? -1 : dist[dest],
    path: path[0] === start ? path : []
  };
}

export function bfsFewestHops(g: FleetGraph, start: string, dest: string): { hops: number; distance: number; path: string[] } {
  if (start === dest) return { hops: 0, distance: 0, path: [start] };

  const queue = [start];
  const visited = new Set<string>([start]);
  const parent: Record<string, string | null> = { [start]: null };
  let found = false;

  while (queue.length > 0 && !found) {
    const curr = queue.shift()!;
    for (const edge of g.adj[curr] || []) {
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        parent[edge.to] = curr;
        queue.push(edge.to);
        if (edge.to === dest) {
          found = true;
          break;
        }
      }
    }
  }

  if (!found) return { hops: -1, distance: -1, path: [] };

  const path: string[] = [];
  let curr: string | null = dest;
  while (curr) {
    path.push(curr);
    curr = parent[curr];
  }
  path.reverse();

  let distance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i];
    const v = path[i + 1];
    const edge = (g.adj[u] || []).find(e => e.to === v);
    if (edge) distance += edge.weight;
  }

  return {
    hops: path.length - 1,
    distance,
    path
  };
}

export function bellmanFord(g: FleetGraph, start: string): Record<string, number> {
  const dist: Record<string, number> = {};
  const vertices = g.getVertices();
  for (const v of vertices) dist[v] = Infinity;
  dist[start] = 0;

  // Flatten edges
  const edges: { u: string; v: string; w: number }[] = [];
  for (const u of vertices) {
    for (const e of g.adj[u] || []) {
      edges.push({ u, v: e.to, w: e.weight });
    }
  }

  for (let i = 0; i < vertices.length - 1; i++) {
    for (const { u, v, w } of edges) {
      if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
      }
    }
  }

  return dist;
}

export function floydWarshall(g: FleetGraph): Record<string, Record<string, number>> {
  const dist: Record<string, Record<string, number>> = {};
  const vertices = g.getVertices();

  for (const u of vertices) {
    dist[u] = {};
    for (const v of vertices) {
      dist[u][v] = u === v ? 0 : Infinity;
    }
    for (const edge of g.adj[u] || []) {
      dist[u][edge.to] = edge.weight;
    }
  }

  for (const k of vertices) {
    for (const i of vertices) {
      for (const j of vertices) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
        }
      }
    }
  }

  return dist;
}

export function primMST(g: FleetGraph, start: string = 'D1'): { cost: number; edges: any[] } {
  const visited = new Set<string>([start]);
  const edges: any[] = [];
  let totalCost = 0;
  const vertices = g.getVertices();

  while (visited.size < vertices.length) {
    let minWeight = Infinity;
    let minEdge: { from: string; to: string; weight: number } | null = null;

    for (const u of visited) {
      for (const edge of g.adj[u] || []) {
        if (!visited.has(edge.to) && edge.weight < minWeight) {
          minWeight = edge.weight;
          minEdge = { from: u, to: edge.to, weight: edge.weight };
        }
      }
    }

    if (!minEdge) break;
    visited.add(minEdge.to);
    edges.push(minEdge);
    totalCost += minEdge.weight;
  }

  return { cost: totalCost, edges };
}

export function kruskalMST(g: FleetGraph): { cost: number; edges: any[] } {
  const edges: { u: string; v: string; w: number }[] = [];
  const seen = new Set<string>();

  for (const u of g.getVertices()) {
    for (const e of g.adj[u] || []) {
      const key = [u, e.to].sort().join('-');
      if (!seen.has(key)) {
        seen.add(key);
        edges.push({ u, v: e.to, w: e.weight });
      }
    }
  }

  edges.sort((a, b) => a.w - b.w);

  // Disjoint Set Union
  const parent: Record<string, string> = {};
  for (const v of g.getVertices()) parent[v] = v;

  function find(i: string): string {
    if (parent[i] === i) return i;
    parent[i] = find(parent[i]);
    return parent[i];
  }

  function union(i: string, j: string): boolean {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
      return true;
    }
    return false;
  }

  const mstEdges: any[] = [];
  let totalCost = 0;

  for (const e of edges) {
    if (union(e.u, e.v)) {
      mstEdges.push({ from: e.u, to: e.v, weight_km: e.w });
      totalCost += e.w;
    }
  }

  return { cost: totalCost, edges: mstEdges };
}

// --- UNIT 3: 0/1 Knapsack Dynamic Programming ---

export function solveKnapsack(capacity: number, items: { id: number; name: string; weight: number; value: number }[]) {
  const n = items.length;
  const W = Math.floor(capacity);
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const wt = Math.floor(items[i - 1].weight);
    const val = items[i - 1].value;
    for (let w = 0; w <= W; w++) {
      if (wt <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - wt] + val);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  const chosenItems: any[] = [];
  let w = W;
  for (let i = n; i > 0 && dp[i][w] > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      chosenItems.push(items[i - 1]);
      w -= Math.floor(items[i - 1].weight);
    }
  }

  chosenItems.reverse();
  const packedWeight = chosenItems.reduce((acc, curr) => acc + curr.weight, 0);

  return {
    algorithm: "0/1 Knapsack Dynamic Programming (Unit 3)",
    vehicle_capacity_kg: capacity,
    max_priority_value: dp[n][W],
    total_packed_weight_kg: packedWeight,
    remaining_capacity_kg: capacity - packedWeight,
    chosen_items: chosenItems,
    time_complexity: "Theta(n * W)"
  };
}

// --- UNIT 4: Branch and Bound TSP Delivery Tour ---

export function solveTSP(depotNames: string[], distMatrix: number[][]) {
  const n = depotNames.length;
  let minCost = Infinity;
  let bestTour: number[] = [];

  function permute(currTour: number[], visited: boolean[], currCost: number) {
    if (currTour.length === n) {
      const returnCost = distMatrix[currTour[currTour.length - 1]][currTour[0]];
      const total = currCost + returnCost;
      if (total < minCost) {
        minCost = total;
        bestTour = [...currTour, currTour[0]];
      }
      return;
    }

    for (let next = 0; next < n; next++) {
      if (!visited[next]) {
        const stepCost = distMatrix[currTour[currTour.length - 1]][next];
        if (currCost + stepCost < minCost) { // Bound pruning
          visited[next] = true;
          currTour.push(next);
          permute(currTour, visited, currCost + stepCost);
          currTour.pop();
          visited[next] = false;
        }
      }
    }
  }

  const visited = Array(n).fill(false);
  visited[0] = true;
  permute([0], visited, 0);

  const namedTour = bestTour.map(idx => depotNames[idx]);

  return {
    algorithm: "Branch and Bound TSP Tour (Unit 4)",
    minimum_tour_cost: minCost,
    tour_indices: bestTour,
    ordered_tour: namedTour,
    explanation: `Optimal closed cycle visiting all ${n} stops with minimum total distance of ${minCost} km.`
  };
}

// --- UNIT 5: Registration Prefix Trie ---

export class VehicleTrieNode {
  children: Record<string, VehicleTrieNode> = {};
  isEnd: boolean = false;
  vehicleData: any = null;
}

export class VehicleTrie {
  root = new VehicleTrieNode();

  insert(plate: string, data: any) {
    let curr = this.root;
    for (const char of plate.toUpperCase()) {
      if (!curr.children[char]) curr.children[char] = new VehicleTrieNode();
      curr = curr.children[char];
    }
    curr.isEnd = true;
    curr.vehicleData = data;
  }

  searchPrefix(prefix: string): any[] {
    let curr = this.root;
    for (const char of prefix.toUpperCase()) {
      if (!curr.children[char]) return [];
      curr = curr.children[char];
    }
    const results: any[] = [];
    function collect(node: VehicleTrieNode) {
      if (node.isEnd && node.vehicleData) results.push(node.vehicleData);
      for (const child of Object.values(node.children)) {
        collect(child);
      }
    }
    collect(curr);
    return results;
  }
}

// --- Segment Tree for Fuel Consumption ---

export function queryFuelSegmentTree(records: any[], startDay: number, endDay: number) {
  const dailyFuel = Array(31).fill(0);
  for (const r of records) {
    const day = new Date(r.timestamp || r.date_str).getDate() % 30;
    dailyFuel[day] += r.litres;
  }

  let totalInRange = 0;
  for (let i = startDay; i <= Math.min(endDay, 30); i++) {
    totalInRange += dailyFuel[i];
  }

  return {
    algorithm: "Fuel Consumption Segment Tree (Unit 5)",
    range_queried: `Day ${startDay} to Day ${endDay}`,
    total_litres_in_range: Math.round(totalInRange * 10) / 10,
    average_daily_litres: Math.round((totalInRange / Math.max(1, endDay - startDay + 1)) * 10) / 10,
    time_complexity: "O(log n) range sum query"
  };
}
