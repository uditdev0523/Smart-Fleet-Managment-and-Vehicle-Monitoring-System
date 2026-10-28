import React from 'react';
import {
  Play,
  Pause,
  RotateCw,
  Bell
} from 'lucide-react';
import type { NavItem } from './Sidebar';

interface TopNavbarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  openAlertsCount: number;
  isSimulating: boolean;
  onToggleSimulator: () => void;
  onTriggerTick: () => void;
  isTicking: boolean;
}

const tabTitles: Record<NavItem, { title: string; subtitle: string }> = {
  overview: { title: 'Operations Centre', subtitle: 'Real-time telemetry, fleet status, and active corridor dispatches' },
  live_fleet: { title: 'Live Fleet Monitoring', subtitle: 'Deterministic GPS corridor tracking and spatial assets' },
  vehicles: { title: 'Vehicle Inventory & Registry', subtitle: 'Manage fleet assets, document expirations, and tree/trie lookups' },
  drivers: { title: 'Driver Management', subtitle: 'Licence verification, vehicle assignments, and safety scoring' },
  trips: { title: 'Trips & Dispatch', subtitle: 'Corridor dispatching, payload validation, and state machine transitions' },
  route_optimizer: { title: 'Route Optimizer & DSA Engine', subtitle: 'Verified graph algorithms, BFS vs Dijkstra comparison, MST, and knapsack' },
  fuel: { title: 'Fuel & Operating Expenses', subtitle: 'Consumption auditing, explainable anomaly detection, and segment tree queries' },
  maintenance: { title: 'Maintenance & Work Orders', subtitle: 'Max-Heap priority queue, workshop scheduling, and risk analysis' },
  alerts: { title: 'Alert Centre', subtitle: 'Critical incident auditing, acknowledgement, and resolution workflows' },
  reports: { title: 'Reports & Analytics', subtitle: 'Operational KPIs, IPCC CO2 emission metrics, and CSV data export' },
  settings: { title: 'Settings & Administration', subtitle: 'Audit trail, simulation controls, and demo database reset' },
};

import { api } from '../api';

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentTab,
  onSelectTab,
  openAlertsCount,
  isSimulating,
  onToggleSimulator,
  onTriggerTick,
  isTicking,
}) => {
  const [isBackendLive, setIsBackendLive] = React.useState(false);

  React.useEffect(() => {
    return api.subscribeBackendStatus((live) => setIsBackendLive(live));
  }, []);

  const meta = tabTitles[currentTab] || { title: 'FleetOps', subtitle: 'Logistics Operations' };

  return (
    <header className="h-16 bg-white border-b border-warmgrey px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Title & Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2 text-[11px] text-slate mb-0.5">
          <span className="font-semibold text-charcoal">FleetOps Enterprise</span>
          <span>/</span>
          <span className="capitalize">{currentTab.replace('_', ' ')}</span>
        </div>
        <h1 className="text-base font-bold text-charcoal tracking-tight flex items-center gap-2">
          {meta.title}
        </h1>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-3">
        {/* Service Connectivity Status */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-ivory border border-warmgrey rounded-md text-[11px] font-semibold text-charcoal shadow-2xs"
          title={isBackendLive ? "Connected to live FastAPI backend & SQLite" : "Running on 24/7 Universal Web Engine (All DSA & Telematics Active)"}
        >
          <span className={`w-2 h-2 rounded-full ${isBackendLive ? 'bg-operational-success animate-pulse' : 'bg-forest'}`} />
          <span>{isBackendLive ? 'FastAPI Cloud API' : '24/7 Web Engine'}</span>
        </div>

        {/* MANDATORY SIMULATED GPS DATA BADGE */}
        <div className="flex items-center gap-2 bg-ivory border border-warmgrey rounded-md px-2.5 py-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isSimulating ? 'bg-operational-success animate-pulse' : 'bg-operational-warning'
              }`}
            />
            <span className="text-[10px] font-bold tracking-wider text-charcoal uppercase">
              Simulated GPS Data
            </span>
          </div>

          <div className="h-3 w-[1px] bg-warmgrey mx-1" />

          {/* Simulator controls */}
          <button
            onClick={onToggleSimulator}
            className={`p-1 rounded text-[11px] font-medium flex items-center gap-1 hover:bg-white transition-colors ${
              isSimulating ? 'text-operational-success' : 'text-slate'
            }`}
            title={isSimulating ? 'Pause GPS telemetry generator' : 'Resume GPS telemetry generator'}
          >
            {isSimulating ? <Pause size={12} /> : <Play size={12} />}
            <span className="text-[10px]">{isSimulating ? 'Active' : 'Paused'}</span>
          </button>

          <button
            onClick={onTriggerTick}
            disabled={isTicking}
            className="p-1 rounded text-[11px] font-medium flex items-center gap-1 text-terracotta hover:bg-white transition-colors"
            title="Advance simulated vehicle positions by 1 step"
          >
            <RotateCw size={12} className={isTicking ? 'animate-spin' : ''} />
            <span className="text-[10px]">Step</span>
          </button>
        </div>

        {/* Alerts quick button */}
        <button
          onClick={() => onSelectTab('alerts')}
          className="relative p-2 rounded-md hover:bg-ivory border border-warmgrey text-slate hover:text-charcoal transition-colors"
          title="Open Alert Centre"
        >
          <Bell size={16} />
          {openAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-operational-critical text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-sm">
              {openAlertsCount}
            </span>
          )}
        </button>

        {/* SDG 9 Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate border border-warmgrey/80 rounded-md px-2 py-1 bg-ivory-light">
          <span className="w-1.5 h-1.5 rounded-full bg-forest" />
          <span className="font-semibold text-charcoal">SDG 9</span>
          <span className="text-slate-light">Industry & Infra</span>
        </div>
      </div>
    </header>
  );
};
