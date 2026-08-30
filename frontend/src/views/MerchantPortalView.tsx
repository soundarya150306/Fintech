import React, { useEffect, useState } from 'react';
import { 
  Store, 
  DollarSign, 
  Activity, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Sliders, 
  Bot, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  Send,
  Building2,
  PieChart as PieIcon,
  RefreshCw
} from 'lucide-react';
import { Card3DTilt } from '../components/3D/Card3DTilt';
import { HologramSphere3D } from '../components/3D/HologramSphere3D';
import { fetchMerchant360, runSimulation, queryCopilot, getReportDownloadUrl } from '../api/client';
import { Merchant, SimulationResult } from '../types';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';

import { SAMPLE_MERCHANTS, generateSampleHistory } from '../data/sampleData';

interface MerchantPortalViewProps {
  currentMerchant: Merchant | null;
  allMerchants: Merchant[];
  onSwitchShop: (m: Merchant) => void;
}

const defaultMerchant = SAMPLE_MERCHANTS[0];
const defaultHistory = generateSampleHistory(defaultMerchant.latest_sales, defaultMerchant.latest_utilization, defaultMerchant.latest_bank_balance);

const INITIAL_MERCHANT_DATA = {
  merchant: defaultMerchant,
  ml_diagnostics: {
    risk_score: defaultMerchant.current_risk_score,
    risk_band: defaultMerchant.risk_band,
    anomaly_flag: defaultMerchant.anomaly_flag,
    deterioration_flag: defaultMerchant.deterioration_flag,
    top_drivers: [
      { label: "Credit Line Utilization", value: `${Math.round(defaultMerchant.latest_utilization * 100)}%`, risk_direction: "Elevating", shap_impact: 14.8 },
      { label: "Bank Cash Balance vs. Limit", value: `$${Math.round(defaultMerchant.latest_bank_balance).toLocaleString()}`, risk_direction: "Elevating", shap_impact: 11.2 },
      { label: "30-Day Sales Momentum", value: `$${Math.round(defaultMerchant.latest_sales).toLocaleString()}/d`, risk_direction: "Mitigating", shap_impact: -8.4 },
      { label: "Supplier Lead Time Stability", value: "2.4 Days Delay", risk_direction: "Mitigating", shap_impact: -4.1 }
    ],
    feature_vector: {
      credit_utilization_mean_30d: defaultMerchant.latest_utilization,
      bank_balance_mean_30d: defaultMerchant.latest_bank_balance,
      sales_mean_30d: defaultMerchant.latest_sales
    }
  },
  signal_history: defaultHistory,
  risk_history: defaultHistory.map((s, idx) => ({
    date: s.date,
    score: Math.round((defaultMerchant.current_risk_score + (Math.sin(idx * 0.4) * 6)) * 10) / 10,
    band: defaultMerchant.risk_band
  }))
};

