import os
import sys
import time
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, HTMLResponse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from backend.routers import race, drivers, predictions, track
except ImportError:
    from routers import race, drivers, predictions, track

app = FastAPI(
    title="Pitwall.ai",
    description="Formula 1 Analytics Platform powered by FastF1 and AI",
    version="2.0.0",
    docs_url="/f1/docs",
    openapi_url="/f1/openapi.json",
)

# CORS — restrict to known origins
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
    os.environ.get("FRONTEND_URL", "https://pitwall.app"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers under /f1/api
app.include_router(race.router, prefix="/f1/api")
app.include_router(drivers.router, prefix="/f1/api")
app.include_router(predictions.router, prefix="/f1/api")
app.include_router(track.router, prefix="/f1/api")


@app.get("/f1/api/health")
@app.get("/api/health")
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "pitwall-ai",
        "version": "2.0.0",
        "timestamp": time.time(),
    }


# --- Static SPA serving ---
DIST_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"
ASSETS_DIR = DIST_DIR / "assets"
if ASSETS_DIR.exists():
    app.mount("/f1/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")


@app.get("/f1")
async def serve_spa_root(request: Request):
    index_file = DIST_DIR / "index.html"
    if index_file.exists():
        return HTMLResponse(index_file.read_text())
    return JSONResponse({"error": "Frontend not built. Run: cd frontend && npm run build"}, status_code=500)


@app.get("/f1/{path:path}")
async def serve_spa(request: Request, path: str = ""):
    # Don't catch API or docs routes
    if path.startswith("api/") or path.startswith("docs") or path.startswith("openapi"):
        return JSONResponse({"error": "Not found"}, status_code=404)
    index_file = DIST_DIR / "index.html"
    if index_file.exists():
        return HTMLResponse(index_file.read_text())
    return JSONResponse({"error": "Frontend not built. Run: cd frontend && npm run build"}, status_code=500)
