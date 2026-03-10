"""
OpenF1 Live Data Proxy
Proxies requests to the free OpenF1 API (api.openf1.org) to avoid CORS issues
and provide server-side caching for live session data.
"""
import time
import logging
import httpx
from fastapi import APIRouter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/openf1", tags=["openf1"])

OPENF1_BASE = "https://api.openf1.org/v1"

# Simple in-memory cache with TTL
_cache: dict[str, dict] = {}


def _cached_fetch(key: str, url: str, ttl: float = 4.0) -> dict | list | None:
    """Fetch from OpenF1 with a short TTL cache."""
    now = time.time()
    cached = _cache.get(key)
    if cached and now - cached["ts"] < ttl:
        return cached["data"]

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url)
            resp.raise_for_status()
            data = resp.json()
            _cache[key] = {"data": data, "ts": now}
            return data
    except Exception as e:
        logger.warning(f"OpenF1 fetch failed for {url}: {e}")
        # Return stale cache if available
        if cached:
            return cached["data"]
        return None


@router.get("/session/latest")
async def get_latest_session():
    """Get the latest F1 session info from OpenF1."""
    data = _cached_fetch(
        "session_latest",
        f"{OPENF1_BASE}/sessions?session_key=latest",
        ttl=30.0  # Session info doesn't change often
    )
    if not data or not isinstance(data, list) or len(data) == 0:
        return {"session": None, "is_live": False}

    session = data[0]

    # Determine if session is currently live
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    is_live = False
    try:
        start = datetime.fromisoformat(session.get("date_start", ""))
        end = datetime.fromisoformat(session.get("date_end", ""))
        is_live = start <= now <= end
    except (ValueError, TypeError):
        pass

    return {
        "session": session,
        "is_live": is_live,
    }


@router.get("/location/latest")
async def get_latest_locations():
    """Get latest car locations for all drivers (last 5 seconds)."""
    # Fetch location data — use date filter to only get recent data
    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc)
    since = (now - timedelta(seconds=10)).strftime("%Y-%m-%dT%H:%M:%S")

    data = _cached_fetch(
        "location_latest",
        f"{OPENF1_BASE}/location?session_key=latest&date>={since}",
        ttl=3.0
    )

    if not data or not isinstance(data, list):
        return {"locations": []}

    # Group by driver and take the latest location for each
    latest: dict[int, dict] = {}
    for point in data:
        dn = point.get("driver_number")
        if dn is not None:
            # Keep only the most recent entry per driver
            existing = latest.get(dn)
            if existing is None or point.get("date", "") > existing.get("date", ""):
                latest[dn] = point

    return {"locations": list(latest.values())}


@router.get("/position/latest")
async def get_latest_positions():
    """Get latest race positions for all drivers."""
    data = _cached_fetch(
        "position_latest",
        f"{OPENF1_BASE}/position?session_key=latest",
        ttl=4.0
    )

    if not data or not isinstance(data, list):
        return {"positions": []}

    # Group by driver and take the latest position for each
    latest: dict[int, dict] = {}
    for entry in data:
        dn = entry.get("driver_number")
        if dn is not None:
            existing = latest.get(dn)
            if existing is None or entry.get("date", "") > existing.get("date", ""):
                latest[dn] = entry

    return {"positions": list(latest.values())}


@router.get("/drivers")
async def get_drivers(session_key: str = "latest"):
    """Get driver info for a session."""
    data = _cached_fetch(
        f"drivers_{session_key}",
        f"{OPENF1_BASE}/drivers?session_key={session_key}",
        ttl=300.0  # Driver info rarely changes
    )

    if not data or not isinstance(data, list):
        return {"drivers": []}

    return {"drivers": data}
