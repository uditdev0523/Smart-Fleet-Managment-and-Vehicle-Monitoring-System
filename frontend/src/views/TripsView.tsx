import React, { useState } from 'react';
import {
  Send,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Truck,
  User,
  ArrowRight,
  X
} from 'lucide-react';
import { Trip, Vehicle, Driver, api } from '../api';

interface TripsViewProps {
  trips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onRefresh: () => void;
}

export const TripsView: React.FC<TripsViewProps> = ({ trips, vehicles, drivers, onRefresh }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  // Dispatch Form
  const [formData, setFormData] = useState({
    trip_code: '',
    origin_depot_code: 'D1',
    destination_depot_code: 'D4',
    vehicle_id: vehicles[0]?.id || 1,
    driver_id: drivers[0]?.id || 1,
    planned_departure: new Date().toISOString().slice(0, 16),
    expected_arrival: new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 16),
    cargo_description: '',
    cargo_weight_kg: 5000,
    distance_km: 8.0,
    notes: '',
  });
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Transition Dialog
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [transitionNotes, setTransitionNotes] = useState('');

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatchError(null);
    try {
      await api.createTrip(formData);
      setIsDispatchModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setDispatchError(err.message);
    }
  };

  const handleStatusTransition = async (tripId: number, newStatus: string) => {
    try {
      await api.transitionTrip(tripId, newStatus, transitionNotes || undefined);
      setSelectedTrip(null);
      setTransitionNotes('');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredTrips = trips.filter((t) => {
    const matchesSearch =
      t.trip_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.cargo_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.vehicle?.vehicle_code || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white p-3.5 rounded-lg border border-warmgrey flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
            <input
              type="text"
              placeholder="Search by trip code, cargo, or vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-ivory pl-8 pr-3 py-1.5 rounded text-xs text-charcoal border border-warmgrey focus:outline-none focus:border-terracotta"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            {['all', 'in_progress', 'assigned', 'planned', 'completed', 'delayed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize ${
                  statusFilter === st
                    ? 'bg-forest text-white'
                    : 'bg-ivory text-charcoal border border-warmgrey hover:bg-ivory-dark'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setFormData({
                trip_code: `TRP-2026-${String(trips.length + 1).padStart(3, '0')}`,
                origin_depot_code: 'D1',
                destination_depot_code: 'D4',
                vehicle_id: vehicles.find((v) => v.status === 'available')?.id || vehicles[0]?.id || 1,
                driver_id: drivers.find((d) => d.status === 'available')?.id || drivers[0]?.id || 1,
                planned_departure: new Date().toISOString().slice(0, 16),
                expected_arrival: new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 16),
                cargo_description: 'Industrial Equipment Consignment',
                cargo_weight_kg: 8500,
                distance_km: 8.0,
                notes: '',
              });
              setIsDispatchModalOpen(true);
            }}
            className="bg-terracotta hover:bg-terracotta-hover text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm ml-2"
          >
            <Plus size={14} />
            <span>Dispatch Trip</span>
          </button>
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-white rounded-lg border border-warmgrey shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory border-b border-warmgrey text-slate text-[11px] font-semibold">
              <tr>
                <th className="py-2.5 px-3">Trip Code</th>
                <th className="py-2.5 px-3">Corridor</th>
                <th className="py-2.5 px-3">Vehicle & Driver</th>
                <th className="py-2.5 px-3">Cargo Details</th>
                <th className="py-2.5 px-3">Planned Departure</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">State Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmgrey">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate text-xs">
                    No trips found for selected filter.
                  </td>
                </tr>
              ) : (
                filteredTrips.map((t) => (
                  <tr key={t.id} className="hover:bg-ivory/50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-charcoal">{t.trip_code}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-charcoal flex items-center gap-1.5">
                        <span>{t.origin_depot_code}</span>
                        <ArrowRight size={11} className="text-terracotta" />
                        <span>{t.destination_depot_code}</span>
                      </div>
                      <div className="text-[10px] text-slate">{t.distance_km} km</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-charcoal flex items-center gap-1">
                        <Truck size={12} className="text-slate" />
                        <span>{t.vehicle?.vehicle_code} ({t.vehicle?.registration_no})</span>
                      </div>
                      <div className="text-[10px] text-slate flex items-center gap-1 mt-0.5">
                        <User size={11} />
                        <span>{t.driver?.full_name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-charcoal font-medium">{t.cargo_description}</div>
                      <div className="text-[10px] text-slate">{t.cargo_weight_kg.toLocaleString('en-IN')} kg</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate">
                      {new Date(t.planned_departure).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.status === 'in_progress'
                            ? 'bg-operational-success/10 text-operational-success border border-operational-success/30'
                            : t.status === 'delayed'
                            ? 'bg-operational-warning/10 text-operational-warning border border-operational-warning/30'
                            : t.status === 'completed'
                            ? 'bg-sage-light text-forest border border-sage/40'
                            : t.status === 'cancelled'
                            ? 'bg-slate/10 text-slate border border-slate/30'
                            : 'bg-ivory text-charcoal border border-warmgrey'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1">
                      {t.status === 'assigned' && (
                        <button
                          onClick={() => handleStatusTransition(t.id, 'in_progress')}
                          className="px-2 py-1 rounded bg-operational-success text-white text-[10px] font-semibold hover:bg-forest transition-colors shadow-2xs"
                        >
                          Start Trip
                        </button>
                      )}
                      {t.status === 'in_progress' && (
                        <>
                          <button
                            onClick={() => handleStatusTransition(t.id, 'completed')}
                            className="px-2 py-1 rounded bg-forest text-white text-[10px] font-semibold hover:bg-forest-light transition-colors shadow-2xs"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleStatusTransition(t.id, 'delayed')}
                            className="px-2 py-1 rounded bg-operational-warning/20 text-operational-warning border border-operational-warning/30 text-[10px] font-semibold hover:bg-operational-warning/30"
                          >
                            Delay
                          </button>
                        </>
                      )}
                      {t.status === 'delayed' && (
                        <button
                          onClick={() => handleStatusTransition(t.id, 'completed')}
                          className="px-2 py-1 rounded bg-forest text-white text-[10px] font-semibold hover:bg-forest-light"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Modal with Conflict Validation */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-warmgrey shadow-xl max-w-lg w-full">
            <div className="px-5 py-3 border-b border-warmgrey flex items-center justify-between bg-ivory">
              <h3 className="text-xs font-bold text-charcoal">Dispatch New Corridor Trip</h3>
              <button onClick={() => setIsDispatchModalOpen(false)} className="text-slate hover:text-charcoal">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="p-5 space-y-3 text-xs">
              {dispatchError && (
                <div className="p-2.5 rounded bg-operational-critical/10 text-operational-critical text-[11px] border border-operational-critical/20 flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <div>
                    <strong>Assignment Conflict:</strong> {dispatchError}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate mb-1">Trip Code</label>
                  <input
                    required
                    type="text"
                    value={formData.trip_code}
                    onChange={(e) => setFormData({ ...formData, trip_code: e.target.value })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate mb-1">Estimated Distance (km)</label>
                  <input
                    type="number"
                    value={formData.distance_km}
                    onChange={(e) => setFormData({ ...formData, distance_km: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate mb-1">Origin Depot</label>
                  <select
                    value={formData.origin_depot_code}
                    onChange={(e) => setFormData({ ...formData, origin_depot_code: e.target.value })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey font-semibold"
                  >
                    <option value="D1">D1 - Greater Noida</option>
                    <option value="D2">D2 - Noida Sector 62</option>
                    <option value="D3">D3 - Ghaziabad Terminal</option>
                    <option value="D4">D4 - Delhi Anand Vihar</option>
                    <option value="D5">D5 - Meerut Transport Nagar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate mb-1">Destination Depot</label>
                  <select
                    value={formData.destination_depot_code}
                    onChange={(e) => setFormData({ ...formData, destination_depot_code: e.target.value })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey font-semibold"
                  >
                    <option value="D4">D4 - Delhi Anand Vihar</option>
                    <option value="D5">D5 - Meerut Transport Nagar</option>
                    <option value="D1">D1 - Greater Noida</option>
                    <option value="D2">D2 - Noida Sector 62</option>
                    <option value="D3">D3 - Ghaziabad Terminal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate mb-1">Assign Vehicle</label>
                  <select
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData({ ...formData, vehicle_id: parseInt(e.target.value) })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicle_code} ({v.registration_no}) - {v.status} (Cap: {v.load_capacity_kg}kg)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate mb-1">Assign Driver</label>
                  <select
                    value={formData.driver_id}
                    onChange={(e) => setFormData({ ...formData, driver_id: parseInt(e.target.value) })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey"
                  >
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name} ({d.driver_code}) - {d.status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate mb-1">Cargo Description</label>
                  <input
                    required
                    type="text"
                    value={formData.cargo_description}
                    onChange={(e) => setFormData({ ...formData, cargo_description: e.target.value })}
                    placeholder="e.g. Electrical Transformers"
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate mb-1">Cargo Weight (kg)</label>
                  <input
                    required
                    type="number"
                    value={formData.cargo_weight_kg}
                    onChange={(e) => setFormData({ ...formData, cargo_weight_kg: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-warmgrey">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-warmgrey text-slate hover:bg-ivory"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-terracotta hover:bg-terracotta-hover text-white px-4 py-1.5 rounded font-semibold shadow-xs"
                >
                  Confirm & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
