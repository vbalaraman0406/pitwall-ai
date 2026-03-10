"""Race prediction endpoints using LLM-powered analysis."""
from fastapi import APIRouter
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

try:
    from backend.services.llm_prediction_service import predict_race_llm
    from backend.data.fastf1_loader import get_schedule, get_race_results
except ImportError:
    from services.llm_prediction_service import predict_race_llm
    from data.fastf1_loader import get_schedule, get_race_results

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.get("/{year}/{round_num}")
async def get_predictions(year: int, round_num: int):
    """Get LLM-powered race predictions for a specific round."""
    try:
        # Try to get race name from schedule
        race_name = ""
        try:
            schedule = get_schedule(year)
            for event in schedule:
                if event.get("round") == round_num:
                    race_name = event.get("name", "")
                    break
        except Exception:
            pass

        # Try to get qualifying/recent results for context
        qualifying_data = None
        recent_results = None
        try:
            if round_num > 1:
                recent_results = get_race_results(year, round_num - 1)
        except Exception:
            pass

        prediction = await predict_race_llm(
            year=year,
            round_num=round_num,
            race_name=race_name,
            qualifying_data=qualifying_data,
            recent_results=recent_results,
        )
        return prediction
    except Exception as e:
        logger.error(f"Prediction failed for {year} R{round_num}: {e}")
        return JSONResponse(content={"detail": str(e)}, status_code=500)
