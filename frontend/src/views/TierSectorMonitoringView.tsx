import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Activity, 
  ShieldAlert, 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown, 
  Layers,
  Cpu,
  Shirt,
  Home,
  Package,
  Wrench
} from 'lucide-react';
import { Card3DTilt } from '../components/3D/Card3DTilt';
import { fetchMerchants } from '../api/client';
import { Merchant } from '../types';

interface TierSectorMonitoringViewProps {
  sector: string;
  onSelectMerchant: (m: Merchant) => void;
}

export const TierSectorMonitoringView: React.FC<TierSectorMonitoringViewProps> = ({
  sector,
  onSelectMerchant
}) => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetchMerchants({ sector, limit: 100 })
      .then(res => setMerchants(res.merchants))
      .catch(err => console.error("Error loading sector merchants:", err))
      .finally(() => setLoading(false));
  }, [sector]);

  const totalCount = merchants.length;
  const avgRisk = totalCount > 0 
    ? Math.round(merchants.reduce((acc, m) => acc + m.current_risk_score, 0) / totalCount)
    : 30;
  const criticalCount = merchants.filter(m => m.risk_band === 'Critical').length;
  const anomalyCount = merchants.filter(m => m.anomaly_flag).length;

  const getSectorIcon = (sec: string) => {
    if (sec.includes('Electronics')) return Cpu;
    if (sec.includes('Apparel')) return Shirt;
    if (sec.includes('Home')) return Home;
    if (sec.includes('FMCG')) return Package;
    return Wrench;
  };

  const IconComponent = getSectorIcon(sector);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-teal-500/20 bg-gradient-to-r from-slate-900 via-[#0B1526] to-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <IconComponent className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-teal-400 mb-0.5">
              <span>TIER SECTOR MONITORING</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100">{sector}</h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Real-time telemetry, transaction velocity &amp; credit stress tracking
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 text-teal-300 border border-slate-800">
          {totalCount} Active Merchants
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card3DTilt>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-mono">Tier Merchants</div>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{totalCount}</div>
            </div>
            <Building2 className="w-6 h-6 text-slate-500" />
          </div>
        </Card3DTilt>

        <Card3DTilt>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-mono">Sector Avg Risk</div>
              <div className="text-2xl font-bold font-mono text-teal-400 mt-1">{avgRisk} / 100</div>
            </div>
            <Activity className="w-6 h-6 text-teal-400" />
          </div>
        </Card3DTilt>

        <Card3DTilt>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-mono">Critical Merchants</div>
              <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{criticalCount}</div>
            </div>
            <ShieldAlert className="w-6 h-6 text-rose-400" />
          </div>
        </Card3DTilt>

        <Card3DTilt>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-mono">Anomalies Detected</div>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{anomalyCount}</div>
            </div>
            <Activity className="w-6 h-6 text-amber-400" />
          </div>
        </Card3DTilt>
      </div>

      {/* Merchants Table in this Tier */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Tier Merchant Roster</h3>
            <p className="text-xs text-slate-400 font-mono">Continuous credit risk scoring &amp; behavioral anomaly tracking</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Merchant</th>
                <th className="py-3.5 px-4 font-semibold">Region</th>
                <th className="py-3.5 px-4 font-semibold">Base Credit Limit</th>
                <th className="py-3.5 px-4 font-semibold">Risk Score</th>
                <th className="py-3.5 px-4 font-semibold">Risk Band</th>
                <th className="py-3.5 px-4 font-semibold">Anomaly</th>
                <th className="py-3.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {merchants.map((m) => (
                <tr key={m.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-200">{m.name}</div>
                    <div className="text-[10px] text-slate-500">{m.id}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">{m.region}</td>
                  <td className="py-3.5 px-4 text-slate-300">${m.base_credit_limit.toLocaleString()}</td>
                  <td className="py-3.5 px-4">
                    <span className={`font-bold ${
                      m.current_risk_score > 70 ? 'text-rose-400' : m.current_risk_score > 40 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {m.current_risk_score} / 100
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.risk_band === 'Critical' 
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' 
                        : m.risk_band === 'Watchlist' 
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {m.risk_band}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {m.anomaly_flag ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        Flagged
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Normal</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSelectMerchant(m)}
                      className="px-3 py-1 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-medium transition-all"
                    >
                      Inspect 360° →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
