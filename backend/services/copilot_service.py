import os
import json
import requests
from typing import Dict, Any

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

def generate_copilot_response(
    merchant_info: Dict[str, Any],
    signals_summary: Dict[str, Any],
    ml_output: Dict[str, Any],
    user_query: str
) -> Dict[str, Any]:
    """
    Calls Google Gemini API (with Groq fallback and local deterministic fallback)
    with exact merchant signals + SHAP feature attributions injected into the prompt.
    """
    
    # 1. Prepare grounded prompt with merchant metrics + SHAP drivers
    shap_text = "\n".join([
        f"  - {d['label']}: value={d['value']} (SHAP Impact: {d['shap_impact']:+.3f}, Direction: {d['risk_direction']})"
        for d in ml_output.get("top_drivers", [])
    ])

    det_text = "\n".join([f"  - {r}" for r in ml_output.get("deterioration_reasons", [])]) or "  - No active deterioration trend detected."

    system_instruction = (
        "You are FinTrust AI Credit Copilot, an expert financial risk advisor for commercial credit officers.\n"
        "You MUST base your answer strictly on the provided real merchant financial metrics and SHAP explainability model output.\n"
        "Be direct, quantitative, professional, and actionable. Recommend specific credit interventions (e.g. reduce exposure, restructure repayment, request collateral, or maintain limit).\n"
        "Do not invent facts not present in the provided context."
    )

    prompt_context = f"""
=== MERCHANT PROFILE ===
ID: {merchant_info['id']}
Name: {merchant_info['name']}
Sector: {merchant_info['sector']}
Region: {merchant_info['region']}
Base Credit Limit: ${merchant_info['base_credit_limit']:,.2f}

=== ML MODEL DIAGNOSTICS ===
Risk Score: {ml_output['risk_score']} / 100 ({ml_output['risk_band']})
Isolation Forest Anomaly Flag: {'ANOMALOUS BEHAVIOR DETECTED' if ml_output['anomaly_flag'] else 'Normal Baseline'} (Score: {ml_output['anomaly_score']})
Time-Series Deterioration Flag: {'ACTIVE DETERIORATION TREND' if ml_output['deterioration_flag'] else 'Stable Trend'}

Deterioration Signals:
{det_text}

=== REAL SHAP TOP RISK DRIVERS ===
{shap_text}

=== RECENT FINANCIAL SIGNALS (30-DAY SUMMARY) ===
Mean Daily Sales: ${signals_summary.get('sales_mean_30d', 0):,.2f}
Sales Trajectory Slope: {signals_summary.get('sales_slope_30d', 0):+.4f}
Mean Refund Rate: {signals_summary.get('refund_rate_mean_30d', 0)*100:.1f}%
Mean Bank Balance: ${signals_summary.get('bank_balance_mean_30d', 0):,.2f}
Credit Line Utilization: {signals_summary.get('credit_utilization_mean_30d', 0)*100:.1f}%
Supplier Delivery Delay: {signals_summary.get('supplier_delay_mean_30d', 0):.1f} days

=== USER CREDIT OFFICER QUESTION ===
"{user_query}"
"""

    # Try Primary: Gemini API
    if GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": system_instruction + "\n\n" + prompt_context}
                        ]
                    }
                ],
                "generationConfig": {"temperature": 0.2, "maxOutputTokens": 600}
            }
            res = requests.post(url, headers=headers, json=payload, timeout=8)
            if res.status_code == 200:
                data = res.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return {
                    "answer": text,
                    "provider": "Google Gemini 1.5 Flash",
                    "grounded_sources": {
                        "risk_score": ml_output["risk_score"],
                        "top_shap_driver": ml_output["top_drivers"][0]["label"] if ml_output["top_drivers"] else "N/A",
                        "anomaly_flag": ml_output["anomaly_flag"]
                    }
                }
        except Exception as e:
            print(f"Gemini API attempt failed: {e}, falling back to Groq...")

    # Try Fallback: Groq API
    if GROQ_API_KEY:
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt_context}
                ],
                "temperature": 0.2,
                "max_tokens": 600
            }
            res = requests.post(url, headers=headers, json=payload, timeout=8)
            if res.status_code == 200:
                data = res.json()
                text = data["choices"][0]["message"]["content"]
                return {
                    "answer": text,
                    "provider": "Groq Llama-3.3-70B",
                    "grounded_sources": {
                        "risk_score": ml_output["risk_score"],
                        "top_shap_driver": ml_output["top_drivers"][0]["label"] if ml_output["top_drivers"] else "N/A",
                        "anomaly_flag": ml_output["anomaly_flag"]
                    }
                }
        except Exception as e:
            print(f"Groq API attempt failed: {e}")

    # Local Deterministic Grounded Engine (when no external API key is provided)
    top_driver = ml_output["top_drivers"][0] if ml_output["top_drivers"] else {"label": "Credit Utilization", "shap_impact": 0.5, "value": "High"}
    
    local_answer = f"""### AI Copilot Diagnostic for {merchant_info['name']} ({merchant_info['id']})

**1. Stress Assessment & Risk Score**
Merchant **{merchant_info['name']}** currently holds a Financial Stress Index of **{ml_output['risk_score']} / 100** ({ml_output['risk_band']}).

**2. Grounded SHAP Risk Drivers**
The dominant factor driving this score is **{top_driver['label']}** (current value: `{top_driver['value']}`), contributing a SHAP positive stress impact of **+{top_driver['shap_impact']}**.

**3. Behavioral Deterioration & Anomaly Signals**
- **Isolation Forest Anomaly Status:** {'⚠️ Flagged for unusual transaction anomaly' if ml_output['anomaly_flag'] else '✅ Operating within normal statistical baseline'}
- **Time-Series Deterioration:** {'⚠️ Active 30-day deterioration trend detected' if ml_output['deterioration_flag'] else '✅ Signals are holding stable'}

**4. Recommended Credit Officer Action**
"""

    if ml_output['risk_band'] == "Critical":
        local_answer += f"• **Action: Immediate Credit Exposure Reduction.** Reduce base credit limit from ${merchant_info['base_credit_limit']:,.0f} by 25-30% and switch repayment frequency to daily settlement."
    elif ml_output['risk_band'] == "Watchlist":
        local_answer += f"• **Action: Restructure & Monitor.** Maintain ${merchant_info['base_credit_limit']:,.0f} limit but require weekly reserve reconciliation and freeze limit expansion."
    else:
        local_answer += f"• **Action: Maintain Standard Credit.** Merchant demonstrates strong repayment capacity and stable cash reserves."

    return {
        "answer": local_answer,
        "provider": "FinTrust Grounded Rule Engine (Set GEMINI_API_KEY or GROQ_API_KEY for live LLM response)",
        "grounded_sources": {
            "risk_score": ml_output["risk_score"],
            "top_shap_driver": top_driver["label"],
            "anomaly_flag": ml_output["anomaly_flag"]
        }
    }
