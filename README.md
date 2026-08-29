# FinTrust AI - Merchant Financial Stress Radar

## AI-Powered Credit Risk Underwriting Platform for E-Commerce Merchants Using Alternate Transaction Data

> "FinTrust AI doesn't just decide whether a merchant deserves credit - it continuously senses when their ability to repay is changing, explains why, and recommends the safest intervention before financial stress becomes default."

---

## Does This Project Fit the Research Title?

YES - completely and precisely.

| Research Requirement | How FinTrust AI Covers It |
|---|---|
| AI-Powered | XGBoost ML model + SHAP explainability + Isolation Forest anomaly detection + Gemini LLM Copilot |
| Credit Risk Underwriting | Real-time risk scoring 0-100, risk bands (Low / Watchlist / Critical), and credit limit simulation |
| E-Commerce Merchants | Built for online merchants - tracks daily sales, transactions, refunds |
| Alternate Transaction Data | Uses daily sales, refund rate, bank balance, credit utilization, inventory turnover, supplier delays - NOT traditional bureau scores |
| Platform | Full-stack web app with dashboard, merchant profiles, early warning, simulator, AI copilot, and audit trail |

---

## What Does It Do?

Traditional lending checks credit once and waits for default. FinTrust AI watches merchant transaction behavior daily and:
- Detects deterioration BEFORE default happens
- Explains exactly WHY a merchant is becoming risky (using AI)
- Lets credit officers simulate "what-if" scenarios before making decisions
- Maintains a full compliance audit trail of every AI recommendation

---

## Full Tech Stack

### Backend
- Python 3.12
- FastAPI (REST API framework)
- SQLAlchemy (ORM)
- SQLite (database)
- Uvicorn (ASGI server)
- Mangum 0.22.0 (Vercel serverless adapter)
- Pydantic v2 (data validation)

### Machine Learning & AI
- XGBoost 3.4.1 (risk scoring model - Gradient Boosted Trees)
- SHAP 0.52.0 (AI explainability - feature attribution)
- Scikit-learn (Isolation Forest anomaly detection)
- NumPy 2.2.6 (vectorized numerical computation)
- Pandas (time-series data manipulation)
- Numba 0.67.0 (JIT compilation for SHAP)
- Joblib (ML model serialization/persistence)
- Google Gemini 1.5 Flash API (grounded AI Copilot)
- Groq API (LLM fallback provider)

### Authentication & Security
- PyJWT (JSON Web Token creation and verification)
- Passlib + pbkdf2_sha256 (secure password hashing)
- FastAPI OAuth2 (token-based login flow)

### PDF Generation
- ReportLab (programmatic PDF risk report generation)

### Frontend
- React 18 (UI component framework)
- TypeScript (type-safe JavaScript)
- Vite 5.4 (fast build tool and dev server)
- Tailwind CSS v3 (dark fintech UI theme)
- Recharts (line charts, bar charts, pie charts)
- Lucide React (icon library)
- Canvas API - Browser Native (animated risk radar visualization)

### Deployment
- Vercel (frontend CDN + Python serverless functions)
- GitHub (source control)

---

## Machine Learning Pipeline

### 12 Alternate Data Features (no bureau scores used)
1. sales_mean_30d - Average daily sales revenue over 30 days
2. sales_slope_30d - Whether sales are trending up or down
3. sales_std_30d - How volatile daily sales are
4. refund_rate_mean_30d - Average daily refund/return rate
5. refund_rate_slope_30d - Whether refunds are accelerating (bad sign)
6. bank_balance_mean_30d - Average cash reserves held
7. bank_balance_slope_30d - Whether cash reserves are depleting
8. credit_utilization_mean_30d - Average percentage of credit line used
9. credit_utilization_slope_30d - Whether utilization is growing (stress indicator)
10. supplier_delay_mean_30d - Average days suppliers are delayed
11. inventory_turnover_mean_30d - How fast inventory is moving
12. utilization_to_balance_ratio - Composite stress ratio: credit used vs cash held

### Models
- XGBoost Regressor: outputs continuous 0-100 stress score
- Risk Bands: Low Risk (0-40), Watchlist (40-70), Critical (70-100)
- Isolation Forest: unsupervised anomaly detection (12% contamination rate)
- SHAP TreeExplainer: per-prediction feature attribution for every score

---

## Database Schema (SQLite - 6 tables)

- users - Credit officers with JWT auth and role
- merchants - 200 merchant profiles with live risk scores
- daily_signals - 9,000 rows of daily transaction records
- risk_scores - Historical model outputs + SHAP JSON per merchant
- alerts - Auto-generated stress alerts
- audit_logs - Immutable compliance record of every action

---

## Project Structure

