"""Race calendar and results endpoints."""
from fastapi import APIRouter, HTTPException, Query
from app.services.fastf1_service import FastF1Service

router = APIRouter(tags=["races"])
f1 = FastF1Service()


@router.get("/races")
async def list_races(year: int = Query(default=2025, ge=1950, le=2030)):
    """Get the full race calendar for a given season."""
    try:
        schedule = f1.get_schedule(year)
        return {"season": year, "races": schedule}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/races/{year}/{round_num}")
async def get_race_detail(year: int, round_num: int):
    """Get detailed race results for a specific round."""
    try:
        results = f1.get_race_results(year, round_num)
        return {"season": year, "round": round_num, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
