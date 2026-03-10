"""LLM-powered race prediction service using Google Gemini API."""
import os
import json
import logging
import hashlib
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# In-memory cache for LLM predictions
_prediction_cache: Dict[str, Any] = {}

# 2025 F1 Grid — accurate driver ratings and team assignments
DEFAULT_DRIVER_RATINGS = {
    "NOR": {"name": "Lando Norris", "team": "McLaren", "rating": 0.95},
    "VER": {"name": "Max Verstappen", "team": "Red Bull Racing", "rating": 0.94},
    "LEC": {"name": "Charles Leclerc", "team": "Ferrari", "rating": 0.91},
    "HAM": {"name": "Lewis Hamilton", "team": "Ferrari", "rating": 0.90},
    "PIA": {"name": "Oscar Piastri", "team": "McLaren", "rating": 0.89},
    "RUS": {"name": "George Russell", "team": "Mercedes", "rating": 0.88},
    "ALO": {"name": "Fernando Alonso", "team": "Aston Martin", "rating": 0.85},
    "ANT": {"name": "Kimi Antonelli", "team": "Mercedes", "rating": 0.83},
    "SAI": {"name": "Carlos Sainz", "team": "Williams", "rating": 0.84},
    "ALB": {"name": "Alexander Albon", "team": "Williams", "rating": 0.82},
    "GAS": {"name": "Pierre Gasly", "team": "Alpine", "rating": 0.80},
    "HUL": {"name": "Nico Hulkenberg", "team": "Audi", "rating": 0.79},
    "LAW": {"name": "Liam Lawson", "team": "Racing Bulls", "rating": 0.78},
    "HAD": {"name": "Isack Hadjar", "team": "Red Bull Racing", "rating": 0.76},
    "STR": {"name": "Lance Stroll", "team": "Aston Martin", "rating": 0.75},
    "OCO": {"name": "Esteban Ocon", "team": "Haas F1 Team", "rating": 0.77},
    "BEA": {"name": "Oliver Bearman", "team": "Haas F1 Team", "rating": 0.74},
    "COL": {"name": "Franco Colapinto", "team": "Alpine", "rating": 0.73},
    "BOR": {"name": "Gabriel Bortoleto", "team": "Audi", "rating": 0.72},
    "LIN": {"name": "Arvid Lindblad", "team": "Racing Bulls", "rating": 0.71},
    "PER": {"name": "Sergio Perez", "team": "Cadillac", "rating": 0.76},
    "BOT": {"name": "Valtteri Bottas", "team": "Cadillac", "rating": 0.74},
}


def _get_cache_key(year: int, round_num: int, context_hash: str = "") -> str:
    """Generate a unique cache key for predictions."""
    raw = f"pred_{year}_{round_num}_{context_hash}"
    return hashlib.md5(raw.encode()).hexdigest()


def _build_prediction_prompt(
    year: int,
    round_num: int,
    race_name: str = "",
    qualifying_data: Optional[List[dict]] = None,
    recent_results: Optional[List[dict]] = None,
) -> str:
    """Build a detailed prompt for the LLM to predict a race."""
    prompt = f"""You are an expert Formula 1 analyst and data scientist. Predict the finishing order for the {year} Formula 1 Season, Round {round_num}{f' ({race_name})' if race_name else ''}.

TASK: Predict the top 20 finishing positions for this race. For each driver, provide:
1. Predicted finishing position
2. Confidence percentage (0-100%)
3. Brief reasoning (1 sentence)

CONTEXT:
- Current 2025 F1 Grid: {json.dumps([{"driver": k, "name": v["name"], "team": v["team"]} for k, v in DEFAULT_DRIVER_RATINGS.items()], indent=2)}
"""

    if qualifying_data:
        prompt += f"\n- Qualifying Results: {json.dumps(qualifying_data[:10], indent=2)}"

    if recent_results:
        prompt += f"\n- Recent Race Results: {json.dumps(recent_results[:10], indent=2)}"

    prompt += """

Consider these factors:
- Car performance and recent upgrades
- Circuit characteristics (high/low downforce, street circuit, etc.)
- Driver skill and track record at this circuit
- Team strategy tendencies
- Historical reliability data
- Weather conditions (assume dry unless noted)
- Lando Norris is the reigning 2024 World Champion driving for McLaren
- Lewis Hamilton moved to Ferrari for 2025
- Red Bull Racing has Max Verstappen and Isack Hadjar
- Cadillac is a new team for 2025 with Perez and Bottas

RESPOND IN EXACTLY THIS JSON FORMAT (no markdown, no code blocks, just raw JSON):
{
  "predictions": [
    {
      "position": 1,
      "driver": "NOR",
      "name": "Lando Norris",
      "team": "McLaren",
      "confidence": 85.0,
      "reasoning": "Dominant qualifying pace and strong race craft at this circuit"
    }
  ],
  "analysis": "A 2-3 paragraph narrative analysis of the predicted race, discussing key battles, strategy considerations, and potential surprises.",
  "key_factors": ["Factor 1", "Factor 2", "Factor 3"],
  "upset_risk": "Brief description of the most likely upset scenario"
}
"""
    return prompt


