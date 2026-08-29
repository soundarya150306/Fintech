import os
import json
import joblib
import numpy as np
import pandas as pd

from ml.train_model import FEATURE_COLUMNS, extract_features_from_signals, NativeTreeExplainer, IsolationForestDetector, GradientBoostedTreeRegressor

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")

class StressRadarInferenceEngine:
    def __init__(self):
        self.model = None
        self.iso_forest = None
        self.explainer = None
        self.feature_names = FEATURE_COLUMNS
        self.load_or_initialize()

    def load_or_initialize(self):
        model_path = os.path.join(ARTIFACTS_DIR, "xgboost_model.pkl")
        iso_path = os.path.join(ARTIFACTS_DIR, "isolation_forest.pkl")

        if os.path.exists(model_path) and os.path.exists(iso_path):
            try:
                self.model = GradientBoostedTreeRegressor()
                self.model.load_model(model_path)
                self.iso_forest = joblib.load(iso_path)
                self.explainer = NativeTreeExplainer(self.model)
                print("Successfully loaded pre-trained GradientBoostedTree, Isolation Forest & Native SHAP Explainer!")
                return
            except Exception as e:
                print(f"Error loading saved ML models, fallback initialization: {e}")

        # Fallback initialization (fit quick baseline if artifacts missing)
        self.initialize_fallback()

    def initialize_fallback(self):
        from ml.synthetic_generator import generate_synthetic_dataset
        from ml.train_model import train_and_save_ml_models
        print("Artifacts missing, triggering on-demand synthetic ML model training...")
        df_m, df_s = generate_synthetic_dataset(300, 90)
        self.model, self.iso_forest, self.explainer, self.feature_names = train_and_save_ml_models(df_m, df_s)

    def analyze_merchant(self, df_signals, merchant_base_limit=100000, modified_vector=None):
        """
        Runs complete real inference:
        - Extracts feature vector (or applies modified vector for What-If scenario)
        - Calculates XGBoost risk score
        - Calculates SHAP feature impact breakdown
        - Calculates Isolation Forest anomaly score & flag
        - Calculates time-series deterioration slope & flag
        """
        feats_dict = extract_features_from_signals(df_signals, merchant_base_limit)

        # Apply What-If scenario modifications if provided
        if modified_vector:
            if "base_credit_limit" in modified_vector:
                new_limit = float(modified_vector["base_credit_limit"])
                old_limit = merchant_base_limit
                ratio = old_limit / new_limit if new_limit > 0 else 1.0
                feats_dict["credit_utilization_mean_30d"] = float(np.clip(feats_dict["credit_utilization_mean_30d"] * ratio, 0.05, 0.99))
                feats_dict["utilization_to_balance_ratio"] = feats_dict["credit_utilization_mean_30d"] / (feats_dict["bank_balance_mean_30d"] / new_limit if feats_dict["bank_balance_mean_30d"] > 0 else 0.01)

            if "repayment_frequency" in modified_vector:
                freq = modified_vector["repayment_frequency"]
                if freq == "Daily":
                    feats_dict["credit_utilization_mean_30d"] = float(np.clip(feats_dict["credit_utilization_mean_30d"] * 0.85, 0.05, 0.99))
                elif freq == "Monthly":
                    feats_dict["credit_utilization_mean_30d"] = float(np.clip(feats_dict["credit_utilization_mean_30d"] * 1.15, 0.05, 0.99))

            if "spending_restriction" in modified_vector and modified_vector["spending_restriction"]:
                feats_dict["refund_rate_mean_30d"] = float(np.clip(feats_dict["refund_rate_mean_30d"] * 0.70, 0.005, 0.25))

        X_input = pd.DataFrame([feats_dict])[self.feature_names]

        # 1. XGBoost Risk Score Prediction
        raw_score = float(self.model.predict(X_input)[0])
        risk_score = round(float(np.clip(raw_score, 5.0, 99.0)), 1)

        # Risk Band
        if risk_score < 40.0:
            risk_band = "Low Risk"
        elif risk_score < 70.0:
            risk_band = "Watchlist"
        else:
            risk_band = "Critical"

        # 2. Real SHAP Explanation
        shap_values = self.explainer.shap_values(X_input)[0]
        shap_drivers = []
        
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

        for fname, val, s_val in zip(self.feature_names, X_input.iloc[0], shap_values):
            label = feature_labels.get(fname, fname)
            shap_drivers.append({
                "feature": fname,
                "label": label,
                "value": round(float(val), 4),
                "shap_impact": round(float(s_val), 3),
                "risk_direction": "Increases Risk" if s_val > 0 else "Decreases Risk"
            })

        # Sort by magnitude of SHAP impact
        shap_drivers.sort(key=lambda x: abs(x["shap_impact"]), reverse=True)

        # 3. Isolation Forest Anomaly Detection
        iso_pred = int(self.iso_forest.predict(X_input)[0])  # -1 = anomaly, 1 = normal
        iso_score = float(-self.iso_forest.score_samples(X_input)[0])  # higher = more anomalous
        anomaly_flag = bool(iso_pred == -1 or iso_score > 0.65)

        # 4. Deterioration Trend Detection (Time-series slope test)
        sales_slope = feats_dict["sales_slope_30d"]
        refund_slope = feats_dict["refund_rate_slope_30d"]
        util_slope = feats_dict["credit_utilization_slope_30d"]
        balance_slope = feats_dict["bank_balance_slope_30d"]

        deterioration_flag = bool(
            sales_slope < -0.15 or
            refund_slope > 0.02 or
            util_slope > 0.05 or
            balance_slope < -0.20
        )

        deterioration_reasons = []
        if sales_slope < -0.15:
            deterioration_reasons.append(f"Consistent 30-day revenue decline (slope: {sales_slope:.2f})")
        if refund_slope > 0.02:
            deterioration_reasons.append(f"Rapid refund rate acceleration (+{refund_slope*100:.1f}%)")
        if util_slope > 0.05:
            deterioration_reasons.append(f"Steep credit line utilization growth (+{util_slope*100:.1f}%)")
        if balance_slope < -0.20:
            deterioration_reasons.append(f"Fast bank balance depletion (-{abs(balance_slope)*100:.1f}%)")

        return {
            "risk_score": risk_score,
            "risk_band": risk_band,
            "top_drivers": shap_drivers[:5],  # top 5 drivers
            "all_shap_drivers": shap_drivers,
            "anomaly_flag": anomaly_flag,
            "anomaly_score": round(iso_score, 3),
            "deterioration_flag": deterioration_flag,
            "deterioration_reasons": deterioration_reasons,
            "feature_vector": feats_dict
        }

# Global singleton
inference_engine = StressRadarInferenceEngine()
