import os
import sys

# Add current directory (api/) and backend/ to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

backend_dir = os.path.join(os.path.dirname(current_dir), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from mangum import Mangum

# Vercel / AWS Lambda ASGI handler
handler = Mangum(app, lifespan="off")
