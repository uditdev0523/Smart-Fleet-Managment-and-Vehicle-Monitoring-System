import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Check,
  Search,
  X
} from 'lucide-react';
import { MaintenanceAlert, api } from '../api';

interface AlertsViewProps {
  alerts: MaintenanceAlert[];
  onRefresh: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ alerts, onRefresh }) => {
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('open');
  const [resolvingAlert, setResolvingAlert] = useState<MaintenanceAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const handleAcknowledge = async (id: number) => {
    try {
      await api.acknowledgeAlert(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingAlert) return;
    try {
      await api.resolveAlert(resolvingAlert.id, resolutionNotes);
      setResolvingAlert(null);
      setResolutionNotes('');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesPriority = priorityFilter === 'all' || a.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesPriority && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white p-3.5 rounded-lg border border-warmgrey flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate font-medium text-xs">Priority:</span>
          {['all', 'critical', 'high', 'medium', 'low'].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize ${
                priorityFilter === p
                  ? 'bg-forest text-white'
                  : 'bg-ivory text-charcoal border border-warmgrey hover:bg-ivory-dark'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate font-medium text-xs">Status:</span>
          {['all', 'open', 'acknowledged', 'resolved'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize ${
                statusFilter === s
                  ? 'bg-terracotta text-white'
                  : 'bg-ivory text-charcoal border border-warmgrey hover:bg-ivory-dark'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border border-warmgrey text-center text-slate text-xs flex flex-col items-center justify-center gap-2">
            <CheckCircle2 size={24} className="text-operational-success" />
            <span>No alerts matching the selected filter criteria.</span>
          </div>
        ) : (
          filteredAlerts.map((a) => (
            <div
              key={a.id}
              className={`bg-white p-4 rounded-lg border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                a.priority === 'critical'
                  ? 'border-operational-critical/40 bg-operational-critical/5'
                  : a.priority === 'high'
                  ? 'border-operational-warning/40'
                  : 'border-warmgrey'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      a.priority === 'critical'
                        ? 'bg-operational-critical text-white'
                        : a.priority === 'high'
                        ? 'bg-operational-warning text-white'
                        : 'bg-ivory text-slate border border-warmgrey'
                    }`}
                  >
                    {a.priority}
                  </span>
                  <span className="text-xs font-bold text-charcoal">{a.reason}</span>
                  <span className="text-[10px] text-slate font-mono">({a.category})</span>
                </div>

                <div className="text-[11px] text-slate">
                  Related Unit: <strong>Vehicle {a.vehicle_code}</strong> ({a.registration_no}) • Urgency: <strong>{a.urgency}/10</strong>
                </div>

                {a.evidence && (
                  <div className="text-[11px] text-slate-light italic">Evidence: {a.evidence}</div>
                )}

                {a.status === 'resolved' && a.resolution_notes && (
                  <div className="text-[11px] text-operational-success font-medium pt-1">
                    Resolved: {a.resolution_notes}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {a.status === 'open' && (
                  <>
                    <button
                      onClick={() => handleAcknowledge(a.id)}
                      className="px-2.5 py-1 rounded bg-ivory hover:bg-ivory-dark text-slate text-xs font-medium border border-warmgrey"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => {
                        setResolvingAlert(a);
                        setResolutionNotes('Inspected by technician, corrective adjustment performed.');
                      }}
                      className="px-3 py-1 rounded bg-forest hover:bg-forest-light text-white text-xs font-semibold shadow-2xs"
                    >
                      Resolve
                    </button>
                  </>
                )}
                {a.status === 'acknowledged' && (
                  <button
                    onClick={() => {
                      setResolvingAlert(a);
                      setResolutionNotes('Work order scheduled and problem resolved.');
                    }}
                    className="px-3 py-1 rounded bg-forest hover:bg-forest-light text-white text-xs font-semibold"
                  >
                    Resolve
                  </button>
                )}
                {a.status === 'resolved' && (
                  <span className="text-[11px] text-operational-success font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Resolved
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolve Dialog */}
      {resolvingAlert && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-warmgrey shadow-xl max-w-md w-full p-5 space-y-3 text-xs">
            <h3 className="font-bold text-charcoal text-sm">Resolve Operational Alert</h3>
            <div className="text-[11px] text-slate">{resolvingAlert.reason}</div>

            <form onSubmit={handleResolve} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate mb-1">Resolution Audit Notes</label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full bg-ivory p-2.5 rounded border border-warmgrey"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-warmgrey">
                <button
                  type="button"
                  onClick={() => setResolvingAlert(null)}
                  className="px-3 py-1.5 rounded border border-warmgrey text-slate hover:bg-ivory"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-operational-success hover:bg-forest text-white px-4 py-1.5 rounded font-semibold"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
