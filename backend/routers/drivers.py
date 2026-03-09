from fastapi import APIRouter
from fastapi.responses import JSONResponse
try:
    from backend.data.fastf1_loader import get_drivers_list, get_driver_season_stats, get_driver_comparison
except ImportError:
    from data.fastf1_loader import get_drivers_list, get_driver_season_stats, get_driver_comparison

router = APIRouter(prefix="/drivers", tags=["drivers"])


@router.get("/{year}")
async def get_drivers(year: int):
    try:
        data = get_drivers_list(year)
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
        data = get_driver_comparison(year, d1, d2)
        return data
    except Exception as e:
        return JSONResponse(content={"detail": str(e)}, status_code=500)

# DEPLOY_TIMESTAMP=1773016290
