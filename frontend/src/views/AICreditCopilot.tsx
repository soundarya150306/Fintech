import React, { useEffect, useState } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  ShieldCheck, 
  Activity, 
  Building2, 
  HelpCircle 
} from 'lucide-react';
import { fetchMerchants, queryCopilot } from '../api/client';
import { Merchant } from '../types';

interface Message {
  sender: 'user' | 'copilot';
  text: string;
  provider?: string;
  grounded_sources?: any;
}

interface AICreditCopilotProps {
  initialMerchant?: any;
}

export const AICreditCopilot: React.FC<AICreditCopilotProps> = ({ initialMerchant }) => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMerchants({ limit: 100 }).then(res => {
      setMerchants(res.merchants);
      if (initialMerchant?.id) {
        setSelectedMerchantId(initialMerchant.id);
      } else if (res.merchants.length > 0) {
        setSelectedMerchantId(res.merchants[0].id);
      }
    });
  }, [initialMerchant]);

  const activeMerchant = merchants.find(m => m.id === selectedMerchantId);

  useEffect(() => {
    if (activeMerchant) {
      setMessages([
        {
          sender: 'copilot',
          text: `Hello! I am FinTrust AI Credit Copilot. I have loaded real 30-day time-series signals and exact SHAP risk drivers for **${activeMerchant.name} (${activeMerchant.id})**.\n\nCurrent Risk Score: **${activeMerchant.current_risk_score}/100** (${activeMerchant.risk_band}). How can I assist with credit intervention?`,
          provider: 'FinTrust Grounded Engine'
        }
      ]);
    }
  }, [selectedMerchantId]);

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim() || !selectedMerchantId || loading) return;

    const userMsg: Message = { sender: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setLoading(true);

    try {
      const res = await queryCopilot({
        merchant_id: selectedMerchantId,
        question: q
      });

      const copilotMsg: Message = {
        sender: 'copilot',
        text: res.answer,
        provider: res.provider,
        grounded_sources: res.grounded_sources
      };
      setMessages(prev => [...prev, copilotMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'copilot',
        text: 'Error processing copilot query. Please try again.',
        provider: 'System Error'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Why did this merchant's financial stress score increase?",
    "Should we raise or lower their credit limit?",
    "What is the primary SHAP risk driver affecting repayment?",
    "Recommend the safest credit restructuring intervention."
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-1">
              <Bot className="w-4 h-4" />
              <span>GROUNDED LLM COPILOT • GOOGLE GEMINI 1.5 FLASH / GROQ FALLBACK</span>
            </div>
            <h1 className="text-xl font-bold text-slate-100">AI Credit Copilot</h1>
            <p className="text-xs text-slate-400 mt-1">
              Ask natural language questions about any merchant. The Copilot injects real SHAP feature drivers & time-series signals into prompt context.
            </p>
          </div>

          {/* Merchant Selector */}
          <div className="w-full md:w-64">
            <select
              value={selectedMerchantId}
              onChange={(e) => setSelectedMerchantId(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500/50"
            >
              {merchants.map(m => (
                <option key={m.id} value={m.id}>
                  {m.id} — {m.name} ({m.risk_band})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col h-[520px] overflow-hidden">
        
        {/* Messages Scroll Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === 'user' ? 'bg-teal-500 text-black' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`p-4 rounded-2xl text-xs space-y-2 leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-teal-500/10 border border-teal-500/30 text-slate-100'
                  : 'bg-slate-900 border border-slate-800 text-slate-200'
              }`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {msg.provider && (
                  <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                    <span>Provider: <strong className="text-slate-400">{msg.provider}</strong></span>
                    {msg.grounded_sources && (
                      <span>Score Grounded: {msg.grounded_sources.risk_score} / 100</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 text-xs text-slate-400 font-mono items-center">
              <Bot className="w-5 h-5 text-indigo-400 animate-spin" />
              <span>Grounding merchant signals and generating LLM diagnostic...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] whitespace-nowrap transition-all"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3">
          <input
            type="text"
            placeholder={`Ask Copilot about ${activeMerchant?.name || 'merchant'}...`}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500/50 font-sans"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !inputQuery.trim()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>

      </div>

    </div>
  );
};
