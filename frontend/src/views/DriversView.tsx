import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  CreditCard,
  Calendar,
  CheckCircle,
  Truck,
  ShieldCheck,
  X
} from 'lucide-react';
import { Driver, api } from '../api';

interface DriversViewProps {
  drivers: Driver[];
  onRefresh: () => void;
}

export const DriversView: React.FC<DriversViewProps> = ({ drivers, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    driver_code: '',
    full_name: '',
    phone: '',
    licence_no: '',
    licence_expiry: '2028-12-31',
    status: 'available',
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await api.createDriver(formData);
      setIsAddModalOpen(false);
      onRefresh();
      setFormData({
        driver_code: '',
        full_name: '',
        phone: '',
        licence_no: '',
        licence_expiry: '2028-12-31',
        status: 'available',
        notes: '',
      });
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleDeactivate = async (id: number, name: string) => {
    if (confirm(`Deactivate driver ${name}?`)) {
      try {
        await api.deactivateDriver(id);
        onRefresh();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.driver_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.licence_no.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-white p-3.5 rounded-lg border border-warmgrey flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
            <input
              type="text"
              placeholder="Search driver by name, code, or licence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-ivory pl-8 pr-3 py-1.5 rounded text-xs text-charcoal border border-warmgrey focus:outline-none focus:border-terracotta"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            {['all', 'available', 'on_trip', 'inactive'].map((st) => (
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
            onClick={() => setIsAddModalOpen(true)}
            className="bg-terracotta hover:bg-terracotta-hover text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm ml-2"
          >
            <Plus size={14} />
            <span>Add Driver</span>
          </button>
        </div>
      </div>

      {/* Driver Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDrivers.map((driver) => (
          <div
            key={driver.id}
            className="bg-white p-4 rounded-lg border border-warmgrey shadow-sm flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate uppercase">
                    {driver.driver_code}
                  </span>
                  <h3 className="text-sm font-bold text-charcoal">{driver.full_name}</h3>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    driver.status === 'on_trip'
                      ? 'bg-terracotta/10 text-terracotta border border-terracotta/30'
                      : driver.status === 'inactive'
                      ? 'bg-slate/10 text-slate border border-slate/30'
                      : 'bg-operational-success/10 text-operational-success border border-operational-success/30'
                  }`}
                >
                  {driver.status.replace('_', ' ')}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate">
                  <Phone size={13} className="shrink-0" />
                  <span className="font-medium text-charcoal">{driver.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate">
                  <CreditCard size={13} className="shrink-0" />
                  <span className="font-mono text-[11px] text-charcoal">{driver.licence_no}</span>
                </div>
                <div className="flex items-center gap-2 text-slate text-[11px]">
                  <Calendar size={13} className="shrink-0" />
                  <span>Expires: {driver.licence_expiry}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-warmgrey flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-operational-success font-semibold text-[11px]">
                <ShieldCheck size={14} />
                <span>{driver.safety_score}% Safety</span>
              </div>
              <div className="text-slate text-[11px]">
                <strong>{driver.total_trips}</strong> completed trips
              </div>
            </div>

            {driver.assigned_vehicle && (
              <div className="p-2 rounded bg-ivory text-[11px] flex items-center gap-2 border border-warmgrey/70">
                <Truck size={13} className="text-forest shrink-0" />
                <span className="truncate">
                  Assigned: <strong>{driver.assigned_vehicle.vehicle_code}</strong> ({driver.assigned_vehicle.registration_no})
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Driver Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-warmgrey shadow-xl max-w-md w-full">
            <div className="px-5 py-3 border-b border-warmgrey flex items-center justify-between bg-ivory">
              <h3 className="text-xs font-bold text-charcoal">Enroll Professional Driver</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate hover:text-charcoal">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="p-5 space-y-3 text-xs">
              {formError && (
                <div className="p-2 rounded bg-operational-critical/10 text-operational-critical text-[11px]">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[11px] text-slate mb-1">Driver Code</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. DRV-006"
                  value={formData.driver_code}
                  onChange={(e) => setFormData({ ...formData, driver_code: e.target.value })}
                  className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey uppercase font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate mb-1">Full Legal Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Harpreet Singh"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate mb-1">Contact Phone</label>
                <input
                  required
                  type="text"
                  placeholder="+91 98XXX XXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate mb-1">Licence Number</label>
                  <input
                    required
                    type="text"
                    placeholder="DL-142021..."
                    value={formData.licence_no}
                    onChange={(e) => setFormData({ ...formData, licence_no: e.target.value })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate mb-1">Licence Expiry</label>
                  <input
                    type="date"
                    value={formData.licence_expiry}
                    onChange={(e) => setFormData({ ...formData, licence_expiry: e.target.value })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey text-[11px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-warmgrey">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-warmgrey text-slate hover:bg-ivory"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-terracotta hover:bg-terracotta-hover text-white px-4 py-1.5 rounded font-semibold"
                >
                  Enroll Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
