from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/race", tags=["race"])

try:
    from backend.data.fastf1_loader import get_race_schedule, get_race_results as load_race_results, get_race_laps as load_race_laps
except Exception as e:
    print(f"Warning: Could not import fastf1_loader: {e}")
    def get_race_schedule(year): return []
    def load_race_results(year, rnd): return []
    def load_race_laps(year, rnd): return []

@router.get("/schedule/{year}")
async def race_schedule(year: int):
    try:
        data = get_race_schedule(year)
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
        return data
    except Exception as e:
        return JSONResponse(content={"detail": str(e)}, status_code=500)

@router.get("/{year}/{round_num}/laps")
async def race_laps(year: int, round_num: int):
    try:
        data = load_race_laps(year, round_num)
        if not isinstance(data, list):
            data = []
        return data
    except Exception as e:
        return JSONResponse(content={"detail": str(e)}, status_code=500)

# DEPLOY_TIMESTAMP=1773016290
