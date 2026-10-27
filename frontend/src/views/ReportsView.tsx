import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  Leaf,
  DollarSign,
  TrendingUp,
  Truck
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { KPISummary, api } from '../api';

interface ReportsViewProps {
  kpi: KPISummary | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ kpi }) => {
  const [analytics, setAnalytics] = useState<any | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await api.getAnalyticsData();
      setAnalytics(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="bg-white p-4 rounded-lg border border-warmgrey flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-charcoal">Fleet Performance & Sustainability Dossier</h2>
          <div className="text-[11px] text-slate">
            Derived directly from operational telemetry, trip manifests, and fuel audits.
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* CSV Exports */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate font-medium mr-1">Export Data:</span>
            <a
              href={api.getExportCSVUrl('trips')}
              download
              className="px-2.5 py-1 rounded bg-ivory hover:bg-ivory-dark text-charcoal border border-warmgrey text-[11px] font-semibold flex items-center gap-1"
            >
              <Download size={12} />
              <span>Trips CSV</span>
            </a>
            <a
              href={api.getExportCSVUrl('vehicles')}
              download
              className="px-2.5 py-1 rounded bg-ivory hover:bg-ivory-dark text-charcoal border border-warmgrey text-[11px] font-semibold flex items-center gap-1"
            >
              <Download size={12} />
              <span>Vehicles CSV</span>
            </a>
            <a
              href={api.getExportCSVUrl('fuel')}
              download
              className="px-2.5 py-1 rounded bg-ivory hover:bg-ivory-dark text-charcoal border border-warmgrey text-[11px] font-semibold flex items-center gap-1"
            >
              <Download size={12} />
              <span>Fuel CSV</span>
            </a>
          </div>

          <button
            onClick={handlePrint}
            className="px-3 py-1 rounded bg-forest hover:bg-forest-light text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs ml-2"
          >
            <Printer size={13} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Sustainability & SDG 9 Emissions Card */}
      <div className="bg-white p-5 rounded-lg border border-warmgrey shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-operational-success flex items-center gap-1">
            <Leaf size={12} /> UN SDG 9 Alignment
          </span>
          <h3 className="text-xl font-bold text-charcoal">
            {kpi?.estimated_emissions_kg_co2 ?? 0} kg CO₂
          </h3>
          <div className="text-[11px] text-slate">
            Total estimated greenhouse emissions from {kpi?.total_litres_consumed ?? 0} litres consumed.
          </div>
          <div className="text-[10px] text-slate-light italic pt-1">
            Standard IPCC coefficient: 2.68 kg CO₂ per litre of commercial diesel.
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate flex items-center gap-1">
            <DollarSign size={12} /> Fleet Fuel Capital
          </span>
          <h3 className="text-xl font-bold text-charcoal">
            ₹{((kpi?.total_fuel_expenditure_inr ?? 0)).toLocaleString('en-IN')}
          </h3>
          <div className="text-[11px] text-slate">
            Cumulative fuel disbursements across active transport routes.
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta flex items-center gap-1">
            <TrendingUp size={12} /> Fleet Operational Rate
          </span>
          <h3 className="text-xl font-bold text-charcoal">
            {analytics?.fleet_utilization_rate ?? 75}%
          </h3>
          <div className="text-[11px] text-slate">
            Percentage of active assets engaged in revenue-generating transit.
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel Expense Trend Chart */}
        <div className="bg-white p-4 rounded-lg border border-warmgrey shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-warmgrey">
            <h3 className="text-xs font-bold text-charcoal">Daily Fuel Expenditure Trend (INR ₹)</h3>
            <span className="text-[10px] text-slate">Operational Audits</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.fuel_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E0D8" />
                <XAxis dataKey="day" stroke="#737A75" fontSize={11} />
                <YAxis stroke="#737A75" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [`₹${val.toLocaleString('en-IN')}`, 'Cost']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E3E0D8', fontSize: '11px' }}
                />
                <Bar dataKey="cost" fill="#B9674B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Asset Distribution */}
        <div className="bg-white p-4 rounded-lg border border-warmgrey shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-warmgrey">
            <h3 className="text-xs font-bold text-charcoal">Vehicle Status Breakdown</h3>
            <span className="text-[10px] text-slate">Real-Time Registry</span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.status_breakdown || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(analytics?.status_breakdown || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} vehicles`, name]}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E3E0D8', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-[11px] text-slate">
            {(analytics?.status_breakdown || []).map((entry: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                <span>{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
