# DEPLOY_MARKER: 1773014667
import os
import sys

# Ensure project root is on sys.path for GCP App Engine
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from backend.routers import race, drivers

app = FastAPI(
    title="Pitwall.ai - F1 Analytics",
    description="F1 race analytics powered by FastF1",
    version="1.0.0",
    root_path="/f1"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enable fastf1 cache in writable /tmp directory
try:
    import fastf1
    cache_dir = "/tmp/fastf1_cache"
    os.makedirs(cache_dir, exist_ok=True)
    fastf1.Cache.enable_cache(cache_dir)
except Exception:
    pass

# --- API ROUTES (BEFORE static files) ---

@app.get("/health")
@app.get("/api/health")
async def health_check():
    return JSONResponse(content={"status": "ok", "service": "pitwall-ai-f1"})

# Mount routers at /api prefix. Routers have /race and /drivers prefixes.
# So final paths: /api/race/..., /api/drivers/...
app.include_router(race.router, prefix="/api", tags=["races"])
app.include_router(drivers.router, prefix="/api", tags=["drivers"])

# Frontend calls /api/races/{year} but router defines /api/race/schedule/{year}
# Add alias route
@app.get("/api/races/{year}")
async def races_alias(year: int):
    try:
        from backend.data.fastf1_loader import get_race_schedule
        data = get_race_schedule(year)
        if not isinstance(data, list):
            data = []
        return data
    except Exception as e:
        return JSONResponse(content={"detail": str(e)}, status_code=500)

# --- STATIC FILES (SPA catch-all, LAST) ---

frontend_dist = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist")
frontend_dist = os.path.abspath(frontend_dist)

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/vite.svg")
    async def vite_svg():
        svg_path = os.path.join(frontend_dist, "vite.svg")
        if os.path.exists(svg_path):
            return FileResponse(svg_path, media_type="image/svg+xml")
        return JSONResponse(content={"error": "not found"}, status_code=404)

    @app.get("/{path:path}")
    async def serve_spa(path: str):
        file_path = os.path.join(frontend_dist, path)
        if path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path, media_type="text/html")
        return JSONResponse(content={"error": "Frontend not built"}, status_code=500)
else:
    @app.get("/")
    async def no_frontend():
        return JSONResponse(content={"message": "Pitwall.ai API running. Frontend not found.", "docs": "/f1/docs"})
