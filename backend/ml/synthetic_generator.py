import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

SECTORS = [
    "Electronics & Retail",
    "Apparel & Fashion",
    "Food & Beverage",
    "Healthcare & Pharmacy",
    "Digital Goods & SaaS",
    "Logistics & Wholesale",
    "Auto Parts & Services"
]

REGIONS = ["North America", "Europe", "Asia-Pacific", "Latin America", "Middle East"]

COMPANY_PREFIXES = [
    "Nexus", "Apex", "Vanguard", "Summit", "Starlight", "Beacon", "Horizon", "Velocity",
    "Zenith", "Quantum", "Hyperion", "Pinnacle", "Aero", "Pulse", "Titan", "Nova",
    "Crest", "Orbital", "Solaria", "Veritas", "Ironclad", "Omni", "Strata", "Eclipse"
]

COMPANY_SUFFIXES = [
    "Trading", "Logistics", "Retail", "Solutions", "Mart", "Direct", "Express", "Holdings",
    "Ventures", "Supply", "Hub", "Network", "Tech", "Foods", "Outfitters", "Systems"
]

def generate_merchant_names(n=250):
    names = set()
    while len(names) < n:
        name = f"{random.choice(COMPANY_PREFIXES)} {random.choice(COMPANY_SUFFIXES)}"
        names.add(name)
    return list(names)

def generate_synthetic_dataset(num_merchants=250, num_days=60):
    np.random.seed(42)
    random.seed(42)

    merchant_names = generate_merchant_names(num_merchants)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=num_days)

    dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(num_days)]

    merchants_list = []
    signals_list = []

    archetype_choices = ["HEALTHY", "SEASONAL", "DETERIORATING", "ANOMALOUS_SHOCK"]
    archetype_weights = [0.60, 0.15, 0.15, 0.10]
    archetypes = np.random.choice(archetype_choices, size=num_merchants, p=archetype_weights)

    for i in range(num_merchants):
        m_id = f"MCH-{1000 + i}"
        name = merchant_names[i]
        sector = random.choice(SECTORS)
        region = random.choice(REGIONS)
        base_limit = float(random.choice([25000, 50000, 100000, 250000, 500000]))
        archetype = archetypes[i]

        merchants_list.append({
            "id": m_id,
            "name": name,
            "sector": sector,
            "region": region,
            "base_credit_limit": base_limit,
            "archetype": archetype,
            "onboarded_date": (start_date - timedelta(days=random.randint(60, 365))).strftime("%Y-%m-%d")
        })

        base_daily_sales = random.uniform(2000, 12000)
        base_bank_balance = base_limit * random.uniform(0.4, 1.2)
        base_utilization = random.uniform(0.15, 0.40)
        base_refund_rate = random.uniform(0.01, 0.03)

        # Vectorized generation for days
        day_indices = np.arange(num_days)
        progress = day_indices / num_days

        if archetype == "HEALTHY":
            sales_trend = 1.0 + (0.15 * progress) + np.random.normal(0, 0.04, size=num_days)
            refund_rate = np.clip(base_refund_rate + np.random.normal(0, 0.002, size=num_days), 0.005, 0.04)
            utilization = np.clip(base_utilization + np.random.normal(0, 0.01, size=num_days), 0.10, 0.55)
            balance_mult = 1.0 + (0.2 * progress) + np.random.normal(0, 0.04, size=num_days)
            supplier_delay = np.random.randint(0, 3, size=num_days)

        elif archetype == "SEASONAL":
            season_factor = 1.0 + 0.3 * np.sin(2 * np.pi * day_indices / 20)
            sales_trend = season_factor + np.random.normal(0, 0.04, size=num_days)
            refund_rate = np.clip(base_refund_rate + np.random.normal(0, 0.003, size=num_days), 0.01, 0.05)
            utilization = np.clip(base_utilization + 0.2 * np.sin(2 * np.pi * day_indices / 20), 0.15, 0.70)
            balance_mult = season_factor + np.random.normal(0, 0.04, size=num_days)
            supplier_delay = np.random.randint(0, 4, size=num_days)

        elif archetype == "DETERIORATING":
            det_factor = np.maximum(0, (day_indices - 15) / (num_days - 15))
            sales_trend = np.maximum(0.2, 1.0 - (0.65 * det_factor) + np.random.normal(0, 0.03, size=num_days))
            refund_rate = np.clip(0.02 + (0.16 * det_factor) + np.random.normal(0, 0.005, size=num_days), 0.01, 0.22)
            utilization = np.clip(0.3 + (0.65 * det_factor) + np.random.normal(0, 0.02, size=num_days), 0.2, 0.98)
            balance_mult = np.maximum(0.05, 1.0 - (0.85 * det_factor) + np.random.normal(0, 0.03, size=num_days))
            supplier_delay = np.clip((2 + 18 * det_factor).astype(int) + np.random.randint(0, 3, size=num_days), 1, 25)

        else: # ANOMALOUS_SHOCK
            sales_trend = np.ones(num_days) + np.random.normal(0, 0.04, size=num_days)
            refund_rate = np.full(num_days, base_refund_rate)
            utilization = np.full(num_days, base_utilization)
            balance_mult = np.ones(num_days)
            supplier_delay = np.random.randint(0, 3, size=num_days)

            # Shock window between day 40-50
            shock_mask = (day_indices >= 40) & (day_indices <= 50)
            sales_trend[shock_mask] = 0.25
            refund_rate[shock_mask] = 0.18
            utilization[shock_mask] = 0.95
            balance_mult[shock_mask] = 0.10
            supplier_delay[shock_mask] = 16

        sales_vals = np.round(np.maximum(100.0, base_daily_sales * sales_trend), 2)
        tx_counts = np.maximum(1, (sales_vals / 85.0).astype(int))
        avg_tx_vals = np.round(sales_vals / tx_counts, 2)
        bank_balances = np.round(np.maximum(500.0, base_bank_balance * balance_mult), 2)
        inv_turnover = np.round(np.maximum(1.0, 8.0 * np.sqrt(np.maximum(0.1, sales_trend))), 2)

        for d_idx, d_str in enumerate(dates):
            signals_list.append({
                "merchant_id": m_id,
                "date": d_str,
                "sales": float(sales_vals[d_idx]),
                "transaction_count": int(tx_counts[d_idx]),
                "avg_transaction_value": float(avg_tx_vals[d_idx]),
                "refund_rate": round(float(refund_rate[d_idx]), 4),
                "bank_balance": float(bank_balances[d_idx]),
                "credit_utilization": round(float(utilization[d_idx]), 4),
                "inventory_turnover": float(inv_turnover[d_idx]),
                "supplier_delay": int(supplier_delay[d_idx])
            })

    return pd.DataFrame(merchants_list), pd.DataFrame(signals_list)

if __name__ == "__main__":
    df_m, df_s = generate_synthetic_dataset(250, 60)
    print(f"Generated {len(df_m)} merchants and {len(df_s)} signal records in vector speed.")
