import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  Truck,
  Users,
  Send,
  Network,
  Fuel,
  Wrench,
  AlertTriangle,
  BarChart3,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react';
import type { User } from '../api';

export type NavItem =
  | 'overview'
  | 'live_fleet'
  | 'vehicles'
  | 'drivers'
  | 'trips'
  | 'route_optimizer'
  | 'fuel'
  | 'maintenance'
  | 'alerts'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentUser: User | null;
  onSwitchRole: (role: string) => void;
  openAlertsCount: number;
}

const navItems: { id: NavItem; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'live_fleet', label: 'Live Fleet', icon: MapPin },
  { id: 'vehicles', label: 'Vehicles', icon: Truck },
  { id: 'drivers', label: 'Drivers', icon: Users },
  { id: 'trips', label: 'Trips & Dispatch', icon: Send },
  { id: 'route_optimizer', label: 'Route Optimizer', icon: Network },
  { id: 'fuel', label: 'Fuel & Expenses', icon: Fuel },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Sliders },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  currentUser,
  onSwitchRole,
  openAlertsCount,
}) => {
  return (
    <aside
      className={`bg-forest text-white flex flex-col transition-all duration-300 ease-in-out shrink-0 border-r border-forest-dark select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
      style={{ height: '100vh', position: 'sticky', top: 0 }}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-forest-light">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-terracotta flex items-center justify-center font-bold text-white tracking-wider text-sm shadow-sm">
              FO
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                FleetOps
                <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-forest-light text-sage border border-sage/30">
                  DSA II
                </span>
              </div>
              <div className="text-[11px] text-slate-light truncate max-w-[130px]">
                Smart Vehicle Ops
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 mx-auto rounded bg-terracotta flex items-center justify-center font-bold text-white text-sm">
            FO
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded hover:bg-forest-light text-slate-light hover:text-white transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-3 overflow-y-auto px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-all ${
                isActive
                  ? 'bg-terracotta text-white shadow-sm font-semibold'
                  : 'text-slate-light hover:text-white hover:bg-forest-light'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <div className="relative">
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-light'} />
                {item.id === 'alerts' && openAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-operational-critical rounded-full ring-2 ring-forest" />
                )}
              </div>
              {!collapsed && (
                <span className="flex-1 text-left flex items-center justify-between">
                  <span>{item.label}</span>
                  {item.id === 'alerts' && openAlertsCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-operational-critical text-white font-bold">
                      {openAlertsCount}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile and Role Switcher */}
      <div className="p-3 border-t border-forest-light bg-forest-dark/40">
        {!collapsed ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-forest-light border border-sage/30 flex items-center justify-center text-xs font-semibold text-sage">
                {currentUser ? currentUser.full_name.charAt(0) : 'U'}
              </div>
              <div className="overflow-hidden flex-1">
                <div className="text-xs font-semibold text-white truncate">
                  {currentUser ? currentUser.full_name : 'Loading...'}
                </div>
                <div className="text-[10px] text-sage flex items-center gap-1">
                  <Shield size={10} />
                  <span className="capitalize">{currentUser?.role.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Quick Demo Role Switcher */}
            <div className="mt-2 pt-2 border-t border-forest-light/60">
              <div className="text-[10px] text-slate-light mb-1 font-medium flex items-center justify-between">
                <span>Active Role:</span>
                <span className="text-[9px] text-sage bg-forest-light px-1 rounded">Evaluation Mode</span>
              </div>
              <select
                value={currentUser?.role || 'fleet_manager'}
                onChange={(e) => onSwitchRole(e.target.value)}
                className="w-full bg-forest-light text-xs text-white rounded px-2 py-1 border border-forest-light/80 focus:outline-none focus:border-terracotta text-[11px]"
              >
                <option value="fleet_manager">Fleet Manager (Admin)</option>
                <option value="dispatcher">Dispatcher</option>
                <option value="technician">Technician</option>
                <option value="driver">Driver</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title={`${currentUser?.full_name} (${currentUser?.role})`}>
            <div className="w-8 h-8 rounded-full bg-forest-light border border-sage/30 flex items-center justify-center text-xs font-semibold text-sage">
              {currentUser ? currentUser.full_name.charAt(0) : 'U'}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