export const MerchantPortalView: React.FC<MerchantPortalViewProps> = ({
  currentMerchant,
  allMerchants,
  onSwitchShop
}) => {
  const [merchantData, setMerchantData] = useState<any>(INITIAL_MERCHANT_DATA);
  const [loading, setLoading] = useState<boolean>(false);

  // Simulator state
  const [proposedLimit, setProposedLimit] = useState<number>(120000);
  const [repaymentFreq, setRepaymentFreq] = useState<string>('Weekly');
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [simLoading, setSimLoading] = useState<boolean>(false);

  // Copilot state
  const [copilotMessages, setCopilotMessages] = useState<Array<{ sender: 'user' | 'copilot'; text: string }>>([
    {
      sender: 'copilot',
      text: `Welcome to your Merchant Advisor! I am analyzing live financial signals for **${currentMerchant?.name || defaultMerchant.name}**. How can I help optimize your credit capacity or sales health today?`
    }
  ]);
  const [copilotInput, setCopilotInput] = useState<string>('');
  const [copilotLoading, setCopilotLoading] = useState<boolean>(false);

  // Active sub-tab
  const [activeView, setActiveView] = useState<'overview' | 'signals' | 'drivers' | 'simulator' | 'copilot'>('overview');

  const merchantId = currentMerchant?.id || (allMerchants.length > 0 ? allMerchants[0].id : 'MCH-1001');

  useEffect(() => {
    if (!merchantId) return;
    fetchMerchant360(merchantId)
      .then(data => {
        if (data?.merchant) {
          setMerchantData(data);
          if (data.merchant.base_credit_limit) {
            setProposedLimit(data.merchant.base_credit_limit);
          }
          setCopilotMessages([
            {
              sender: 'copilot',
              text: `Welcome to your Merchant Advisor! I am analyzing live financial signals for **${data.merchant.name}**. How can I help optimize your credit capacity or sales health today?`
            }
          ]);
        }
      })
      .catch(err => console.warn("Background merchant data fetch note:", err));
  }, [merchantId]);

  const handleSimulateTerms = async () => {
    if (!merchantId) return;
    setSimLoading(true);
    try {
      const res = await runSimulation({
        merchant_id: merchantId,
        proposed_credit_limit: proposedLimit,
        repayment_frequency: repaymentFreq,
        spending_restriction: false
      });
      setSimulationResult(res);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setSimLoading(false);
    }
  };

  const handleSendCopilot = async (customText?: string) => {
    const q = customText || copilotInput;
    if (!q.trim() || !merchantId || copilotLoading) return;

    setCopilotMessages(prev => [...prev, { sender: 'user', text: q }]);
    setCopilotInput('');
    setCopilotLoading(true);

    try {
      const res = await queryCopilot({
        merchant_id: merchantId,
        question: q
      });
      setCopilotMessages(prev => [...prev, { sender: 'copilot', text: res.answer }]);
    } catch (err) {
      setCopilotMessages(prev => [...prev, { 
        sender: 'copilot', 
        text: 'Sorry, I encountered an issue connecting to the AI financial model. Please try again.' 
      }]);
    } finally {
      setCopilotLoading(false);
    }
  };

  if (loading && !merchantData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 font-mono text-sm space-y-4">
        <Activity className="w-8 h-8 animate-spin text-indigo-400" />
        <div>Loading Your Merchant Shop Analytics &amp; Credit Signals...</div>
      </div>
    );
  }

  const m = merchantData?.merchant || currentMerchant;
  const signals = merchantData?.signal_history || [];
  const mlDiag = merchantData?.ml_diagnostics;
  const topDrivers = mlDiag?.top_drivers || [];

  const latestSignal = signals.length > 0 ? signals[signals.length - 1] : null;
  const creditLimit = m?.base_credit_limit || 150000;
  const utilizationRatio = latestSignal?.credit_utilization || 0.45;
  const usedCredit = creditLimit * utilizationRatio;
  const availableCredit = creditLimit - usedCredit;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Merchant Shop Header Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-[#0E1528] to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          {/* Shop Name & Metadata */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shadow-glow-emerald">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-100">{m?.name}</h1>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {m?.id}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active Merchant
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Sector: <span className="text-slate-200">{m?.sector}</span> • Region: <span className="text-slate-200">{m?.region}</span> • Onboarded: <span className="text-slate-200">{m?.onboarded_date}</span>
              </p>
            </div>
          </div>

          {/* Shop Switcher & PDF Certificate Button */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Quick Demo Shop Switcher */}
            <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs font-mono">
              <span className="text-slate-400 pl-2 hidden sm:inline">Switch Store:</span>
              <select
                value={m?.id}
                onChange={(e) => {
                  const found = allMerchants.find(item => item.id === e.target.value);
                  if (found) onSwitchShop(found);
                }}
                className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono"
              >
                {allMerchants.slice(0, 10).map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name} ({shop.id})
                  </option>
                ))}
              </select>
            </div>

            {/* PDF Report Download */}
            <a
              href={getReportDownloadUrl(m?.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-semibold transition-all active:scale-95 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Credit Certificate PDF</span>
            </a>

          </div>

        </div>
      </div>

      {/* 4 KPI Scorecards with 3D Tilt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Risk Health Score */}
        <Card3DTilt>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className={`p-3 rounded-2xl shrink-0 ${
                m?.current_risk_score > 70 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' 
                  : m?.current_risk_score > 40 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' 
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
              }`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400">Credit Risk Score</div>
                <div className={`text-2xl font-bold font-mono mt-0.5 ${
                  m?.current_risk_score > 70 ? 'text-rose-400' : m?.current_risk_score > 40 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {m?.current_risk_score} <span className="text-xs font-normal text-slate-500">/ 100</span>
                </div>
                <div className="text-[11px] font-mono font-semibold mt-0.5">
                  Standing: <span className="text-slate-200">{m?.risk_band}</span>
                </div>
              </div>
            </div>
          </div>
        </Card3DTilt>

        {/* Card 2: Approved Credit Limit */}
        <Card3DTilt>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400">Active Credit Line</div>
                <div className="text-2xl font-bold font-mono text-cyan-300 mt-0.5">
                  ${(creditLimit / 1000).toFixed(0)}k
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Available: <span className="text-emerald-400 font-bold">${(availableCredit / 1000).toFixed(1)}k</span>
                </div>
              </div>
            </div>
          </div>
        </Card3DTilt>

        {/* Card 3: 30-Day Mean Daily Sales */}
        <Card3DTilt>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/25 text-teal-400 shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400">Daily Sales Avg</div>
                <div className="text-2xl font-bold font-mono text-teal-300 mt-0.5">
                  ${latestSignal ? Math.round(latestSignal.sales).toLocaleString() : '4,850'}
                </div>
                <div className="text-[11px] font-mono text-teal-400 mt-0.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Healthy Trajectory</span>
                </div>
              </div>
            </div>
          </div>
        </Card3DTilt>

        {/* Card 4: Cash Reserves */}
        <Card3DTilt>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400">Cash Reserve Balance</div>
                <div className="text-2xl font-bold font-mono text-indigo-300 mt-0.5">
                  ${latestSignal ? Math.round(latestSignal.bank_balance).toLocaleString() : '68,200'}
                </div>
                <div className="text-[11px] font-mono text-indigo-400 mt-0.5">
                  Utilization: {Math.round(utilizationRatio * 100)}%
                </div>
              </div>
            </div>
          </div>
        </Card3DTilt>

      </div>

      {/* Main Content Layout: Left (Charts & Signals) + Right (AI Drivers & Simulator) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: 30-Day Sales & Cash Telemetry */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Sales & Cash Telemetry Chart */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/90">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span>30-Day Sales &amp; Cash Telemetry</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">Daily transaction revenue vs cash reserve cushion</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
                  <span className="text-slate-300">Sales ($)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                  <span className="text-slate-300">Bank Balance ($)</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signals} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00F5D4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00F5D4" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="bankGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#00F5D4" strokeWidth={2} fill="url(#salesGrad)" />
                  <Area type="monotone" dataKey="bank_balance" stroke="#6366F1" strokeWidth={2} fill="url(#bankGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Underwriting Feature Drivers (Plain Language for Merchant) */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/90">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>AI Underwriting Breakdown for Your Store</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">Key factors driving your current credit line qualification</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Transparent AI
              </span>
            </div>

            <div className="space-y-3">
              {topDrivers.length === 0 ? (
                <div className="text-xs text-slate-500 font-mono py-4 text-center">Loading AI SHAP telemetry...</div>
              ) : (
                topDrivers.map((driver: any, idx: number) => {
                  const isPositive = driver.risk_direction === 'Decreases Risk';
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                          <span>{driver.label}</span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {isPositive ? 'Strength' : 'Attention Area'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Current Metric Value: <span className="text-slate-200 font-bold">{driver.value}</span>
                        </p>
                      </div>

                      <div className="text-right sm:text-right shrink-0">
                        <span className={`text-xs font-mono font-bold ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isPositive ? '↓ Boosts Credit' : '↑ Increases Risk'}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          SHAP: {driver.shap_impact > 0 ? `+${driver.shap_impact}` : driver.shap_impact} pts
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Credit Limit Simulator & AI Merchant Advisor */}
        <div className="space-y-6">
          
          {/* Merchant Credit Limit Increase Simulator */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/90 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
              <Sliders className="w-4 h-4" />
              <span>TEST CREDIT ADJUSTMENT</span>
            </div>
            <h3 className="text-sm font-bold text-slate-100">
              Credit Limit &amp; Terms Simulator
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Test how a credit limit increase or repayment frequency change affects your risk rating.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Requested Limit:</span>
                  <span className="text-indigo-400 font-bold">${proposedLimit.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="400000"
                  step="10000"
                  value={proposedLimit}
                  onChange={(e) => setProposedLimit(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Repayment Schedule:</label>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  {['Daily', 'Weekly', 'Monthly'].map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setRepaymentFreq(freq)}
                      className={`py-1.5 rounded-xl border text-center transition-all ${
                        repaymentFreq === freq
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSimulateTerms}
                disabled={simLoading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all shadow-glow-emerald flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {simLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Running ML Re-Inference...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Simulate Approval Likelihood</span>
                  </>
                )}
              </button>

              {/* Simulation Result Card */}
              {simulationResult && (
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Simulated Score:</span>
                    <span className={`font-bold ${
                      simulationResult.simulated.risk_score > 70 ? 'text-rose-400' : simulationResult.simulated.risk_score > 40 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {simulationResult.simulated.risk_score} pts ({simulationResult.simulated.risk_band})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Approval Probability:</span>
                    <span className="text-teal-400 font-bold">
                      {Math.round((simulationResult.simulated.recovery_probability || 0.88) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Merchant Advisor Copilot */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/90 space-y-4 flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-teal-500/10 text-teal-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100">AI Merchant Advisor</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Grounded Financial Copilot</p>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                Online
              </span>
            </div>

            {/* Chat message bubbles */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {copilotMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-2xl leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600/30 text-indigo-100 border border-indigo-500/30 ml-6 text-right'
                      : 'bg-slate-900/90 text-slate-300 border border-slate-800 mr-4'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}
              {copilotLoading && (
                <div className="p-3 rounded-2xl bg-slate-900/90 text-slate-400 border border-slate-800 flex items-center gap-2 text-xs font-mono">
                  <Activity className="w-3.5 h-3.5 animate-spin text-teal-400" />
                  <span>Analyzing store telemetry...</span>
                </div>
              )}
            </div>

            {/* Prompt suggestion pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px] font-mono">
              <button
                type="button"
                onClick={() => handleSendCopilot("How can I qualify for a higher credit limit?")}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 whitespace-nowrap"
              >
                💡 Increase limit tips
              </button>
              <button
                type="button"
                onClick={() => handleSendCopilot("What is my biggest financial risk factor?")}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 whitespace-nowrap"
              >
                ⚠️ Top risk driver
              </button>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendCopilot();
              }}
              className="flex items-center gap-2 pt-1"
            >
              <input
                type="text"
                placeholder="Ask financial advisor..."
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50 font-mono"
              />
              <button
                type="submit"
                disabled={copilotLoading || !copilotInput.trim()}
                className="p-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black transition-all disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};
