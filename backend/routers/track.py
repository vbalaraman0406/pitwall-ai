"""Track map and driver position endpoints for live visualization."""
from fastapi import APIRouter
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

try:
    from backend.data.fastf1_loader import get_track_coordinates, get_driver_positions
except ImportError:
    from data.fastf1_loader import get_track_coordinates, get_driver_positions

router = APIRouter(prefix="/race", tags=["track"])


@router.get("/{year}/{round_num}/track")
async def race_track(year: int, round_num: int):
    """Get circuit coordinates (X/Y points) for track visualization."""
    try:
        data = get_track_coordinates(year, round_num)
        return data
    except Exception as e:
        logger.error(f"Failed to get track data for {year} R{round_num}: {e}")
        return JSONResponse(content={"detail": str(e)}, status_code=500)


@router.get("/{year}/{round_num}/positions")
async def driver_positions(year: int, round_num: int):
    """Get per-lap driver positions on track for animation replay."""
    try:
        data = get_driver_positions(year, round_num)
        return data
    except Exception as e:
        logger.error(f"Failed to get positions for {year} R{round_num}: {e}")
        return JSONResponse(content={"detail": str(e)}, status_code=500)
