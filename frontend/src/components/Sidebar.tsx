import React from 'react';
import { 
  LayoutDashboard, 
  Search, 
  AlertTriangle, 
  Sliders, 
  Bot, 
  FileText, 
  Network, 
  Radar, 
  ShieldCheck, 
  Store, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  Award
} from 'lucide-react';

interface SidebarProps {
  portalMode: 'admin' | 'merchant';
  setPortalMode: (mode: 'admin' | 'merchant') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  unreadAlertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  portalMode,
  setPortalMode,
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  unreadAlertCount
}) => {
  // Admin Navigation (Clean, Professional, No Tier Bloat)
  const adminNavSections = [
    {
      group: 'PORTFOLIO & RADAR',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, badge: null },
        { id: 'merchant360', label: 'Merchant Portfolio 360°', icon: Search, badge: null }
      ]
    },
    {
      group: '3D SPATIAL ENGINES',
      items: [
        { id: 'graph3d', label: '3D Contagion Network', icon: Network, badge: '3D WebGL' },
        { id: 'radar3d', label: '3D Spatial Stress Radar', icon: Radar, badge: '3D' }
      ]
    },
    {
      group: 'AI RISK & DIGITAL TWIN',
      items: [
        { id: 'earlywarning', label: 'Early Warning Radar', icon: AlertTriangle, badge: unreadAlertCount > 0 ? `${unreadAlertCount}` : null },
        { id: 'simulator', label: 'Digital Twin Simulator', icon: Sliders, badge: 'AI' },
        { id: 'copilot', label: 'AI Credit Copilot', icon: Bot, badge: '24/7' },
        { id: 'audit', label: 'Audit & Compliance', icon: FileText, badge: null }
      ]
    }
  ];

  // Merchant Portal Navigation
  const merchantNavSections = [
    {
      group: 'MY STORE',
      items: [
        { id: 'merchant_dashboard', label: 'Shop Overview', icon: Store, badge: null },
        { id: 'merchant_signals', label: '30-Day Signals', icon: Activity, badge: null }
      ]
    },
    {
      group: 'AI UNDERWRITING',
      items: [
        { id: 'merchant_drivers', label: 'AI Risk & SHAP Factors', icon: ShieldCheck, badge: 'AI' },
        { id: 'merchant_simulator', label: 'Credit Limit Simulator', icon: Sliders, badge: 'Sim' },
        { id: 'merchant_copilot', label: 'AI Merchant Advisor', icon: Bot, badge: '24/7' },
        { id: 'merchant_report', label: 'Credit Certificate', icon: Award, badge: 'PDF' }
      ]
    }
  ];

  const currentSections = portalMode === 'admin' ? adminNavSections : merchantNavSections;

  return (
    <aside
      className={`glass-sidebar fixed top-0 left-0 bottom-0 z-40 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
        <div 
          onClick={() => {
            if (portalMode === 'admin') setActiveTab('dashboard');
            else setActiveTab('merchant_dashboard');
          }}
          className="flex items-center gap-3 cursor-pointer overflow-hidden"
        >
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 shrink-0 shadow-glow-teal">
            <Radar className="w-5 h-5 animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-wide text-slate-100">FinTrust AI</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono truncate">Financial Stress Radar</p>
            </div>
          )}
        </div>
      </div>

      {/* Role Badge Indicator */}
      {!isCollapsed && (
        <div className="px-4 pt-3 pb-1">
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${portalMode === 'admin' ? 'bg-teal-400 shadow-glow-teal animate-pulse' : 'bg-indigo-400 shadow-glow-emerald animate-pulse'}`} />
              <span className="text-[11px] font-mono font-semibold text-slate-200">
                {portalMode === 'admin' ? 'Credit Officer' : 'Shop Owner'}
              </span>
            </div>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
              portalMode === 'admin' ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20' : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
            }`}>
              {portalMode === 'admin' ? 'Admin Portal' : 'Merchant'}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 no-scrollbar">
        {currentSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                {section.group}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item: any) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                      isSelected
                        ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isSelected ? 'text-teal-400' : 'text-slate-400'
                    }`} />
                    
                    {!isCollapsed && (
                      <div className="flex-1 text-left truncate flex items-center justify-between">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ml-1 ${
                            item.badge === '3D WebGL' || item.badge === '3D' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                            item.badge === 'AI' || item.badge === '24/7' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                            item.badge === 'PDF' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Switcher & Collapse Button */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        <button
          onClick={() => {
            const nextMode = portalMode === 'admin' ? 'merchant' : 'admin';
            setPortalMode(nextMode);
            setActiveTab(nextMode === 'admin' ? 'dashboard' : 'merchant_dashboard');
          }}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-slate-100 transition-all shadow-md"
        >
          {portalMode === 'admin' ? (
            <>
              <Store className="w-4 h-4 text-indigo-400" />
              {!isCollapsed && <span>Switch to Merchant Portal</span>}
            </>
          ) : (
            <>
              <LayoutDashboard className="w-4 h-4 text-teal-400" />
              {!isCollapsed && <span>Switch to Admin Portal</span>}
            </>
          )}
        </button>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

    </aside>
  );
};
