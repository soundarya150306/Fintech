import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  TrendingDown, 
  Activity, 
  Building2, 
  AlertOctagon, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { RadarVisualizer } from '../components/3D/RadarVisualizer';
import { fetchDashboardSummary, fetchMerchants } from '../api/client';
import { Merchant } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';

interface ExecutiveDashboardProps {
  onSelectMerchant: (m: Merchant) => void;
  simulatedDayCount: number;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ onSelectMerchant, simulatedDayCount }) => {
  const [summary, setSummary] = useState<any>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumData, merchData] = await Promise.all([
        fetchDashboardSummary(),
        fetchMerchants({ limit: 100 })
      ]);
      setSummary(sumData);
      setMerchants(merchData.merchants);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [simulatedDayCount]);

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400 font-mono text-sm">
        <Activity className="w-6 h-6 animate-spin text-teal-400 mr-2" />
        Computing Portfolio Stress Metrics & Radar Vectors...
      </div>
    );
  }

  const riskPieData = summary ? [
    { name: 'Low Risk', value: summary.risk_bands.low_risk, color: '#10B981' },
    { name: 'Watchlist', value: summary.risk_bands.watchlist, color: '#F59E0B' },
    { name: 'Critical Stress', value: summary.risk_bands.critical, color: '#EF4444' }
  ] : [];

  return (
    <div className="space-[#1e293b] space-y-6 pb-12">
      
      {/* Pitch Header Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-teal-500/20 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-4xl">
          <div className="flex items-center gap-2 text-xs font-mono text-teal-400 mb-1">
            <Activity className="w-4 h-4" />
            <span>LIVE MONITORING ACTIVE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2">
            Financial Stress Radar
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
            Monitor all your merchants in real-time. Our AI automatically detects when a merchant might struggle to repay their credit, explains exactly why, and helps you take action before they default.
          </p>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Total Monitored</span>
            <Building2 className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">{summary?.total_merchants || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active merchant credit lines</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Average Risk Score</span>
            <Activity className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-teal-400">{summary?.portfolio_avg_risk || 0} <span className="text-xs font-normal text-slate-500">/ 100</span></div>
          <div className="text-[11px] text-slate-400 mt-1">Overall portfolio health</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-rose-500/30 bg-rose-500/5">
          <div className="flex items-center justify-between text-rose-400 text-xs font-medium mb-1">
            <span>Critical Risk Merchants</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">{summary?.risk_bands?.critical || 0}</div>
          <div className="text-[11px] text-rose-300/80 mt-1">High chance of default</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between text-amber-400 text-xs font-medium mb-1">
            <span>Unusual Behavior</span>
            <AlertOctagon className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{summary?.anomaly_count || 0}</div>
          <div className="text-[11px] text-amber-300/80 mt-1">Sudden financial shifts</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-purple-500/30 bg-purple-500/5">
          <div className="flex items-center justify-between text-purple-400 text-xs font-medium mb-1">
            <span>Deterioration Trends</span>
            <TrendingDown className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">{summary?.deterioration_count || 0}</div>
          <div className="text-[11px] text-purple-300/80 mt-1">30-day slope decline</div>
        </div>

      </div>

      {/* 3D Canvas Spatial Radar Visualizer */}
      <RadarVisualizer merchants={merchants} onSelectMerchant={onSelectMerchant} />

      {/* Analytics Charts & Live Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Risk Band Distribution Pie */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <span>Portfolio Risk Band Breakdown</span>
          </h3>
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs font-mono">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <div>Low Risk</div>
              <div className="font-bold text-sm">{summary?.risk_bands?.low_risk}</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <div>Watchlist</div>
              <div className="font-bold text-sm">{summary?.risk_bands?.watchlist}</div>
            </div>
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <div>Critical</div>
              <div className="font-bold text-sm">{summary?.risk_bands?.critical}</div>
            </div>
          </div>
        </div>

        {/* Sector Stress Bar Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Sector Average Stress Index</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.sector_breakdown || []} layout="vertical">
                <XAxis type="number" domain={[0, 100]} stroke="#64748B" fontSize={10} />
                <YAxis dataKey="sector" type="category" width={110} stroke="#94A3B8" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="avg_risk" radius={[0, 4, 4, 0]}>
                  {(summary?.sector_breakdown || []).map((entry: any, index: number) => (
                    <Cell key={`bar-${index}`} fill={entry.avg_risk > 60 ? '#EF4444' : entry.avg_risk > 35 ? '#F59E0B' : '#00F5D4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Active Stress Alert Feed */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Live Stress Alert Feed</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Real-Time</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-64 pr-1 flex-1">
            {summary?.active_alerts?.length === 0 ? (
              <div className="text-xs text-slate-500 italic p-4 text-center">No critical alerts detected in active feed.</div>
            ) : (
              summary?.active_alerts?.map((alert: any) => (
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
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                      alert.severity === 'High' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {alert.alert_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{alert.description}</p>
                  <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {alert.date}
                    </span>
                    <span className="text-teal-400 flex items-center gap-0.5">
                      Inspect 360° <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
