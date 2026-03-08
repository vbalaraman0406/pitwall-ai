"""Pitwall.ai - F1 Analytics API"""
import os, logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import fastf1
from routers.race import router as race_router
from routers.drivers import router as drivers_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

CACHE_DIR = os.path.join(os.path.dirname(__file__), "cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

app = FastAPI(title="Pitwall.ai", description="F1 Analytics API", version="0.1.0", docs_url="/docs", redoc_url="/redoc")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(race_router)
app.include_router(drivers_router)

@app.get("/")
async def root():
    return {"service": "Pitwall.ai", "version": "0.1.0", "status": "running", "docs": "/docs"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
