"""Race data API routes with comprehensive error handling"""
from fastapi import APIRouter, HTTPException
from data.fastf1_loader import get_race_results, get_race_laps, get_schedule
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/race", tags=["race"])


@router.get("/schedule/{year}")
async def race_schedule(year: int):
    """Get the race schedule for a given year."""
    try:
        schedule = get_schedule(year)
        return {"year": year, "schedule": schedule}
    except Exception as e:
        logger.error(f"Error fetching schedule for {year}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load schedule: {str(e)}")


@router.get("/{year}/{round_num}/results")
async def race_results(year: int, round_num: int):
    """Get results for a specific race."""
    try:
        results = get_race_results(year, round_num)
        return {"year": year, "round": round_num, "results": results}
    except Exception as e:
        logger.error(f"Error fetching results for {year} R{round_num}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load race results: {str(e)}")


@router.get("/{year}/{round_num}/laps")
async def race_laps(year: int, round_num: int):
    """Get lap data for a specific race with ValueError protection."""
    try:
        laps = get_race_laps(year, round_num)
        return {"year": year, "round": round_num, "laps": laps}
    except ValueError as e:
        logger.error(f"ValueError loading laps for {year} R{round_num}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load lap data: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error fetching laps for {year} R{round_num}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load lap data: {str(e)}"
        )
