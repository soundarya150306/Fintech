import { Merchant } from '../types';

export const SAMPLE_MERCHANTS: Merchant[] = [
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
    onboarded_date: "2025-11-12",
    latest_sales: 18450.0,
    latest_utilization: 0.32,
    latest_bank_balance: 54200.0
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
    onboarded_date: "2025-08-04",
    latest_sales: 7200.0,
    latest_utilization: 0.94,
    latest_bank_balance: 9100.0
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
    onboarded_date: "2026-01-19",
    latest_sales: 11400.0,
    latest_utilization: 0.68,
    latest_bank_balance: 28400.0
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
    onboarded_date: "2025-05-15",
    latest_sales: 29800.0,
    latest_utilization: 0.22,
    latest_bank_balance: 89000.0
  },
  {
    id: "MCH-1005",
    name: "Velocity Auto Parts",
    sector: "Auto Parts & Services",
    region: "Latin America (LATAM-BR)",
    base_credit_limit: 150000,
    current_risk_score: 79.2,
    risk_band: "Critical",
    anomaly_flag: true,
    deterioration_flag: false,
    onboarded_date: "2025-10-30",
    latest_sales: 5800.0,
    latest_utilization: 0.88,
    latest_bank_balance: 12300.0
  },
  {
    id: "MCH-1006",
    name: "Pulse Organic Foods",
    sector: "Food & Beverage",
    region: "North America (US-Central)",
    base_credit_limit: 140000,
    current_risk_score: 34.5,
    risk_band: "Low Risk",
    anomaly_flag: false,
    deterioration_flag: false,
    onboarded_date: "2025-12-01",
    latest_sales: 16200.0,
    latest_utilization: 0.41,
    latest_bank_balance: 42000.0
  },
  {
    id: "MCH-1007",
    name: "CloudScale SaaS Solutions",
    sector: "Digital Goods & SaaS",
    region: "Europe (UK-West)",
    base_credit_limit: 400000,
    current_risk_score: 22.1,
    risk_band: "Low Risk",
    anomaly_flag: false,
    deterioration_flag: false,
    onboarded_date: "2025-07-20",
    latest_sales: 44000.0,
    latest_utilization: 0.18,
    latest_bank_balance: 145000.0
  },
  {
    id: "MCH-1008",
    name: "Titan Industrial Tools",
    sector: "Logistics & Wholesale",
    region: "North America (US-Midwest)",
    base_credit_limit: 220000,
    current_risk_score: 61.4,
    risk_band: "Watchlist",
    anomaly_flag: false,
    deterioration_flag: true,
    onboarded_date: "2026-02-10",
    latest_sales: 9800.0,
    latest_utilization: 0.74,
    latest_bank_balance: 21500.0
  },
  {
    id: "MCH-1009",
    name: "Lumina Lighting & Decor",
    sector: "Apparel & Fashion",
    region: "Europe (EU-South)",
    base_credit_limit: 135000,
    current_risk_score: 38.2,
    risk_band: "Low Risk",
    anomaly_flag: false,
    deterioration_flag: false,
    onboarded_date: "2025-09-14",
    latest_sales: 14500.0,
    latest_utilization: 0.45,
    latest_bank_balance: 38000.0
  },
  {
    id: "MCH-1010",
    name: "Hyperion Digital Media",
    sector: "Digital Goods & SaaS",
    region: "North America (US-West)",
    base_credit_limit: 280000,
    current_risk_score: 72.8,
    risk_band: "Critical",
    anomaly_flag: true,
    deterioration_flag: true,
    onboarded_date: "2025-06-11",
    latest_sales: 8200.0,
    latest_utilization: 0.85,
    latest_bank_balance: 15400.0
  },
  {
    id: "MCH-1011",
    name: "Optima Medical Supplies",
    sector: "Healthcare & Pharmacy",
    region: "Europe (EU-East)",
    base_credit_limit: 350000,
    current_risk_score: 16.5,
    risk_band: "Low Risk",
    anomaly_flag: false,
    deterioration_flag: false,
    onboarded_date: "2025-04-02",
    latest_sales: 38000.0,
    latest_utilization: 0.15,
    latest_bank_balance: 112000.0
  },
  {
    id: "MCH-1012",
    name: "Summit Freight Logistics",
    sector: "Logistics & Wholesale",
    region: "Asia Pacific (APAC-East)",
    base_credit_limit: 210000,
    current_risk_score: 88.3,
    risk_band: "Critical",
    anomaly_flag: true,
    deterioration_flag: true,
    onboarded_date: "2025-11-28",
    latest_sales: 6100.0,
    latest_utilization: 0.96,
    latest_bank_balance: 7800.0
  },
  {
    id: "MCH-1013",
    name: "Solstice Energy Systems",
    sector: "Electronics & Retail",
    region: "North America (US-West)",
    base_credit_limit: 320000,
    current_risk_score: 25.6,
    risk_band: "Low Risk",
    anomaly_flag: false,
    deterioration_flag: false,
    onboarded_date: "2025-09-01",
    latest_sales: 31200.0,
    latest_utilization: 0.28,
    latest_bank_balance: 94000.0
  },
  {
    id: "MCH-1014",
    name: "Verdant Craft Brewery",
    sector: "Food & Beverage",
    region: "Europe (EU-West)",
    base_credit_limit: 175000,
    current_risk_score: 76.4,
    risk_band: "Critical",
    anomaly_flag: true,
    deterioration_flag: false,
    onboarded_date: "2025-10-18",
    latest_sales: 6800.0,
    latest_utilization: 0.89,
    latest_bank_balance: 14200.0
  },
  {
    id: "MCH-1015",
    name: "Beacon Cyber Defense",
    sector: "Digital Goods & SaaS",
    region: "North America (US-East)",
    base_credit_limit: 450000,
    current_risk_score: 18.2,
    risk_band: "Low Risk",
    anomaly_flag: false,
    deterioration_flag: false,
    onboarded_date: "2025-03-12",
    latest_sales: 52000.0,
    latest_utilization: 0.14,
    latest_bank_balance: 168000.0
  },
  {
    id: "MCH-1016",
    name: "Apex Precision Dynamics",
    sector: "Auto Parts & Services",
    region: "Europe (EU-Central)",
    base_credit_limit: 190000,
    current_risk_score: 58.7,
    risk_band: "Watchlist",
    anomaly_flag: false,
    deterioration_flag: true,
    onboarded_date: "2026-01-05",
    latest_sales: 10500.0,
    latest_utilization: 0.71,
    latest_bank_balance: 24000.0
  },
  {
    id: "MCH-1017",
    name: "Prism Apparel Studio",
    sector: "Apparel & Fashion",
    region: "Asia Pacific (APAC-South)",
    base_credit_limit: 160000,
    current_risk_score: 31.8,
    risk_band: "Low Risk",
    anomaly_flag: false,
    deterioration_flag: false,
    onboarded_date: "2025-08-22",
    latest_sales: 17800.0,
    latest_utilization: 0.36,
    latest_bank_balance: 48500.0
  },
  {
    id: "MCH-1018",
    name: "OmniSupply Global Warehousing",
    sector: "Logistics & Wholesale",
    region: "North America (US-Central)",
    base_credit_limit: 380000,
    current_risk_score: 82.1,
    risk_band: "Critical",
    anomaly_flag: true,
    deterioration_flag: true,
    onboarded_date: "2025-07-08",
    latest_sales: 8900.0,
    latest_utilization: 0.92,
    latest_bank_balance: 11000.0
  },
  {
    id: "MCH-1019",
    name: "Verve Therapeutics",
    sector: "Healthcare & Pharmacy",
    region: "Europe (UK-South)",
    base_credit_limit: 290000,
    current_risk_score: 24.3,
    risk_band: "Low Risk",
    anomaly_flag: false,
    deterioration_flag: false,
    onboarded_date: "2025-12-14",
    latest_sales: 27500.0,
    latest_utilization: 0.25,
    latest_bank_balance: 81000.0
  },
  {
    id: "MCH-1020",
    name: "Terra Organics Farm Direct",
    sector: "Food & Beverage",
    region: "Latin America (LATAM-MX)",
    base_credit_limit: 130000,
    current_risk_score: 49.5,
    risk_band: "Watchlist",
    anomaly_flag: false,
    deterioration_flag: true,
    onboarded_date: "2026-02-01",
    latest_sales: 12200.0,
    latest_utilization: 0.64,
    latest_bank_balance: 31000.0
  }
];

