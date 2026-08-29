import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Determine DB path based on environment (Vercel vs Local)
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    DB_PATH = "/tmp/fintrust.db"
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DB_PATH = os.path.join(BASE_DIR, "fintrust.db")

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

_db_initialized = False

def ensure_db_seeded():
    global _db_initialized
    if _db_initialized:
        return
    try:
        from models import Merchant
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        count = db.query(Merchant).count()
        if count == 0:
            print("Auto-seeding empty database on demand...")
            from seed import seed_database
            seed_database()
        db.close()
        _db_initialized = True
    except Exception as e:
        print(f"Auto-seed note: {e}")

def get_db():
    ensure_db_seeded()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
