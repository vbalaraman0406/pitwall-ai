"""Telemetry data endpoints."""
from fastapi import APIRouter, HTTPException
from app.services.fastf1_service import FastF1Service

router = APIRouter(tags=["telemetry"])
f1 = FastF1Service()


@router.get("/telemetry/{year}/{round_num}/{session_type}/{driver}")
async def get_telemetry(year: int, round_num: int, session_type: str, driver: str):
    """
    Get telemetry data for a specific driver in a session.

    Args:
        year: Season year
        round_num: Race round number
        session_type: Session identifier (FP1, FP2, FP3, Q, SQ, S, R)
        driver: 3-letter driver abbreviation (e.g., VER, HAM, LEC)
    """
    valid_sessions = ["FP1", "FP2", "FP3", "Q", "SQ", "S", "R"]
    session_upper = session_type.upper()
    if session_upper not in valid_sessions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid session type. Must be one of: {valid_sessions}"
        )
    try:
        data = f1.get_telemetry(year, round_num, session_upper, driver.upper())
        return {
            "season": year,
            "round": round_num,
            "session": session_upper,
            "driver": driver.upper(),
            "telemetry": data,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
