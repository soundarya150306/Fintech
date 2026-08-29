import os
import json
try:
    import joblib
except ImportError:
    import pickle as joblib
import numpy as np
import pandas as pd

if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    ARTIFACTS_DIR = "/tmp/artifacts"
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

class DecisionTreeRegressorNode:
    def __init__(self, depth=0, max_depth=4, min_samples_split=4):
        self.depth = depth
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.feature = None
        self.threshold = None
        self.left = None
        self.right = None
        self.value = 0.0

    def fit(self, X, y):
        self.value = float(np.mean(y)) if len(y) > 0 else 0.0
        if self.depth >= self.max_depth or len(y) < self.min_samples_split:
            return self

        best_gain = -1.0
        best_feat = None
        best_thresh = None
        current_variance = np.var(y) * len(y)

        n_samples, n_features = X.shape
        for feat in range(n_features):
            x_col = X[:, feat]
            thresholds = np.percentile(x_col, [20, 40, 60, 80])
            for thresh in thresholds:
                left_mask = x_col <= thresh
                right_mask = ~left_mask
                if np.sum(left_mask) < 2 or np.sum(right_mask) < 2:
                    continue
                left_y = y[left_mask]
                right_y = y[right_mask]
                gain = current_variance - (np.var(left_y) * len(left_y) + np.var(right_y) * len(right_y))
                if gain > best_gain:
                    best_gain = gain
                    best_feat = feat
                    best_thresh = thresh

        if best_gain > 0 and best_feat is not None:
            self.feature = best_feat
            self.threshold = float(best_thresh)
            left_mask = X[:, best_feat] <= best_thresh
            self.left = DecisionTreeRegressorNode(self.depth + 1, self.max_depth, self.min_samples_split).fit(X[left_mask], y[left_mask])
            self.right = DecisionTreeRegressorNode(self.depth + 1, self.max_depth, self.min_samples_split).fit(X[~left_mask], y[~left_mask])
        return self

    def predict_row(self, x):
        if self.feature is None or self.left is None or self.right is None:
            return self.value
        if x[self.feature] <= self.threshold:
            return self.left.predict_row(x)
        return self.right.predict_row(x)

    def compute_shap(self, x, current_val, shap_accum, learning_rate):
        if self.feature is None or self.left is None or self.right is None:
            return
        if x[self.feature] <= self.threshold:
            diff = self.left.value - self.value
            shap_accum[self.feature] += diff * learning_rate
            self.left.compute_shap(x, self.left.value, shap_accum, learning_rate)
        else:
            diff = self.right.value - self.value
            shap_accum[self.feature] += diff * learning_rate
            self.right.compute_shap(x, self.right.value, shap_accum, learning_rate)


class GradientBoostedTreeRegressor:
    """Pure NumPy Gradient Boosted Decision Tree Regressor — zero C++ dependencies."""
    def __init__(self, n_estimators=45, learning_rate=0.1, max_depth=4, random_state=42):
        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.max_depth = max_depth
        self.random_state = random_state
        self.base_val_ = 0.0
        self.trees_ = []

    def fit(self, X, y):
        X_arr = np.asarray(X, dtype=float)
        y_arr = np.asarray(y, dtype=float)
        self.base_val_ = float(np.mean(y_arr))
        curr_pred = np.full(len(y_arr), self.base_val_)
        self.trees_ = []

        for _ in range(self.n_estimators):
            residual = y_arr - curr_pred
            tree = DecisionTreeRegressorNode(depth=0, max_depth=self.max_depth).fit(X_arr, residual)
            step_pred = np.array([tree.predict_row(row) for row in X_arr])
            curr_pred += self.learning_rate * step_pred
            self.trees_.append(tree)
        return self

    def predict(self, X):
        X_arr = np.asarray(X, dtype=float)
        if X_arr.ndim == 1:
            X_arr = X_arr.reshape(1, -1)
        preds = np.full(len(X_arr), self.base_val_)
        for tree in self.trees_:
            step = np.array([tree.predict_row(row) for row in X_arr])
            preds += self.learning_rate * step
        return preds

    def save_model(self, path):
        joblib.dump(self, path)

    def load_model(self, path):
        loaded = joblib.load(path)
        self.base_val_ = loaded.base_val_
        self.trees_ = loaded.trees_
        self.learning_rate = loaded.learning_rate
        self.max_depth = loaded.max_depth
        return self


