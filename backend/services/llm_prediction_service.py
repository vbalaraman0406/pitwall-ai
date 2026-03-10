"""LLM-powered prediction service for Race, Qualifying, and Sprint sessions."""
import os
import json
import logging
import hashlib
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# In-memory cache for LLM predictions
_prediction_cache: Dict[str, Any] = {}

# 2026 F1 Grid — driver ratings and team assignments
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
    "TSU": {"name": "Yuki Tsunoda", "team": "Red Bull Racing", "rating": 0.80},
    "DOO": {"name": "Jack Doohan", "team": "Alpine", "rating": 0.70},
}


def _get_cache_key(year: int, round_num: int, session_type: str, context_hash: str = "") -> str:
    raw = f"pred_{session_type}_{year}_{round_num}_{context_hash}"
    return hashlib.md5(raw.encode()).hexdigest()


GRID_JSON = json.dumps(
    [{"driver": k, "name": v["name"], "team": v["team"]} for k, v in DEFAULT_DRIVER_RATINGS.items()],
    indent=2,
)

# ──────────────────────────── PROMPTS ────────────────────────────


def _build_race_prompt(year, round_num, race_name, qualifying_data, recent_results):
    prompt = f"""You are an expert Formula 1 analyst. Predict the RACE finishing order for {year} Round {round_num}{f' ({race_name})' if race_name else ''}.

TASK: Predict the top 20 finishing positions. For each driver provide position, confidence %, and 1-sentence reasoning.

DRIVER GRID:
{GRID_JSON}
"""
    if qualifying_data:
        prompt += f"\nQUALIFYING RESULTS (starting grid): {json.dumps(qualifying_data[:10], indent=2)}"
    if recent_results:
        prompt += f"\nPREVIOUS RACE RESULTS: {json.dumps(recent_results[:10], indent=2)}"

    prompt += """

PREDICTION FACTORS to consider:
- Grid position from qualifying (pole advantage)
- Race pace vs one-lap pace (some cars are better in race trim)
- Pit stop strategy (1-stop vs 2-stop, undercut/overcut potential)
- Tyre degradation management over full race distance
- Circuit characteristics (overtaking difficulty, DRS zones)
- Historical reliability and team operational strength
- Weather forecast impact on strategy
- Driver racecraft and wheel-to-wheel ability
- Team orders and championship implications

RESPOND IN EXACTLY THIS JSON (no markdown, no code blocks, raw JSON only):
{
  "predictions": [
    {"position": 1, "driver": "NOR", "name": "Lando Norris", "team": "McLaren", "confidence": 85.0, "reasoning": "Strong qualifying and race pace"}
  ],
  "analysis": "2-3 paragraph race narrative discussing key battles and strategy",
  "key_factors": ["Factor 1", "Factor 2", "Factor 3", "Factor 4", "Factor 5"],
  "upset_risk": "Most likely upset scenario"
}"""
    return prompt


def _build_qualifying_prompt(year, round_num, race_name, recent_results):
    prompt = f"""You are an expert Formula 1 analyst. Predict the QUALIFYING order for {year} Round {round_num}{f' ({race_name})' if race_name else ''}.

TASK: Predict the Q3 top 10, plus Q2 and Q1 eliminations. For each driver provide predicted qualifying position, confidence %, and reasoning.

DRIVER GRID:
{GRID_JSON}
"""
    if recent_results:
        prompt += f"\nPREVIOUS RACE RESULTS: {json.dumps(recent_results[:10], indent=2)}"

    prompt += """

QUALIFYING-SPECIFIC FACTORS to consider:
- One-lap pace (raw speed over a single flying lap)
- Sector strengths (high-speed vs low-speed corners, traction zones)
- Car setup for low fuel, maximum downforce qualifying trim
- Track evolution throughout the session (more rubber = faster)
- Tyre compound performance (soft tyre peak window)
- Driver qualifying reputation (Hamilton, Leclerc, Russell known as strong qualifiers)
- Team qualifying philosophy (risk tolerance on out-laps, traffic management)
- Wind and temperature effects on aero balance
- FP session form and pace trends
- New parts or upgrades introduced for this weekend

Q FORMAT RULES:
- Q1: Bottom 5 drivers eliminated (positions 16-20)
- Q2: Next 5 eliminated (positions 11-15)
- Q3: Top 10 fight for pole position (positions 1-10)

RESPOND IN EXACTLY THIS JSON (no markdown, no code blocks, raw JSON only):
{
  "predictions": [
    {"position": 1, "driver": "NOR", "name": "Lando Norris", "team": "McLaren", "confidence": 80.0, "reasoning": "Exceptional one-lap pace", "session": "Q3"}
  ],
  "pole_sitter": {"driver": "NOR", "name": "Lando Norris", "team": "McLaren", "reasoning": "Best single-lap speed"},
  "analysis": "2-3 paragraph qualifying narrative discussing Q3 shootout and elimination surprises",
  "key_factors": ["Factor 1", "Factor 2", "Factor 3", "Factor 4", "Factor 5"],
  "upset_risk": "Most likely qualifying upset"
}"""
    return prompt


