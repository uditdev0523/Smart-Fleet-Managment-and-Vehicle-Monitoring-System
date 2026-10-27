import React, { useState, useEffect } from 'react';
import { Sidebar, NavItem } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { OverviewView } from './views/OverviewView';
import { LiveFleetView } from './views/LiveFleetView';
import { VehiclesView } from './views/VehiclesView';
import { DriversView } from './views/DriversView';
import { TripsView } from './views/TripsView';
import { RouteOptimizerView } from './views/RouteOptimizerView';
import { FuelView } from './views/FuelView';
import { MaintenanceView } from './views/MaintenanceView';
import { AlertsView } from './views/AlertsView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';

import {
  api,
  User,
  Vehicle,
  Driver,
  Trip,
  Depot,
  Corridor,
  MaintenanceAlert,
  KPISummary,
  setToken
} from './api';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavItem>('overview');
  const [collapsed, setCollapsed] = useState(false);

  // Core State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [kpi, setKpi] = useState<KPISummary | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [corridors, setCorridors] = useState<Corridor[]>([]);
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(true);
  const [isTicking, setIsTicking] = useState(false);

  // Selected vehicle for cross-view navigation
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  // Initial load
  useEffect(() => {
    initializeApp();
  }, []);

  // Periodic simulation tick every 6 seconds when active
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      triggerSimulatorTick(false);
    }, 6000);
    return () => clearInterval(interval);
  }, [isSimulating]);

  const initializeApp = async () => {
    try {
      // 1. Authenticate default admin if needed
      const authRes = await api.login({ username: 'admin', password: 'admin123' });
      setToken(authRes.access_token);
      setCurrentUser(authRes.user);

      // 2. Fetch all foundation data
      await refreshAllData();
    } catch (err: any) {
      console.error('Initialization error:', err);
    }
  };

  const refreshAllData = async () => {
    try {
      const [kpiRes, vehRes, drvRes, tripRes, depRes, corRes, alertRes] = await Promise.all([
        api.getKPISummary(),
        api.getVehicles(),
        api.getDrivers(),
        api.getTrips(),
        api.getDepots(),
        api.getCorridors(),
        api.getAlerts(),
      ]);

      setKpi(kpiRes);
      setVehicles(vehRes.items || []);
      setDrivers(drvRes || []);
      setTrips(tripRes || []);
      setDepots(depRes || []);
      setCorridors(corRes || []);
      setAlerts(alertRes || []);
    } catch (err: any) {
      console.error('Data refresh error:', err);
    }
  };

  const handleSwitchRole = async (role: string) => {
    try {
      const res = await api.switchDemoRole(role);
      setToken(res.access_token);
      setCurrentUser(res.user);
      await refreshAllData();
    } catch (err: any) {
      alert(`Role switch error: ${err.message}`);
    }
  };

  const handleToggleSimulator = async () => {
    try {
      const res = await api.toggleSimulator();
      setIsSimulating(res.is_running);
    } catch (err: any) {
      console.error(err);
    }
  };

  const triggerSimulatorTick = async (manual = true) => {
    if (manual) setIsTicking(true);
    try {
      await api.triggerTick();
      // Refresh telemetry & vehicles without full reload
      const vehRes = await api.getVehicles();
      setVehicles(vehRes.items || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      if (manual) setIsTicking(false);
    }
  };

  const handleSelectVehicleForDossier = (vehicleId: number) => {
    setSelectedVehicleId(vehicleId);
    setCurrentTab('vehicles');
  };

  const openAlertsCount = alerts.filter((a) => a.status === 'open').length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ivory">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedVehicleId(null);
          setCurrentTab(tab);
        }}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        openAlertsCount={openAlertsCount}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          openAlertsCount={openAlertsCount}
          isSimulating={isSimulating}
          onToggleSimulator={handleToggleSimulator}
          onTriggerTick={() => triggerSimulatorTick(true)}
          isTicking={isTicking}
        />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'overview' && (
              <OverviewView
                kpi={kpi}
                vehicles={vehicles}
                trips={trips}
                alerts={alerts}
                onNavigate={setCurrentTab}
                onRefresh={refreshAllData}
              />
            )}

            {currentTab === 'live_fleet' && (
              <LiveFleetView
                vehicles={vehicles}
                depots={depots}
                corridors={corridors}
                isSimulating={isSimulating}
                onToggleSimulator={handleToggleSimulator}
                onTriggerTick={() => triggerSimulatorTick(true)}
                isTicking={isTicking}
                onSelectVehicle={handleSelectVehicleForDossier}
              />
            )}

            {currentTab === 'vehicles' && (
              <VehiclesView
                vehicles={vehicles}
                onRefresh={refreshAllData}
                selectedVehicleId={selectedVehicleId}
                onClearSelectedVehicle={() => setSelectedVehicleId(null)}
              />
            )}

            {currentTab === 'drivers' && (
              <DriversView drivers={drivers} onRefresh={refreshAllData} />
            )}

            {currentTab === 'trips' && (
              <TripsView
                trips={trips}
                vehicles={vehicles}
                drivers={drivers}
                onRefresh={refreshAllData}
              />
            )}

            {currentTab === 'route_optimizer' && <RouteOptimizerView />}

            {currentTab === 'fuel' && (
              <FuelView vehicles={vehicles} onRefresh={refreshAllData} />
            )}

            {currentTab === 'maintenance' && (
              <MaintenanceView vehicles={vehicles} onRefresh={refreshAllData} />
            )}

            {currentTab === 'alerts' && (
              <AlertsView alerts={alerts} onRefresh={refreshAllData} />
            )}

            {currentTab === 'reports' && <ReportsView kpi={kpi} />}

            {currentTab === 'settings' && (
              <SettingsView
                currentUser={currentUser}
                onSwitchRole={handleSwitchRole}
                isSimulating={isSimulating}
                onToggleSimulator={handleToggleSimulator}
                onRefreshAll={refreshAllData}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