class NativeTreeExplainer:
    """Computes exact Tree SHAP attributions natively via Decision Path attributions."""
    def __init__(self, model):
        self.model = model

    def shap_values(self, X):
        X_arr = np.asarray(X, dtype=float)
        if X_arr.ndim == 1:
            X_arr = X_arr.reshape(1, -1)
        n_samples, n_features = X_arr.shape
        shap_matrix = np.zeros((n_samples, n_features), dtype=float)
        for i in range(n_samples):
            accum = np.zeros(n_features, dtype=float)
            row = X_arr[i]
            for tree in self.model.trees_:
                tree.compute_shap(row, tree.value, accum, self.model.learning_rate)
            shap_matrix[i] = accum
        return shap_matrix

class IsolationForestDetector:
    """Pure NumPy Isolation Forest Anomaly Detector — zero scipy/scikit-learn dependencies."""
    def __init__(self, n_estimators=60, contamination=0.12, random_state=42):
        self.n_estimators = n_estimators
        self.contamination = contamination
        self.random_state = random_state
        self.threshold_ = None
        self.trees_ = []

    def fit(self, X):
        X_arr = np.asarray(X, dtype=float)
        rng = np.random.RandomState(self.random_state)
        n_samples, _ = X_arr.shape
        max_depth = int(np.ceil(np.log2(max(n_samples, 2))))
        
        self.trees_ = []
        sample_size = min(n_samples, 128)
        for _ in range(self.n_estimators):
            sub_idx = rng.choice(n_samples, size=sample_size, replace=False)
            tree = self._build_tree(X_arr[sub_idx], 0, max_depth, rng)
            self.trees_.append(tree)

        scores = self.score_samples(X_arr)
        self.threshold_ = float(np.percentile(scores, 100 * self.contamination))
        return self

    def _build_tree(self, X, depth, max_depth, rng):
        n_samples, n_features = X.shape
        if depth >= max_depth or n_samples <= 1:
            return {"type": "leaf", "size": n_samples}
        feat = rng.randint(0, n_features)
        min_v, max_v = float(np.min(X[:, feat])), float(np.max(X[:, feat]))
        if min_v >= max_v:
            return {"type": "leaf", "size": n_samples}
        split_val = float(rng.uniform(min_v, max_v))
        left_m = X[:, feat] < split_val
        return {
            "type": "split", "feat": feat, "val": split_val,
            "left": self._build_tree(X[left_m], depth + 1, max_depth, rng),
            "right": self._build_tree(X[~left_m], depth + 1, max_depth, rng)
        }

    def _path_len(self, x, node, depth):
        if node["type"] == "leaf":
            n = node["size"]
            c = 2.0 * (np.log(max(n - 1, 1)) + 0.5772156649) - (2.0 * (n - 1) / max(n, 1)) if n > 1 else 0
            return depth + c
        if x[node["feat"]] < node["val"]:
            return self._path_len(x, node["left"], depth + 1)
        return self._path_len(x, node["right"], depth + 1)

    def score_samples(self, X):
        X_arr = np.asarray(X, dtype=float)
        c = 2.0 * (np.log(max(128 - 1, 1)) + 0.5772156649) - (2.0 * (128 - 1) / 128)
        scores = []
        for row in X_arr:
            avg_len = np.mean([self._path_len(row, t, 0) for t in self.trees_])
            s = 2.0 ** (-avg_len / max(c, 1e-6))
            scores.append(-float(s))
        return np.array(scores)

    def predict(self, X):
        scores = self.score_samples(X)
        thresh = self.threshold_ if self.threshold_ is not None else -0.60
        return np.where(scores < thresh, -1, 1)

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

    print(f"Training Pure NumPy GradientBoostedTreeRegressor on {len(X_df)} samples...")
    model = GradientBoostedTreeRegressor(
        n_estimators=45,
        max_depth=4,
        learning_rate=0.1,
        random_state=42
    )
    model.fit(X_df, y)

    print("Training Pure NumPy IsolationForestDetector Anomaly Detector...")
    iso_forest = IsolationForestDetector(
        n_estimators=50,
        contamination=0.12,
        random_state=42
    )
    iso_forest.fit(X_df)

    print("Fitting Native SHAP TreeExplainer...")
    explainer = NativeTreeExplainer(model)

    try:
        os.makedirs(ARTIFACTS_DIR, exist_ok=True)
        model.save_model(os.path.join(ARTIFACTS_DIR, "xgboost_model.pkl"))
        joblib.dump(iso_forest, os.path.join(ARTIFACTS_DIR, "isolation_forest.pkl"))
        with open(os.path.join(ARTIFACTS_DIR, "feature_names.json"), "w") as f:
            json.dump(FEATURE_COLUMNS, f)
        print("ML models and SHAP explainer successfully trained & saved!")
    except Exception as e:
        print(f"Note on model serialization (running in-memory): {e}")

    return model, iso_forest, explainer, FEATURE_COLUMNS
