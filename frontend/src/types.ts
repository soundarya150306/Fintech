export interface ShapDriver {
  feature: string;
  label: string;
  value: number | string;
  shap_impact: number;
  risk_direction: string;
}

export interface MLDiagnostics {
  risk_score: number;
  risk_band: 'Low Risk' | 'Watchlist' | 'Critical';
  top_drivers: ShapDriver[];
  all_shap_drivers: ShapDriver[];
  anomaly_flag: boolean;
  anomaly_score: number;
  deterioration_flag: boolean;
  deterioration_reasons: string[];
}

export interface Merchant {
  id: string;
  name: string;
  sector: string;
  region: string;
  base_credit_limit: number;
  current_risk_score: number;
  risk_band: 'Low Risk' | 'Watchlist' | 'Critical';
  anomaly_flag: boolean;
  deterioration_flag: boolean;
  onboarded_date: string;
  latest_sales?: number;
  latest_utilization?: number;
  latest_bank_balance?: number;
}

export interface DailySignal {
  date: string;
  sales: number;
  transaction_count: number;
  avg_transaction_value: number;
  refund_rate: number;
  bank_balance: number;
  credit_utilization: number;
  inventory_turnover: number;
  supplier_delay: number;
}

export interface FastRiser {
  merchant_id: string;
  merchant_name: string;
  sector: string;
  current_score: number;
  score_delta: number;
  risk_band: 'Low Risk' | 'Watchlist' | 'Critical';
  anomaly_flag: boolean;
  deterioration_flag: boolean;
  top_shap_reason: string;
  shap_driver_detail: string;
}

export interface SimulationResult {
  merchant_id: string;
  merchant_name: string;
  baseline: {
    credit_limit: number;
    risk_score: number;
    risk_band: string;
    utilization: number;
  };
  simulated: {
    proposed_credit_limit: number;
    repayment_frequency: string;
    spending_restriction: boolean;
    risk_score: number;
    risk_band: string;
    utilization: number;
    score_delta: number;
    recovery_probability: number;
    top_drivers: ShapDriver[];
  };
}

export interface CopilotResponse {
  answer: string;
  provider: string;
  grounded_sources: {
    risk_score: number;
    top_shap_driver: string;
    anomaly_flag: boolean;
  };
}

export interface AuditLogItem {
  id: number;
  timestamp: string;
  user_email: string;
  action_type: string;
  merchant_id?: string;
  merchant_name?: string;
  details: any;
}
