import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  ArrowUpRight, 
  Sliders, 
  Bot, 
  Clock, 
  Activity 
} from 'lucide-react';
import { fetchEarlyWarning } from '../api/client';
import { FastRiser, Merchant } from '../types';

interface EarlyWarningCenterProps {
  onSelectMerchant: (m: Merchant) => void;
  onLaunchSimulator: (m: any) => void;
  onLaunchCopilot: (m: any) => void;
}

export const EarlyWarningCenter: React.FC<EarlyWarningCenterProps> = ({
  onSelectMerchant,
  onLaunchSimulator,
  onLaunchCopilot
}) => {
  const [days, setDays] = useState(14);
  const [fastRisers, setFastRisers] = useState<FastRiser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEarlyWarningData = () => {
    setLoading(true);
    fetchEarlyWarning(days)
      .then(res => setFastRisers(res.fast_risers))
      .catch(err => console.error("Early warning fetch error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEarlyWarningData();
  }, [days]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>RISK ACCELERATION MONITOR</span>
            </div>
            <h1 className="text-xl font-bold text-slate-100">Early Warning Center</h1>
            <p className="text-xs text-slate-400 mt-1">
              See which merchants have had the sharpest increase in risk recently, so you can intervene early.
            </p>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-400 px-2 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Lookback Window:
            </span>
            {[7, 14, 30].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  days === d
                    ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-80 text-slate-400 font-mono text-sm">
          <Activity className="w-6 h-6 animate-spin text-amber-400 mr-2" />
          Analyzing portfolio 30-day time-series slope trajectories & SHAP attributions...
        </div>
      ) : fastRisers.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center text-slate-400 font-mono">
          No rapid risk acceleration detected in the last {days} days.
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Merchant Details</th>
                  <th className="py-3.5 px-4 font-semibold">Sector</th>
                  <th className="py-3.5 px-4 font-semibold">Risk Score</th>
                  <th className="py-3.5 px-4 font-semibold">Rate of Change ({days}d)</th>
                  <th className="py-3.5 px-4 font-semibold">Main Reason for Risk</th>
                  <th className="py-3.5 px-4 font-semibold">System Diagnostics</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Intervention Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {fastRisers.map((item) => (
                  <tr key={item.merchant_id} className="hover:bg-slate-900/50 transition-colors">
                    
                    {/* Merchant Name & ID */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-semibold text-slate-100">{item.merchant_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{item.merchant_id}</div>
                    </td>

                    {/* Sector */}
                    <td className="py-3.5 px-4 text-slate-300">{item.sector}</td>

                    {/* Score */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${
                          item.current_score > 70 ? 'text-rose-400' : item.current_score > 40 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {item.current_score}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.risk_band === 'Critical' ? 'bg-rose-500/20 text-rose-300' : item.risk_band === 'Watchlist' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {item.risk_band}
                        </span>
                      </div>
                    </td>

                    {/* Score Delta */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-rose-400 font-bold">
                        <TrendingUp className="w-4 h-4" />
                        <span>+{item.score_delta} pts</span>
                      </div>
                    </td>

                    {/* SHAP Reason */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-slate-200 font-medium">{item.top_shap_reason}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.shap_driver_detail}</div>
                    </td>

                    {/* Diagnostics */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {item.deterioration_flag && (
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px]">
                            Slope Decline
                          </span>
                        )}
                        {item.anomaly_flag && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                            Anomaly
                          </span>
                        )}
                        {!item.deterioration_flag && !item.anomaly_flag && (
                          <span className="text-slate-500 text-[10px]">Moderate Shift</span>
                        )}
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onLaunchSimulator({ id: item.merchant_id, name: item.merchant_name, base_credit_limit: 100000 })}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                          title="Simulate credit policy change"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onLaunchCopilot({ id: item.merchant_id, name: item.merchant_name })}
                          className="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition-all"
                          title="Ask AI Copilot for intervention recommendation"
                        >
                          <Bot className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectMerchant({ id: item.merchant_id, name: item.merchant_name } as any)}
                          className="p-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 transition-all"
                          title="Inspect full 360 view"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
