import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  AlertCircle,
  FileText,
  Calendar,
  Wrench,
  Fuel,
  Send,
  Eye,
  Trash2,
  TreePine,
  Binary,
  X
} from 'lucide-react';
import { Vehicle, api } from '../api';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  onRefresh: () => void;
  selectedVehicleId?: number | null;
  onClearSelectedVehicle?: () => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  vehicles,
  onRefresh,
  selectedVehicleId,
  onClearSelectedVehicle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'inventory' | 'dsa_search' | 'expirations'>('inventory');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailVehicle, setDetailVehicle] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    vehicle_code: '',
    registration_no: '',
    vehicle_type: 'Heavy Commercial Truck (16T)',
    make_model: '',
    year: 2024,
    load_capacity_kg: 16000,
    odometer_km: 0,
    fuel_type: 'Diesel',
    expected_mileage: 4.5,
    service_interval_km: 10000,
    insurance_expiry: '2027-12-31',
    pollution_expiry: '2027-06-30',
    permit_expiry: '2028-12-31',
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // DSA Explorer states
  const [triePrefix, setTriePrefix] = useState('UP32');
  const [trieResults, setTrieResults] = useState<any | null>(null);
  const [treeQueryId, setTreeQueryId] = useState(1);
  const [treeResults, setTreeResults] = useState<any | null>(null);

  // Open detail view if selected from outside
  React.useEffect(() => {
    if (selectedVehicleId) {
      loadVehicleDetail(selectedVehicleId);
    }
  }, [selectedVehicleId]);

  const loadVehicleDetail = async (id: number) => {
    setIsLoadingDetail(true);
    try {
      const data = await api.getVehicle(id);
      setDetailVehicle(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await api.createVehicle(formData);
      setIsAddModalOpen(false);
      onRefresh();
      setFormData({
        vehicle_code: '',
        registration_no: '',
        vehicle_type: 'Heavy Commercial Truck (16T)',
        make_model: '',
        year: 2024,
        load_capacity_kg: 16000,
        odometer_km: 0,
        fuel_type: 'Diesel',
        expected_mileage: 4.5,
        service_interval_km: 10000,
        insurance_expiry: '2027-12-31',
        pollution_expiry: '2027-06-30',
        permit_expiry: '2028-12-31',
        notes: '',
      });
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleArchive = async (id: number, code: string) => {
    if (confirm(`Are you sure you want to archive vehicle ${code}? This will remove it from active dispatch.`)) {
      try {
        await api.archiveVehicle(id);
        onRefresh();
        if (detailVehicle?.id === id) setDetailVehicle(null);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleRunTrieSearch = async () => {
    try {
      const res = await api.searchTrie(triePrefix);
      setTrieResults(res);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRunTreeSearch = async () => {
    try {
      const res = await api.searchTree(treeQueryId);
      setTreeResults(res);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.registration_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vehicle_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.make_model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* View Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-warmgrey pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'inventory'
                ? 'bg-forest text-white'
                : 'text-slate hover:bg-ivory hover:text-charcoal'
            }`}
          >
            Vehicle Inventory ({vehicles.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('dsa_search');
              handleRunTrieSearch();
              handleRunTreeSearch();
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'dsa_search'
                ? 'bg-forest text-white'
                : 'text-slate hover:bg-ivory hover:text-charcoal'
            }`}
          >
            <TreePine size={13} />
            <span>DSA Lookup & Trie Search (Unit 1 & 5)</span>
          </button>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-terracotta hover:bg-terracotta-hover text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <Plus size={14} />
          <span>Add Vehicle</span>
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-3 rounded-lg border border-warmgrey flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
                <input
                  type="text"
                  placeholder="Search by registration number, code, or model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-ivory pl-8 pr-3 py-1.5 rounded text-xs text-charcoal border border-warmgrey focus:outline-none focus:border-terracotta"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate font-medium">Status:</span>
              {['all', 'active', 'available', 'maintenance'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize ${
                    statusFilter === st
                      ? 'bg-forest text-white'
                      : 'bg-ivory text-charcoal border border-warmgrey hover:bg-ivory-dark'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-warmgrey shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory border-b border-warmgrey text-slate text-[11px] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Vehicle Code</th>
                    <th className="py-2.5 px-3">Registration No</th>
                    <th className="py-2.5 px-3">Make & Model</th>
                    <th className="py-2.5 px-3">Capacity</th>
                    <th className="py-2.5 px-3">Odometer</th>
                    <th className="py-2.5 px-3">Assigned Driver</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Maintenance Risk</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warmgrey">
                  {filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate text-xs">
                        No vehicles matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredVehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-ivory/50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-charcoal">{v.vehicle_code}</td>
                        <td className="py-2.5 px-3 font-mono font-medium">{v.registration_no}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-charcoal">{v.make_model}</div>
                          <div className="text-[10px] text-slate">{v.vehicle_type}</div>
                        </td>
                        <td className="py-2.5 px-3">{(v.load_capacity_kg / 1000).toFixed(1)} T</td>
                        <td className="py-2.5 px-3">{v.odometer_km.toLocaleString('en-IN')} km</td>
                        <td className="py-2.5 px-3 text-slate">
                          {v.assigned_driver ? v.assigned_driver.full_name : <span className="italic">Unassigned</span>}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              v.status === 'active'
                                ? 'bg-terracotta/10 text-terracotta border border-terracotta/30'
                                : v.status === 'maintenance'
                                ? 'bg-operational-critical/10 text-operational-critical border border-operational-critical/30'
                                : 'bg-operational-success/10 text-operational-success border border-operational-success/30'
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {v.risk_info ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  v.risk_info.risk_score >= 70
                                    ? 'bg-operational-critical'
                                    : v.risk_info.risk_score >= 40
                                    ? 'bg-operational-warning'
                                    : 'bg-operational-success'
                                }`}
                              />
                              <span className="font-semibold text-[11px]">{v.risk_info.status_label}</span>
                              <span className="text-[10px] text-slate font-mono">({v.risk_info.risk_score})</span>
                            </div>
                          ) : (
                            <span className="text-slate italic">Nominal</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1">
                          <button
                            onClick={() => loadVehicleDetail(v.id)}
                            className="p-1.5 rounded hover:bg-ivory text-slate hover:text-charcoal"
                            title="Inspect Vehicle Dossier"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleArchive(v.id, v.vehicle_code)}
                            className="p-1.5 rounded hover:bg-operational-critical/10 text-slate hover:text-operational-critical"
                            title="Safely Archive Vehicle"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DSA Search Tab (Unit 1 & Unit 5 Verification) */}
      {activeTab === 'dsa_search' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Unit 5 Trie Prefix Search */}
          <div className="bg-white p-4 rounded-lg border border-warmgrey shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-warmgrey">
              <TreePine size={16} className="text-forest" />
              <div>
                <h3 className="text-xs font-bold text-charcoal">Registration Trie Prefix Search</h3>
                <div className="text-[10px] text-slate">Unit 5 Advanced Data Structure: O(L) prefix autocompletion</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={triePrefix}
                onChange={(e) => setTriePrefix(e.target.value.toUpperCase())}
                placeholder="e.g. UP32 or DL01"
                className="flex-1 bg-ivory px-3 py-1.5 rounded text-xs border border-warmgrey font-mono uppercase"
              />
              <button
                onClick={handleRunTrieSearch}
                className="bg-forest text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-forest-light"
              >
                Search Trie
              </button>
            </div>

            {trieResults && (
              <div className="bg-ivory p-3 rounded border border-warmgrey text-xs space-y-2">
                <div className="text-[11px] text-slate font-medium">
                  Prefix: <strong className="text-charcoal font-mono">{trieResults.prefix_query}</strong> • Found{' '}
                  <strong className="text-forest font-bold">{trieResults.matches_count}</strong> matches:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {trieResults.matches.map((reg: string) => (
                    <span
                      key={reg}
                      className="px-2 py-0.5 rounded bg-white text-charcoal font-mono font-semibold text-[11px] border border-warmgrey shadow-2xs"
                    >
                      {reg}
                    </span>
                  ))}
                </div>
                <div className="text-[10px] text-slate pt-2 border-t border-warmgrey/60">
                  Exact Match Status: {trieResults.is_exact_match ? 'Exact Full Registration' : 'Incomplete Prefix Only'}
                </div>
              </div>
            )}
          </div>

          {/* Unit 1 BST / AVL Tree Lookup */}
          <div className="bg-white p-4 rounded-lg border border-warmgrey shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-warmgrey">
              <Binary size={16} className="text-terracotta" />
              <div>
                <h3 className="text-xs font-bold text-charcoal">Binary Search Tree & AVL Lookup</h3>
                <div className="text-[10px] text-slate">Unit 1 Trees: Logarithmic search & self-balancing tree height</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                value={treeQueryId}
                onChange={(e) => setTreeQueryId(parseInt(e.target.value) || 1)}
                min={1}
                placeholder="Vehicle ID (e.g. 1)"
                className="flex-1 bg-ivory px-3 py-1.5 rounded text-xs border border-warmgrey font-mono"
              />
              <button
                onClick={handleRunTreeSearch}
                className="bg-terracotta text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-terracotta-hover"
              >
                Query Trees
              </button>
            </div>

            {treeResults && (
              <div className="bg-ivory p-3 rounded border border-warmgrey text-xs space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate">BST Result:</span>
                    <div className="font-bold text-charcoal">{treeResults.bst_found || 'Not Found'}</div>
                  </div>
                  <div>
                    <span className="text-slate">AVL Result:</span>
                    <div className="font-bold text-charcoal">{treeResults.avl_found || 'Not Found'}</div>
                  </div>
                </div>
                <div className="pt-2 border-t border-warmgrey text-[11px] flex justify-between">
                  <span>AVL Tree Height: <strong className="text-forest font-bold">{treeResults.avl_height}</strong></span>
                  <span>Total Nodes: <strong className="text-charcoal">{treeResults.total_nodes}</strong></span>
                </div>
                <div className="text-[10px] text-slate-light">
                  Sorted in-order traversal: [{treeResults.sorted_keys.slice(0, 10).join(', ')}]
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-warmgrey shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-3 border-b border-warmgrey flex items-center justify-between bg-ivory">
              <h3 className="text-xs font-bold text-charcoal">Add New Fleet Vehicle</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate hover:text-charcoal">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="p-5 space-y-3 text-xs">
              {formError && (
                <div className="p-2 rounded bg-operational-critical/10 text-operational-critical text-[11px] border border-operational-critical/20">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate mb-1">Vehicle Code</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. V7"
                    value={formData.vehicle_code}
                    onChange={(e) => setFormData({ ...formData, vehicle_code: e.target.value })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate mb-1">Registration Number</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. UP14XY9999"
                    value={formData.registration_no}
                    onChange={(e) => setFormData({ ...formData, registration_no: e.target.value })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate mb-1">Vehicle Type</label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey"
                  >
                    <option value="Heavy Commercial Truck (16T)">Heavy Commercial Truck (16T)</option>
                    <option value="Multi-Axle Cargo Truck (25T)">Multi-Axle Cargo Truck (25T)</option>
                    <option value="Medium Duty Cargo (10T)">Medium Duty Cargo (10T)</option>
                    <option value="Light Commercial Van (3.5T)">Light Commercial Van (3.5T)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate mb-1">Make & Model</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Tata Prima 5530.S"
                    value={formData.make_model}
                    onChange={(e) => setFormData({ ...formData, make_model: e.target.value })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate mb-1">Payload (kg)</label>
                  <input
                    type="number"
                    value={formData.load_capacity_kg}
                    onChange={(e) => setFormData({ ...formData, load_capacity_kg: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate mb-1">Odometer (km)</label>
                  <input
                    type="number"
                    value={formData.odometer_km}
                    onChange={(e) => setFormData({ ...formData, odometer_km: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate mb-1">Exp. km/L</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.expected_mileage}
                    onChange={(e) => setFormData({ ...formData, expected_mileage: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-slate mb-1">Insurance Expiry</label>
                  <input
                    type="date"
                    value={formData.insurance_expiry}
                    onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                    className="w-full bg-ivory px-2 py-1.5 rounded border border-warmgrey text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate mb-1">Pollution (PUCC)</label>
                  <input
                    type="date"
                    value={formData.pollution_expiry}
                    onChange={(e) => setFormData({ ...formData, pollution_expiry: e.target.value })}
                    className="w-full bg-ivory px-2 py-1.5 rounded border border-warmgrey text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate mb-1">National Permit</label>
                  <input
                    type="date"
                    value={formData.permit_expiry}
                    onChange={(e) => setFormData({ ...formData, permit_expiry: e.target.value })}
                    className="w-full bg-ivory px-2 py-1.5 rounded border border-warmgrey text-[11px]"
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
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Dossier Details Drawer */}
      {detailVehicle && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto space-y-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-warmgrey">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate">Vehicle Dossier</span>
                <h2 className="text-base font-bold text-charcoal">
                  {detailVehicle.vehicle_code} • {detailVehicle.registration_no}
                </h2>
              </div>
              <button
                onClick={() => {
                  setDetailVehicle(null);
                  if (onClearSelectedVehicle) onClearSelectedVehicle();
                }}
                className="p-1 rounded text-slate hover:text-charcoal hover:bg-ivory"
              >
                <X size={18} />
              </button>
            </div>

            {/* Specs & Driver */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-ivory p-3.5 rounded-lg border border-warmgrey">
              <div>
                <span className="text-slate">Make & Specification:</span>
                <div className="font-semibold text-charcoal">{detailVehicle.make_model}</div>
                <div className="text-[11px] text-slate">{detailVehicle.vehicle_type} ({detailVehicle.year})</div>
              </div>
              <div>
                <span className="text-slate">Payload Capacity:</span>
                <div className="font-semibold text-charcoal">
                  {detailVehicle.load_capacity_kg} kg ({(detailVehicle.load_capacity_kg / 1000).toFixed(1)} tonnes)
                </div>
                <div className="text-[11px] text-slate">Odometer: {detailVehicle.odometer_km} km</div>
              </div>
              <div className="pt-2 border-t border-warmgrey col-span-2">
                <span className="text-slate">Assigned Driver:</span>
                <div className="font-semibold text-charcoal">
                  {detailVehicle.assigned_driver ? detailVehicle.assigned_driver.full_name : 'No driver currently assigned'}
                </div>
              </div>
            </div>

            {/* Document Expirations */}
            <div className="border border-warmgrey rounded-lg p-3 text-xs space-y-2">
              <div className="font-bold text-charcoal text-[11px] flex items-center gap-1.5">
                <Calendar size={13} />
                <span>Statutory Compliance & Expiry Dates</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 bg-ivory rounded border border-warmgrey/60">
                  <div className="text-slate text-[10px]">Insurance</div>
                  <div className="font-semibold text-charcoal">{detailVehicle.insurance_expiry || 'N/A'}</div>
                </div>
                <div className="p-2 bg-ivory rounded border border-warmgrey/60">
                  <div className="text-slate text-[10px]">PUCC</div>
                  <div className="font-semibold text-charcoal">{detailVehicle.pollution_expiry || 'N/A'}</div>
                </div>
                <div className="p-2 bg-ivory rounded border border-warmgrey/60">
                  <div className="text-slate text-[10px]">National Permit</div>
                  <div className="font-semibold text-charcoal">{detailVehicle.permit_expiry || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Recent Trips */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-charcoal flex items-center justify-between">
                <span>Trip Dispatch History</span>
                <span className="text-[11px] text-slate font-normal">Last {detailVehicle.recent_trips?.length || 0} entries</span>
              </div>
              <div className="divide-y divide-warmgrey border border-warmgrey rounded-md overflow-hidden">
                {detailVehicle.recent_trips?.length === 0 ? (
                  <div className="p-3 text-slate text-center text-xs">No recorded trips.</div>
                ) : (
                  detailVehicle.recent_trips?.map((t: any) => (
                    <div key={t.id} className="p-2.5 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-bold text-charcoal">{t.trip_code}</span> ({t.origin} → {t.destination})
                        <div className="text-slate text-[10px]">{t.cargo}</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-ivory border border-warmgrey uppercase">
                        {t.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Maintenance History */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-charcoal flex items-center justify-between">
                <span>Service & Work Order History</span>
                <span className="text-[11px] text-slate font-normal">Last {detailVehicle.maintenance_history?.length || 0} records</span>
              </div>
              <div className="divide-y divide-warmgrey border border-warmgrey rounded-md overflow-hidden">
                {detailVehicle.maintenance_history?.length === 0 ? (
                  <div className="p-3 text-slate text-center text-xs">No service records.</div>
                ) : (
                  detailVehicle.maintenance_history?.map((m: any) => (
                    <div key={m.id} className="p-2.5 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-bold text-charcoal">{m.work_order_no}</span> ({m.category})
                        <div className="text-slate text-[10px]">{m.description}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-charcoal font-semibold">₹{m.cost}</span>
                        <div className="text-[10px] text-slate">{m.service_date}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
