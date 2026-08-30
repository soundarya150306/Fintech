import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ExecutiveDashboard } from './views/ExecutiveDashboard';
import { MerchantPortalView } from './views/MerchantPortalView';
import { Merchant360 } from './views/Merchant360';
import { EarlyWarningCenter } from './views/EarlyWarningCenter';
import { DigitalTwinSimulator } from './views/DigitalTwinSimulator';
import { AICreditCopilot } from './views/AICreditCopilot';
import { AuditLogView } from './views/AuditLogView';
import { GraphNetworkView } from './views/GraphNetworkView';
import { AuthModal } from './components/AuthModal';
import { advanceSimulationDay, fetchMerchants, fetchDashboardSummary } from './api/client';
import { Merchant } from './types';
import { Sparkles } from 'lucide-react';

export function App() {
  // Dual Portals: 'admin' | 'merchant'
  const [portalMode, setPortalMode] = useState<'admin' | 'merchant'>('admin');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Selection and filter state
  const [allMerchants, setAllMerchants] = useState<Merchant[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Simulation & time state
  const [simulatedDayCount, setSimulatedDayCount] = useState<number>(0);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Layout & Search state
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Auth state
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [user, setUser] = useState<any>({
    username: 'officer_sarah',
    email: 'officer@fintrust.ai',
    role: 'Senior Credit Officer'
  });

  // Initial load
  useEffect(() => {
    fetchMerchants({ limit: 100 })
      .then(res => {
        setAllMerchants(res.merchants);
        if (res.merchants.length > 0 && !selectedMerchant) {
          setSelectedMerchant(res.merchants[0]);
        }
      })
      .catch(err => console.error("Initial load error:", err));

    fetchDashboardSummary()
      .then(sum => {
        if (sum?.active_alerts) setAlerts(sum.active_alerts);
      })
      .catch(err => console.error("Summary error:", err));
  }, []);

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
      
      // Refresh merchants
      const mRes = await fetchMerchants({ limit: 100 });
      setAllMerchants(mRes.merchants);
      const sumRes = await fetchDashboardSummary();
      if (sumRes?.active_alerts) setAlerts(sumRes.active_alerts);
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

  const handleSelectMerchant = (m: Merchant) => {
    setSelectedMerchant(m);
    if (portalMode === 'admin') {
      setActiveTab('merchant360');
    }
  };

  const handleSelectMerchantById = (mId: string) => {
    const found = allMerchants.find(m => m.id === mId);
    if (found) {
      setSelectedMerchant(found);
      setActiveTab('merchant360');
    }
  };

  const handleLaunchSimulator = (m: any) => {
    setSelectedMerchant(m);
    setActiveTab('simulator');
  };

  const handleLaunchCopilot = (m: any) => {
    setSelectedMerchant(m);
    setActiveTab('copilot');
  };

  const handleLoginSuccess = (userData: any, newPortalMode: 'admin' | 'merchant', selectedShopMerchant?: any) => {
    setUser(userData);
    setPortalMode(newPortalMode);
    if (selectedShopMerchant) {
      setSelectedMerchant(selectedShopMerchant);
    }
    if (newPortalMode === 'admin') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('merchant_dashboard');
    }
    showToast(`Signed in successfully as ${userData.username} (${userData.role})`);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 glass-panel-glow px-4 py-3 rounded-2xl border border-teal-500/40 text-xs font-mono text-teal-300 flex items-center gap-2 shadow-2xl animate-bounce">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        portalMode={portalMode}
        setPortalMode={setPortalMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        unreadAlertCount={alerts.length}
      />

      {/* Top Navbar */}
      <Navbar
        portalMode={portalMode}
        setPortalMode={setPortalMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAdvanceDay={handleAdvanceDay}
        isAutoAdvancing={isAutoAdvancing}
        setIsAutoAdvancing={setIsAutoAdvancing}
        simulatedDayCount={simulatedDayCount}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => {
          setUser(null);
          showToast("Signed out successfully");
        }}
        alerts={alerts}
        onSelectMerchantById={handleSelectMerchantById}
        selectedMerchant={selectedMerchant}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isCollapsed={isCollapsed}
      />

      {/* Main Container Area */}
      <main className={`flex-1 transition-all duration-300 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto ${
        isCollapsed ? 'md:pl-24' : 'md:pl-72'
      }`}>
        
        {/* === ADMIN PORTAL VIEWS === */}
        {portalMode === 'admin' && (
          <>
            {(activeTab === 'dashboard' || activeTab === 'radar3d') && (
              <ExecutiveDashboard
                onSelectMerchant={handleSelectMerchant}
                simulatedDayCount={simulatedDayCount}
                onNavigateToTab={setActiveTab}
              />
            )}

            {activeTab === 'graph3d' && (
              <GraphNetworkView
                onSelectMerchant={handleSelectMerchant}
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
          </>
        )}

        {/* === MERCHANT SHOP OWNER PORTAL VIEWS === */}
        {portalMode === 'merchant' && (
          <MerchantPortalView
            currentMerchant={selectedMerchant}
            allMerchants={allMerchants}
            onSwitchShop={(m) => setSelectedMerchant(m)}
          />
        )}

      </main>

      {/* Auth Modal with Dual Portal Selection */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        merchants={allMerchants}
      />

      {/* Global Clean Footer */}
      <footer className={`border-t border-slate-900 bg-[#070A10] py-6 text-center text-xs font-mono text-slate-500 transition-all duration-300 ${
        isCollapsed ? 'md:pl-20' : 'md:pl-64'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            FinTrust AI — Continuous Merchant Financial Stress Radar &amp; Grounded Copilot
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-emerald-400 font-bold">XGBoost ML</span>
            <span>•</span>
            <span className="text-teal-400 font-bold">SHAP Explainability</span>
            <span>•</span>
            <span className="text-indigo-400 font-bold">3D WebGL Engine</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
