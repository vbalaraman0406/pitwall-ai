import os
import sys
import time
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, HTMLResponse

# DEPLOY_TIMESTAMP_1773019741

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from backend.routers import race, drivers
except ImportError:
    from routers import race, drivers

app = FastAPI(title="Pitwall.ai", docs_url="/f1/docs", openapi_url="/f1/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(race.router, prefix="/f1/api")
app.include_router(drivers.router, prefix="/f1/api")

@app.get("/f1/api/health")
@app.get("/api/health")
@app.get("/health")
async def health():
    return {"status": "ok", "service": "pitwall-ai", "timestamp": time.time()}

DIST_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"
ASSETS_DIR = DIST_DIR / "assets"
if ASSETS_DIR.exists():
    app.mount("/f1/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")

@app.get("/f1")
async def serve_spa_root(request: Request):
    index_file = DIST_DIR / "index.html"
    if index_file.exists():
        return HTMLResponse(index_file.read_text())
    return JSONResponse({"error": "Frontend not built"}, status_code=500)

@app.get("/f1/{path:path}")
async def serve_spa(request: Request, path: str = ""):
    index_file = DIST_DIR / "index.html"
    if index_file.exists():
        return HTMLResponse(index_file.read_text())
    return JSONResponse({"error": "Frontend not built"}, status_code=500)
