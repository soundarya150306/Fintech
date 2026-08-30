import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Play, 
  Pause, 
  UserCheck, 
  LogOut, 
  ShieldCheck, 
  Sparkles, 
  Store, 
  LayoutDashboard,
  Calendar,
  Layers
} from 'lucide-react';
import { NotificationsDrawer } from './NotificationsDrawer';

interface NavbarProps {
  portalMode: 'admin' | 'merchant';
  setPortalMode: (mode: 'admin' | 'merchant') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAdvanceDay: () => void;
  isAutoAdvancing: boolean;
  setIsAutoAdvancing: React.Dispatch<React.SetStateAction<boolean>>;
  simulatedDayCount: number;
  user: any;
  onOpenAuth: () => void;
  onLogout: () => void;
  alerts: any[];
  onSelectMerchantById: (mId: string) => void;
  selectedMerchant: any;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isCollapsed: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  portalMode,
  setPortalMode,
  activeTab,
  setActiveTab,
  onAdvanceDay,
  isAutoAdvancing,
  setIsAutoAdvancing,
  simulatedDayCount,
  user,
  onOpenAuth,
  onLogout,
  alerts,
  onSelectMerchantById,
  selectedMerchant,
  searchTerm,
  setSearchTerm,
  isCollapsed
}) => {
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className={`glass-topbar sticky top-0 z-30 h-16 transition-all duration-300 ${
      isCollapsed ? 'pl-20' : 'pl-64'
    }`}>
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        
        {/* Left: Breadcrumbs & Status Tag */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 truncate">
            <span className="text-slate-200 font-semibold truncate hidden sm:inline">
              FinTrust AI — SCF Fraud &amp; Stress Detection
            </span>
            <span className="hidden sm:inline text-slate-600">/</span>
            <span className="text-teal-400 capitalize font-medium truncate">
              {portalMode === 'admin' ? (
                activeTab === 'graph3d' ? '3D Contagion Network' :
                activeTab === 'radar3d' ? '3D Spatial Stress Radar' :
                activeTab === 'merchant360' ? 'Merchant Portfolio 360°' :
                activeTab === 'earlywarning' ? 'Early Warning Radar' :
                activeTab === 'simulator' ? 'Digital Twin Simulator' :
                activeTab === 'copilot' ? 'AI Credit Copilot' :
                activeTab === 'audit' ? 'Audit & Compliance' : 'Executive Dashboard'
              ) : (selectedMerchant?.name || 'Shop Portal')}
            </span>
          </div>

          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 hidden md:inline-flex items-center gap-1 ${
            portalMode === 'admin' 
              ? 'bg-teal-500/10 text-teal-300 border-teal-500/25' 
              : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${portalMode === 'admin' ? 'bg-teal-400' : 'bg-indigo-400'}`}></span>
            {portalMode === 'admin' ? 'Risk Analyst Mode' : 'Merchant Mode'}
          </span>
        </div>

        {/* Center/Right: Quick Search */}
        <div className="hidden lg:flex items-center flex-1 max-w-xs relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder={portalMode === 'admin' ? "Search merchants (Ctrl+K)..." : "Search store signals..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50 transition-colors font-mono"
          />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Time Simulation Ticker (Admin) */}
          {portalMode === 'admin' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
              <Calendar className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              <span className="text-slate-400 text-[11px] hidden sm:inline">Day:</span>
              <span className="text-teal-400 font-bold">{simulatedDayCount}</span>

              <button
                onClick={onAdvanceDay}
                className="ml-1.5 px-2 py-0.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 flex items-center gap-1 text-[11px] font-medium transition-all active:scale-95"
                title="Advance simulation by 1 day"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>Next Day</span>
              </button>

              <button
                onClick={() => setIsAutoAdvancing(prev => !prev)}
                className={`p-1 rounded-lg border transition-all ${
                  isAutoAdvancing 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
                title={isAutoAdvancing ? 'Pause auto day ticker' : 'Start auto day ticker'}
              >
                {isAutoAdvancing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
            </div>
          )}

          {/* Portal Switcher Button */}
          <button
            onClick={() => setPortalMode(portalMode === 'admin' ? 'merchant' : 'admin')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-slate-900 border border-slate-800 hover:border-teal-500/40 text-slate-300 hover:text-slate-100 transition-all"
            title="Switch between Admin / Underwriter and Merchant Shop Portal"
          >
            {portalMode === 'admin' ? (
              <>
                <Store className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Merchant Portal</span>
              </>
            ) : (
              <>
                <LayoutDashboard className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">Admin Portal</span>
              </>
            )}
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 relative transition-all"
              title="View active stress & fraud alerts"
            >
              <Bell className="w-4 h-4" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {alerts.length}
                </span>
              )}
            </button>

            <NotificationsDrawer
              isOpen={isAlertsOpen}
              onClose={() => setIsAlertsOpen(false)}
              alerts={alerts}
              onSelectMerchantById={onSelectMerchantById}
            />
          </div>

          {/* User Profile / Auth */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-xs transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden md:block pr-1">
                  <div className="font-semibold text-slate-200 leading-tight">{user.username}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{user.role}</div>
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 glass-panel-glow rounded-xl border border-slate-700/80 shadow-2xl p-2 z-50 animate-fade-in bg-[#0F1626]/95">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <div className="font-semibold text-xs text-slate-200">{user.username}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onOpenAuth();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 rounded-lg flex items-center gap-2"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                      <span>Switch Account</span>
                    </button>
                    <button
                      onClick={() => {
                        onLogout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-semibold text-xs transition-all shadow-glow-teal"
            >
              Sign In
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
