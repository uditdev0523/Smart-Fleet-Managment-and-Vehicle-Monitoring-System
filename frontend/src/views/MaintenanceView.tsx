import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Calendar,
  X,
  ArrowUpRight
} from 'lucide-react';
import { MaintenanceRecord, Vehicle, api } from '../api';

interface MaintenanceViewProps {
  vehicles: Vehicle[];
  onRefresh: () => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ vehicles, onRefresh }) => {
  const [workOrders, setWorkOrders] = useState<MaintenanceRecord[]>([]);
  const [maxHeapData, setMaxHeapData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'work_orders' | 'max_heap' | 'allocation'>('work_orders');

  // New Work Order Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: vehicles[0]?.id || 1,
    work_order_no: '',
    category: 'Preventive Overhaul',
    description: '',
    service_date: new Date().toISOString().slice(0, 10),
    odometer_km: 50000,
    estimated_cost: 15000,
    workshop_name: 'Noida Central Auto Workshop',
    downtime_hours: 8.0,
    urgency: 7,
    parts_notes: '',
  });

  // Complete Order Modal
  const [completingOrder, setCompletingOrder] = useState<MaintenanceRecord | null>(null);
  const [actualCost, setActualCost] = useState(14000);

  // Workshop Hours Allocation State
  const [workshopHours, setWorkshopHours] = useState(5);
  const [allocationResult, setAllocationResult] = useState<any | null>(null);

  useEffect(() => {
    loadMaintenanceData();
  }, []);

  const loadMaintenanceData = async () => {
    try {
      const orders = await api.getWorkOrders();
      setWorkOrders(orders);
      const heapRes = await api.getMaxHeapQueue();
      setMaxHeapData(heapRes);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createWorkOrder(formData);
      setIsModalOpen(false);
      loadMaintenanceData();
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingOrder) return;
    try {
      await api.completeWorkOrder(completingOrder.id, actualCost);
      setCompletingOrder(null);
      loadMaintenanceData();
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRunAllocation = async () => {
    try {
      const sampleJobs = [
        { id: 1, name: 'Brake Overhaul (V2)', hours: 2, priority: 3 },
        { id: 2, name: 'Turbocharger Rebuild (V1)', hours: 3, priority: 4 },
        { id: 3, name: 'Differential Replacement (V4)', hours: 4, priority: 5 },
      ];
      const res = await api.allocateWorkshop({
        available_hours: workshopHours,
        jobs: sampleJobs,
      });
      setAllocationResult(res);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub Navigation */}
      <div className="flex items-center justify-between border-b border-warmgrey pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('work_orders')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'work_orders' ? 'bg-forest text-white' : 'text-slate hover:bg-ivory hover:text-charcoal'
            }`}
          >
            Work Orders ({workOrders.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('max_heap');
              loadMaintenanceData();
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'max_heap' ? 'bg-forest text-white' : 'text-slate hover:bg-ivory hover:text-charcoal'
            }`}
          >
            <Layers size={13} className="text-terracotta" />
            <span>Max-Heap Priority Queue (Unit 1)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('allocation');
              handleRunAllocation();
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'allocation' ? 'bg-forest text-white' : 'text-slate hover:bg-ivory hover:text-charcoal'
            }`}
          >
            <Clock size={13} />
            <span>Workshop Hours Knapsack Allocation (Unit 3)</span>
          </button>
        </div>

        <button
          onClick={() => {
            setFormData({
              vehicle_id: vehicles[0]?.id || 1,
              work_order_no: `WO-2026-${String(workOrders.length + 90).padStart(3, '0')}`,
              category: 'Preventive Overhaul',
              description: 'Scheduled brake pad and suspension bushing replacement.',
              service_date: new Date().toISOString().slice(0, 10),
              odometer_km: vehicles[0]?.odometer_km || 50000,
              estimated_cost: 18500,
              workshop_name: 'Noida Central Auto Workshop',
              downtime_hours: 6.0,
              urgency: 8,
              parts_notes: 'Brake pads front/rear, engine oil filter.',
            });
            setIsModalOpen(true);
          }}
          className="bg-terracotta hover:bg-terracotta-hover text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <Plus size={14} />
          <span>New Work Order</span>
        </button>
      </div>

      {/* Tab 1: Work Orders Table */}
      {activeTab === 'work_orders' && (
        <div className="bg-white rounded-lg border border-warmgrey shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory border-b border-warmgrey text-slate text-[11px] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Order No</th>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Category & Description</th>
                  <th className="py-2.5 px-3">Workshop</th>
                  <th className="py-2.5 px-3">Downtime</th>
                  <th className="py-2.5 px-3">Cost (INR)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warmgrey">
                {workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-ivory/50 transition-colors">
                    <td className="py-2.5 px-3 font-bold font-mono text-charcoal">{wo.work_order_no}</td>
                    <td className="py-2.5 px-3 font-semibold text-charcoal">
                      {wo.vehicle_code} <span className="text-[10px] text-slate font-normal">({wo.registration_no})</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-charcoal">{wo.category}</div>
                      <div className="text-[11px] text-slate truncate max-w-xs">{wo.description}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate">{wo.workshop_name}</td>
                    <td className="py-2.5 px-3 font-medium text-charcoal">{wo.downtime_hours} hrs</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-charcoal">
                        ₹{(wo.actual_cost || wo.estimated_cost).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate">
                        {wo.actual_cost ? 'Actual' : 'Estimated'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          wo.status === 'in_progress'
                            ? 'bg-operational-warning/10 text-operational-warning border border-operational-warning/30'
                            : 'bg-operational-success/10 text-operational-success border border-operational-success/30'
                        }`}
                      >
                        {wo.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {wo.status === 'in_progress' && (
                        <button
                          onClick={() => {
                            setCompletingOrder(wo);
                            setActualCost(wo.estimated_cost || 15000);
                          }}
                          className="px-2 py-1 rounded bg-forest text-white text-[10px] font-semibold hover:bg-forest-light"
                        >
                          Mark Done
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Max-Heap Priority Queue */}
      {activeTab === 'max_heap' && maxHeapData && (
        <div className="bg-white p-5 rounded-lg border border-warmgrey shadow-sm space-y-4">
          <div className="flex items-start justify-between pb-3 border-b border-warmgrey">
            <div>
              <h3 className="text-sm font-bold text-charcoal">Maintenance Max-Heap Priority Queue (Unit 1)</h3>
              <div className="text-[11px] text-slate leading-relaxed mt-0.5">
                {maxHeapData.explanation}
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-terracotta text-white font-bold text-xs shadow-2xs">
              Queue Size: {maxHeapData.queue_length}
            </span>
          </div>

          <div className="space-y-3">
            {maxHeapData.prioritized_jobs.map((job: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 bg-ivory rounded-lg border border-warmgrey flex items-center justify-between text-xs hover:border-terracotta/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-forest text-white font-bold text-xs flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-charcoal text-sm flex items-center gap-2">
                      <span>Vehicle {job.vehicle_code}</span>
                      <span className="font-mono text-slate text-xs font-normal">({job.registration_no})</span>
                    </div>
                    <div className="text-[11px] text-slate mt-0.5">{job.reason}</div>
                    {job.evidence && (
                      <div className="text-[10px] text-slate-light italic mt-0.5">Evidence: {job.evidence}</div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-operational-critical text-white uppercase shadow-2xs">
                    Urgency Score: {job.urgency_score} / 10
                  </span>
                  <div className="text-[10px] text-slate mt-1 uppercase font-semibold">Priority: {job.priority}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Workshop Hours Knapsack Allocation */}
      {activeTab === 'allocation' && (
        <div className="bg-white p-5 rounded-lg border border-warmgrey shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-warmgrey">
            <div>
              <h3 className="text-sm font-bold text-charcoal">Workshop Hours Knapsack Allocation (Unit 3)</h3>
              <div className="text-[11px] text-slate">
                Selects the combination of repair jobs that maximizes priority value within available technician shift hours.
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate font-medium">Available Workshop Shift:</span>
              <input
                type="number"
                value={workshopHours}
                onChange={(e) => setWorkshopHours(parseInt(e.target.value) || 1)}
                className="w-16 bg-ivory px-2 py-1 rounded border border-warmgrey font-bold text-forest"
              />
              <span className="text-slate">hours</span>
              <button
                onClick={handleRunAllocation}
                className="bg-forest text-white px-3 py-1 rounded font-semibold hover:bg-forest-light ml-2"
              >
                Compute
              </button>
            </div>
          </div>

          {allocationResult && (
            <div className="p-4 bg-ivory rounded border border-warmgrey text-xs space-y-3">
              <div className="flex justify-between items-center text-sm pb-2 border-b border-warmgrey">
                <span>Total Priority Achieved: <strong className="text-terracotta">{allocationResult.max_priority_achieved}</strong></span>
                <span>Hours Utilized: <strong>{allocationResult.allocated_hours} / {allocationResult.available_hours} hrs</strong></span>
              </div>

              <div>
                <div className="font-bold text-charcoal mb-1">Assigned Repair Jobs:</div>
                <div className="space-y-1">
                  {allocationResult.chosen_jobs.map((job: any) => (
                    <div key={job.id} className="p-2 bg-white rounded border border-warmgrey flex justify-between text-[11px]">
                      <span className="font-semibold text-charcoal">{job.name}</span>
                      <span className="text-slate">{job.hours} hrs • Priority: {job.priority}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Work Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-warmgrey shadow-xl max-w-md w-full">
            <div className="px-5 py-3 border-b border-warmgrey flex items-center justify-between bg-ivory">
              <h3 className="text-xs font-bold text-charcoal">Create Workshop Work Order</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate hover:text-charcoal">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateWorkOrder} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate mb-1">Target Vehicle</label>
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
                  <label className="block text-[11px] text-slate mb-1">Work Order No</label>
                  <input
                    required
                    type="text"
                    value={formData.work_order_no}
                    onChange={(e) => setFormData({ ...formData, work_order_no: e.target.value })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate mb-1">Category</label>
                  <input
                    required
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate mb-1">Fault Description</label>
                <textarea
                  required
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-slate mb-1">Est. Cost (₹)</label>
                  <input
                    type="number"
                    value={formData.estimated_cost}
                    onChange={(e) => setFormData({ ...formData, estimated_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-ivory px-2 py-1.5 rounded border border-warmgrey"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate mb-1">Downtime (hrs)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.downtime_hours}
                    onChange={(e) => setFormData({ ...formData, downtime_hours: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-ivory px-2 py-1.5 rounded border border-warmgrey"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate mb-1">Max-Heap Urgency (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: parseInt(e.target.value) || 5 })}
                    className="w-full bg-ivory px-2 py-1.5 rounded border border-warmgrey font-bold text-terracotta"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-warmgrey">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-warmgrey text-slate hover:bg-ivory"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-terracotta hover:bg-terracotta-hover text-white px-4 py-1.5 rounded font-semibold"
                >
                  Create & Lock Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Order Modal */}
      {completingOrder && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-warmgrey shadow-xl max-w-sm w-full p-5 space-y-3 text-xs">
            <h3 className="font-bold text-charcoal text-sm">Complete Work Order {completingOrder.work_order_no}</h3>
            <p className="text-slate text-[11px]">
              This will mark the repair as complete, update the vehicle's last service odometer, and restore vehicle status to Available.
            </p>

            <div>
              <label className="block text-[11px] text-slate mb-1">Actual Invoiced Repair Cost (INR ₹)</label>
              <input
                type="number"
                value={actualCost}
                onChange={(e) => setActualCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-ivory px-2.5 py-1.5 rounded border border-warmgrey font-bold text-forest"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-warmgrey">
              <button
                type="button"
                onClick={() => setCompletingOrder(null)}
                className="px-3 py-1.5 rounded border border-warmgrey text-slate hover:bg-ivory"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteOrder}
                className="bg-forest hover:bg-forest-light text-white px-4 py-1.5 rounded font-semibold"
              >
                Confirm Completion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
