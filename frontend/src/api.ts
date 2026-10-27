/**
 * FleetOps API Client & TypeScript Interfaces
 */

const API_BASE = "/api";

export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: 'fleet_manager' | 'dispatcher' | 'technician' | 'driver';
  organization_id: number;
}

export interface Depot {
  id: number;
  code: string;
  name: string;
  location_name: string;
  latitude: number;
  longitude: number;
  capacity: number;
}

export interface Corridor {
  id: number;
  from: string;
  to: string;
  distance_km: number;
  corridor_name: string;
  estimated_minutes: number;
}

export interface Vehicle {
  id: number;
  vehicle_code: string;
  registration_no: string;
  vehicle_type: string;
  make_model: string;
  year: number;
  load_capacity_kg: number;
  odometer_km: number;
  fuel_type: string;
  expected_mileage: number;
  service_interval_km: number;
  last_service_km: number;
  status: 'active' | 'available' | 'maintenance' | 'archived';
  insurance_expiry?: string;
  permit_expiry?: string;
  pollution_expiry?: string;
  notes?: string;
  home_depot?: { id: number; code: string; name: string };
  assigned_driver?: { id: number; driver_code: string; full_name: string; phone: string };
  risk_info?: {
    risk_score: number;
    urgency: number;
    status_label: string;
    km_since_service: number;
    service_interval: number;
    risk_factors: string[];
  };
  latest_telemetry?: {
    latitude: number;
    longitude: number;
    speed_kmph: number;
    fuel_level_l: number;
    status_text: string;
    timestamp: string;
    is_simulated: boolean;
  };
}

export interface Driver {
  id: number;
  driver_code: string;
  full_name: string;
  phone: string;
  licence_no: string;
  licence_expiry: string;
  status: 'available' | 'on_trip' | 'inactive';
  total_trips: number;
  safety_score: number;
  incidents_count: number;
  notes?: string;
  assigned_vehicle?: {
    id: number;
    vehicle_code: string;
    registration_no: string;
    make_model: string;
  };
}

export interface Trip {
  id: number;
  trip_code: string;
  origin_depot_code: string;
  destination_depot_code: string;
  route_stops: string[];
  vehicle?: {
    id: number;
    vehicle_code: string;
    registration_no: string;
    make_model: string;
    capacity_kg: number;
    status: string;
  };
  driver?: {
    id: number;
    driver_code: string;
    full_name: string;
    phone: string;
    licence_no: string;
  };
  planned_departure: string;
  expected_arrival: string;
  actual_departure?: string;
  actual_arrival?: string;
  cargo_description: string;
  cargo_weight_kg: number;
  distance_km: number;
  status: 'planned' | 'assigned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  fuel_cost: number;
  notes?: string;
}

export interface FuelRecord {
  id: number;
  vehicle_id: number;
  vehicle_code?: string;
  registration_no?: string;
  trip_id?: number;
  date_str: string;
  timestamp: string;
  odometer_km: number;
  litres: number;
  total_cost: number;
  price_per_litre: number;
  fuel_station: string;
  payment_ref?: string;
  mileage_calculated?: number;
  cost_per_km?: number;
  anomaly_flag: boolean;
  anomaly_details?: string;
  notes?: string;
}

export interface MaintenanceRecord {
  id: number;
  vehicle_id: number;
  vehicle_code?: string;
  registration_no?: string;
  work_order_no: string;
  category: string;
  description: string;
  service_date: string;
  odometer_km: number;
  estimated_cost: number;
  actual_cost: number;
  workshop_name: string;
  downtime_hours: number;
  parts_notes?: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  urgency: number;
}

export interface MaintenanceAlert {
  id: number;
  vehicle_id: number;
  vehicle_code?: string;
  registration_no?: string;
  urgency: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  reason: string;
  evidence?: string;
  status: 'open' | 'acknowledged' | 'resolved';
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface KPISummary {
  total_vehicles: number;
  active_vehicles: number;
  available_vehicles: number;
  maintenance_vehicles: number;
  active_trips: number;
  delayed_trips: number;
  total_trips: number;
  critical_alerts: number;
  maintenance_due_soon: number;
  total_fuel_expenditure_inr: number;
  total_litres_consumed: number;
  estimated_emissions_kg_co2: number;
  emissions_methodology: string;
}

// Token helper
export const getToken = () => localStorage.getItem("fleetops_token");
export const setToken = (t: string) => localStorage.setItem("fleetops_token", t);
export const removeToken = () => localStorage.removeItem("fleetops_token");

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errDetail = "API Error";
    try {
      const errJson = await res.json();
      errDetail = errJson.detail || errJson.message || errDetail;
    } catch {
      errDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errDetail);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  getMe: () => request("/auth/me"),
  switchDemoRole: (role: string) =>
    request("/auth/switch-demo-role", { method: "POST", body: JSON.stringify({ role }) }),
  getUsers: () => request("/auth/users"),

