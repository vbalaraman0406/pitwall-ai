from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# Ensure backend package is importable
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

app = FastAPI(title="Pitwall.ai", docs_url="/f1/docs", openapi_url="/f1/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# FastF1 cache in /tmp (GCP App Engine read-only filesystem except /tmp)
try:
    import fastf1
    cache_dir = "/tmp/fastf1_cache"
    os.makedirs(cache_dir, exist_ok=True)
    fastf1.Cache.enable_cache(cache_dir)
except Exception:
    pass

# Import routers
from backend.routers import race, drivers

app.include_router(race.router, prefix="/f1/api")
app.include_router(drivers.router, prefix="/f1/api")


@app.get("/f1/api/health")
async def health():
    return {"status": "ok", "service": "pitwall-ai", "version": "f1final"}


@app.get("/health")
async def health_root():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"message": "Pitwall.ai API", "docs": "/f1/docs"}


# Serve frontend static assets
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, "..", "frontend", "dist")
ASSETS_DIR = os.path.join(DIST_DIR, "assets")

if os.path.isdir(ASSETS_DIR):
    app.mount("/f1/assets", StaticFiles(directory=ASSETS_DIR), name="static-assets")

# Serve vite.svg and other root-level static files
if os.path.isdir(DIST_DIR):
    @app.get("/f1/vite.svg")
    async def serve_vite_svg():
        svg_path = os.path.join(DIST_DIR, "vite.svg")
        if os.path.isfile(svg_path):
            return FileResponse(svg_path, media_type="image/svg+xml")
        return JSONResponse({"error": "not found"}, status_code=404)


@app.get("/f1")
async def serve_spa_root_no_slash():
    index = os.path.join(DIST_DIR, "index.html")
    if os.path.isfile(index):
        return FileResponse(index, media_type="text/html")
    return JSONResponse({"error": "index.html not found"}, status_code=404)


@app.get("/f1/{path:path}")
async def serve_spa(path: str):
    # First check if it is a real file in dist
    file_path = os.path.join(DIST_DIR, path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    # Otherwise serve index.html for SPA routing
    index = os.path.join(DIST_DIR, "index.html")
    if os.path.isfile(index):
        return FileResponse(index, media_type="text/html")
    return JSONResponse({"error": "index.html not found"}, status_code=404)


# DEPLOY_TIMESTAMP=1773016290
# FINAL_DEPLOY_TS=1773016792
