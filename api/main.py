import os
import sys
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, HTTPException, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import engine, Base, get_db, SessionLocal
from models import User, Merchant, DailySignal, RiskScore, Alert, AuditLog
import auth
from ml.inference_engine import inference_engine
from services.copilot_service import generate_copilot_response
from services.pdf_generator import generate_merchant_pdf_report

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FinTrust AI — Merchant Financial Stress Radar",
    description="Continuous Merchant Financial Stress Radar with SHAP Explainability & Digital Twin What-If Simulator",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)

import traceback
from fastapi.responses import JSONResponse
from fastapi import Request

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = str(exc)
    stack = traceback.format_exc()
    print(f"Unhandled error on {request.url.path}: {error_msg}\n{stack}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": error_msg,
            "path": str(request.url.path),
            "traceback": stack
        }
    )

# Automatic database seed on startup if database is empty (essential for Vercel cold start)
def ensure_db_seeded():
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        count = db.query(Merchant).count()
        if count == 0:
            print("Auto-seeding empty database for production deployment...")
            from seed import seed_database
            seed_database()
        db.close()
    except Exception as e:
        print(f"Auto-seed check note: {e}")

# Run immediately for serverless / Mangum lifespan='off'
ensure_db_seeded()

@app.on_event("startup")
def startup_event():
    ensure_db_seeded()

# --- Request/Response Models ---
class SimulationRequest(BaseModel):
    merchant_id: str
    proposed_credit_limit: Optional[float] = None
    repayment_frequency: Optional[str] = "Weekly"  # Daily, Weekly, Monthly
    spending_restriction: Optional[bool] = False

class CopilotRequest(BaseModel):
    merchant_id: str
    question: str

