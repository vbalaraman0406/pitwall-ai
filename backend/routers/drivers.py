"""Driver data API routes for Pitwall.ai."""
from fastapi import APIRouter, HTTPException, Query
from data.fastf1_loader import get_event_schedule, get_session_results, get_driver_season_stats, get_drivers_comparison

router = APIRouter(prefix="/api/drivers", tags=["drivers"])

@router.get("/{year}")
async def list_drivers(year: int):
    try:
        schedule = get_event_schedule(year)
        for _, event in schedule.iterrows():
            rnd = int(event["RoundNumber"])
            try:
                results = get_session_results(year, rnd, "R")
                if not results.empty:
                    drivers = []
                    for _, row in results.iterrows():
                        drivers.append({"driver_number": str(row.get("DriverNumber","")), "broadcast_name": str(row.get("BroadcastName","")), "abbreviation": str(row.get("Abbreviation","")), "team_name": str(row.get("TeamName",""))})
                    return {"year": year, "total_drivers": len(drivers), "drivers": drivers}
            except Exception:
                continue
        return {"year": year, "total_drivers": 0, "drivers": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{year}/{driver_code}/stats")
async def driver_stats(year: int, driver_code: str):
    try:
        return get_driver_season_stats(year, driver_code.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{year}/compare")
async def compare_drivers(year: int, drivers: str = Query(..., description="Comma-separated driver codes")):
    try:
        driver_list = [d.strip().upper() for d in drivers.split(",") if d.strip()]
        if len(driver_list) < 2:
            raise HTTPException(status_code=400, detail="Provide at least 2 driver codes")
        return {"year": year, "drivers": get_drivers_comparison(year, driver_list)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
