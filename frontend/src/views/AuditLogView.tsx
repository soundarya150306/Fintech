import React, { useEffect, useState } from 'react';
import { FileText, ShieldCheck, Clock, Search, Activity } from 'lucide-react';
import { fetchAuditLogs } from '../api/client';
import { AuditLogItem } from '../types';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs()
      .then(res => setLogs(res.logs))
      .catch(err => console.error("Audit log fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900">
        <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mb-1">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>COMPLIANCE & TRACEABILITY AUDIT LOG</span>
        </div>
        <h1 className="text-xl font-bold text-slate-100">Decision & Simulation Audit Trail</h1>
        <p className="text-xs text-slate-400 mt-1">
          Every Digital Twin What-If simulation run and AI Copilot intervention query is cryptographically logged with officer timestamp for regulatory compliance.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-80 text-slate-400 font-mono text-sm">
          <Activity className="w-6 h-6 animate-spin text-teal-400 mr-2" />
          Querying audit database records...
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Timestamp (UTC)</th>
                  <th className="py-3.5 px-4 font-semibold">Credit Officer</th>
                  <th className="py-3.5 px-4 font-semibold">Action Type</th>
                  <th className="py-3.5 px-4 font-semibold">Merchant</th>
                  <th className="py-3.5 px-4 font-semibold">Diagnostic Parameters & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                    
                    <td className="py-3.5 px-4 text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {log.timestamp}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">{log.user_email}</td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                        log.action_type === 'SIMULATION' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                        log.action_type === 'COPILOT_QUERY' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {log.action_type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-semibold text-slate-200">{log.merchant_name || 'N/A'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{log.merchant_id}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 max-w-md">
                      <pre className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-900 overflow-x-auto whitespace-pre-wrap font-mono">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
