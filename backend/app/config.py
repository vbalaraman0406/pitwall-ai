"""Application configuration for Pitwall.ai backend."""
import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# FastF1 cache directory
CACHE_DIR = os.getenv("FASTF1_CACHE_DIR", str(BASE_DIR / "cache"))

# API configuration
API_PREFIX = "/api"
API_TITLE = "Pitwall.ai API"
API_VERSION = "1.0.0"
API_DESCRIPTION = "Formula 1 Analytics API powered by FastF1"

# CORS origins
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://pitwall.app",
]

# Current season
CURRENT_SEASON = int(os.getenv("CURRENT_SEASON", "2025"))
