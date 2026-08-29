import os
import sys

# Add backend directory to sys.path so imports inside backend work seamlessly
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(os.path.dirname(current_dir), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from mangum import Mangum

# Vercel / AWS Lambda ASGI handler
handler = Mangum(app, lifespan="off")