FinTech/
|-- README.md
|-- vercel.json                      Vercel routing config (API vs Frontend)
|-- api/
|   |-- index.py                     Mangum serverless entry point for Vercel
|-- backend/
|   |-- main.py                      FastAPI app + all 10 REST endpoints
|   |-- models.py                    SQLAlchemy ORM table definitions
|   |-- database.py                  SQLite connection + session management
|   |-- auth.py                      JWT authentication + OAuth2 login
|   |-- seed.py                      Data generation + model training script
|   |-- requirements.txt             All Python dependencies
|   |-- fintrust.db                  SQLite database (auto-generated by seed.py)
|   |-- ml/
|   |   |-- synthetic_generator.py   Generates 200 merchant x 45-day dataset
|   |   |-- train_model.py           Trains XGBoost + Isolation Forest + SHAP
|   |   |-- inference_engine.py      Live inference: score + SHAP + anomaly
|   |   |-- artifacts/               Saved model files
|   |-- services/
|   |   |-- copilot_service.py       Gemini/Groq AI Copilot with context injection
|   |   |-- pdf_generator.py         ReportLab PDF risk report generator
|-- frontend/
    |-- package.json
    |-- vite.config.ts               Vite dev server + API proxy to port 8000
    |-- tailwind.config.js           Dark fintech theme config
    |-- tsconfig.json
    |-- src/
        |-- main.tsx                 React entry point
        |-- App.tsx                  Root app state, routing, tab management
        |-- types.ts                 TypeScript data interfaces
        |-- api/
        |   |-- client.ts            REST API client (all fetch wrappers)
        |-- components/
        |   |-- Navbar.tsx           Header, navigation tabs, simulation ticker
        |   |-- AuthModal.tsx        JWT login modal with demo credentials
        |   |-- 3D/RadarVisualizer.tsx   Canvas 2D animated risk radar
        |-- views/
            |-- ExecutiveDashboard.tsx   Main dashboard (charts, metrics, alerts)
            |-- Merchant360.tsx          Full merchant profile + SHAP breakdown
            |-- EarlyWarningCenter.tsx   Risk acceleration ranking table
            |-- DigitalTwinSimulator.tsx What-If credit policy simulator
            |-- AICreditCopilot.tsx      Gemini-powered chat interface
            |-- AuditLogView.tsx         Compliance audit trail table

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/dashboard/summary | Portfolio metrics, alerts, sector breakdown |
| GET | /api/merchants | List merchants with filters (risk band, sector, anomaly) |
| GET | /api/merchants/{id} | Full 360 profile with SHAP drivers + signal history |
| POST | /api/simulate | Run What-If simulation with new credit parameters |
| POST | /api/copilot | Query AI Copilot with grounded merchant context |
| GET | /api/early-warning | Fast-risers ranked by risk score acceleration |
| POST | /api/simulation/advance-day | Advance synthetic dataset by 1 day |
| GET | /api/merchants/{id}/report | Download PDF risk report |
| GET | /api/audit-logs | Fetch compliance audit trail |
| POST | /api/auth/login | JWT authentication login |

---

## Running Locally

### Step 1: Install Python dependencies
```
pip install -r backend/requirements.txt
```

### Step 2: Seed the database and train ML models
```
python backend/seed.py
```
This generates synthetic data, trains XGBoost + Isolation Forest + SHAP, and populates SQLite in one command.

### Step 3: Start backend server (Terminal 1)
```
cd C:\Users\iswar\FinTech
python -m uvicorn backend.main:app --reload --port 8000
```

### Step 4: Start frontend dev server (Terminal 2)
```
cd C:\Users\iswar\FinTech\frontend
npm run dev
```

### Step 5: Open in browser
Visit: http://localhost:5173

Demo Login:
- Credit Officer: officer@fintrust.ai / officer123
- Admin: admin@fintrust.ai / admin123

---

## Deploying to Vercel

### Step 1: Push to GitHub
```
git init
git add .
git commit -m "Initial commit: FinTrust AI"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Import in Vercel
Go to vercel.com > Add New Project > Import from GitHub

### Step 3: Set Environment Variables in Vercel Dashboard
- GEMINI_API_KEY - Your Google AI Studio API key (for AI Copilot)
- JWT_SECRET_KEY - Any secure random string
- GROQ_API_KEY - (Optional) Groq API key for LLM fallback

### Step 4: Click Deploy

---

## All Features

| Feature | Description |
|---|---|
| Financial Stress Radar | Animated 2D canvas risk map - all merchants as colored dots |
| Real-Time Risk Scoring | XGBoost model scores every merchant on a 0-100 stress index |
| SHAP Explainability | AI explains which specific factor caused each risk score |
| Anomaly Detection | Isolation Forest flags sudden behavioral shifts independently |
| Early Warning Center | Ranks merchants by fastest risk score acceleration |
| Merchant 360 Profile | Full deep-dive: SHAP drivers, 30-day signal charts, risk history |
| What-If Simulator | Real AI re-inference on hypothetical credit limit changes |
| AI Credit Copilot | Gemini-powered chatbot grounded in real merchant financial data |
| PDF Risk Reports | Downloadable PDF risk reports per merchant |
| Audit & Compliance Log | Immutable record of every decision and AI recommendation |
| JWT Authentication | Role-based login for credit officers and admins |
| Time Simulation | Next Day button advances synthetic data to demo live score drift |
| Vercel Deployment | Full production deployment: serverless Python + React CDN |

---

## Research Contribution

This project demonstrates:
1. Alternate Data Underwriting - Transaction signals replace traditional bureau scores
2. Explainable AI (XAI) in Finance - SHAP values make every decision auditable
3. Behavioral Anomaly Detection - Isolation Forest for financial shock detection
4. Digital Twin Simulation - Test policy changes virtually before implementing them
5. Continuous Credit Monitoring - Daily re-assessment vs one-time point-in-time scoring

---

FinTrust AI - AI-Powered Credit Risk Underwriting Platform for E-Commerce Merchants Using Alternate Transaction Data
