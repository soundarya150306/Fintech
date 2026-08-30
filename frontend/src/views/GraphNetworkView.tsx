import React, { useEffect, useState } from 'react';
import { Network, Activity, Filter, Eye, ShieldAlert, Sparkles, Sliders } from 'lucide-react';
import { Network3DGraph } from '../components/3D/Network3DGraph';
import { fetchMerchants } from '../api/client';
import { Merchant } from '../types';
import { SAMPLE_MERCHANTS } from '../data/sampleData';

interface GraphNetworkViewProps {
  onSelectMerchant: (m: Merchant) => void;
}

export const GraphNetworkView: React.FC<GraphNetworkViewProps> = ({ onSelectMerchant }) => {
  const [merchants, setMerchants] = useState<Merchant[]>(SAMPLE_MERCHANTS);
  const [loading, setLoading] = useState<boolean>(false);
  const [sectorFilter, setSectorFilter] = useState<string>('All');
  const [riskFilter, setRiskFilter] = useState<string>('All');

  useEffect(() => {
    fetchMerchants({ limit: 100 })
      .then(res => {
        if (res?.merchants?.length > 0) setMerchants(res.merchants);
      })
      .catch(err => console.warn("Graph network fetch note:", err));
  }, []);

  const filteredMerchants = merchants.filter(m => {
    const matchSector = sectorFilter === 'All' || m.sector === sectorFilter;
    const matchRisk = riskFilter === 'All' || m.risk_band === riskFilter;
    return matchSector && matchRisk;
  });

  const sectors = ['All', 'Electronics & Tech', 'Apparel & Fashion', 'Home & Living', 'FMCG & Groceries', 'Automotive & Spares'];
  const riskBands = ['All', 'Low Risk', 'Watchlist', 'Critical'];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-[#0C1324] to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-1">
            <Network className="w-4 h-4" />
            <span>3D SPATIAL TOPOLOGY ENGINE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            3D Graph Network &amp; Contagion Explorer
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Interactive merchant supply chain network • Real-time financial stress propagation
          </p>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sector select */}
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="bg-slate-900 text-slate-200 border border-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono"
          >
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Risk select */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-900 text-slate-200 border border-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono"
          >
            {riskBands.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Main 3D Graph Container */}
      <div className="w-full">
        <Network3DGraph 
          merchants={filteredMerchants} 
          onSelectMerchant={onSelectMerchant} 
        />
      </div>

      {/* Network Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs font-mono text-slate-400">Rendered Nodes</div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">{filteredMerchants.length} Active Merchants</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs font-mono text-slate-400">Contagion Edge Links</div>
          <div className="text-xl font-bold font-mono text-teal-400 mt-1">{Math.round(filteredMerchants.length * 2.4)} Dynamic Curves</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs font-mono text-slate-400">Pulsing Shockwaves</div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">
            {filteredMerchants.filter(m => m.risk_band === 'Critical').length} Critical Nodes
          </div>
        </div>
      </div>

    </div>
  );
};
