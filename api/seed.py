import os
import sys
import json
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from passlib.context import CryptContext

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base, SessionLocal
from models import User, Merchant, DailySignal, RiskScore, Alert, AuditLog
from ml.synthetic_generator import generate_synthetic_dataset
from ml.train_model import train_and_save_ml_models, FEATURE_COLUMNS, extract_features_from_signals
from ml.inference_engine import inference_engine

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def seed_database():
    print("Resetting database schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
    n_merchants = 50 if is_serverless else 200
    n_days = 20 if is_serverless else 45

    print(f"Generating synthetic merchant dataset ({n_merchants} merchants x {n_days} days)...")
    df_merchants, df_signals = generate_synthetic_dataset(n_merchants, n_days)

    print("Training XGBoost, Isolation Forest & SHAP TreeExplainer...")
    trained_model, trained_iso, trained_explainer, trained_features = train_and_save_ml_models(df_merchants, df_signals)
    inference_engine.model = trained_model
    inference_engine.iso_forest = trained_iso
    inference_engine.explainer = trained_explainer

    print("Seeding Credit Officer Accounts...")
    users = [
        User(
            username="admin",
            email="admin@fintrust.ai",
            hashed_password=pwd_context.hash("admin123"),
            role="Admin"
        ),
        User(
            username="officer_sarah",
            email="officer@fintrust.ai",
            hashed_password=pwd_context.hash("officer123"),
            role="Senior Credit Officer"
        )
    ]
    db.add_all(users)
    db.commit()

    print("Seeding Merchants, Daily Signals & Bulk Model Inferences...")
    signal_grouped = df_signals.groupby("merchant_id")
    latest_date = df_signals["date"].max()

    m_limit_map = dict(zip(df_merchants["id"], df_merchants["base_credit_limit"]))

    merchants_to_add = []
    signals_to_add = []
    feature_rows = []
    merchant_ids_ordered = []

    for idx, row in df_merchants.iterrows():
        m_id = row["id"]
        group = signal_grouped.get_group(m_id) if m_id in signal_grouped.groups else None
        if group is None or len(group) == 0:
            continue

        base_limit = float(row["base_credit_limit"])
        feats = extract_features_from_signals(group, base_limit)
        feature_rows.append(feats)
        merchant_ids_ordered.append(m_id)

        # Signals
        for _, s_row in group.iterrows():
            signals_to_add.append(DailySignal(
                merchant_id=m_id,
                date=s_row["date"],
                sales=float(s_row["sales"]),
                transaction_count=int(s_row["transaction_count"]),
                avg_transaction_value=float(s_row["avg_transaction_value"]),
                refund_rate=float(s_row["refund_rate"]),
                bank_balance=float(s_row["bank_balance"]),
                credit_utilization=float(s_row["credit_utilization"]),
                inventory_turnover=float(s_row["inventory_turnover"]),
                supplier_delay=int(s_row["supplier_delay"])
            ))

    # Fast Vectorized Bulk Inference
    X_matrix = pd.DataFrame(feature_rows)[FEATURE_COLUMNS]
    raw_scores = inference_engine.model.predict(X_matrix)
    iso_preds = inference_engine.iso_forest.predict(X_matrix)
    iso_scores = -inference_engine.iso_forest.score_samples(X_matrix)
    shap_matrix = inference_engine.explainer.shap_values(X_matrix)

    feature_labels = {
        "credit_utilization_mean_30d": "Credit Utilization Ratio",
        "refund_rate_mean_30d": "Refund Rate Percentage",
        "sales_slope_30d": "30-Day Sales Trajectory",
        "bank_balance_slope_30d": "Bank Balance Decline Rate",
        "supplier_delay_mean_30d": "Supplier Delivery Delay (Days)",
        "credit_utilization_slope_30d": "Utilization Growth Speed",
        "refund_rate_slope_30d": "Refund Rate Acceleration",
        "bank_balance_mean_30d": "Average Bank Reserve Balance",
        "sales_mean_30d": "30-Day Mean Daily Sales",
        "utilization_to_balance_ratio": "Utilization vs Reserve Stress Ratio",
        "inventory_turnover_mean_30d": "Inventory Turnover Speed",
        "sales_std_30d": "Sales Volatility Fluctuation"
    }

    risk_scores_to_add = []
    alerts_to_add = []

    m_row_map = {r["id"]: r for _, r in df_merchants.iterrows()}

    for idx, m_id in enumerate(merchant_ids_ordered):
        m_info = m_row_map[m_id]
        score = round(float(np.clip(raw_scores[idx], 5.0, 99.0)), 1)
        
        if score < 40.0:
            band = "Low Risk"
        elif score < 70.0:
            band = "Watchlist"
        else:
            band = "Critical"

        feats = feature_rows[idx]
        s_values = shap_matrix[idx]

        drivers = []
        for fname, val, s_val in zip(FEATURE_COLUMNS, X_matrix.iloc[idx], s_values):
            drivers.append({
                "feature": fname,
                "label": feature_labels.get(fname, fname),
                "value": round(float(val), 4),
                "shap_impact": round(float(s_val), 3),
                "risk_direction": "Increases Risk" if s_val > 0 else "Decreases Risk"
            })
        drivers.sort(key=lambda x: abs(x["shap_impact"]), reverse=True)
        top_drivers = drivers[:5]

        anomaly_flag = bool(iso_preds[idx] == -1 or iso_scores[idx] > 0.65)
        
        deterioration_flag = bool(
            feats["sales_slope_30d"] < -0.15 or
            feats["refund_rate_slope_30d"] > 0.02 or
            feats["credit_utilization_slope_30d"] > 0.05 or
            feats["bank_balance_slope_30d"] < -0.20
        )

        merchants_to_add.append(Merchant(
            id=m_id,
            name=m_info["name"],
            sector=m_info["sector"],
            region=m_info["region"],
            base_credit_limit=float(m_info["base_credit_limit"]),
            current_risk_score=score,
            risk_band=band,
            anomaly_flag=anomaly_flag,
            deterioration_flag=deterioration_flag,
            onboarded_date=m_info["onboarded_date"],
            status="Active"
        ))

        risk_scores_to_add.append(RiskScore(
            merchant_id=m_id,
            date=latest_date,
            risk_score=score,
            risk_band=band,
            top_drivers_json=json.dumps(top_drivers),
            anomaly_score=round(float(iso_scores[idx]), 3),
            deterioration_score=1.0 if deterioration_flag else 0.0
        ))

        if band == "Critical" or anomaly_flag or deterioration_flag:
            descr = f"Financial stress alert: Score {score} ({band}). "
            if deterioration_flag:
                descr += "Slope deterioration detected. "
            if anomaly_flag:
                descr += "Isolation Forest anomaly flagged. "

            alerts_to_add.append(Alert(
                merchant_id=m_id,
                date=latest_date,
                alert_type="Critical Stress" if band == "Critical" else ("Deterioration" if deterioration_flag else "Anomaly"),
                severity="High" if band == "Critical" else "Medium",
                description=descr,
                status="Active"
            ))

    print(f"Bulk saving {len(merchants_to_add)} merchants...")
    db.bulk_save_objects(merchants_to_add)

    print(f"Bulk saving {len(signals_to_add)} daily signals...")
    db.bulk_save_objects(signals_to_add)

    print(f"Bulk saving {len(risk_scores_to_add)} risk scores & {len(alerts_to_add)} alerts...")
    db.bulk_save_objects(risk_scores_to_add)
    db.bulk_save_objects(alerts_to_add)

    db.add(AuditLog(
        user_email="system@fintrust.ai",
        action_type="INITIAL_SEED",
        details_json=json.dumps({"message": f"Seeded database with {len(merchants_to_add)} merchants."})
    ))

    db.commit()
    db.close()
    print("Database seeding completed in lightning speed!")

if __name__ == "__main__":
    seed_database()
