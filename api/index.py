import os
import sys
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    from main import app as backend_app
    app = backend_app
except Exception as e:
    tb = traceback.format_exc()
    app = FastAPI(title="Diagnostics App")
    
    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE"])
    async def catch_all(request: Request, path_name: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Backend Import Error on Vercel",
                "exception": str(e),
                "traceback": tb,
                "sys_path": sys.path,
                "dir_contents": os.listdir(current_dir) if os.path.exists(current_dir) else []
            }
        )