async def predict_race_llm(
    year: int,
    round_num: int,
    race_name: str = "",
    qualifying_data: Optional[List[dict]] = None,
    recent_results: Optional[List[dict]] = None,
) -> dict:
    """
    Generate race predictions using Google Gemini LLM.
    Falls back to heuristic model if Gemini API is unavailable.
    """
    # Check cache first
    context_str = json.dumps(qualifying_data or []) + json.dumps(recent_results or [])
    cache_key = _get_cache_key(year, round_num, hashlib.md5(context_str.encode()).hexdigest())

    if cache_key in _prediction_cache:
        logger.info(f"Returning cached prediction for {year} R{round_num}")
        return _prediction_cache[cache_key]

    gemini_api_key = os.environ.get("GEMINI_API_KEY", "")

    if gemini_api_key:
        try:
            result = await _predict_with_gemini(
                year, round_num, race_name, qualifying_data, recent_results, gemini_api_key
            )
            result["model"] = "gemini"
            _prediction_cache[cache_key] = result
            return result
        except Exception as e:
            logger.error(f"Gemini prediction failed, falling back to heuristic: {e}")

    # Fallback to heuristic model
    result = _predict_heuristic(year, round_num)
    result["model"] = "heuristic"
    _prediction_cache[cache_key] = result
    return result


async def _predict_with_gemini(
    year: int,
    round_num: int,
    race_name: str,
    qualifying_data: Optional[List[dict]],
    recent_results: Optional[List[dict]],
    api_key: str,
) -> dict:
    """Call Google Gemini API for race predictions."""
    from google import genai

    client = genai.Client(api_key=api_key)

    prompt = _build_prediction_prompt(year, round_num, race_name, qualifying_data, recent_results)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config={
            "temperature": 0.7,
            "max_output_tokens": 8192,
        },
    )

    # Parse the JSON response
    text = response.text.strip()
    # Remove markdown code blocks if present
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first and last lines if they are code fences
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        logger.error(f"Failed to parse Gemini response as JSON: {text[:500]}")
        raise ValueError("LLM returned invalid JSON")

    return {
        "season": year,
        "round": round_num,
        "race_name": race_name,
        "predictions": parsed.get("predictions", []),
        "analysis": parsed.get("analysis", ""),
        "key_factors": parsed.get("key_factors", []),
        "upset_risk": parsed.get("upset_risk", ""),
    }


def _predict_heuristic(year: int, round_num: int) -> dict:
    """Fallback heuristic prediction when LLM is unavailable."""
    import random

    random.seed(year * 100 + round_num)

    predictions = []
    for code, info in DEFAULT_DRIVER_RATINGS.items():
        noise = random.gauss(0, 0.05)
        score = info["rating"] + noise
        predictions.append({
            "driver": code,
            "name": info["name"],
            "team": info["team"],
            "score": round(score, 4),
        })

    predictions.sort(key=lambda x: x["score"], reverse=True)

    result_predictions = []
    for i, pred in enumerate(predictions, 1):
        confidence = max(40, min(99, pred["score"] * 100))
        result_predictions.append({
            "position": i,
            "driver": pred["driver"],
            "name": pred["name"],
            "team": pred["team"],
            "confidence": round(confidence, 1),
            "reasoning": f"Based on historical performance rating ({pred['score']:.2f})",
        })

    return {
        "season": year,
        "round": round_num,
        "race_name": "",
        "predictions": result_predictions,
        "analysis": "This prediction is generated using a heuristic model based on 2025 driver performance ratings. "
                     "For AI-powered predictions with detailed analysis, the GEMINI_API_KEY is being used via Google Gemini.",
        "key_factors": [
            "2025 driver performance ratings",
            "Team competitiveness analysis",
            "Statistical modeling with variance",
        ],
        "upset_risk": "Heuristic model cannot assess real-time upset risks. Gemini AI mode provides detailed upset analysis.",
    }
