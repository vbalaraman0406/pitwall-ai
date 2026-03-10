from fastapi import APIRouter
from fastapi.responses import JSONResponse
try:
    from backend.data.fastf1_loader import get_schedule, get_race_results as load_race_results, get_race_laps as load_race_laps, get_tire_strategy
except ImportError:
    from data.fastf1_loader import get_schedule, get_race_results as load_race_results, get_race_laps as load_race_laps, get_tire_strategy

router = APIRouter(prefix="/race", tags=["race"])


@router.get("/schedule/{year}")
async def race_schedule(year: int):
    try:
        data = get_schedule(year)
        if not isinstance(data, list):
            data = []
        return data
    except Exception as e:
        return JSONResponse(content={"detail": str(e)}, status_code=500)

@router.get("/{year}/{round_num}/results")
async def race_results(year: int, round_num: int):
    try:
        data = load_race_results(year, round_num)
        if not isinstance(data, list):
            data = []
        return {"results": data}
    except Exception as e:
        return JSONResponse(content={"detail": str(e)}, status_code=500)

@router.get("/{year}/{round_num}/laps")
async def race_laps(year: int, round_num: int):
    try:
        data = load_race_laps(year, round_num)
        if not isinstance(data, list):
            data = []
        return {"laps": data}
    except Exception as e:
        return JSONResponse(content={"detail": str(e)}, status_code=500)

@router.get("/{year}/{round_num}/strategy")
async def race_strategy(year: int, round_num: int):
    try:
        data = get_tire_strategy(year, round_num)
        if not isinstance(data, list):
            data = []
        return {"strategies": data}
    except Exception as e:
        return JSONResponse(content={"detail": str(e)}, status_code=500)

