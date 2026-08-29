import os
import json
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import IsolationForest

class NativeTreeExplainer:
    """Computes exact Tree SHAP attributions natively via XGBoost C++ engine."""
    def __init__(self, model):
        self.model = model

    def shap_values(self, X):
        dmatrix = xgb.DMatrix(X)
        booster = self.model.get_booster() if hasattr(self.model, "get_booster") else self.model
        contribs = booster.predict(dmatrix, pred_contribs=True)
        # contribs shape: (N, num_features + 1), last column is base margin / bias
        return contribs[:, :-1]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

FEATURE_COLUMNS = [
    "sales_mean_30d",
    "sales_std_30d",
    "sales_slope_30d",
    "refund_rate_mean_30d",
    "refund_rate_slope_30d",
    "bank_balance_mean_30d",
    "bank_balance_slope_30d",
    "credit_utilization_mean_30d",
    "credit_utilization_slope_30d",
    "supplier_delay_mean_30d",
    "inventory_turnover_mean_30d",
    "utilization_to_balance_ratio"
]

def calculate_slope(y_series):
    if len(y_series) < 5:
        return 0.0
    x = np.arange(len(y_series))
    y = np.array(y_series, dtype=float)
    denom = float(np.var(x))
    if denom == 0:
        return 0.0
    return float(np.cov(x, y)[0, 1] / denom)

def extract_features_from_signals(df_signals, merchant_base_limit=100000):
    last_30 = df_signals.tail(30)
    
    sales_vals = last_30["sales"].values
    refund_vals = last_30["refund_rate"].values
    balance_vals = last_30["bank_balance"].values
    util_vals = last_30["credit_utilization"].values
    delay_vals = last_30["supplier_delay"].values
    inv_vals = last_30["inventory_turnover"].values

    sales_mean = float(np.mean(sales_vals)) if len(sales_vals) > 0 else 1000.0
    sales_std = float(np.std(sales_vals)) if len(sales_vals) > 0 else 10.0
    sales_slope = calculate_slope(sales_vals) / (sales_mean if sales_mean > 0 else 1.0)

    refund_mean = float(np.mean(refund_vals)) if len(refund_vals) > 0 else 0.02
    refund_slope = calculate_slope(refund_vals)

    balance_mean = float(np.mean(balance_vals)) if len(balance_vals) > 0 else 10000.0
    balance_slope = calculate_slope(balance_vals) / (balance_mean if balance_mean > 0 else 1.0)

    util_mean = float(np.mean(util_vals)) if len(util_vals) > 0 else 0.3
    util_slope = calculate_slope(util_vals)

    delay_mean = float(np.mean(delay_vals)) if len(delay_vals) > 0 else 2.0
    inv_mean = float(np.mean(inv_vals)) if len(inv_vals) > 0 else 5.0

    util_to_balance = util_mean / (balance_mean / merchant_base_limit if balance_mean > 0 else 0.01)

    return {
        "sales_mean_30d": sales_mean,
        "sales_std_30d": sales_std,
        "sales_slope_30d": sales_slope,
        "refund_rate_mean_30d": refund_mean,
        "refund_rate_slope_30d": refund_slope,
        "bank_balance_mean_30d": balance_mean,
        "bank_balance_slope_30d": balance_slope,
        "credit_utilization_mean_30d": util_mean,
        "credit_utilization_slope_30d": util_slope,
        "supplier_delay_mean_30d": delay_mean,
        "inventory_turnover_mean_30d": inv_mean,
        "utilization_to_balance_ratio": util_to_balance
    }

def train_and_save_ml_models(df_merchants, df_signals):
    print("Extracting feature vectors for model training...")
    feature_rows = []
    labels = []

    m_limit_map = dict(zip(df_merchants["id"], df_merchants["base_credit_limit"]))
    m_archetype_map = dict(zip(df_merchants["id"], df_merchants["archetype"]))

    grouped = df_signals.groupby("merchant_id")
    for m_id, group in grouped:
        base_limit = m_limit_map.get(m_id, 100000)
        feats = extract_features_from_signals(group, base_limit)
        feature_rows.append(feats)

        arch = m_archetype_map.get(m_id, "HEALTHY")
        util = feats["credit_utilization_mean_30d"]
        refund = feats["refund_rate_mean_30d"]
        sales_slope = feats["sales_slope_30d"]
        delay = feats["supplier_delay_mean_30d"]
        util_slope = feats["credit_utilization_slope_30d"]

        risk_score = 15.0
        if util > 0.70:
            risk_score += (util - 0.70) * 120
        if refund > 0.05:
            risk_score += (refund - 0.05) * 350
        if sales_slope < 0:
            risk_score += abs(sales_slope) * 40
        if delay > 5:
            risk_score += (delay - 5) * 3.5
        if util_slope > 0:
            risk_score += util_slope * 500

        if arch == "DETERIORATING":
            risk_score += 25
        elif arch == "ANOMALOUS_SHOCK":
            risk_score += 35

        risk_score = max(5.0, min(99.0, risk_score))
        labels.append(risk_score)

    X_df = pd.DataFrame(feature_rows)[FEATURE_COLUMNS]
    y = np.array(labels)

    print(f"Training XGBoost Regressor on {len(X_df)} samples...")
    model = xgb.XGBRegressor(
        n_estimators=60,
        max_depth=4,
        learning_rate=0.08,
        random_state=42
    )
    model.fit(X_df, y)

    print("Training Isolation Forest Anomaly Detector...")
    iso_forest = IsolationForest(
        n_estimators=60,
        contamination=0.12,
        random_state=42
    )
    iso_forest.fit(X_df)

    print("Fitting Native SHAP TreeExplainer...")
    explainer = NativeTreeExplainer(model)

    model.save_model(os.path.join(ARTIFACTS_DIR, "xgboost_model.json"))
    joblib.dump(iso_forest, os.path.join(ARTIFACTS_DIR, "isolation_forest.pkl"))
    with open(os.path.join(ARTIFACTS_DIR, "feature_names.json"), "w") as f:
        json.dump(FEATURE_COLUMNS, f)

    print("ML models and SHAP explainer successfully trained & saved!")
    return model, iso_forest, explainer, FEATURE_COLUMNS
