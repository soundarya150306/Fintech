import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Store, 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles
} from 'lucide-react';
import { Merchant } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userData: any, portalMode: 'admin' | 'merchant', selectedShopMerchant?: any) => void;
  merchants?: Merchant[];
}

const DEFAULT_DEMO_SHOPS: Merchant[] = [
  {
    id: "MCH-1001",
    name: "Aura Glow Beauty",
    sector: "Apparel & Fashion",
    region: "North America (US-West)",
    base_credit_limit: 120000,
    current_risk_score: 28.4,
    risk_band: "Low Risk",
    anomaly_flag: false,
    deterioration_flag: false,
    onboarded_date: "2025-11-12"
  },
  {
    id: "MCH-1002",
    name: "Apex Gear Store",
    sector: "Electronics & Retail",
    region: "Europe (EU-Central)",
    base_credit_limit: 250000,
    current_risk_score: 84.6,
    risk_band: "Critical",
    anomaly_flag: true,
    deterioration_flag: true,
    onboarded_date: "2025-08-04"
  },
  {
    id: "MCH-1003",
    name: "Zenith Home & Kitchen",
    sector: "Logistics & Wholesale",
    region: "Asia Pacific (APAC-South)",
    base_credit_limit: 180000,
    current_risk_score: 52.1,
    risk_band: "Watchlist",
    anomaly_flag: false,
    deterioration_flag: true,
    onboarded_date: "2026-01-19"
  },
  {
    id: "MCH-1004",
    name: "Nova Health Labs",
    sector: "Healthcare & Pharmacy",
    region: "North America (US-East)",
    base_credit_limit: 300000,
    current_risk_score: 19.8,
    risk_band: "Low Risk",
    anomaly_flag: false,
    deterioration_flag: false,
    onboarded_date: "2025-05-15"
  }
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  merchants = []
}) => {
  const [portalType, setPortalType] = useState<'admin' | 'merchant'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDemoShop, setSelectedDemoShop] = useState<string>('MCH-1001');

  if (!isOpen) return null;

  const demoShops = merchants.length >= 4 ? merchants.slice(0, 4) : DEFAULT_DEMO_SHOPS;

  const handleAdminDemoLogin = (role: 'officer' | 'admin') => {
    if (role === 'officer') {
      onLoginSuccess({
        username: 'officer_sarah',
        email: 'officer@fintrust.ai',
        role: 'Senior Credit Officer'
      }, 'admin');
    } else {
      onLoginSuccess({
        username: 'admin',
        email: 'admin@fintrust.ai',
        role: 'System Administrator'
      }, 'admin');
    }
    onClose();
  };

  const handleMerchantDemoLogin = (shopItem: Merchant) => {
    onLoginSuccess({
      username: shopItem.name,
      email: `owner@${shopItem.id.toLowerCase()}.com`,
      role: 'Merchant Shop Owner',
      merchantId: shopItem.id
    }, 'merchant', shopItem);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (portalType === 'admin') {
      onLoginSuccess({
        username: email.split('@')[0] || 'officer_sarah',
        email: email || 'officer@fintrust.ai',
        role: 'Senior Credit Officer'
      }, 'admin');
    } else {
      const shop = demoShops.find(m => m.id === selectedDemoShop) || demoShops[0];
      onLoginSuccess({
        username: shop.name,
        email: email || `owner@${shop.id.toLowerCase()}.com`,
        role: 'Merchant Shop Owner',
        merchantId: shop.id
      }, 'merchant', shop);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg glass-panel-glow rounded-3xl border border-slate-700/80 shadow-2xl p-6 sm:p-8 bg-[#0C1220]/95 overflow-hidden">
        
        {/* Glow ambient circle */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 mb-3 shadow-glow-teal">
            {portalType === 'admin' ? <ShieldCheck className="w-6 h-6" /> : <Store className="w-6 h-6 text-indigo-400" />}
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Sign In to FinTrust AI
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Select your portal to access credit risk radar or merchant shop analytics
          </p>
        </div>

        {/* Portal Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => setPortalType('admin')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
              portalType === 'admin'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Admin / Credit Officer</span>
          </button>

          <button
            type="button"
            onClick={() => setPortalType('merchant')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
              portalType === 'merchant'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store className="w-4 h-4 text-indigo-400" />
            <span>Merchant Shop Owner</span>
          </button>
        </div>

        {/* Quick 1-Click Demo Logins */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Instant Demo Access (Sample Database)</span>
            <span className="text-teal-400 flex items-center gap-1 font-bold">
              <Sparkles className="w-3 h-3" /> 1-Click Sign In
            </span>
          </div>

          {portalType === 'admin' ? (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleAdminDemoLogin('officer')}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-teal-500/40 text-left transition-all group shadow-sm"
              >
                <div className="text-xs font-bold text-slate-200 group-hover:text-teal-300">Officer Sarah</div>
                <div className="text-[10px] text-slate-400 font-mono">Senior Credit Officer</div>
                <div className="text-[9px] text-teal-400/80 mt-1 font-mono flex items-center gap-1">
                  Full 200 Merchant Suite →
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAdminDemoLogin('admin')}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-teal-500/40 text-left transition-all group shadow-sm"
              >
                <div className="text-xs font-bold text-slate-200 group-hover:text-teal-300">System Admin</div>
                <div className="text-[10px] text-slate-400 font-mono">Full Compliance &amp; ML</div>
                <div className="text-[9px] text-teal-400/80 mt-1 font-mono flex items-center gap-1">
                  Admin Master Suite →
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-slate-400">Select a demo merchant store:</div>
              <div className="grid grid-cols-2 gap-2">
                {demoShops.map((shop) => (
                  <button
                    key={shop.id}
                    type="button"
                    onClick={() => handleMerchantDemoLogin(shop)}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/40 text-left transition-all group shadow-sm"
                  >
                    <div className="text-xs font-bold text-slate-200 truncate group-hover:text-indigo-300">
                      {shop.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between mt-0.5">
                      <span>{shop.sector.split('&')[0]}</span>
                      <span className={shop.current_risk_score > 70 ? 'text-rose-400' : shop.current_risk_score > 40 ? 'text-amber-400' : 'text-emerald-400'}>
                        {shop.current_risk_score} pts
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Custom Credential Form */}
        <form onSubmit={handleCustomSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              {portalType === 'admin' ? 'Officer Email or Username' : 'Merchant Store Email'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={portalType === 'admin' ? "officer@fintrust.ai" : "owner@store.com"}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500/50 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500/50 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
              portalType === 'admin'
                ? 'bg-teal-500 hover:bg-teal-400 text-black shadow-glow-teal'
                : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-glow-emerald'
            }`}
          >
            <span>Enter {portalType === 'admin' ? 'Admin Portal' : 'Merchant Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
