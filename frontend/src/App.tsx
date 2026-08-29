import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ExecutiveDashboard } from './views/ExecutiveDashboard';
import { Merchant360 } from './views/Merchant360';
import { EarlyWarningCenter } from './views/EarlyWarningCenter';
import { DigitalTwinSimulator } from './views/DigitalTwinSimulator';
import { AICreditCopilot } from './views/AICreditCopilot';
import { AuditLogView } from './views/AuditLogView';
import { AuthModal } from './components/AuthModal';
import { advanceSimulationDay } from './api/client';
import { Merchant } from './types';
import { Play, Sparkles } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [simulatedDayCount, setSimulatedDayCount] = useState<number>(0);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [user, setUser] = useState<any>({
    username: 'officer_sarah',
    email: 'officer@fintrust.ai',
    role: 'Senior Credit Officer'
  });

  // Auto Day Advance Ticker Timer
  useEffect(() => {
    let interval: any = null;
    if (isAutoAdvancing) {
      interval = setInterval(() => {
        handleAdvanceDay();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isAutoAdvancing]);

  const handleAdvanceDay = async () => {
    try {
      const res = await advanceSimulationDay();
      setSimulatedDayCount(prev => prev + 1);
      showToast(`Simulation Day Advanced → ${res.new_date} (${res.merchants_updated} merchants updated live)`);
    } catch (err) {
      console.error("Advance day error:", err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSelectMerchant = (m: any) => {
    setSelectedMerchant(m);
    setActiveTab('merchant360');
  };

  const handleLaunchSimulator = (m: any) => {
    setSelectedMerchant(m);
    setActiveTab('simulator');
  };

  const handleLaunchCopilot = (m: any) => {
    setSelectedMerchant(m);
    setActiveTab('copilot');
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col font-sans">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 glass-panel-glow px-4 py-3 rounded-xl border border-teal-500/40 text-xs font-mono text-teal-300 flex items-center gap-2 shadow-2xl animate-bounce">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAdvanceDay={handleAdvanceDay}
        isAutoAdvancing={isAutoAdvancing}
        setIsAutoAdvancing={setIsAutoAdvancing}
        simulatedDayCount={simulatedDayCount}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => setUser(null)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <ExecutiveDashboard
            onSelectMerchant={handleSelectMerchant}
            simulatedDayCount={simulatedDayCount}
          />
        )}

        {activeTab === 'merchant360' && (
          <Merchant360
            selectedMerchantId={selectedMerchant?.id || null}
            onSelectMerchant={handleSelectMerchant}
            onLaunchSimulator={handleLaunchSimulator}
            onLaunchCopilot={handleLaunchCopilot}
          />
        )}

        {activeTab === 'earlywarning' && (
          <EarlyWarningCenter
            onSelectMerchant={handleSelectMerchant}
            onLaunchSimulator={handleLaunchSimulator}
            onLaunchCopilot={handleLaunchCopilot}
          />
        )}

        {activeTab === 'simulator' && (
          <DigitalTwinSimulator initialMerchant={selectedMerchant} />
        )}

        {activeTab === 'copilot' && (
          <AICreditCopilot initialMerchant={selectedMerchant} />
        )}

        {activeTab === 'audit' && (
          <AuditLogView />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(userData) => setUser(userData)}
      />

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-[#05070C] py-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            FinTrust AI — Continuous Merchant Financial Stress Radar & Grounded Copilot
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400 font-bold">XGBoost ML</span>
            <span>•</span>
            <span className="text-teal-400 font-bold">SHAP Explainability</span>
            <span>•</span>
            <span className="text-indigo-400 font-bold">Gemini/Groq LLM</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
