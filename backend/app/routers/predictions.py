"""Race prediction endpoints."""
from fastapi import APIRouter, HTTPException
from app.services.prediction_service import PredictionService

router = APIRouter(tags=["predictions"])
predictor = PredictionService()


@router.get("/predictions/{year}/{round_num}")
async def get_predictions(year: int, round_num: int):
    """Get predicted finishing order for a specific race."""
    try:
        predictions = predictor.predict_race(year, round_num)
        return {"season": year, "round": round_num, "predictions": predictions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
