const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchDashboardSummary() {
  const res = await fetch(`${API_BASE}/dashboard/summary`);
  if (!res.ok) throw new Error('Failed to fetch dashboard summary');
  return res.json();
}

export async function fetchMerchants(params?: {
  search?: string;
  risk_band?: string;
  sector?: string;
  anomaly_only?: boolean;
  deterioration_only?: boolean;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.risk_band) query.append('risk_band', params.risk_band);
  if (params?.sector) query.append('sector', params.sector);
  if (params?.anomaly_only) query.append('anomaly_only', 'true');
  if (params?.deterioration_only) query.append('deterioration_only', 'true');
  if (params?.limit) query.append('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/merchants?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch merchants');
  return res.json();
}

export async function fetchMerchant360(merchantId: string) {
  const res = await fetch(`${API_BASE}/merchants/${merchantId}`);
  if (!res.ok) throw new Error(`Failed to fetch merchant ${merchantId}`);
  return res.json();
}

export async function fetchEarlyWarning(days = 14) {
  const res = await fetch(`${API_BASE}/early-warning?days=${days}`);
  if (!res.ok) throw new Error('Failed to fetch early warning data');
  return res.json();
}

export async function runSimulation(data: {
  merchant_id: string;
  proposed_credit_limit?: number;
  repayment_frequency?: string;
  spending_restriction?: boolean;
}) {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Simulation failed');
  return res.json();
}

export async function queryCopilot(data: { merchant_id: string; question: string }) {
  const res = await fetch(`${API_BASE}/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Copilot query failed');
  return res.json();
}

export async function advanceSimulationDay() {
  const res = await fetch(`${API_BASE}/simulation/advance-day`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to advance day');
  return res.json();
}

export async function fetchAuditLogs() {
  const res = await fetch(`${API_BASE}/audit-logs`);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export function getReportDownloadUrl(merchantId: string) {
  return `${API_BASE}/merchants/${merchantId}/report`;
}
