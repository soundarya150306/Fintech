import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Building2, 
  AlertOctagon, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  TrendingDown, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Cpu, 
  Sparkles,
  Network,
  Eye,
  Sliders,
  Layers
} from 'lucide-react';
import { RadarVisualizer3D } from '../components/3D/RadarVisualizer3D';
import { Network3DGraph } from '../components/3D/Network3DGraph';
import { Card3DTilt } from '../components/3D/Card3DTilt';
import { HologramSphere3D } from '../components/3D/HologramSphere3D';
import { fetchDashboardSummary, fetchMerchants } from '../api/client';
import { Merchant } from '../types';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

import { SAMPLE_DASHBOARD_SUMMARY, SAMPLE_MERCHANTS } from '../data/sampleData';

interface ExecutiveDashboardProps {
  onSelectMerchant: (m: Merchant) => void;
  simulatedDayCount: number;
  onNavigateToTab?: (tab: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ 
  onSelectMerchant, 
  simulatedDayCount,
  onNavigateToTab 
}) => {
  const [summary, setSummary] = useState<any>(SAMPLE_DASHBOARD_SUMMARY);
  const [merchants, setMerchants] = useState<Merchant[]>(SAMPLE_MERCHANTS);
  const [loading, setLoading] = useState(false);
  const [visualMode, setVisualMode] = useState<'radar3d' | 'network3d'>('radar3d');

  const loadData = async () => {
    try {
      const [sumData, merchData] = await Promise.all([
        fetchDashboardSummary(),
        fetchMerchants({ limit: 100 })
      ]);
      if (sumData) setSummary(sumData);
      if (merchData?.merchants?.length > 0) setMerchants(merchData.merchants);
    } catch (err) {
      console.warn("Background dashboard update note:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [simulatedDayCount]);

  const riskPieData = summary ? [
    { name: 'Low Risk', value: summary.risk_bands?.low_risk || 140, color: '#10B981' },
    { name: 'Watchlist', value: summary.risk_bands?.watchlist || 45, color: '#F59E0B' },
    { name: 'Critical Stress', value: summary.risk_bands?.critical || 15, color: '#EF4444' }
  ] : [];

  // Smooth Flagged Trend chart data matching reference
  const flaggedTrendData = [
    { month: 'Jul', flagged: 22, avgRisk: 30 },
    { month: 'Aug', flagged: 31, avgRisk: 33 },
    { month: 'Sep', flagged: 28, avgRisk: 31 },
    { month: 'Oct', flagged: 36, avgRisk: 35 },
    { month: 'Nov', flagged: 42, avgRisk: 38 },
    { month: 'Dec', flagged: 38, avgRisk: 36 },
    { month: 'Jan', flagged: 29, avgRisk: 32 },
    { month: 'Feb', flagged: 47, avgRisk: summary?.portfolio_avg_risk || 34 }
  ];

  // AI Risk Dimensions metrics matching reference
  const aiRiskDimensions = [
    { name: 'Invoice & Sales Velocity', score: 86, color: 'bg-emerald-500', barColor: '#10B981', status: 'Healthy' },
    { name: 'Cash Flow Reserve Stability', score: 74, color: 'bg-teal-500', barColor: '#00F5D4', status: 'Optimal' },
    { name: 'Credit Utilization Pressure', score: 62, color: 'bg-amber-500', barColor: '#F59E0B', status: 'Elevated' },
    { name: 'Supplier Delay & Supply Chain Latency', score: 48, color: 'bg-indigo-500', barColor: '#6366F1', status: 'Moderate' },
    { name: 'Refund Surge Acceleration', score: 28, color: 'bg-rose-500', barColor: '#EF4444', status: 'Stress Signal' },
    { name: 'Behavioral Anomaly Index', score: 18, color: 'bg-purple-500', barColor: '#8B5CF6', status: 'Isolated' }
  ];

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner matching Reference */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <span>Risk Analyst Dashboard</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
              Live Feed
            </span>
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Fraud investigation &amp; financial stress network analysis — {currentDateFormatted}
          </p>
        </div>

        {/* View Switcher pills */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900/90 border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setVisualMode('radar3d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
              visualMode === 'radar3d'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>3D Radar</span>
          </button>
          <button
            onClick={() => setVisualMode('network3d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
              visualMode === 'network3d'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>3D Network</span>
          </button>
        </div>
      </div>

      {/* Top 4-5 KPI Metric Cards matching Reference Screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Unacknowledged Alerts */}
        <Card3DTilt>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400">Unacknowledged Alerts</div>
                <div className="text-2xl font-bold font-mono text-slate-100 mt-0.5">
                  {summary?.active_alerts?.length || 5}
                </div>
                <div className="text-[11px] font-mono text-rose-400 font-semibold mt-0.5 flex items-center gap-1">
                  <span>Requires action</span>
                </div>
              </div>
            </div>
          </div>
        </Card3DTilt>

        {/* Card 2: Avg Risk Score */}
        <Card3DTilt>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400">Avg Risk Score</div>
                <div className="text-2xl font-bold font-mono text-cyan-300 mt-0.5">
                  {Math.round(summary?.portfolio_avg_risk || 34)}
                </div>
                <div className="text-[11px] font-mono text-cyan-400 font-semibold mt-0.5 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  <span>-3.1% vs baseline</span>
                </div>
              </div>
            </div>
          </div>
        </Card3DTilt>

        {/* Card 3: Suspicious / Anomaly Nodes */}
        <Card3DTilt>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400">Suspicious Nodes</div>
                <div className="text-2xl font-bold font-mono text-amber-300 mt-0.5">
                  {summary?.anomaly_count || 6}
                </div>
                <div className="text-[11px] font-mono text-amber-400 font-semibold mt-0.5">
                  In merchant network
                </div>
              </div>
            </div>
          </div>
        </Card3DTilt>

        {/* Card 4: Active Investigations / Monitored Merchants */}
        <Card3DTilt>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400">Active Monitored</div>
                <div className="text-2xl font-bold font-mono text-emerald-300 mt-0.5">
                  {summary?.total_merchants || 200}
                </div>
                <div className="text-[11px] font-mono text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+2 this week</span>
                </div>
              </div>
            </div>
          </div>
        </Card3DTilt>

      </div>

      {/* Main Charts Row matching Reference (Flagged Invoice Trend + Risk Distribution Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Flagged Invoice Trend (Smooth Spline Area Chart) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800/90">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Flagged Stress &amp; Invoice Trend</h3>
              <p className="text-xs text-slate-400 font-mono">Monthly aggregated high-risk transaction signals</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
              XGBoost Monitored
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={flaggedTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="roseCurveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} domain={[0, 60]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="flagged" 
                  stroke="#EF4444" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#roseCurveGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Risk Distribution Donut Ring Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-100">Risk Distribution</h3>
              <span className="text-[10px] font-mono text-slate-400">Total: {summary?.total_merchants || 200}</span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Portfolio risk band allocation</p>
          </div>

          <div className="h-48 w-full relative flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F172A', 
                    borderColor: '#334155', 
                    borderRadius: '12px', 
                    color: '#fff', 
                    fontSize: '12px' 
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center metric */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-slate-400 font-mono">Avg Risk</span>
              <span className="text-xl font-bold font-mono text-teal-400">
                {Math.round(summary?.portfolio_avg_risk || 34)}
              </span>
            </div>
          </div>

          {/* Segment Badges */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <div className="text-[10px] text-slate-400">Healthy</div>
              <div className="font-bold text-sm">{summary?.risk_bands?.low_risk || 140}</div>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <div className="text-[10px] text-slate-400">Watchlist</div>
              <div className="font-bold text-sm">{summary?.risk_bands?.watchlist || 45}</div>
            </div>
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <div className="text-[10px] text-slate-400">Critical</div>
              <div className="font-bold text-sm">{summary?.risk_bands?.critical || 15}</div>
            </div>
          </div>
        </div>

      </div>

      {/* Middle Row 2: AI Risk Dimensions Progress Bars */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>AI Risk Dimensions</span>
                <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                  SHAP Explainability
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">Multi-dimensional alternate data feature attribution</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">Portfolio Benchmark: 28/100</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {aiRiskDimensions.map((dim, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-medium">{dim.name}</span>
                <span className="text-slate-400">{dim.score}% ({dim.status})</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${dim.color}`}
                  style={{ width: `${dim.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3D Visualizer Section Header & Toggle */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Network className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>3D Spatial Risk Engine (Three.js WebGL)</span>
                <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">
                  Interactive 3D
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Real-time 3D spatial elevation radar &amp; transaction supply chain contagion graph
              </p>
            </div>
          </div>

          {/* 3D View Switcher Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
            <button
              onClick={() => setVisualMode('radar3d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
                visualMode === 'radar3d'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>3D Spatial Radar</span>
            </button>

            <button
              onClick={() => setVisualMode('network3d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
                visualMode === 'network3d'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>3D Network Graph</span>
            </button>
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="w-full">
          {visualMode === 'radar3d' ? (
            <RadarVisualizer3D merchants={merchants} onSelectMerchant={onSelectMerchant} />
          ) : (
            <Network3DGraph merchants={merchants} onSelectMerchant={onSelectMerchant} />
          )}
        </div>
      </div>

      {/* Live Alerts & Sector Stress Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sector Stress Table */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              <span>Sector Stress Benchmark</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">5 Monitored Sectors</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Sector</th>
                  <th className="py-2.5 px-3">Merchants</th>
                  <th className="py-2.5 px-3">Avg Stress</th>
                  <th className="py-2.5 px-3">Anomalies</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(summary?.sector_breakdown || []).map((sec: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-200">{sec.sector}</td>
                    <td className="py-3 px-3 text-slate-400">{sec.count}</td>
                    <td className="py-3 px-3">
                      <span className={`font-bold ${sec.avg_risk > 60 ? 'text-rose-400' : sec.avg_risk > 35 ? 'text-amber-400' : 'text-teal-400'}`}>
                        {sec.avg_risk} pts
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {sec.anomaly_count || 1}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sec.avg_risk > 60 
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' 
                          : sec.avg_risk > 35 
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {sec.avg_risk > 60 ? 'High Alert' : sec.avg_risk > 35 ? 'Watch' : 'Healthy'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Alert Feed */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Live Stress Alerts</span>
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-teal-400 border border-slate-800">
                Real-Time
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {(summary?.active_alerts || []).slice(0, 4).map((alert: any) => (
                <div
                  key={alert.id}
                  onClick={() => {
                    const found = merchants.find(m => m.id === alert.merchant_id);
                    if (found) onSelectMerchant(found);
                  }}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-teal-500/40 cursor-pointer transition-all hover:translate-x-1"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-slate-200">{alert.merchant_name}</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                      {alert.alert_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{alert.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 mt-3 text-center">
            <span className="text-[10px] font-mono text-slate-500">
              Click any alert to inspect merchant 360° telemetry
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
