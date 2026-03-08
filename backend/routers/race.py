"""Race data API routes for Pitwall.ai."""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from data.fastf1_loader import get_event_schedule, get_session_results, get_lap_data, get_telemetry, get_tire_strategy

router = APIRouter(prefix="/api/races", tags=["races"])

@router.get("/{year}")
async def list_races(year: int):
    try:
        schedule = get_event_schedule(year)
        events = []
        for _, row in schedule.iterrows():
            events.append({"round_number": int(row["RoundNumber"]), "country": str(row.get("Country","")), "location": str(row.get("Location","")), "event_name": str(row.get("OfficialEventName", row.get("EventName",""))), "event_date": str(row.get("EventDate","")) if row.get("EventDate") is not None else None, "event_format": str(row.get("EventFormat",""))})
        return {"year": year, "total_races": len(events), "events": events}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{year}/{round_number}/results")
async def race_results(year: int, round_number: int, session: str = Query(default="R")):
    try:
        results = get_session_results(year, round_number, session)
        if results.empty:
            return {"year": year, "round": round_number, "session": session, "results": []}
        records = results.to_dict(orient="records")
        for r in records:
            for k, v in r.items():
                if hasattr(v, "total_seconds"): r[k] = v.total_seconds()
        return {"year": year, "round": round_number, "session": session, "results": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{year}/{round_number}/laps")
async def lap_data(year: int, round_number: int, driver: Optional[str] = Query(default=None), session: str = Query(default="R")):
    try:
        laps = get_lap_data(year, round_number, session, driver)
        if laps.empty:
            return {"year": year, "round": round_number, "laps": []}
        return {"year": year, "round": round_number, "driver": driver, "total_laps": len(laps), "laps": laps.to_dict(orient="records")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{year}/{round_number}/telemetry/{driver}")
async def driver_telemetry(year: int, round_number: int, driver: str, lap: Optional[int] = Query(default=None), session: str = Query(default="R")):
    try:
        tel = get_telemetry(year, round_number, driver, session, lap)
        if tel.empty:
            return {"year": year, "round": round_number, "driver": driver, "telemetry": []}
        return {"year": year, "round": round_number, "driver": driver, "lap": lap or "fastest", "data_points": len(tel), "telemetry": tel.to_dict(orient="records")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{year}/{round_number}/strategy")
async def tire_strategy(year: int, round_number: int, session: str = Query(default="R")):
    try:
        strategy = get_tire_strategy(year, round_number, session)
        if strategy.empty:
            return {"year": year, "round": round_number, "strategy": []}
        return {"year": year, "round": round_number, "total_stints": len(strategy), "strategy": strategy.to_dict(orient="records")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
