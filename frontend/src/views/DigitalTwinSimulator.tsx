import React, { useEffect, useState } from 'react';
import { 
  Sliders, 
  Play, 
  ArrowRight, 
  RotateCcw, 
  Activity, 
  ShieldCheck, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { fetchMerchants, runSimulation } from '../api/client';
import { Merchant, SimulationResult } from '../types';

interface DigitalTwinSimulatorProps {
  initialMerchant?: any;
}

export const DigitalTwinSimulator: React.FC<DigitalTwinSimulatorProps> = ({ initialMerchant }) => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');
  const [proposedLimit, setProposedLimit] = useState<number>(100000);
  const [repaymentFreq, setRepaymentFreq] = useState<string>('Weekly');
  const [spendingRestriction, setSpendingRestriction] = useState<boolean>(false);
  
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchMerchants({ limit: 100 }).then(res => {
      setMerchants(res.merchants);
      if (initialMerchant?.id) {
        setSelectedMerchantId(initialMerchant.id);
        setProposedLimit(initialMerchant.base_credit_limit || 100000);
      } else if (res.merchants.length > 0) {
        setSelectedMerchantId(res.merchants[0].id);
        setProposedLimit(res.merchants[0].base_credit_limit);
      }
    });
  }, [initialMerchant]);

  const activeMerchant = merchants.find(m => m.id === selectedMerchantId);

  const handleSelectMerchant = (mId: string) => {
    setSelectedMerchantId(mId);
    const m = merchants.find(item => item.id === mId);
    if (m) {
      setProposedLimit(m.base_credit_limit);
    }
  };

  const handleRunSimulation = async () => {
    if (!selectedMerchantId) return;
    setLoading(true);
    try {
      const result = await runSimulation({
        merchant_id: selectedMerchantId,
        proposed_credit_limit: proposedLimit,
        repayment_frequency: repaymentFreq,
        spending_restriction: spendingRestriction
      });
      setSimulationResult(result);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-teal-500/20 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900">
        <div className="flex items-center gap-3 text-xs font-mono text-teal-400 mb-1">
          <Sliders className="w-4 h-4" />
          <span>WHAT-IF SIMULATOR • AI PREDICTIONS</span>
        </div>
        <h1 className="text-xl font-bold text-slate-100">What-If Simulator</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Test how changing a merchant's credit limit, repayment terms, or spending rules affects their risk of default. Our AI will re-calculate their risk score instantly based on your proposed changes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Simulator Control Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 lg:col-span-1">
          <h2 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-400" />
            <span>Scenario Parameters</span>
          </h2>

          {/* Merchant Select */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400">Target Merchant</label>
            <select
              value={selectedMerchantId}
              onChange={(e) => handleSelectMerchant(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-500/50"
            >
              {merchants.map(m => (
                <option key={m.id} value={m.id}>
                  {m.id} — {m.name} ({m.risk_band})
                </option>
              ))}
            </select>
          </div>

          {activeMerchant && (
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono space-y-1">
              <div className="text-slate-400">Current Base Limit: <strong className="text-slate-200">${activeMerchant.base_credit_limit.toLocaleString()}</strong></div>
              <div className="text-slate-400">Current Stress Index: <strong className="text-teal-400">{activeMerchant.current_risk_score} / 100</strong></div>
            </div>
          )}

          {/* Credit Limit Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Proposed Base Credit Limit</span>
              <span className="font-bold text-teal-400">${proposedLimit.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="10000"
              max="500000"
              step="5000"
              value={proposedLimit}
              onChange={(e) => setProposedLimit(Number(e.target.value))}
              className="w-full accent-teal-400 bg-slate-900 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>$10,000</span>
              <span>$250,000</span>
              <span>$500,000</span>
            </div>
          </div>

          {/* Repayment Frequency */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400">Repayment Settlement Frequency</label>
            <div className="grid grid-cols-3 gap-2">
              {['Daily', 'Weekly', 'Monthly'].map(freq => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setRepaymentFreq(freq)}
                  className={`py-2 rounded-xl text-xs font-mono font-semibold transition-all border ${
                    repaymentFreq === freq
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-md shadow-teal-500/10'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          {/* Spending Restrictions Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-200">Merchant Spending Restriction</div>
              <div className="text-[10px] text-slate-400">Freeze high-risk category disbursements</div>
            </div>
            <input
              type="checkbox"
              checked={spendingRestriction}
              onChange={(e) => setSpendingRestriction(e.target.checked)}
              className="w-4 h-4 accent-teal-400 cursor-pointer"
            />
          </div>

          {/* Execute Button */}
          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Activity className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>Run Simulation</span>
          </button>

        </div>

        {/* Simulation Output Comparison Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 lg:col-span-2 space-y-6">
          
          <h2 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3">
            Simulated Before vs After Diagnostics
          </h2>

          {!simulationResult ? (
            <div className="flex flex-col items-center justify-center h-80 text-slate-500 font-mono text-xs space-y-2">
              <Sliders className="w-8 h-8 text-slate-600 animate-pulse" />
              <span>Adjust parameters and click "Run Digital Twin Re-Inference"</span>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Score Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Baseline Card */}
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">Baseline Model State</div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold font-mono text-slate-200">
                        {simulationResult.baseline.risk_score}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">Stress Index</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                      simulationResult.baseline.risk_band === 'Critical' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {simulationResult.baseline.risk_band}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-xs font-mono text-slate-400">
                    Credit Limit: <strong>${simulationResult.baseline.credit_limit.toLocaleString()}</strong> • Util: <strong>{simulationResult.baseline.utilization}%</strong>
                  </div>
                </div>

                {/* Simulated Projected Card */}
                <div className={`p-5 rounded-2xl border space-y-3 ${
                  simulationResult.simulated.score_delta < 0 ? 'bg-teal-500/5 border-teal-500/30' : 'bg-rose-500/5 border-rose-500/30'
                }`}>
                  <div className="text-xs text-teal-400 font-mono uppercase tracking-wider flex items-center justify-between">
                    <span>Projected Model Outcome</span>
                    <span className={`font-bold ${simulationResult.simulated.score_delta < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {simulationResult.simulated.score_delta < 0 ? `${simulationResult.simulated.score_delta} pts` : `+${simulationResult.simulated.score_delta} pts`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-3xl font-bold font-mono ${
                        simulationResult.simulated.risk_score > 70 ? 'text-rose-400' : simulationResult.simulated.risk_score > 40 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {simulationResult.simulated.risk_score}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">Projected Stress Index</div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                      simulationResult.simulated.risk_band === 'Critical' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {simulationResult.simulated.risk_band}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 text-xs font-mono text-slate-400">
                    Proposed Limit: <strong>${simulationResult.simulated.proposed_credit_limit.toLocaleString()}</strong> • Util: <strong>{simulationResult.simulated.utilization}%</strong>
                  </div>
                </div>

              </div>

              {/* Recovery Probability Gauge */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Projected Recovery Probability</div>
                  <div className="text-[11px] text-slate-400">Calculated likelihood of returning to healthy stress band</div>
                </div>
                <div className="text-2xl font-bold font-mono text-teal-400">
                  {simulationResult.simulated.recovery_probability}%
                </div>
              </div>

              {/* Simulated Top SHAP Drivers */}
              <div>
                <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
                  Re-Inferred SHAP Risk Drivers Under Scenario
                </h3>
                <div className="space-y-2">
                  {simulationResult.simulated.top_drivers.map((d, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">{d.label}</span>
                      <span className={d.shap_impact > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                        SHAP: {d.shap_impact > 0 ? `+${d.shap_impact}` : d.shap_impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
