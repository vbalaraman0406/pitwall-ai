from fastapi import APIRouter
from fastapi.responses import JSONResponse
import httpx
import logging

try:
    from backend.data.fastf1_loader import list_drivers, get_driver_season_stats
except ImportError:
    from data.fastf1_loader import list_drivers, get_driver_season_stats

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/drivers", tags=["drivers"])

# Cache for OpenF1 driver photo/color data
_driver_photos_cache = {}

@router.get("/{year}")
async def get_drivers(year: int):
    try:
        data = list_drivers(year)
        if not isinstance(data, list):
            data = []
        return data
    except Exception as e:
        return JSONResponse(content={"detail": str(e)}, status_code=500)

@router.get("/{year}/{driver}/stats")
async def get_driver_stats(year: int, driver: str):
    try:
        data = get_driver_season_stats(year, driver)
        return data
    except Exception as e:
        return JSONResponse(content={"detail": str(e)}, status_code=500)

@router.get("/photos/all")
async def get_driver_photos():
    """Fetch driver headshot photos and team colors from OpenF1 API."""
    if _driver_photos_cache:
        return _driver_photos_cache

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get("https://api.openf1.org/v1/drivers?session_key=latest")
            resp.raise_for_status()
            drivers = resp.json()

        result = {}
        for d in drivers:
            abbr = d.get("name_acronym", "")
            result[abbr] = {
                "abbreviation": abbr,
                "driver_number": d.get("driver_number"),
                "full_name": d.get("full_name", ""),
                "first_name": d.get("first_name", ""),
                "last_name": d.get("last_name", ""),
                "team_name": d.get("team_name", ""),
                "team_colour": f"#{d.get('team_colour', '888888')}",
                "headshot_url": d.get("headshot_url", ""),
                "country_code": d.get("country_code"),
            }

        _driver_photos_cache.update(result)
        return result
    except Exception as e:
        logger.error(f"Failed to fetch driver photos from OpenF1: {e}")
        return JSONResponse(content={"detail": str(e)}, status_code=500)


@router.get("/{year}/compare")
async def compare_drivers(year: int, d1: str = "VER", d2: str = "HAM"):
    try:
        return {"driver1": d1, "driver2": d2, "message": "Comparison coming soon"}
    except Exception as e:
        return JSONResponse(content={"detail": str(e)}, status_code=500)
