import os
import sys
import time
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, HTMLResponse

# Load .env file if present (local dev fallback)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from backend.routers import race, drivers, predictions, track, openf1
except ImportError:
    from routers import race, drivers, predictions, track, openf1

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

# GZip compression for all responses > 500 bytes
app.add_middleware(GZipMiddleware, minimum_size=500)

# Mount all routers under /f1/api
app.include_router(race.router, prefix="/f1/api")
app.include_router(drivers.router, prefix="/f1/api")
app.include_router(predictions.router, prefix="/f1/api")
app.include_router(track.router, prefix="/f1/api")
app.include_router(openf1.router, prefix="/f1/api")


# Cache-Control middleware: cache race data responses
@app.middleware("http")
async def add_cache_headers(request: Request, call_next):
    response = await call_next(request)
    path = request.url.path
    # Cache schedule for 1 hour, track data for 24h, results for 1h
    if "/api/openf1/" in path:
        response.headers["Cache-Control"] = "no-cache"  # Live data — no HTTP cache
    elif "/api/race/schedule/" in path:
        response.headers["Cache-Control"] = "public, max-age=14400"  # 4 hours
    elif "/api/race/" in path and "/track" in path:
        response.headers["Cache-Control"] = "public, max-age=604800"  # 1 week - circuit shape never changes
    elif "/api/race/" in path and ("/results" in path or "/qualifying" in path or "/laps" in path or "/strategy" in path or "/positions" in path):
        response.headers["Cache-Control"] = "public, max-age=14400"  # 4 hours - past results don't change
    elif "/api/drivers/photos" in path:
        response.headers["Cache-Control"] = "public, max-age=86400"
    elif "/api/drivers/" in path:
        response.headers["Cache-Control"] = "public, max-age=3600"
    # Predictions: short cache (5 min) since they can change
    elif "/api/predictions/" in path:
        response.headers["Cache-Control"] = "public, max-age=3600"  # 1 hour
    return response


@app.get("/f1/api/health")
@app.get("/api/health")
@app.get("/health")
async def health():
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    return {
        "status": "ok",
        "service": "pitwall-ai",
        "version": "2.1.0",
        "timestamp": time.time(),
        "gemini_configured": bool(gemini_key),
        "gemini_key_prefix": gemini_key[:8] + "..." if len(gemini_key) > 8 else "NOT_SET",
    }


@app.get("/f1/api/cache/clear")
async def clear_cache():
    """Clear all in-memory caches (predictions + FastF1 session data)."""
    try:
        from services.llm_prediction_service import _prediction_cache
    except ImportError:
        from backend.services.llm_prediction_service import _prediction_cache
    count = len(_prediction_cache)
    _prediction_cache.clear()
    return {"status": "ok", "cleared_predictions": count}


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
