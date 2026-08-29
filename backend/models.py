from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="Credit Officer")
    created_at = Column(DateTime, default=datetime.utcnow)

class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sector = Column(String, nullable=False)
    region = Column(String, nullable=False)
    base_credit_limit = Column(Float, nullable=False)
    current_risk_score = Column(Float, default=20.0)
    risk_band = Column(String, default="Low Risk")  # Low Risk, Watchlist, Critical
    anomaly_flag = Column(Boolean, default=False)
    deterioration_flag = Column(Boolean, default=False)
    onboarded_date = Column(String, nullable=False)
    status = Column(String, default="Active")

    signals = relationship("DailySignal", back_populates="merchant", cascade="all, delete-orphan")
    risk_history = relationship("RiskScore", back_populates="merchant", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="merchant", cascade="all, delete-orphan")

class DailySignal(Base):
    __tablename__ = "daily_signals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    merchant_id = Column(String, ForeignKey("merchants.id"), index=True, nullable=False)
    date = Column(String, index=True, nullable=False)  # YYYY-MM-DD
    sales = Column(Float, nullable=False)
    transaction_count = Column(Integer, nullable=False)
    avg_transaction_value = Column(Float, nullable=False)
    refund_rate = Column(Float, nullable=False)  # 0.0 - 1.0 (e.g. 0.03 = 3%)
    bank_balance = Column(Float, nullable=False)
    credit_utilization = Column(Float, nullable=False)  # 0.0 - 1.0 (e.g. 0.65 = 65%)
    inventory_turnover = Column(Float, nullable=False)
    supplier_delay = Column(Integer, nullable=False)  # days

    merchant = relationship("Merchant", back_populates="signals")

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    merchant_id = Column(String, ForeignKey("merchants.id"), index=True, nullable=False)
    date = Column(String, index=True, nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_band = Column(String, nullable=False)
    top_drivers_json = Column(Text, nullable=False)  # JSON string of SHAP feature importance
    anomaly_score = Column(Float, default=0.0)
    deterioration_score = Column(Float, default=0.0)

    merchant = relationship("Merchant", back_populates="risk_history")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    merchant_id = Column(String, ForeignKey("merchants.id"), index=True, nullable=False)
    date = Column(String, nullable=False)
    alert_type = Column(String, nullable=False)  # Deterioration, Anomaly, High Risk
    severity = Column(String, nullable=False)  # High, Medium, Low
    description = Column(Text, nullable=False)
    status = Column(String, default="Active")  # Active, Resolved, Ignored

    merchant = relationship("Merchant", back_populates="alerts")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_email = Column(String, default="system@fintrust.ai")
    action_type = Column(String, nullable=False)  # SIMULATION, COPILOT_QUERY, RISK_OVERRIDE, DAY_ADVANCE
    merchant_id = Column(String, nullable=True)
    details_json = Column(Text, nullable=False)