def _build_sprint_prompt(year, round_num, race_name, sprint_quali_data, recent_results):
    prompt = f"""You are an expert Formula 1 analyst. Predict the SPRINT RACE finishing order for {year} Round {round_num}{f' ({race_name})' if race_name else ''}.

TASK: Predict the top 20 sprint finishing positions. For each driver provide position, confidence %, and reasoning.

DRIVER GRID:
{GRID_JSON}
"""
    if sprint_quali_data:
        prompt += f"\nSPRINT QUALIFYING GRID: {json.dumps(sprint_quali_data[:10], indent=2)}"
    if recent_results:
        prompt += f"\nPREVIOUS RACE RESULTS: {json.dumps(recent_results[:10], indent=2)}"

    prompt += """

SPRINT-SPECIFIC FACTORS to consider:
- Sprint distance is only ~100km (roughly 1/3 of a full race, ~17-24 laps)
- NO mandatory pit stops — most drivers run the entire sprint on one tyre
- Grid position is CRITICAL — limited laps to recover positions
- Aggressive first-lap positioning is common (more risk-taking)
- Tyre management is less important due to short distance
- DRS availability and overtaking difficulty at this circuit
- Points awarded: P1=8, P2=7, P3=6, P4=5, P5=4, P6=3, P7=2, P8=1
- Championship implications affect risk tolerance
- Sprint qualifying (SQ) grid determines starting order
- Less strategic depth — pure racing ability matters more

RESPOND IN EXACTLY THIS JSON (no markdown, no code blocks, raw JSON only):
{
  "predictions": [
    {"position": 1, "driver": "VER", "name": "Max Verstappen", "team": "Red Bull Racing", "confidence": 82.0, "reasoning": "Excellent sprint race record and aggressive starts"}
  ],
  "sprint_winner": {"driver": "VER", "name": "Max Verstappen", "team": "Red Bull Racing", "reasoning": "Dominant from sprint pole"},
  "analysis": "2-3 paragraph sprint narrative discussing key moves and battles",
  "key_factors": ["Factor 1", "Factor 2", "Factor 3", "Factor 4", "Factor 5"],
  "upset_risk": "Most likely sprint upset"
}"""
    return prompt


# ──────────────────────────── GEMINI CALLER ────────────────────────────


async def _call_gemini(prompt: str, api_key: str) -> dict:
    """Call Gemini API and parse JSON response."""
    from google import genai

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config={"temperature": 0.7, "max_output_tokens": 8192},
    )

    text = response.text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        logger.error(f"Failed to parse Gemini JSON: {text[:500]}")
        raise ValueError("LLM returned invalid JSON")


# ──────────────────────────── HEURISTIC FALLBACK ────────────────────────────


def _predict_heuristic(year: int, round_num: int, session_type: str = "race") -> dict:
    import random
    random.seed(year * 100 + round_num + hash(session_type) % 1000)

    predictions = []
    for code, info in DEFAULT_DRIVER_RATINGS.items():
        # Qualifying emphasises one-lap pace (less noise), sprint moderate noise
        noise_scale = 0.03 if session_type == "qualifying" else 0.04 if session_type == "sprint" else 0.05
        noise = random.gauss(0, noise_scale)
        score = info["rating"] + noise
        predictions.append({"driver": code, "name": info["name"], "team": info["team"], "score": round(score, 4)})

    predictions.sort(key=lambda x: x["score"], reverse=True)

    result_predictions = []
    for i, pred in enumerate(predictions, 1):
        confidence = max(40, min(99, pred["score"] * 100))
        session_label = "qualifying pace" if session_type == "qualifying" else "sprint form" if session_type == "sprint" else "historical performance"
        entry = {
            "position": i,
            "driver": pred["driver"],
            "name": pred["name"],
            "team": pred["team"],
            "confidence": round(confidence, 1),
            "reasoning": f"Based on {session_label} rating ({pred['score']:.2f})",
        }
        if session_type == "qualifying":
            entry["session"] = "Q3" if i <= 10 else "Q2" if i <= 15 else "Q1"
        result_predictions.append(entry)

    result = {
        "season": year,
        "round": round_num,
        "session_type": session_type,
        "race_name": "",
        "predictions": result_predictions,
        "analysis": f"Heuristic {session_type} prediction based on driver ratings.",
        "key_factors": [f"Driver {session_type} ratings", "Team competitiveness", "Statistical modeling"],
        "upset_risk": f"Heuristic model cannot assess real-time {session_type} upset risks.",
    }

    if session_type == "qualifying":
        result["pole_sitter"] = {
            "driver": result_predictions[0]["driver"],
            "name": result_predictions[0]["name"],
            "team": result_predictions[0]["team"],
            "reasoning": "Highest qualifying pace rating",
        }
    elif session_type == "sprint":
        result["sprint_winner"] = {
            "driver": result_predictions[0]["driver"],
            "name": result_predictions[0]["name"],
            "team": result_predictions[0]["team"],
            "reasoning": "Highest sprint performance rating",
        }

    return result


