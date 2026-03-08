"""Pitwall.ai Backend - FastAPI Application"""
import os
import logging
import fastf1
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import race, drivers

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Enable fastf1 cache at startup
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)
logger.info(f"FastF1 cache enabled at: {CACHE_DIR}")

# Create FastAPI app
app = FastAPI(
    title="Pitwall.ai",
    description="F1 Analytics API powered by FastF1",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(race.router)
app.include_router(drivers.router)


@app.get("/")
async def root():
    return {
        "service": "Pitwall.ai",
        "version": "1.0.0",
        "status": "running",
        "description": "F1 Analytics API",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "cache_dir": CACHE_DIR,
        "cache_exists": os.path.isdir(CACHE_DIR),
    }
