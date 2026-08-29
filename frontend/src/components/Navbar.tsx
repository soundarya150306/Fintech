import React from 'react';
import { 
  Radar, 
  LayoutDashboard, 
  Search, 
  AlertTriangle, 
  Sliders, 
  Bot, 
  FileText, 
  Play, 
  Pause, 
  UserCheck, 
  LogOut 
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAdvanceDay: () => void;
  isAutoAdvancing: boolean;
  setIsAutoAdvancing: React.Dispatch<React.SetStateAction<boolean>>;
  simulatedDayCount: number;
  user: any;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onAdvanceDay,
  isAutoAdvancing,
  setIsAutoAdvancing,
  simulatedDayCount,
  user,
  onOpenAuth,
  onLogout
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'merchant360', label: 'Merchant 360°', icon: Search },
    { id: 'earlywarning', label: 'Early Warning', icon: AlertTriangle },
    { id: 'simulator', label: 'What-If Simulator', icon: Sliders },
    { id: 'copilot', label: 'AI Copilot', icon: Bot },
    { id: 'audit', label: 'Audit & Compliance', icon: FileText }
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800 bg-[#070A10]/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <Radar className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-wide text-slate-100">FinTrust AI</span>
                <span className="text-[10px] font-mono uppercase bg-teal-500/10 text-teal-300 border border-teal-500/20 px-1.5 py-0.5 rounded">
                  Radar
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">AI-Powered Merchant Risk Monitor</p>
            </div>
          </div>

          {/* Simulation Ticker Control */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Simulated Day:</span>
            <span className="text-teal-400 font-bold">{simulatedDayCount}</span>
            
            <button
              onClick={onAdvanceDay}
              className="ml-2 px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 flex items-center gap-1 transition-all active:scale-95"
              title="Fast-forward time by 1 day to see how risk scores change"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Next Day</span>
            </button>

            <button
              onClick={() => setIsAutoAdvancing((prev) => !prev)}
              className={`p-1 rounded-lg border transition-all ${
                isAutoAdvancing 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title={isAutoAdvancing ? 'Pause auto day tick' : 'Start auto day tick timer'}
            >
              {isAutoAdvancing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* User Profile / Auth */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
                  <UserCheck className="w-4 h-4 text-teal-400" />
                  <div className="text-left">
                    <div className="font-semibold text-slate-200">{user.username}</div>
                    <div className="text-[10px] text-slate-400">{user.role}</div>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-semibold text-xs transition-all shadow-lg shadow-teal-500/20"
              >
                Sign In (Demo)
              </button>
            )}
          </div>

        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar border-t border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-md shadow-teal-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
};