# ──────────────────────────── PUBLIC API ────────────────────────────


async def predict_race_llm(
    year: int, round_num: int, race_name: str = "",
    qualifying_data: Optional[List[dict]] = None,
    recent_results: Optional[List[dict]] = None,
) -> dict:
    context_str = json.dumps(qualifying_data or []) + json.dumps(recent_results or [])
    cache_key = _get_cache_key(year, round_num, "race", hashlib.md5(context_str.encode()).hexdigest())

    if cache_key in _prediction_cache:
        return _prediction_cache[cache_key]

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if api_key:
        try:
            prompt = _build_race_prompt(year, round_num, race_name, qualifying_data, recent_results)
            parsed = await _call_gemini(prompt, api_key)
            result = {
                "season": year, "round": round_num, "race_name": race_name,
                "session_type": "race", "model": "gemini",
                "predictions": parsed.get("predictions", []),
                "analysis": parsed.get("analysis", ""),
                "key_factors": parsed.get("key_factors", []),
                "upset_risk": parsed.get("upset_risk", ""),
            }
            _prediction_cache[cache_key] = result
            return result
        except Exception as e:
            logger.error(f"Gemini race prediction failed: {e}")

    result = _predict_heuristic(year, round_num, "race")
    result["model"] = "heuristic"
    _prediction_cache[cache_key] = result
    return result


async def predict_qualifying_llm(
    year: int, round_num: int, race_name: str = "",
    recent_results: Optional[List[dict]] = None,
) -> dict:
    context_str = json.dumps(recent_results or [])
    cache_key = _get_cache_key(year, round_num, "qualifying", hashlib.md5(context_str.encode()).hexdigest())

    if cache_key in _prediction_cache:
        return _prediction_cache[cache_key]

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if api_key:
        try:
            prompt = _build_qualifying_prompt(year, round_num, race_name, recent_results)
            parsed = await _call_gemini(prompt, api_key)
            result = {
                "season": year, "round": round_num, "race_name": race_name,
                "session_type": "qualifying", "model": "gemini",
                "predictions": parsed.get("predictions", []),
                "pole_sitter": parsed.get("pole_sitter", {}),
                "analysis": parsed.get("analysis", ""),
                "key_factors": parsed.get("key_factors", []),
                "upset_risk": parsed.get("upset_risk", ""),
            }
            _prediction_cache[cache_key] = result
            return result
        except Exception as e:
            logger.error(f"Gemini qualifying prediction failed: {e}")

    result = _predict_heuristic(year, round_num, "qualifying")
    result["model"] = "heuristic"
    _prediction_cache[cache_key] = result
    return result


async def predict_sprint_llm(
    year: int, round_num: int, race_name: str = "",
    sprint_quali_data: Optional[List[dict]] = None,
    recent_results: Optional[List[dict]] = None,
) -> dict:
    context_str = json.dumps(sprint_quali_data or []) + json.dumps(recent_results or [])
    cache_key = _get_cache_key(year, round_num, "sprint", hashlib.md5(context_str.encode()).hexdigest())

    if cache_key in _prediction_cache:
        return _prediction_cache[cache_key]

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if api_key:
        try:
            prompt = _build_sprint_prompt(year, round_num, race_name, sprint_quali_data, recent_results)
            parsed = await _call_gemini(prompt, api_key)
            result = {
                "season": year, "round": round_num, "race_name": race_name,
                "session_type": "sprint", "model": "gemini",
                "predictions": parsed.get("predictions", []),
                "sprint_winner": parsed.get("sprint_winner", {}),
                "analysis": parsed.get("analysis", ""),
                "key_factors": parsed.get("key_factors", []),
                "upset_risk": parsed.get("upset_risk", ""),
            }
            _prediction_cache[cache_key] = result
            return result
        except Exception as e:
            logger.error(f"Gemini sprint prediction failed: {e}")

    result = _predict_heuristic(year, round_num, "sprint")
    result["model"] = "heuristic"
    _prediction_cache[cache_key] = result
    return result
