import os
import sys

# Ensure local api folder is in Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from main import app as backend_app

# Top-level ASGI app and serverless handler for Vercel Python runtime
app = backend_app
handler = backend_app

