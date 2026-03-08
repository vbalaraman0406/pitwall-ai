"""Driver information and statistics endpoints."""
from fastapi import APIRouter, HTTPException, Query
from app.services.fastf1_service import FastF1Service

router = APIRouter(tags=["drivers"])
f1 = FastF1Service()


@router.get("/drivers")
async def list_drivers(year: int = Query(default=2025, ge=1950, le=2030)):
    """Get all drivers for a given season."""
    try:
        drivers = f1.get_drivers(year)
        return {"season": year, "drivers": drivers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/drivers/{driver_id}/stats")
async def get_driver_stats(driver_id: str, year: int = Query(default=2025)):
    """Get season statistics for a specific driver."""
    try:
        stats = f1.get_driver_stats(driver_id, year)
        return {"driver": driver_id, "season": year, "stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