  // Vehicles
  getVehicles: (params: { query?: string; status?: string; depot_id?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.query) q.append("query", params.query);
    if (params.status) q.append("status", params.status);
    if (params.depot_id) q.append("depot_id", params.depot_id.toString());
    return request(`/vehicles?${q.toString()}`);
  },
  getVehicle: (id: number) => request(`/vehicles/${id}`),
  createVehicle: (data: any) => request("/vehicles", { method: "POST", body: JSON.stringify(data) }),
  updateVehicle: (id: number, data: any) => request(`/vehicles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  archiveVehicle: (id: number) => request(`/vehicles/${id}`, { method: "DELETE" }),
  searchTrie: (prefix: string) => request(`/vehicles/search/trie?prefix=${encodeURIComponent(prefix)}`),
  searchTree: (id: number) => request(`/vehicles/search/tree?vehicle_id=${id}`),
  getDocumentExpirations: () => request("/vehicles/document-expirations"),

  // Drivers
  getDrivers: (params: { query?: string; status?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.query) q.append("query", params.query);
    if (params.status) q.append("status", params.status);
    return request(`/drivers?${q.toString()}`);
  },
  getDriver: (id: number) => request(`/drivers/${id}`),
  createDriver: (data: any) => request("/drivers", { method: "POST", body: JSON.stringify(data) }),
  updateDriver: (id: number, data: any) => request(`/drivers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deactivateDriver: (id: number) => request(`/drivers/${id}`, { method: "DELETE" }),

  // Trips
  getTrips: (params: { status?: string; vehicle_id?: number; driver_id?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.append("status", params.status);
    if (params.vehicle_id) q.append("vehicle_id", params.vehicle_id.toString());
    if (params.driver_id) q.append("driver_id", params.driver_id.toString());
    return request(`/trips?${q.toString()}`);
  },
  getTrip: (id: number) => request(`/trips/${id}`),
  createTrip: (data: any) => request("/trips", { method: "POST", body: JSON.stringify(data) }),
  transitionTrip: (id: number, status: string, notes?: string) =>
    request(`/trips/${id}/transition`, { method: "POST", body: JSON.stringify({ status, notes }) }),

  // DSA & Route Optimization
  getDepots: () => request("/dsa/depots"),
  getCorridors: () => request("/dsa/corridors"),
  compareRoutes: (origin: string, destination: string) =>
    request(`/dsa/route-compare?origin=${origin}&destination=${destination}`),
  getClusters: () => request("/dsa/clusters"),
  getMST: () => request("/dsa/mst"),
  planKnapsackLoad: (data: { vehicle_capacity_kg: number; items: any[] }) =>
    request("/dsa/knapsack-load", { method: "POST", body: JSON.stringify(data) }),
  computeTSPTour: (data: { depot_indices: string[]; dist_matrix: number[][] }) =>
    request("/dsa/delivery-tour", { method: "POST", body: JSON.stringify(data) }),

  // Fuel
  getFuelRecords: (params: { vehicle_id?: number; anomaly_only?: boolean } = {}) => {
    const q = new URLSearchParams();
    if (params.vehicle_id) q.append("vehicle_id", params.vehicle_id.toString());
    if (params.anomaly_only) q.append("anomaly_only", "true");
    return request(`/fuel?${q.toString()}`);
  },
  addFuelEntry: (data: any) => request("/fuel", { method: "POST", body: JSON.stringify(data) }),
  getSegmentTreeQuery: (start_day: number, end_day: number) =>
    request(`/fuel/segment-tree-query?start_day=${start_day}&end_day=${end_day}`),
  getFuelAnomalies: () => request("/fuel/anomalies"),

  // Maintenance
  getWorkOrders: (params: { vehicle_id?: number; status?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.vehicle_id) q.append("vehicle_id", params.vehicle_id.toString());
    if (params.status) q.append("status", params.status);
    return request(`/maintenance/work-orders?${q.toString()}`);
  },
  createWorkOrder: (data: any) => request("/maintenance/work-orders", { method: "POST", body: JSON.stringify(data) }),
  completeWorkOrder: (id: number, actual_cost: number) =>
    request(`/maintenance/work-orders/${id}/complete?actual_cost=${actual_cost}`, { method: "POST" }),
  getMaxHeapQueue: () => request("/maintenance/max-heap-queue"),
  allocateWorkshop: (data: { available_hours: number; jobs: any[] }) =>
    request("/maintenance/allocate-workshop", { method: "POST", body: JSON.stringify(data) }),

  // Alerts
  getAlerts: (params: { status?: string; priority?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.append("status", params.status);
    if (params.priority) q.append("priority", params.priority);
    return request(`/alerts?${q.toString()}`);
  },
  createAlert: (data: any) => request("/alerts", { method: "POST", body: JSON.stringify(data) }),
  acknowledgeAlert: (id: number) => request(`/alerts/${id}/acknowledge`, { method: "POST" }),
  resolveAlert: (id: number, resolution_notes: string) =>
    request(`/alerts/${id}/resolve`, { method: "POST", body: JSON.stringify({ resolution_notes }) }),

  // Reports
  getKPISummary: (): Promise<KPISummary> => request("/reports/kpi-summary"),
  getAnalyticsData: () => request("/reports/analytics"),
  getExportCSVUrl: (entity: 'trips' | 'vehicles' | 'fuel') =>
    `${API_BASE}/reports/export-csv?entity=${entity}`,

  // Simulator
  getSimulatorStatus: () => request("/simulator/status"),
  toggleSimulator: () => request("/simulator/toggle", { method: "POST" }),
  setSpeed: (multiplier: number) => request(`/simulator/speed?multiplier=${multiplier}`, { method: "POST" }),
  triggerTick: () => request("/simulator/tick", { method: "POST" }),

  // Settings
  getSettings: () => request("/settings"),
  reseedDatabase: () => request("/settings/reseed", { method: "POST" }),
  getAuditLogs: (limit = 50) => request(`/settings/audit-logs?limit=${limit}`),
};
