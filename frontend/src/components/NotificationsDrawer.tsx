import React from 'react';
import { ShieldAlert, AlertTriangle, Clock, ArrowUpRight, CheckCircle2, X } from 'lucide-react';
import { Merchant } from '../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: any[];
  onSelectMerchantById: (merchantId: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onSelectMerchantById
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-14 w-96 max-w-[95vw] z-50 glass-panel-glow rounded-2xl border border-slate-700/80 shadow-2xl p-4 animate-fade-in backdrop-blur-2xl bg-[#0F1626]/95">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Unacknowledged Alerts</h4>
            <p className="text-[10px] text-slate-400 font-mono">{alerts.length} Critical Events Require Review</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {alerts.length === 0 ? (
          <div className="py-8 text-center text-xs font-mono text-slate-500">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2 opacity-60" />
            No unacknowledged critical alerts. All portfolios healthy.
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => {
                onSelectMerchantById(alert.merchant_id);
                onClose();
              }}
              className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-teal-500/40 cursor-pointer transition-all hover:translate-x-1"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-slate-200">{alert.merchant_name || alert.merchant_id}</span>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                  alert.severity === 'High' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {alert.alert_type}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{alert.description}</p>
              <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {alert.date}
                </span>
                <span className="text-teal-400 flex items-center gap-0.5 font-medium">
                  Inspect 360° <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-800 text-center">
        <span className="text-[10px] font-mono text-slate-500">
          AI continuously senses stress signatures every 24 hours
        </span>
      </div>
    </div>
  );
};
