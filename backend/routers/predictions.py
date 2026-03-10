"""Race, Qualifying, and Sprint prediction endpoints using LLM-powered analysis."""
from fastapi import APIRouter
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

try:
    from backend.services.llm_prediction_service import (
        predict_race_llm, predict_qualifying_llm, predict_sprint_llm
    )
    from backend.data.fastf1_loader import get_schedule, get_race_results, get_qualifying_results
except ImportError:
    from services.llm_prediction_service import (
        predict_race_llm, predict_qualifying_llm, predict_sprint_llm
    )
    from data.fastf1_loader import get_schedule, get_race_results, get_qualifying_results

router = APIRouter(prefix="/predictions", tags=["predictions"])


def _get_race_context(year, round_num):
    """Get race name, qualifying data, and recent results for context."""
    race_name = ""
    is_sprint_weekend = False
    try:
        schedule = get_schedule(year)
        for event in schedule:
            if event.get("round") == round_num:
                race_name = event.get("name", "")
                # Check if this is a sprint weekend
                event_format = event.get("format", "")
                if "sprint" in str(event_format).lower():
                    is_sprint_weekend = True
                break
    except Exception:
        pass

    qualifying_data = None
    try:
        quali = get_qualifying_results(year, round_num)
        if quali and len(quali) > 0:
            qualifying_data = quali
    except Exception:
        pass

    recent_results = None
    try:
        if round_num > 1:
            recent_results = get_race_results(year, round_num - 1)
    except Exception:
        pass

    return race_name, qualifying_data, recent_results, is_sprint_weekend


@router.get("/{year}/{round_num}")
async def get_predictions(year: int, round_num: int):
    """Get LLM-powered RACE predictions for a specific round."""
    try:
        race_name, qualifying_data, recent_results, _ = _get_race_context(year, round_num)
        prediction = await predict_race_llm(
            year=year, round_num=round_num, race_name=race_name,
            qualifying_data=qualifying_data, recent_results=recent_results,
        )
        return prediction
    except Exception as e:
        logger.error(f"Race prediction failed for {year} R{round_num}: {e}")
        return JSONResponse(content={"detail": str(e)}, status_code=500)


@router.get("/{year}/{round_num}/qualifying")
async def get_qualifying_predictions(year: int, round_num: int):
    """Get LLM-powered QUALIFYING predictions for a specific round."""
    try:
        race_name, _, recent_results, _ = _get_race_context(year, round_num)
        prediction = await predict_qualifying_llm(
            year=year, round_num=round_num, race_name=race_name,
            recent_results=recent_results,
        )
        return prediction
    except Exception as e:
        logger.error(f"Qualifying prediction failed for {year} R{round_num}: {e}")
        return JSONResponse(content={"detail": str(e)}, status_code=500)


@router.get("/{year}/{round_num}/sprint")
async def get_sprint_predictions(year: int, round_num: int):
    """Get LLM-powered SPRINT predictions for a specific round."""
    try:
        race_name, qualifying_data, recent_results, _ = _get_race_context(year, round_num)
        prediction = await predict_sprint_llm(
            year=year, round_num=round_num, race_name=race_name,
            sprint_quali_data=qualifying_data, recent_results=recent_results,
        )
        return prediction
    except Exception as e:
        logger.error(f"Sprint prediction failed for {year} R{round_num}: {e}")
        return JSONResponse(content={"detail": str(e)}, status_code=500)
