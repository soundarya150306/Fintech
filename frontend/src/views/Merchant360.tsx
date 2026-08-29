import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Download, 
  ShieldAlert, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  Building2, 
  DollarSign, 
  HelpCircle 
} from 'lucide-react';
import { fetchMerchants, fetchMerchant360, getReportDownloadUrl } from '../api/client';
import { Merchant } from '../types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';

interface Merchant360Props {
  selectedMerchantId: string | null;
  onSelectMerchant: (m: Merchant) => void;
  onLaunchSimulator: (m: Merchant) => void;
  onLaunchCopilot: (m: Merchant) => void;
}

export const Merchant360: React.FC<Merchant360Props> = ({
  selectedMerchantId,
  onSelectMerchant,
  onLaunchSimulator,
  onLaunchCopilot
}) => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [currentId, setCurrentId] = useState<string>(selectedMerchantId || '');
  const [data360, setData360] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load merchant list
  useEffect(() => {
    fetchMerchants({ limit: 100 }).then(res => {
      setMerchants(res.merchants);
      if (!currentId && res.merchants.length > 0) {
        setCurrentId(res.merchants[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedMerchantId) {
      setCurrentId(selectedMerchantId);
    }
  }, [selectedMerchantId]);

  // Load 360 data whenever currentId changes
  useEffect(() => {
    if (!currentId) return;
    setLoading(true);
    fetchMerchant360(currentId)
      .then(res => {
        setData360(res);
      })
      .catch(err => console.error("Error loading 360 data:", err))
      .finally(() => setLoading(false));
  }, [currentId]);

  const filteredMerchants = merchants.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mInfo = data360?.merchant;
  const mlDiag = data360?.ml_diagnostics;
  const signalHist = data360?.signal_history || [];
  const riskHist = data360?.risk_history || [];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Search & Select Controls */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2 rounded-xl bg-slate-800 text-teal-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Merchant 360° Profile</h2>
            <p className="text-xs text-slate-400 font-mono">Real-Time Risk Analysis • AI-Powered Insights</p>
          </div>
        </div>

        {/* Search Input & Select Dropdown */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-teal-500/50"
            />
          </div>

          <select
            value={currentId}
            onChange={(e) => setCurrentId(e.target.value)}
            className="py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-teal-300 focus:outline-none focus:border-teal-500/50"
          >
            {filteredMerchants.map(m => (
              <option key={m.id} value={m.id}>
                {m.id} — {m.name} ({m.risk_band})
              </option>
            ))}
          </select>
        </div>

      </div>

      {loading || !data360 ? (
        <div className="flex items-center justify-center h-80 text-slate-400 font-mono text-sm">
          <Activity className="w-6 h-6 animate-spin text-teal-400 mr-2" />
          Re-computing SHAP feature vectors and trend diagnostics for merchant...
        </div>
      ) : (
        <>
          {/* Merchant Profile Header Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-100">{mInfo.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                    mInfo.risk_band === 'Critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                    mInfo.risk_band === 'Watchlist' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {mInfo.risk_band}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
                  <span>Merchant ID: <strong className="text-slate-200">{mInfo.id}</strong></span>
                  <span>•</span>
                  <span>Sector: <strong className="text-slate-200">{mInfo.sector}</strong></span>
                  <span>•</span>
                  <span>Region: <strong className="text-slate-200">{mInfo.region}</strong></span>
                  <span>•</span>
                  <span>Credit Limit: <strong className="text-teal-400">${mInfo.base_credit_limit.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Stress Score Display & Quick Actions */}
              <div className="flex items-center gap-6">
                
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-mono">Financial Stress Index</div>
                  <div className={`text-4xl font-bold font-mono ${
                    mInfo.current_risk_score > 70 ? 'text-rose-400' :
                    mInfo.current_risk_score > 40 ? 'text-amber-400' :
                    'text-emerald-400'
                  }`}>
                    {mInfo.current_risk_score} <span className="text-sm font-normal text-slate-500">/ 100</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <a
                    href={getReportDownloadUrl(mInfo.id)}
                    download
                    className="px-3.5 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 font-medium text-xs flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    Download Risk Report (PDF)
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onLaunchSimulator(mInfo)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-all"
                    >
                      What-If Simulate
                    </button>
                    <button
                      onClick={() => onLaunchCopilot(mInfo)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs transition-all"
                    >
                      AI Copilot QA
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Diagnostic Alert Banners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800">
              
              {/* Isolation Forest Anomaly Status */}
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                mlDiag.anomaly_flag ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-slate-900/80 border-slate-800 text-slate-300'
              }`}>
                {mlDiag.anomaly_flag ? <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" /> : <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                <div>
                  <div className="font-semibold text-xs flex items-center gap-2">
                    <span>Unusual Behavior Detected</span>
                    <span className="font-mono text-[10px] text-slate-500">(AI Alert)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {mlDiag.anomaly_flag 
                      ? 'This merchant is showing sudden, unusual financial patterns compared to their normal history.'
                      : 'Merchant behavior is normal. No unusual financial shifts detected.'
                    }
                  </p>
                </div>
              </div>

              {/* Time-Series Deterioration Status */}
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                mlDiag.deterioration_flag ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' : 'bg-slate-900/80 border-slate-800 text-slate-300'
              }`}>
                {mlDiag.deterioration_flag ? <TrendingDown className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" /> : <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                <div>
                  <div className="font-semibold text-xs">Recent Trend Analysis (Last 30 Days)</div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {mlDiag.deterioration_flag && mlDiag.deterioration_reasons.length > 0
                      ? mlDiag.deterioration_reasons.join(' • ')
                      : 'Stable trajectory: No consecutive negative declines detected in the recent 30-day window.'
                    }
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* SHAP Explainability Risk Drivers Section */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-400" />
                  <span>Key Risk Factors (AI Analysis)</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">AI-calculated factors driving this merchant's risk score up or down.</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500"></span>
                  <span className="text-slate-400">Increases Risk Score</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
                  <span className="text-slate-400">Decreases Risk Score</span>
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {mlDiag.top_drivers.map((driver: any, idx: number) => {
                const isPositive = driver.shap_impact > 0;
                const widthPercent = Math.min(100, Math.abs(driver.shap_impact) * 200);

                return (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="font-semibold text-slate-200">{driver.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">Value: <strong className="text-slate-200">{driver.value}</strong></span>
                        <span className={`font-bold ${isPositive ? 'text-rose-400' : 'text-emerald-400'}`}>
                          SHAP: {driver.shap_impact > 0 ? `+${driver.shap_impact}` : driver.shap_impact}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isPositive ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.max(5, widthPercent)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time-Series Signals Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Sales vs Refund Rate */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-semibold font-mono text-slate-300 mb-3 uppercase tracking-wider">
                Daily Sales vs Refund Rate (30-Day Window)
              </h4>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={signalHist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="date" stroke="#64748B" fontSize={9} tickFormatter={(v) => v.slice(5)} />
                    <YAxis yAxisId="left" stroke="#00F5D4" fontSize={9} />
                    <YAxis yAxisId="right" orientation="right" stroke="#EF4444" fontSize={9} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="sales" name="Daily Sales ($)" stroke="#00F5D4" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="refund_rate" name="Refund Rate" stroke="#EF4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Credit Utilization vs Bank Balance */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-semibold font-mono text-slate-300 mb-3 uppercase tracking-wider">
                Credit Line Utilization vs Bank Balance
              </h4>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={signalHist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="date" stroke="#64748B" fontSize={9} tickFormatter={(v) => v.slice(5)} />
                    <YAxis yAxisId="left" stroke="#F59E0B" fontSize={9} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#10B981" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="credit_utilization" name="Utilization" stroke="#F59E0B" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="bank_balance" name="Bank Balance ($)" stroke="#10B981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Risk Score History Trajectory Chart */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-semibold font-mono text-slate-300 mb-3 uppercase tracking-wider">
              Risk Score History (Last 30 Days)
            </h4>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={riskHist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={9} />
                  <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={9} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="score" name="Stress Index" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
