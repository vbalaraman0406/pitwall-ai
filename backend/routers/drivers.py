# FORCE_DEPLOY_1773001630.888818
"""Driver data API routes with comprehensive error handling"""
from fastapi import APIRouter, HTTPException
from backend.data.fastf1_loader import list_drivers, get_driver_season_stats
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/drivers", tags=["drivers"])


@router.get("/{year}")
async def get_drivers(year: int):
    """List all drivers for a given year."""
    try:
        drivers = list_drivers(year)
        return {"year": year, "drivers": drivers}
    except Exception as e:
        logger.error(f"Error fetching drivers for {year}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load drivers: {str(e)}")


@router.get("/{year}/{driver}/stats")
async def get_driver_stats(year: int, driver: str):
    """Get driver season statistics with timeout protection."""
    try:
        stats = get_driver_season_stats(year, driver)
        return {"year": year, "driver": driver, "stats": stats}
    except Exception as e:
        logger.error(f"Error fetching stats for {driver} in {year}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load driver stats: {str(e)}"
        )


@router.get("/{year}/compare")
async def compare_drivers(year: int, d1: str = "VER", d2: str = "HAM"):
    """Compare two drivers' season stats."""
    try:
        stats1 = get_driver_season_stats(year, d1)
        stats2 = get_driver_season_stats(year, d2)
        return {
            "year": year,
            "comparison": {
                d1: stats1,
                d2: stats2,
            }
        }
    except Exception as e:
        logger.error(f"Error comparing {d1} vs {d2} in {year}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compare drivers: {str(e)}"
        )