# --- Endpoints ---

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "FinTrust AI — Merchant Financial Stress Radar",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/dashboard/summary")
@app.get("/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_merchants = db.query(Merchant).count()
    low_risk = db.query(Merchant).filter(Merchant.risk_band == "Low Risk").count()
    watchlist = db.query(Merchant).filter(Merchant.risk_band == "Watchlist").count()
    critical = db.query(Merchant).filter(Merchant.risk_band == "Critical").count()

    anomalies = db.query(Merchant).filter(Merchant.anomaly_flag == True).count()
    deteriorations = db.query(Merchant).filter(Merchant.deterioration_flag == True).count()

    avg_score = db.query(func.avg(Merchant.current_risk_score)).scalar() or 0.0

    recent_alerts = db.query(Alert).filter(Alert.status == "Active").order_by(Alert.id.desc()).limit(10).all()
    
    alert_list = []
    for a in recent_alerts:
        m = db.query(Merchant).filter(Merchant.id == a.merchant_id).first()
        alert_list.append({
            "id": a.id,
            "merchant_id": a.merchant_id,
            "merchant_name": m.name if m else a.merchant_id,
            "date": a.date,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "description": a.description
        })

    # Portfolio Sector Breakdown
    sectors = db.query(Merchant.sector, func.count(Merchant.id), func.avg(Merchant.current_risk_score)).group_by(Merchant.sector).all()
    sector_breakdown = [
        {"sector": sec, "count": cnt, "avg_risk": round(float(avg_r), 1)}
        for sec, cnt, avg_r in sectors
    ]

    return {
        "total_merchants": total_merchants,
        "risk_bands": {
            "low_risk": low_risk,
            "watchlist": watchlist,
            "critical": critical
        },
        "portfolio_avg_risk": round(float(avg_score), 1),
        "anomaly_count": anomalies,
        "deterioration_count": deteriorations,
        "active_alerts": alert_list,
        "sector_breakdown": sector_breakdown
    }

@app.get("/api/merchants")
@app.get("/merchants")
def list_merchants(
    search: Optional[str] = None,
    risk_band: Optional[str] = None,
    sector: Optional[str] = None,
    anomaly_only: Optional[bool] = False,
    deterioration_only: Optional[bool] = False,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Merchant)

    if search:
        query = query.filter((Merchant.name.ilike(f"%{search}%")) | (Merchant.id.ilike(f"%{search}%")))
    if risk_band:
        query = query.filter(Merchant.risk_band == risk_band)
    if sector:
        query = query.filter(Merchant.sector == sector)
    if anomaly_only:
        query = query.filter(Merchant.anomaly_flag == True)
    if deterioration_only:
        query = query.filter(Merchant.deterioration_flag == True)

    total = query.count()
    merchants = query.order_by(Merchant.current_risk_score.desc()).offset(offset).limit(limit).all()

    result = []
    for m in merchants:
        # Get latest signal for quick view
        latest_signal = db.query(DailySignal).filter(DailySignal.merchant_id == m.id).order_by(DailySignal.date.desc()).first()
        result.append({
            "id": m.id,
            "name": m.name,
            "sector": m.sector,
            "region": m.region,
            "base_credit_limit": m.base_credit_limit,
            "current_risk_score": m.current_risk_score,
            "risk_band": m.risk_band,
            "anomaly_flag": m.anomaly_flag,
            "deterioration_flag": m.deterioration_flag,
            "onboarded_date": m.onboarded_date,
            "latest_sales": latest_signal.sales if latest_signal else 0.0,
            "latest_utilization": latest_signal.credit_utilization if latest_signal else 0.0,
            "latest_bank_balance": latest_signal.bank_balance if latest_signal else 0.0
        })

    return {"total": total, "merchants": result}

@app.get("/api/merchants/{merchant_id}")
@app.get("/merchants/{merchant_id}")
def get_merchant_360(merchant_id: str, db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    signals = db.query(DailySignal).filter(DailySignal.merchant_id == merchant_id).order_by(DailySignal.date.asc()).all()
    if not signals:
        raise HTTPException(status_code=404, detail="No time series signals found for merchant")

    # Convert signals to Pandas DataFrame for real inference calculation
    signals_data = [{
        "date": s.date,
        "sales": s.sales,
        "transaction_count": s.transaction_count,
        "avg_transaction_value": s.avg_transaction_value,
        "refund_rate": s.refund_rate,
        "bank_balance": s.bank_balance,
        "credit_utilization": s.credit_utilization,
        "inventory_turnover": s.inventory_turnover,
        "supplier_delay": s.supplier_delay
    } for s in signals]

    import pandas as pd
    df_signals = pd.DataFrame(signals_data)

    # Perform real inference & SHAP explainability computation
    ml_res = inference_engine.analyze_merchant(df_signals, merchant.base_credit_limit)

    # 30-day time series trajectory for charts
    signal_history = signals_data[-30:]

    # Risk score history
    risk_history_records = db.query(RiskScore).filter(RiskScore.merchant_id == merchant_id).order_by(RiskScore.date.asc()).all()
    risk_history = [{"date": r.date, "score": r.risk_score, "band": r.risk_band} for r in risk_history_records]

    return {
        "merchant": {
            "id": merchant.id,
            "name": merchant.name,
            "sector": merchant.sector,
            "region": merchant.region,
            "base_credit_limit": merchant.base_credit_limit,
            "current_risk_score": ml_res["risk_score"],
            "risk_band": ml_res["risk_band"],
            "anomaly_flag": ml_res["anomaly_flag"],
            "deterioration_flag": ml_res["deterioration_flag"],
            "onboarded_date": merchant.onboarded_date
        },
        "ml_diagnostics": ml_res,
        "signal_history": signal_history,
        "risk_history": risk_history
    }

@app.get("/api/early-warning")
@app.get("/early-warning")
def get_early_warning_center(days: int = 14, limit: int = 20, db: Session = Depends(get_db)):
    """
    Surfaces merchants whose risk score rose fastest in the last N days, sorted by rate of change.
    Outputs actual top SHAP driver for each merchant.
    """
    merchants = db.query(Merchant).all()
    fast_risers = []

    for m in merchants:
        signals = db.query(DailySignal).filter(DailySignal.merchant_id == m.id).order_by(DailySignal.date.asc()).all()
        if len(signals) < days:
            continue

        import pandas as pd
        df_signals = pd.DataFrame([{
            "date": s.date,
            "sales": s.sales,
            "transaction_count": s.transaction_count,
            "avg_transaction_value": s.avg_transaction_value,
            "refund_rate": s.refund_rate,
            "bank_balance": s.bank_balance,
            "credit_utilization": s.credit_utilization,
            "inventory_turnover": s.inventory_turnover,
            "supplier_delay": s.supplier_delay
        } for s in signals])

        ml_res = inference_engine.analyze_merchant(df_signals, m.base_credit_limit)

        # Estimate historical baseline score (14 days ago)
        df_historical = df_signals.iloc[:-days] if len(df_signals) > days + 10 else df_signals.head(30)
        ml_hist = inference_engine.analyze_merchant(df_historical, m.base_credit_limit)

        score_delta = round(ml_res["risk_score"] - ml_hist["risk_score"], 1)

        if score_delta > 0 or ml_res["deterioration_flag"] or ml_res["risk_band"] != "Low Risk":
            top_driver = ml_res["top_drivers"][0] if ml_res["top_drivers"] else {"label": "Utilization Rate", "value": "High"}
            fast_risers.append({
                "merchant_id": m.id,
                "merchant_name": m.name,
                "sector": m.sector,
                "current_score": ml_res["risk_score"],
                "score_delta": score_delta,
                "risk_band": ml_res["risk_band"],
                "anomaly_flag": ml_res["anomaly_flag"],
                "deterioration_flag": ml_res["deterioration_flag"],
                "top_shap_reason": top_driver["label"],
                "shap_driver_detail": f"{top_driver['label']} ({top_driver['risk_direction']}, impact: +{top_driver['shap_impact']})"
            })

    fast_risers.sort(key=lambda x: x["score_delta"], reverse=True)
    return {"timeframe_days": days, "fast_risers": fast_risers[:limit]}

@app.post("/api/simulate")
@app.post("/simulate")
def run_digital_twin_simulation(req: SimulationRequest, db: Session = Depends(get_db)):
    """
    Digital Twin What-If Simulator:
    Re-runs full XGBoost + SHAP inference with modified feature vector (credit limit, frequency, spending restrictions).
    """
    merchant = db.query(Merchant).filter(Merchant.id == req.merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    signals = db.query(DailySignal).filter(DailySignal.merchant_id == req.merchant_id).order_by(DailySignal.date.asc()).all()
    import pandas as pd
    df_signals = pd.DataFrame([{
        "date": s.date,
        "sales": s.sales,
        "transaction_count": s.transaction_count,
        "avg_transaction_value": s.avg_transaction_value,
        "refund_rate": s.refund_rate,
        "bank_balance": s.bank_balance,
        "credit_utilization": s.credit_utilization,
        "inventory_turnover": s.inventory_turnover,
        "supplier_delay": s.supplier_delay
    } for s in signals])

    # 1. Baseline Inference
    base_res = inference_engine.analyze_merchant(df_signals, merchant.base_credit_limit)

    # 2. Simulated Re-Inference
    mod_vector = {}
    if req.proposed_credit_limit:
        mod_vector["base_credit_limit"] = req.proposed_credit_limit
    if req.repayment_frequency:
        mod_vector["repayment_frequency"] = req.repayment_frequency
    if req.spending_restriction is not None:
        mod_vector["spending_restriction"] = req.spending_restriction

    sim_res = inference_engine.analyze_merchant(df_signals, merchant.base_credit_limit, modified_vector=mod_vector)

    # Recovery Probability Calculation based on simulated score drop & utilization change
    score_change = base_res["risk_score"] - sim_res["risk_score"]
    recovery_prob = round(float(min(98.0, max(15.0, 50.0 + score_change * 1.8))), 1)

    # Log simulation into Audit Table
    db.add(AuditLog(
        user_email="credit.officer@fintrust.ai",
        action_type="SIMULATION",
        merchant_id=merchant.id,
        details_json=json.dumps({
            "base_score": base_res["risk_score"],
            "simulated_score": sim_res["risk_score"],
            "parameters": mod_vector,
            "recovery_prob": recovery_prob
        })
    ))
    db.commit()

    return {
        "merchant_id": merchant.id,
        "merchant_name": merchant.name,
        "baseline": {
            "credit_limit": merchant.base_credit_limit,
            "risk_score": base_res["risk_score"],
            "risk_band": base_res["risk_band"],
            "utilization": round(base_res["feature_vector"]["credit_utilization_mean_30d"] * 100, 1)
        },
        "simulated": {
            "proposed_credit_limit": req.proposed_credit_limit or merchant.base_credit_limit,
            "repayment_frequency": req.repayment_frequency,
            "spending_restriction": req.spending_restriction,
            "risk_score": sim_res["risk_score"],
            "risk_band": sim_res["risk_band"],
            "utilization": round(sim_res["feature_vector"]["credit_utilization_mean_30d"] * 100, 1),
            "score_delta": round(sim_res["risk_score"] - base_res["risk_score"], 1),
            "recovery_probability": recovery_prob,
            "top_drivers": sim_res["top_drivers"]
        }
    }

@app.post("/api/copilot")
@app.post("/copilot")
def query_ai_credit_copilot(req: CopilotRequest, db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.id == req.merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    signals = db.query(DailySignal).filter(DailySignal.merchant_id == req.merchant_id).order_by(DailySignal.date.asc()).all()
    import pandas as pd
    df_signals = pd.DataFrame([{
        "date": s.date,
        "sales": s.sales,
        "transaction_count": s.transaction_count,
        "avg_transaction_value": s.avg_transaction_value,
        "refund_rate": s.refund_rate,
        "bank_balance": s.bank_balance,
        "credit_utilization": s.credit_utilization,
        "inventory_turnover": s.inventory_turnover,
        "supplier_delay": s.supplier_delay
    } for s in signals])

    ml_res = inference_engine.analyze_merchant(df_signals, merchant.base_credit_limit)

    merchant_info = {
        "id": merchant.id,
        "name": merchant.name,
        "sector": merchant.sector,
        "region": merchant.region,
        "base_credit_limit": merchant.base_credit_limit
    }

    copilot_out = generate_copilot_response(
        merchant_info=merchant_info,
        signals_summary=ml_res["feature_vector"],
        ml_output=ml_res,
        user_query=req.question
    )

    # Log Copilot Query into Audit Table
    db.add(AuditLog(
        user_email="credit.officer@fintrust.ai",
        action_type="COPILOT_QUERY",
        merchant_id=merchant.id,
        details_json=json.dumps({
            "question": req.question,
            "provider": copilot_out["provider"]
        })
    ))
    db.commit()

    return copilot_out

@app.post("/api/simulation/advance-day")
@app.post("/simulation/advance-day")
def advance_simulation_day(db: Session = Depends(get_db)):
    """
    Background job endpoint that advances the synthetic dataset by 1 day,
    simulating live drift in sales, balance, utilization, and recalculating scores.
    """
    import random
    merchants = db.query(Merchant).all()

    # Get overall max date
    max_date_str = db.query(func.max(DailySignal.date)).scalar() or "2026-05-01"
    curr_date = datetime.strptime(max_date_str, "%Y-%m-%d")
    next_date_str = (curr_date + timedelta(days=1)).strftime("%Y-%m-%d")

    updated_count = 0
    for m in merchants:
        # Get latest signal
        last_sig = db.query(DailySignal).filter(DailySignal.merchant_id == m.id).order_by(DailySignal.date.desc()).first()
        if not last_sig:
            continue

        # Drift signals slightly
        mult = 0.95 if m.deterioration_flag else 1.02
        new_sales = round(max(100.0, last_sig.sales * mult + random.uniform(-200, 200)), 2)
        new_balance = round(max(500.0, last_sig.bank_balance * mult + random.uniform(-500, 500)), 2)
        new_util = round(max(0.05, min(0.99, last_sig.credit_utilization + (0.02 if m.deterioration_flag else random.uniform(-0.01, 0.01)))), 4)
        new_refund = round(max(0.005, min(0.20, last_sig.refund_rate + (0.005 if m.deterioration_flag else random.uniform(-0.002, 0.002)))), 4)

        # Create new signal record
        sig_new = DailySignal(
            merchant_id=m.id,
            date=next_date_str,
            sales=new_sales,
            transaction_count=last_sig.transaction_count,
            avg_transaction_value=round(new_sales / max(1, last_sig.transaction_count), 2),
            refund_rate=new_refund,
            bank_balance=new_balance,
            credit_utilization=new_util,
            inventory_turnover=last_sig.inventory_turnover,
            supplier_delay=last_sig.supplier_delay
        )
        db.add(sig_new)

        # Re-run inference for updated score
        all_sigs = db.query(DailySignal).filter(DailySignal.merchant_id == m.id).order_by(DailySignal.date.asc()).all()
        import pandas as pd
        df_sigs = pd.DataFrame([{
            "date": s.date, "sales": s.sales, "transaction_count": s.transaction_count,
            "avg_transaction_value": s.avg_transaction_value, "refund_rate": s.refund_rate,
            "bank_balance": s.bank_balance, "credit_utilization": s.credit_utilization,
            "inventory_turnover": s.inventory_turnover, "supplier_delay": s.supplier_delay
        } for s in all_sigs])

        res = inference_engine.analyze_merchant(df_sigs, m.base_credit_limit)

        m.current_risk_score = res["risk_score"]
        m.risk_band = res["risk_band"]
        m.anomaly_flag = res["anomaly_flag"]
        m.deterioration_flag = res["deterioration_flag"]

        db.add(RiskScore(
            merchant_id=m.id,
            date=next_date_str,
            risk_score=res["risk_score"],
            risk_band=res["risk_band"],
            top_drivers_json=json.dumps(res["top_drivers"]),
            anomaly_score=res["anomaly_score"],
            deterioration_score=1.0 if res["deterioration_flag"] else 0.0
        ))

        updated_count += 1

    db.commit()
    return {"status": "success", "new_date": next_date_str, "merchants_updated": updated_count}

@app.get("/api/merchants/{merchant_id}/report")
@app.get("/merchants/{merchant_id}/report")
def download_pdf_report(merchant_id: str, db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    signals = db.query(DailySignal).filter(DailySignal.merchant_id == merchant_id).order_by(DailySignal.date.asc()).all()
    import pandas as pd
    df_signals = pd.DataFrame([{
        "date": s.date, "sales": s.sales, "transaction_count": s.transaction_count,
        "avg_transaction_value": s.avg_transaction_value, "refund_rate": s.refund_rate,
        "bank_balance": s.bank_balance, "credit_utilization": s.credit_utilization,
        "inventory_turnover": s.inventory_turnover, "supplier_delay": s.supplier_delay
    } for s in signals])

    ml_res = inference_engine.analyze_merchant(df_signals, merchant.base_credit_limit)

    merchant_data = {
        "id": merchant.id,
        "name": merchant.name,
        "sector": merchant.sector,
        "region": merchant.region,
        "base_credit_limit": merchant.base_credit_limit
    }

    pdf_bytes = generate_merchant_pdf_report(merchant_data, ml_res)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=FinTrust_Report_{merchant_id}.pdf"}
    )

@app.get("/api/audit-logs")
@app.get("/audit-logs")
def get_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(limit).all()
    result = []
    for l in logs:
        m = db.query(Merchant).filter(Merchant.id == l.merchant_id).first() if l.merchant_id else None
        result.append({
            "id": l.id,
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "user_email": l.user_email,
            "action_type": l.action_type,
            "merchant_id": l.merchant_id,
            "merchant_name": m.name if m else l.merchant_id,
            "details": json.loads(l.details_json) if l.details_json else {}
        })
    return {"total": len(result), "logs": result}
