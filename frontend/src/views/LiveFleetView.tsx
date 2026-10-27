import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Play,
  Pause,
  RotateCw,
  Gauge,
  Fuel,
  MapPin,
  Truck,
  Eye,
  Info,
  Compass,
  ArrowRight
} from 'lucide-react';
import { Vehicle, Depot, Corridor, api } from '../api';

interface LiveFleetViewProps {
  vehicles: Vehicle[];
  depots: Depot[];
  corridors: Corridor[];
  isSimulating: boolean;
  onToggleSimulator: () => void;
  onTriggerTick: () => void;
  isTicking: boolean;
  onSelectVehicle: (id: number) => void;
}

export const LiveFleetView: React.FC<LiveFleetViewProps> = ({
  vehicles,
  depots,
  corridors,
  isSimulating,
  onToggleSimulator,
  onTriggerTick,
  isTicking,
  onSelectVehicle,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const polylinesRef = useRef<L.Polyline[]>([]);

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(vehicles[0] || null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [simSpeed, setSimSpeed] = useState<number>(1.0);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on NCR (Delhi-Noida-Greater Noida corridor)
    const map = L.map(mapContainerRef.current, {
      center: [28.62, 77.45],
      zoom: 10,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | FleetOps GIS',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Draw Corridors
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || depots.length === 0 || corridors.length === 0) return;

    // Clear old polylines
    polylinesRef.current.forEach((p) => p.remove());
    polylinesRef.current = [];

    const depotMap = new Map(depots.map((d) => [d.code, [d.latitude, d.longitude] as [number, number]]));

    corridors.forEach((c) => {
      const p1 = depotMap.get(c.from);
      const p2 = depotMap.get(c.to);
      if (p1 && p2) {
        const line = L.polyline([p1, p2], {
          color: '#203C35',
          weight: 2.5,
          opacity: 0.45,
          dashArray: '5, 8',
        }).addTo(map);
        line.bindTooltip(`${c.from} ↔ ${c.to} (${c.distance_km} km)`, { sticky: true });
        polylinesRef.current.push(line);
      }
    });
  }, [depots, corridors]);

  // Draw Depots & Vehicle Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Render Depots
    depots.forEach((d) => {
      const depotKey = `depot_${d.code}`;
      if (!markersRef.current[depotKey]) {
        const depotIcon = L.divIcon({
          className: 'custom-depot-pin',
          html: `<span>${d.code}</span>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
        const marker = L.marker([d.latitude, d.longitude], { icon: depotIcon }).addTo(map);
        marker.bindPopup(`
          <div style="padding: 10px; font-size: 12px; min-width: 170px;">
            <div style="font-weight: 700; color: #203C35;">${d.name} (${d.code})</div>
            <div style="color: #737A75; font-size: 11px; margin-top: 2px;">${d.location_name}</div>
            <div style="margin-top: 6px; font-weight: 600; color: #252A28;">Capacity: ${d.capacity} vehicles</div>
          </div>
        `);
        markersRef.current[depotKey] = marker;
      }
    });

    // Render / Update Vehicles
    const filtered = vehicles.filter((v) => {
      if (filterStatus === 'all') return true;
      return v.status === filterStatus;
    });

    filtered.forEach((v) => {
      const vKey = `veh_${v.id}`;
      const lat = v.latest_telemetry?.latitude ?? (v.home_depot ? 28.5 : 28.5);
      const lng = v.latest_telemetry?.longitude ?? (v.home_depot ? 77.4 : 77.4);

      const color =
        v.status === 'active'
          ? '#B9674B'
          : v.status === 'maintenance'
          ? '#B54E43'
          : '#39765A';

      const vehIcon = L.divIcon({
        className: 'custom-vehicle-pin',
        html: `<div style="background-color: ${color}; width: 100%; height: 100%; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">${v.vehicle_code}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      if (markersRef.current[vKey]) {
        markersRef.current[vKey].setLatLng([lat, lng]);
        markersRef.current[vKey].setIcon(vehIcon);
      } else {
        const marker = L.marker([lat, lng], { icon: vehIcon }).addTo(map);
        marker.on('click', () => {
          setSelectedVehicle(v);
        });
        marker.bindTooltip(`${v.vehicle_code} • ${v.registration_no} (${v.status})`);
        markersRef.current[vKey] = marker;
      }
    });
  }, [vehicles, depots, filterStatus]);

  const handleSpeedChange = async (speed: number) => {
    setSimSpeed(speed);
    await api.setSpeed(speed);
  };

  return (
    <div className="space-y-4">
      {/* Simulation Controls & Filter Header */}
      <div className="bg-white p-3.5 rounded-lg border border-warmgrey flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Status filters */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate font-medium mr-1">Filter Map:</span>
          {['all', 'active', 'available', 'maintenance'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize transition-all ${
                filterStatus === st
                  ? 'bg-forest text-white shadow-xs'
                  : 'bg-ivory text-charcoal border border-warmgrey hover:bg-ivory-dark'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Deterministic Simulation Controller */}
        <div className="flex items-center gap-2 bg-ivory p-1.5 rounded-md border border-warmgrey text-xs">
          <div className="flex items-center gap-1 text-[11px] font-bold text-charcoal mr-1">
            <span
              className={`w-2 h-2 rounded-full ${
                isSimulating ? 'bg-operational-success animate-pulse' : 'bg-operational-warning'
              }`}
            />
            <span>SIMULATED GPS:</span>
          </div>

          <button
            onClick={onToggleSimulator}
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 ${
              isSimulating ? 'bg-operational-success text-white' : 'bg-white text-slate border border-warmgrey'
            }`}
          >
            {isSimulating ? <Pause size={12} /> : <Play size={12} />}
            <span>{isSimulating ? 'Active' : 'Paused'}</span>
          </button>

          <button
            onClick={onTriggerTick}
            disabled={isTicking}
            className="px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 bg-white text-terracotta border border-warmgrey hover:bg-ivory-light"
            title="Step simulation forward by 1 tick"
          >
            <RotateCw size={12} className={isTicking ? 'animate-spin' : ''} />
            <span>Step</span>
          </button>

          <div className="flex items-center gap-1 ml-1 text-[11px]">
            <span className="text-slate">Speed:</span>
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => handleSpeedChange(spd)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  simSpeed === spd
                    ? 'bg-terracotta text-white'
                    : 'bg-white text-charcoal border border-warmgrey'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Map + Inspection Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Leaflet Map Surface */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-warmgrey overflow-hidden shadow-sm relative">
          {/* Map canvas */}
          <div ref={mapContainerRef} style={{ height: '560px', width: '100%', zIndex: 1 }} />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-xs p-2.5 rounded-md border border-warmgrey shadow-md text-[10px] space-y-1">
            <div className="font-bold text-charcoal mb-1">NCR Fleet Network Legend</div>
            <div className="flex items-center gap-2 text-slate">
              <span className="w-2.5 h-2.5 rounded-full bg-forest inline-block" />
              <span>Depot Vertex (D1 - D5)</span>
            </div>
            <div className="flex items-center gap-2 text-slate">
              <span className="w-2.5 h-2.5 rounded-full bg-terracotta inline-block" />
              <span>Active In-Transit Vehicle</span>
            </div>
            <div className="flex items-center gap-2 text-slate">
              <span className="w-2.5 h-2.5 rounded-full bg-operational-success inline-block" />
              <span>Available Vehicle (Staged)</span>
            </div>
            <div className="flex items-center gap-2 text-slate">
              <span className="w-2.5 h-2.5 rounded-full bg-operational-critical inline-block" />
              <span>In Maintenance Bay</span>
            </div>
          </div>
        </div>

        {/* Selected Vehicle Telemetry Card */}
        <div className="bg-white rounded-lg border border-warmgrey p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-warmgrey mb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate">Selected Unit</span>
                <h3 className="text-sm font-bold text-charcoal">
                  {selectedVehicle ? `${selectedVehicle.vehicle_code} (${selectedVehicle.registration_no})` : 'Select a Vehicle'}
                </h3>
              </div>
              {selectedVehicle && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedVehicle.status === 'active'
                      ? 'bg-terracotta/10 text-terracotta border border-terracotta/30'
                      : selectedVehicle.status === 'maintenance'
                      ? 'bg-operational-critical/10 text-operational-critical border border-operational-critical/30'
                      : 'bg-operational-success/10 text-operational-success border border-operational-success/30'
                  }`}
                >
                  {selectedVehicle.status}
                </span>
              )}
            </div>

            {selectedVehicle ? (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[11px] text-slate">Model & Specification</div>
                  <div className="font-semibold text-charcoal">{selectedVehicle.make_model}</div>
                  <div className="text-[11px] text-slate-light">
                    {selectedVehicle.vehicle_type} • {selectedVehicle.year}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-warmgrey">
                  <div>
                    <div className="text-[10px] text-slate flex items-center gap-1">
                      <Gauge size={12} /> Speed
                    </div>
                    <div className="font-bold text-charcoal text-sm">
                      {selectedVehicle.latest_telemetry?.speed_kmph ?? 0} km/h
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate flex items-center gap-1">
                      <Fuel size={12} /> Fuel Level
                    </div>
                    <div className="font-bold text-charcoal text-sm">
                      {selectedVehicle.latest_telemetry?.fuel_level_l ?? 0} L
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-warmgrey">
                  <div className="text-[10px] text-slate flex items-center gap-1">
                    <Compass size={12} /> Current State & Corridor
                  </div>
                  <div className="font-medium text-charcoal mt-0.5 text-[11px]">
                    {selectedVehicle.latest_telemetry?.status_text || 'Available at Base'}
                  </div>
                </div>

                <div className="pt-2 border-t border-warmgrey">
                  <div className="text-[10px] text-slate">Assigned Driver</div>
                  <div className="font-semibold text-charcoal">
                    {selectedVehicle.assigned_driver?.full_name || 'Unassigned'}
                  </div>
                  {selectedVehicle.assigned_driver && (
                    <div className="text-[11px] text-slate">{selectedVehicle.assigned_driver.phone}</div>
                  )}
                </div>

                <div className="pt-2 border-t border-warmgrey">
                  <div className="text-[10px] text-slate">Coordinates</div>
                  <div className="font-mono text-[11px] text-charcoal">
                    {selectedVehicle.latest_telemetry?.latitude.toFixed(4)},{' '}
                    {selectedVehicle.latest_telemetry?.longitude.toFixed(4)}
                  </div>
                  <div className="text-[10px] text-operational-warning font-semibold mt-1">
                    SIMULATED GPS DATA
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate text-xs">
                Click any vehicle marker on the map to inspect its real-time telemetry.
              </div>
            )}
          </div>

          {selectedVehicle && (
            <button
              onClick={() => onSelectVehicle(selectedVehicle.id)}
              className="mt-4 w-full bg-forest text-white py-2 rounded text-xs font-semibold hover:bg-forest-light transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Full Vehicle Dossier</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
