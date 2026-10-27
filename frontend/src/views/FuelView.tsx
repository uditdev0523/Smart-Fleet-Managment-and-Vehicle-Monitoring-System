import React, { useState, useEffect } from 'react';
import {
  Fuel,
  Plus,
  AlertTriangle,
  Search,
  Filter,
  DollarSign,
  TrendingDown,
  Info,
  Calendar,
  Layers,
  CheckCircle2,
  X
} from 'lucide-react';
import { FuelRecord, Vehicle, api } from '../api';

interface FuelViewProps {
  vehicles: Vehicle[];
  onRefresh: () => void;
}

export const FuelView: React.FC<FuelViewProps> = ({ vehicles, onRefresh }) => {
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'records' | 'anomalies' | 'segment_tree'>('records');

  // Add Refill Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: vehicles[0]?.id || 1,
    date_str: new Date().toISOString().slice(0, 10),
    odometer_km: 48600,
    litres: 50,
    total_cost: 4500,
    fuel_station: 'IndianOil Pari Chowk Auto Fuel',
    payment_ref: 'IOCL-PAY-001',
    notes: '',
  });
  const [modalResult, setModalResult] = useState<any | null>(null);

  // Segment Tree Query State
  const [startDay, setStartDay] = useState(0);
  const [endDay, setEndDay] = useState(3);
  const [segmentTreeResult, setSegmentTreeResult] = useState<any | null>(null);

  useEffect(() => {
    loadFuelData();
  }, []);

  const loadFuelData = async () => {
    try {
      const records = await api.getFuelRecords();
      setFuelRecords(records);
      const anomalyRes = await api.getFuelAnomalies();
      setAnomalies(anomalyRes.items || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAddFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.addFuelEntry(formData);
      setModalResult(res);
      loadFuelData();
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRunSegmentTreeQuery = async () => {
    try {
      const res = await api.getSegmentTreeQuery(startDay, endDay);
      setSegmentTreeResult(res);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-warmgrey pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('records')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'records' ? 'bg-forest text-white' : 'text-slate hover:bg-ivory hover:text-charcoal'
            }`}
          >
            Refill Logs ({fuelRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('anomalies')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'anomalies' ? 'bg-forest text-white' : 'text-slate hover:bg-ivory hover:text-charcoal'
            }`}
          >
            <AlertTriangle size={13} className="text-operational-warning" />
            <span>Explainable Fuel Anomalies ({anomalies.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('segment_tree');
              handleRunSegmentTreeQuery();
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'segment_tree' ? 'bg-forest text-white' : 'text-slate hover:bg-ivory hover:text-charcoal'
            }`}
          >
            <Layers size={13} />
            <span>Fuel Segment Tree O(log n) Range Queries (Unit 5)</span>
          </button>
        </div>

        <button
          onClick={() => {
            setModalResult(null);
            setIsModalOpen(true);
          }}
          className="bg-terracotta hover:bg-terracotta-hover text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <Plus size={14} />
          <span>Log Refill</span>
        </button>
      </div>

      {/* Tab 1: Refill Logs Table */}
      {activeTab === 'records' && (
        <div className="bg-white rounded-lg border border-warmgrey shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory border-b border-warmgrey text-slate text-[11px] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Fuel Station</th>
                  <th className="py-2.5 px-3">Volume</th>
                  <th className="py-2.5 px-3">Rate</th>
                  <th className="py-2.5 px-3">Total Cost</th>
                  <th className="py-2.5 px-3">Mileage</th>
                  <th className="py-2.5 px-3">Cost / km</th>
                  <th className="py-2.5 px-3">Audit Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warmgrey">
                {fuelRecords.map((f) => (
                  <tr key={f.id} className="hover:bg-ivory/50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-charcoal">{f.date_str}</td>
                    <td className="py-2.5 px-3 font-semibold text-charcoal">
                      {f.vehicle_code} <span className="text-[10px] text-slate font-normal">({f.registration_no})</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate">{f.fuel_station}</td>
                    <td className="py-2.5 px-3 font-bold text-charcoal">{f.litres} L</td>
                    <td className="py-2.5 px-3 text-slate">₹{f.price_per_litre}/L</td>
                    <td className="py-2.5 px-3 font-bold text-charcoal">₹{f.total_cost.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3">
                      {f.mileage_calculated ? (
                        <span className="font-semibold text-forest">{f.mileage_calculated} km/L</span>
                      ) : (
                        <span className="text-slate italic">Baseline</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate">
                      {f.cost_per_km ? `₹${f.cost_per_km}/km` : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      {f.anomaly_flag ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-operational-critical/10 text-operational-critical border border-operational-critical/30">
                          Anomaly Flagged
                        </span>
                      ) : (
                        <span className="text-operational-success text-[11px] font-medium flex items-center gap-1">
                          <CheckCircle2 size={12} /> Nominal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Explainable Anomaly Inspector */}
      {activeTab === 'anomalies' && (
        <div className="bg-white p-5 rounded-lg border border-warmgrey shadow-sm space-y-4">
          <div className="flex items-start gap-3 p-3 bg-ivory rounded border border-warmgrey">
            <Info size={18} className="text-slate mt-0.5" />
            <div className="text-xs text-charcoal">
              <span className="font-bold">Transparent Rule Engine Disclaimer:</span> An anomaly indicates a statistically significant deviation (e.g. sub-threshold mileage, inconsistent odometer, or abnormal volume), not verified misconduct. All flagged entries require physical inspection.
            </div>
          </div>

          <div className="space-y-3">
            {anomalies.map((a) => (
              <div key={a.id} className="p-4 rounded-lg border border-operational-critical/30 bg-operational-critical/5 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-operational-critical/20">
                  <div className="font-bold text-charcoal text-sm">
                    {a.vehicle_code} • {a.registration_no} ({a.date})
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-operational-critical text-white uppercase">
                    Rule Triggered
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate">Purchased Litres:</span>
                    <div className="font-bold text-charcoal">{a.litres} L (₹{a.total_cost})</div>
                  </div>
                  <div>
                    <span className="text-slate">Calculated Efficiency:</span>
                    <div className="font-bold text-operational-critical">{a.mileage} km/L</div>
                  </div>
                  <div>
                    <span className="text-slate">Odometer Reading:</span>
                    <div className="font-bold text-charcoal">{a.odometer_km} km</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-operational-critical/20">
                  <div className="font-semibold text-charcoal">Violation Explanation:</div>
                  <div className="text-[11px] text-slate mt-0.5">{a.rule_details}</div>
                </div>

                <div className="text-[11px] text-forest font-medium pt-1">
                  <strong>Recommended Action:</strong> {a.recommended_action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Unit 5 Fuel Segment Tree Range Queries */}
      {activeTab === 'segment_tree' && (
        <div className="bg-white p-5 rounded-lg border border-warmgrey shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-charcoal">Fuel Consumption Segment Tree (Unit 5)</h3>
            <div className="text-[11px] text-slate">
              Allows the fleet manager to query the exact total fuel consumption over arbitrary day ranges in O(log n) time instead of O(n) table scans.
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs bg-ivory p-3 rounded border border-warmgrey">
            <div>
              <label className="block text-[11px] text-slate mb-1">0-Indexed Start Day</label>
              <input
                type="number"
                min={0}
                value={startDay}
                onChange={(e) => setStartDay(parseInt(e.target.value) || 0)}
                className="w-20 bg-white px-2 py-1 rounded border border-warmgrey font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate mb-1">0-Indexed End Day</label>
              <input
                type="number"
                min={0}
                value={endDay}
                onChange={(e) => setEndDay(parseInt(e.target.value) || 0)}
                className="w-20 bg-white px-2 py-1 rounded border border-warmgrey font-bold"
              />
            </div>
            <button
              onClick={handleRunSegmentTreeQuery}
              className="mt-4 bg-forest text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-forest-light"
            >
              Execute Range Query
            </button>
          </div>

          {segmentTreeResult && (
            <div className="p-4 bg-ivory rounded border border-warmgrey text-xs space-y-3">
              <div className="flex justify-between items-baseline border-b border-warmgrey pb-2">
                <span className="font-medium text-slate">Queried Interval [Day {segmentTreeResult.query_range[0]} to Day {segmentTreeResult.query_range[1]}]:</span>
                <span className="text-xl font-bold text-forest">{segmentTreeResult.total_litres_in_range} Litres</span>
              </div>
              <div className="text-[11px] text-slate">
                Daily Telemetry Array: [{segmentTreeResult.daily_readings.join(', ')}]
              </div>
              <div className="grid grid-cols-2 gap-3 text-[11px] pt-2 border-t border-warmgrey">
                <div>Query Complexity: <strong>{segmentTreeResult.time_complexity}</strong></div>
                <div>Point Correction: <strong>{segmentTreeResult.update_complexity}</strong></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log Refill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-warmgrey shadow-xl max-w-md w-full">
            <div className="px-5 py-3 border-b border-warmgrey flex items-center justify-between bg-ivory">
              <h3 className="text-xs font-bold text-charcoal">Record Fuel Refill & Audit</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate hover:text-charcoal">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddFuel} className="p-5 space-y-3 text-xs">
              {modalResult?.anomaly_analysis?.is_anomaly && (
                <div className="p-3 rounded bg-operational-critical/10 border border-operational-critical/20 text-operational-critical text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Rule Engine Alert Triggered:
                  </div>
                  <div>{modalResult.anomaly_analysis.summary}</div>
                </div>
              )}

              <div>
                <label className="block text-[11px] text-slate mb-1">Select Vehicle</label>
                <select
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: parseInt(e.target.value) })}
                  className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicle_code} ({v.registration_no}) - Current Odo: {v.odometer_km} km
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate mb-1">Refill Date</label>
                  <input
                    type="date"
                    value={formData.date_str}
                    onChange={(e) => setFormData({ ...formData, date_str: e.target.value })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate mb-1">Current Odometer (km)</label>
                  <input
                    required
                    type="number"
                    value={formData.odometer_km}
                    onChange={(e) => setFormData({ ...formData, odometer_km: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate mb-1">Litres Purchased</label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    value={formData.litres}
                    onChange={(e) => setFormData({ ...formData, litres: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate mb-1">Total Bill (INR ₹)</label>
                  <input
                    required
                    type="number"
                    value={formData.total_cost}
                    onChange={(e) => setFormData({ ...formData, total_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate mb-1">Fuel Station</label>
                <input
                  required
                  type="text"
                  value={formData.fuel_station}
                  onChange={(e) => setFormData({ ...formData, fuel_station: e.target.value })}
                  className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-warmgrey">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-warmgrey text-slate hover:bg-ivory"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="bg-terracotta hover:bg-terracotta-hover text-white px-4 py-1.5 rounded font-semibold"
                >
                  Save & Validate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
