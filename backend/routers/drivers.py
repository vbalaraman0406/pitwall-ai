from fastapi import APIRouter
from fastapi.responses import JSONResponse
try:
    from backend.data.fastf1_loader import list_drivers, get_driver_season_stats
except ImportError:
    from data.fastf1_loader import list_drivers, get_driver_season_stats

router = APIRouter(prefix="/drivers", tags=["drivers"])

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

@router.get("/{year}/compare")
async def compare_drivers(year: int, d1: str = "VER", d2: str = "HAM"):
    try:
        return {"driver1": d1, "driver2": d2, "message": "Comparison coming soon"}
    except Exception as e:
        return JSONResponse(content={"detail": str(e)}, status_code=500)
