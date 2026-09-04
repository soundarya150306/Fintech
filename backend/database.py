import os
import shutil
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PRESEEDED_DB = os.path.join(BASE_DIR, "fintrust.db")

# Determine DB path based on environment (Vercel vs Local)
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    DB_PATH = "/tmp/fintrust.db"
    # Fast instant copy of pre-seeded SQLite database to writable /tmp on cold start
    if not os.path.exists(DB_PATH) or os.path.getsize(DB_PATH) == 0:
        if os.path.exists(PRESEEDED_DB) and os.path.getsize(PRESEEDED_DB) > 1000:
            try:
                shutil.copyfile(PRESEEDED_DB, DB_PATH)
                print(f"Pre-seeded database copied to {DB_PATH} in <5ms.")
            except Exception as e:
                print(f"Database copy note: {e}")
else:
    DB_PATH = PRESEEDED_DB

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30}
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
            if os.path.exists(PRESEEDED_DB) and os.path.getsize(PRESEEDED_DB) > 1000 and DB_PATH != PRESEEDED_DB:
                db.close()
                shutil.copyfile(PRESEEDED_DB, DB_PATH)
                print("Restored from pre-seeded database snapshot.")
            else:
                print("Auto-seeding empty database on demand...")
                from seed import seed_database
                seed_database()
        else:
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

