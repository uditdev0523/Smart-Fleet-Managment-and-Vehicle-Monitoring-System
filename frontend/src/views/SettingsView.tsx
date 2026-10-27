import React, { useState, useEffect } from 'react';
import {
  Sliders,
  RotateCcw,
  Shield,
  Activity,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Database
} from 'lucide-react';
import { api, User } from '../api';

interface SettingsViewProps {
  currentUser: User | null;
  onSwitchRole: (role: string) => void;
  isSimulating: boolean;
  onToggleSimulator: () => void;
  onRefreshAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onSwitchRole,
  isSimulating,
  onToggleSimulator,
  onRefreshAll,
}) => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isReseeding, setIsReseeding] = useState(false);
  const [reseedSuccess, setReseedSuccess] = useState(false);

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    try {
      const logs = await api.getAuditLogs(30);
      setAuditLogs(logs);
      const userList = await api.getUsers();
      setUsers(userList);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleReseed = async () => {
    if (confirm('Are you sure you want to reseed the database? This will reset all records to the original sample dataset.')) {
      setIsReseeding(true);
      try {
        await api.reseedDatabase();
        setReseedSuccess(true);
        setTimeout(() => setReseedSuccess(false), 4000);
        onRefreshAll();
        loadSettingsData();
      } catch (err: any) {
        alert(err.message);
      } finally {
        setIsReseeding(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Reseed Success Notice */}
      {reseedSuccess && (
        <div className="p-3 bg-operational-success/10 border border-operational-success/30 rounded-lg text-xs font-semibold text-operational-success flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>Database successfully reset and re-seeded with pristine Indian enterprise fleet records.</span>
        </div>
      )}

      {/* Grid: Simulator & Reseed Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Simulator Parameters */}
        <div className="bg-white p-5 rounded-lg border border-warmgrey shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-warmgrey">
            <Activity size={16} className="text-forest" />
            <div>
              <h3 className="text-xs font-bold text-charcoal">Deterministic GPS Simulator</h3>
              <div className="text-[10px] text-slate">Generates simulated telemetry along real NCR corridors</div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-ivory rounded border border-warmgrey">
              <div>
                <div className="font-semibold text-charcoal">Simulation Engine State</div>
                <div className="text-[11px] text-slate">
                  Currently: <strong className={isSimulating ? 'text-operational-success' : 'text-slate'}>{isSimulating ? 'Running' : 'Paused'}</strong>
                </div>
              </div>
              <button
                onClick={onToggleSimulator}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 ${
                  isSimulating ? 'bg-operational-success text-white' : 'bg-white text-charcoal border border-warmgrey'
                }`}
              >
                {isSimulating ? <Pause size={13} /> : <Play size={13} />}
                <span>{isSimulating ? 'Pause Engine' : 'Resume Engine'}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate leading-relaxed">
              <strong>Compliance Notice:</strong> As required by the system specification, simulated GPS data is generated deterministically along realistic highway corridors and is visibly tagged as <em>SIMULATED GPS DATA</em> across all views.
            </div>
          </div>
        </div>

        {/* Database Management & Demo Reset */}
        <div className="bg-white p-5 rounded-lg border border-warmgrey shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-warmgrey">
            <Database size={16} className="text-terracotta" />
            <div>
              <h3 className="text-xs font-bold text-charcoal">Database State & Test Harness</h3>
              <div className="text-[10px] text-slate">Reset or restore initial regression test data</div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-[11px] text-slate leading-relaxed">
              Use this tool during evaluation to restore the pristine 5-depot / 6-route sample network, 6 vehicles (V1-V6), 5 drivers, active trips, and Max-Heap alerts.
            </p>

            <button
              onClick={handleReseed}
              disabled={isReseeding}
              className="bg-terracotta hover:bg-terracotta-hover text-white px-4 py-2 rounded text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <RotateCcw size={14} className={isReseeding ? 'animate-spin' : ''} />
              <span>{isReseeding ? 'Reseeding Database...' : 'Reset to Clean Demo State'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role-Based Access Control Evaluation Switcher */}
      <div className="bg-white p-5 rounded-lg border border-warmgrey shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-warmgrey">
          <Shield size={16} className="text-forest" />
          <div>
            <h3 className="text-xs font-bold text-charcoal">Role-Based Access Control (RBAC) Accounts</h3>
            <div className="text-[10px] text-slate">Switch roles immediately to test server-side authorization checks</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {[
            { role: 'fleet_manager', title: 'Fleet Manager', desc: 'Full administrative access across all records & audits' },
            { role: 'dispatcher', title: 'Dispatcher', desc: 'Manage trips, assign vehicles & drivers' },
            { role: 'technician', title: 'Technician', desc: 'Manage work orders & resolve maintenance alerts' },
            { role: 'driver', title: 'Driver', desc: 'View assigned trips and vehicle logs' },
          ].map((item) => {
            const isCurrent = currentUser?.role === item.role;
            return (
              <div
                key={item.role}
                onClick={() => onSwitchRole(item.role)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-forest text-white border-forest shadow-sm'
                    : 'bg-ivory text-charcoal border-warmgrey hover:border-terracotta/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">{item.title}</span>
                  {isCurrent && <CheckCircle2 size={13} className="text-sage" />}
                </div>
                <div className={`text-[10px] leading-relaxed ${isCurrent ? 'text-sage-light' : 'text-slate'}`}>
                  {item.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg border border-warmgrey shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-warmgrey bg-ivory flex items-center justify-between">
          <h3 className="text-xs font-bold text-charcoal">System Audit Trail</h3>
          <span className="text-[10px] text-slate font-medium">Immutable operation log</span>
        </div>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory border-b border-warmgrey text-slate text-[10px] font-semibold sticky top-0">
              <tr>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Operator</th>
                <th className="py-2 px-3">Action Type</th>
                <th className="py-2 px-3">Entity</th>
                <th className="py-2 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmgrey text-[11px]">
              {auditLogs.map((l) => (
                <tr key={l.id} className="hover:bg-ivory/50">
                  <td className="py-2 px-3 text-slate font-mono text-[10px]">
                    {new Date(l.timestamp).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="py-2 px-3 font-semibold text-charcoal">{l.user}</td>
                  <td className="py-2 px-3">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-ivory border border-warmgrey">
                      {l.action}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate">{l.entity_type} {l.entity_id ? `#${l.entity_id}` : ''}</td>
                  <td className="py-2 px-3 text-charcoal truncate max-w-sm">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