export const SAMPLE_DASHBOARD_SUMMARY = {
  total_merchants: 200,
  risk_bands: {
    low_risk: 122,
    watchlist: 17,
    critical: 61
  },
  portfolio_avg_risk: 43.5,
  anomaly_count: 55,
  deterioration_count: 38,
  active_alerts: [
    {
      id: 63,
      merchant_id: 'MCH-1002',
      merchant_name: 'Apex Gear Store',
      date: '2026-08-30',
      alert_type: 'Critical Stress',
      severity: 'High',
      description: 'Financial stress alert: Score 84.6 (Critical). Isolation Forest anomaly flagged (94% utilization draw).'
    },
    {
      id: 62,
      merchant_id: 'MCH-1005',
      merchant_name: 'Velocity Auto Parts',
      date: '2026-08-30',
      alert_type: 'Anomaly Detected',
      severity: 'High',
      description: 'Sharp credit line draw (88% utilization) and inventory delay detected.'
    },
    {
      id: 61,
      merchant_id: 'MCH-1012',
      merchant_name: 'Summit Freight Logistics',
      date: '2026-08-30',
      alert_type: 'Contagion Risk',
      severity: 'High',
      description: '3 consecutive delayed supplier invoices triggering shockwave transmission.'
    },
    {
      id: 60,
      merchant_id: 'MCH-1003',
      merchant_name: 'Zenith Home & Kitchen',
      date: '2026-08-30',
      alert_type: 'Deterioration',
      severity: 'Medium',
      description: '14-day consecutive sales deceleration slope exceeding -12%.'
    }
  ],
  sector_breakdown: [
    { sector: 'Apparel & Fashion', count: 25, avg_risk: 47.9 },
    { sector: 'Auto Parts & Services', count: 32, avg_risk: 42.9 },
    { sector: 'Digital Goods & SaaS', count: 32, avg_risk: 34.4 },
    { sector: 'Electronics & Retail', count: 30, avg_risk: 40.1 },
    { sector: 'Food & Beverage', count: 21, avg_risk: 55.8 },
    { sector: 'Healthcare & Pharmacy', count: 30, avg_risk: 36.4 },
    { sector: 'Logistics & Wholesale', count: 30, avg_risk: 51.9 }
  ]
};

export function generateSampleHistory(baseSales: number, baseUtil: number, baseBalance: number) {
  const history = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const drift = (Math.sin(i * 0.45) * 0.18);
    history.push({
      date: dateStr,
      sales: Math.round(baseSales * (1 + drift) * 100) / 100,
      transaction_count: Math.round(35 + Math.sin(i * 0.3) * 15),
      avg_transaction_value: Math.round((baseSales / 35) * (1 + drift) * 100) / 100,
      refund_rate: Math.round((0.02 + Math.random() * 0.02) * 1000) / 1000,
      bank_balance: Math.round(baseBalance * (1 - drift * 0.4) * 100) / 100,
      credit_utilization: Math.round(Math.min(0.98, Math.max(0.08, baseUtil + drift * 0.25)) * 1000) / 1000,
      inventory_turnover: Math.round((4.5 + Math.cos(i * 0.2) * 1.5) * 10) / 10,
      supplier_delay: Math.round(1.5 + Math.random() * 3)
    });
  }
  return history;
}
