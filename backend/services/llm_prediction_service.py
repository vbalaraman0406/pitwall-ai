"""LLM-powered prediction service for Race, Qualifying, and Sprint sessions.

Enhanced with comprehensive metrics: car performance tiers, team power rankings,
driver form, circuit characteristics, and historical data.
"""
import os
import json
import logging
import hashlib
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# In-memory cache — only Gemini results (NOT heuristic) get cached
_prediction_cache: Dict[str, Any] = {}

# Disk-based prediction cache — survives cold starts
PRED_CACHE_DIR = "/tmp/pitwall_pred_cache"
try:
    os.makedirs(PRED_CACHE_DIR, exist_ok=True)
except Exception:
    pass


def _pred_disk_get(cache_key: str):
    """Read prediction from disk cache."""
    path = os.path.join(PRED_CACHE_DIR, f"{cache_key}.json")
    try:
        if os.path.exists(path):
            with open(path, "r") as f:
                data = json.load(f)
                _prediction_cache[cache_key] = data  # promote to memory
                return data
    except Exception:
        pass
    return None


def _pred_disk_set(cache_key: str, data):
    """Write prediction to disk cache."""
    path = os.path.join(PRED_CACHE_DIR, f"{cache_key}.json")
    try:
        with open(path, "w") as f:
            json.dump(data, f, separators=(",", ":"))
    except Exception as e:
        logger.warning(f"Failed to write prediction cache: {e}")


def _pred_cache_get(cache_key: str):
    """Multi-layer prediction cache read: memory → disk → None."""
    if cache_key in _prediction_cache:
        return _prediction_cache[cache_key]
    return _pred_disk_get(cache_key)


def _pred_cache_set(cache_key: str, data):
    """Write to both memory and disk prediction cache."""
    _prediction_cache[cache_key] = data
    _pred_disk_set(cache_key, data)

# ──────────────────────────── TEAM & DRIVER DATA ────────────────────────────

# 2026 Car performance tiers — UPDATED after Round 1 (Australian GP, March 8 2026)
# Mercedes scored a dominant 1-2 (RUS P1, ANT P2), Ferrari strong (LEC P3, HAM P4),
# McLaren solid (NOR P5), Red Bull underperformed (VER P6, HAD P15)
TEAM_PERFORMANCE = {
    "Mercedes": {"tier": "A+", "car_rating": 9.6, "aero": "excellent", "power_unit": "Mercedes", "budget": "top", "strengths": "Dominant race pace, 1-2 finish in R01. Best overall package early 2026", "weakness": "Sustained development pace unknown"},
    "Ferrari": {"tier": "A+", "car_rating": 9.4, "aero": "excellent", "power_unit": "Ferrari", "budget": "top", "strengths": "Power unit and traction, LEC P3 and HAM P4 in Melbourne", "weakness": "Couldn't match Mercedes race pace in R01"},
    "McLaren": {"tier": "A", "car_rating": 9.2, "aero": "excellent", "power_unit": "Mercedes", "budget": "top", "strengths": "NOR P5 in R01, strong qualifying pace", "weakness": "Race pace gap to Mercedes in R01"},
    "Red Bull Racing": {"tier": "A-", "car_rating": 8.8, "aero": "good", "power_unit": "Honda RBPT", "budget": "top", "strengths": "VER driver talent can extract more than the car offers", "weakness": "Significant pace deficit in R01 (VER P6), struggling with 2026 regs"},
    "Aston Martin": {"tier": "B+", "car_rating": 8.0, "aero": "good", "power_unit": "Honda RBPT", "budget": "upper-mid", "strengths": "High-speed stability", "weakness": "Low-speed corners"},
    "Haas F1 Team": {"tier": "B", "car_rating": 7.5, "aero": "average", "power_unit": "Ferrari", "budget": "lower-mid", "strengths": "BEA P7 in R01, Ferrari PU synergy paying off", "weakness": "Development budget"},
    "Racing Bulls": {"tier": "B", "car_rating": 7.3, "aero": "average", "power_unit": "Honda RBPT", "budget": "lower-mid", "strengths": "LIN P8 in R01, Red Bull technology sharing", "weakness": "Inconsistency"},
    "Williams": {"tier": "B", "car_rating": 7.2, "aero": "good", "power_unit": "Mercedes", "budget": "midfield", "strengths": "Straight-line speed", "weakness": "Midcorner balance"},
    "Audi": {"tier": "B-", "car_rating": 7.0, "aero": "developing", "power_unit": "Audi", "budget": "growing", "strengths": "BOR P9 in R01, new investment paying off", "weakness": "New PU still developing"},
    "Alpine": {"tier": "B-", "car_rating": 6.8, "aero": "average", "power_unit": "Renault", "budget": "midfield", "strengths": "GAS P10 in R01", "weakness": "Overall pace deficit"},
    "Cadillac": {"tier": "C", "car_rating": 6.0, "aero": "basic", "power_unit": "Ferrari", "budget": "entry-level", "strengths": "GM backing and resources", "weakness": "Brand new team, PER P19 in R01"},
}

# Driver performance data — ratings, strengths, qualifying ability, racecraft
DRIVER_DATA = {
    # UPDATED after R01 Australian GP results
    "RUS": {"name": "George Russell", "team": "Mercedes", "overall": 95, "race_craft": 93, "qualifying": 94, "consistency": 93, "tyre_management": 92, "wet_weather": 88, "overtaking": 90, "form": "excellent", "championships": 0, "career_wins": 4},
    "ANT": {"name": "Kimi Antonelli", "team": "Mercedes", "overall": 89, "race_craft": 87, "qualifying": 90, "consistency": 85, "tyre_management": 85, "wet_weather": 84, "overtaking": 86, "form": "excellent", "championships": 0, "career_wins": 0},
    "LEC": {"name": "Charles Leclerc", "team": "Ferrari", "overall": 93, "race_craft": 91, "qualifying": 97, "consistency": 88, "tyre_management": 90, "wet_weather": 87, "overtaking": 90, "form": "good", "championships": 0, "career_wins": 8},
    "HAM": {"name": "Lewis Hamilton", "team": "Ferrari", "overall": 94, "race_craft": 97, "qualifying": 95, "consistency": 96, "tyre_management": 98, "wet_weather": 97, "overtaking": 95, "form": "good", "championships": 7, "career_wins": 105},
    "NOR": {"name": "Lando Norris", "team": "McLaren", "overall": 95, "race_craft": 94, "qualifying": 96, "consistency": 93, "tyre_management": 92, "wet_weather": 90, "overtaking": 93, "form": "good", "championships": 1, "career_wins": 9},
    "VER": {"name": "Max Verstappen", "team": "Red Bull Racing", "overall": 97, "race_craft": 98, "qualifying": 96, "consistency": 95, "tyre_management": 96, "wet_weather": 98, "overtaking": 97, "form": "struggling", "championships": 4, "career_wins": 63},
    "PIA": {"name": "Oscar Piastri", "team": "McLaren", "overall": 91, "race_craft": 89, "qualifying": 92, "consistency": 90, "tyre_management": 88, "wet_weather": 85, "overtaking": 88, "form": "good", "championships": 0, "career_wins": 3},
    "BEA": {"name": "Oliver Bearman", "team": "Haas F1 Team", "overall": 79, "race_craft": 77, "qualifying": 80, "consistency": 76, "tyre_management": 75, "wet_weather": 73, "overtaking": 77, "form": "good", "championships": 0, "career_wins": 0},
    "LIN": {"name": "Arvid Lindblad", "team": "Racing Bulls", "overall": 77, "race_craft": 76, "qualifying": 78, "consistency": 74, "tyre_management": 73, "wet_weather": 75, "overtaking": 77, "form": "good", "championships": 0, "career_wins": 0},
    "BOR": {"name": "Gabriel Bortoleto", "team": "Audi", "overall": 77, "race_craft": 76, "qualifying": 77, "consistency": 75, "tyre_management": 74, "wet_weather": 72, "overtaking": 75, "form": "good", "championships": 0, "career_wins": 0},
    "GAS": {"name": "Pierre Gasly", "team": "Alpine", "overall": 84, "race_craft": 85, "qualifying": 84, "consistency": 83, "tyre_management": 82, "wet_weather": 83, "overtaking": 83, "form": "average", "championships": 0, "career_wins": 1},
    "ALO": {"name": "Fernando Alonso", "team": "Aston Martin", "overall": 90, "race_craft": 96, "qualifying": 88, "consistency": 94, "tyre_management": 97, "wet_weather": 95, "overtaking": 93, "form": "steady", "championships": 2, "career_wins": 32},
    "SAI": {"name": "Carlos Sainz", "team": "Williams", "overall": 89, "race_craft": 90, "qualifying": 88, "consistency": 91, "tyre_management": 91, "wet_weather": 86, "overtaking": 87, "form": "good", "championships": 0, "career_wins": 4},
    "ALB": {"name": "Alexander Albon", "team": "Williams", "overall": 85, "race_craft": 86, "qualifying": 83, "consistency": 87, "tyre_management": 88, "wet_weather": 84, "overtaking": 85, "form": "steady", "championships": 0, "career_wins": 0},
    "HUL": {"name": "Nico Hulkenberg", "team": "Audi", "overall": 82, "race_craft": 83, "qualifying": 84, "consistency": 82, "tyre_management": 83, "wet_weather": 80, "overtaking": 78, "form": "steady", "championships": 0, "career_wins": 0},
    "OCO": {"name": "Esteban Ocon", "team": "Haas F1 Team", "overall": 81, "race_craft": 80, "qualifying": 82, "consistency": 80, "tyre_management": 79, "wet_weather": 81, "overtaking": 78, "form": "steady", "championships": 0, "career_wins": 1},
    "LAW": {"name": "Liam Lawson", "team": "Racing Bulls", "overall": 80, "race_craft": 79, "qualifying": 81, "consistency": 78, "tyre_management": 77, "wet_weather": 80, "overtaking": 80, "form": "developing", "championships": 0, "career_wins": 0},
    "STR": {"name": "Lance Stroll", "team": "Aston Martin", "overall": 78, "race_craft": 77, "qualifying": 76, "consistency": 79, "tyre_management": 80, "wet_weather": 82, "overtaking": 74, "form": "average", "championships": 0, "career_wins": 0},
    "COL": {"name": "Franco Colapinto", "team": "Alpine", "overall": 75, "race_craft": 74, "qualifying": 76, "consistency": 72, "tyre_management": 73, "wet_weather": 71, "overtaking": 74, "form": "developing", "championships": 0, "career_wins": 0},
    "HAD": {"name": "Isack Hadjar", "team": "Red Bull Racing", "overall": 75, "race_craft": 73, "qualifying": 77, "consistency": 72, "tyre_management": 71, "wet_weather": 73, "overtaking": 74, "form": "struggling", "championships": 0, "career_wins": 0},
    "PER": {"name": "Sergio Perez", "team": "Cadillac", "overall": 78, "race_craft": 80, "qualifying": 76, "consistency": 74, "tyre_management": 83, "wet_weather": 78, "overtaking": 77, "form": "declining", "championships": 0, "career_wins": 6},
    "BOT": {"name": "Valtteri Bottas", "team": "Cadillac", "overall": 77, "race_craft": 76, "qualifying": 79, "consistency": 79, "tyre_management": 81, "wet_weather": 77, "overtaking": 71, "form": "steady", "championships": 0, "career_wins": 10},
}


# ──────────────────────────── ACTUAL SEASON RESULTS ────────────────────────────
# This data feeds into prompts so the LLM can make informed predictions

SEASON_RESULTS_2026 = {
    1: {
        "race_name": "Australian Grand Prix",
        "circuit": "Albert Park, Melbourne",
        "date": "2026-03-08",
        "results": [
            {"pos": 1, "driver": "RUS", "team": "Mercedes", "status": "Finished", "points": 25},
            {"pos": 2, "driver": "ANT", "team": "Mercedes", "status": "Finished", "points": 18},
            {"pos": 3, "driver": "LEC", "team": "Ferrari", "status": "Finished", "points": 15},
            {"pos": 4, "driver": "HAM", "team": "Ferrari", "status": "Finished", "points": 12},
            {"pos": 5, "driver": "NOR", "team": "McLaren", "status": "Finished", "points": 10},
            {"pos": 6, "driver": "VER", "team": "Red Bull Racing", "status": "Finished", "points": 8},
            {"pos": 7, "driver": "BEA", "team": "Haas F1 Team", "status": "Lapped", "points": 6},
            {"pos": 8, "driver": "LIN", "team": "Racing Bulls", "status": "Lapped", "points": 4},
            {"pos": 9, "driver": "BOR", "team": "Audi", "status": "Lapped", "points": 2},
            {"pos": 10, "driver": "GAS", "team": "Alpine", "status": "Lapped", "points": 1},
            {"pos": 11, "driver": "ALO", "team": "Aston Martin", "status": "Lapped", "points": 0},
            {"pos": 12, "driver": "SAI", "team": "Williams", "status": "Lapped", "points": 0},
            {"pos": 13, "driver": "ALB", "team": "Williams", "status": "Lapped", "points": 0},
            {"pos": 14, "driver": "HUL", "team": "Audi", "status": "Lapped", "points": 0},
            {"pos": 15, "driver": "HAD", "team": "Red Bull Racing", "status": "Lapped", "points": 0},
            {"pos": 16, "driver": "OCO", "team": "Haas F1 Team", "status": "Lapped", "points": 0},
            {"pos": 17, "driver": "COL", "team": "Alpine", "status": "Lapped", "points": 0},
            {"pos": 18, "driver": "LAW", "team": "Racing Bulls", "status": "Lapped", "points": 0},
            {"pos": 19, "driver": "PER", "team": "Cadillac", "status": "Lapped", "points": 0},
            {"pos": 20, "driver": "STR", "team": "Aston Martin", "status": "Lapped", "points": 0},
            {"pos": 21, "driver": "BOT", "team": "Cadillac", "status": "DNF", "points": 0},
            {"pos": 99, "driver": "PIA", "team": "McLaren", "status": "DNS", "points": 0},
        ],
        "key_takeaways": [
            "Mercedes dominant 1-2 — best car on the grid in R01",
            "Ferrari solid but couldn't match Mercedes pace",
            "Red Bull struggling — VER only P6 despite being 4x champion",
            "Rookies ANT (P2!) and BEA (P7) impressed massively",
            "PIA DNS due to pre-race issue — no data on McLaren race pace",
        ],
    }
}


def _season_results_summary(up_to_round: int) -> str:
    """Build a text summary of season results up to (but not including) the given round."""
    lines = []
    for rnd in sorted(SEASON_RESULTS_2026.keys()):
        if rnd >= up_to_round:
            break
        data = SEASON_RESULTS_2026[rnd]
        lines.append(f"\nRound {rnd} — {data['race_name']} ({data['date']}):")
        for r in data["results"][:10]:
            lines.append(f"  P{r['pos']}: {r['driver']} ({r['team']}) — {r['status']}")
        if data.get("key_takeaways"):
            lines.append("  Key takeaways:")
            for t in data["key_takeaways"]:
                lines.append(f"    - {t}")
    return "\n".join(lines) if lines else "No completed races yet this season."


def _get_cache_key(year: int, round_num: int, session_type: str, context_hash: str = "") -> str:
    raw = f"pred_v2_{session_type}_{year}_{round_num}_{context_hash}"  # v2 to bust old caches
    return hashlib.md5(raw.encode()).hexdigest()


def _team_tier_summary():
    lines = []
    for team, data in TEAM_PERFORMANCE.items():
        lines.append(f"  {team}: Tier {data['tier']} (car: {data['car_rating']}/10, PU: {data['power_unit']}, "
                      f"aero: {data['aero']}, strengths: {data['strengths']}, weakness: {data['weakness']})")
    return "\n".join(lines)


def _driver_summary():
    lines = []
    for code, d in DRIVER_DATA.items():
        lines.append(f"  {code} ({d['name']}, {d['team']}): overall={d['overall']}, quali={d['qualifying']}, "
                      f"racecraft={d['race_craft']}, tyre_mgmt={d['tyre_management']}, wet={d['wet_weather']}, "
                      f"form={d['form']}, championships={d['championships']}, wins={d['career_wins']}")
    return "\n".join(lines)


# ──────────────────────────── PROMPTS ────────────────────────────


def _build_race_prompt(year, round_num, race_name, qualifying_data, recent_results):
    season_context = _season_results_summary(round_num)
    prompt = f"""You are an expert Formula 1 data analyst and race strategist. Predict the RACE finishing order for the {year} Formula 1 Season, Round {round_num}{f' ({race_name})' if race_name else ''}.

TASK: Predict the top 20 finishing positions for this RACE. For each driver provide position, confidence %, and 1-sentence reasoning.

IMPORTANT: Base your predictions on ACTUAL RESULTS from earlier rounds this season, not just pre-season expectations. The actual race results below show the TRUE competitive order.

ACTUAL 2026 SEASON RESULTS SO FAR:
{season_context}

CAR PERFORMANCE TIERS (updated based on actual 2026 results):
{_team_tier_summary()}

DRIVER RATINGS & CURRENT FORM:
{_driver_summary()}
"""
    if qualifying_data:
        prompt += f"\nQUALIFYING RESULTS (starting grid) FOR THIS RACE: {json.dumps(qualifying_data[:10], indent=2)}"
    if recent_results:
        prompt += f"\nMOST RECENT RACE RESULTS: {json.dumps(recent_results[:10], indent=2)}"

    prompt += f"""

RACE-SPECIFIC PREDICTION FACTORS - weigh ALL of these:
1. CAR PERFORMANCE: Team tier and car rating are the PRIMARY drivers of race pace
2. GRID POSITION: Starting position from qualifying hugely impacts finishing position
3. RACE PACE vs QUALI PACE: Some cars are stronger in race trim (longer stints, tyre management)
4. PIT STRATEGY: 1-stop vs 2-stop options, undercut/overcut potential, pit crew reliability
5. TYRE DEGRADATION: How each car/driver manages high/medium/low degradation tyres over race distance
6. CIRCUIT CHARACTERISTICS for {race_name}: overtaking difficulty, DRS zones, high/low downforce needs
7. DRIVER RACECRAFT: Wheel-to-wheel ability, defending, overtaking skill ratings
8. RELIABILITY: Each team's mechanical reliability track record
9. WEATHER CONDITIONS: Impact on strategy and performance
10. TEAM STRATEGY: Quality of race strategists and team orders potential
11. CHAMPIONSHIP IMPLICATIONS: How much risk drivers will take based on standings
12. DRIVER FORM: Current momentum and confidence level

IMPORTANT: The car/team performance tier is the MOST important factor. A Tier A+ car will almost always beat a Tier C car regardless of driver skill. Weight car performance heavily.

RESPOND IN EXACTLY THIS JSON (no markdown, no code blocks, raw JSON only):
{{
  "predictions": [
    {{"position": 1, "driver": "NOR", "name": "Lando Norris", "team": "McLaren", "confidence": 85.0, "reasoning": "McLaren's A+ tier car dominates race pace with Norris's excellent form"}}
  ],
  "analysis": "2-3 paragraph race narrative discussing key battles, strategy considerations, and predicted race flow. Mention specific driver battles and overtaking scenarios.",
  "key_factors": ["Car performance gap between tiers", "Grid position advantage", "Tyre strategy options", "Circuit overtaking difficulty", "Weather conditions"],
  "upset_risk": "Most likely upset scenario with specific driver and circumstances"
}}"""
    return prompt


def _build_qualifying_prompt(year, round_num, race_name, recent_results):
    season_context = _season_results_summary(round_num)
    prompt = f"""You are an expert Formula 1 data analyst. Predict the QUALIFYING order for the {year} Season, Round {round_num}{f' ({race_name})' if race_name else ''}.

TASK: Predict the Q3 top 10, Q2 eliminations (P11-15), and Q1 eliminations (P16-20+). For each driver provide predicted qualifying position, confidence %, session (Q3/Q2/Q1), and reasoning.

IMPORTANT: Base your predictions on ACTUAL RESULTS from earlier rounds this season, not just pre-season expectations.

ACTUAL 2026 SEASON RESULTS SO FAR:
{season_context}

CAR PERFORMANCE TIERS (updated based on actual 2026 results, qualifying-specific):
{_team_tier_summary()}

DRIVER QUALIFYING ABILITIES:
{_driver_summary()}
"""
    if recent_results:
        prompt += f"\nMOST RECENT RACE RESULTS: {json.dumps(recent_results[:10], indent=2)}"

    prompt += f"""

QUALIFYING-SPECIFIC FACTORS - weigh ALL of these:
1. ONE-LAP PACE: Car aerodynamic efficiency and power unit in qualifying trim (low fuel, max power)
2. CAR TIER: A+ cars have a 0.5-1.0s advantage over C tier cars in qualifying
3. DRIVER QUALIFYING SKILL: Some drivers consistently outperform (Leclerc and Russell are qualifying specialists)
4. TRACK EVOLUTION: Rubber build-up means later runs in sessions are faster
5. SECTOR STRENGTHS: High-speed vs low-speed corner performance per car
6. TYRE COMPOUND: Soft tyre performance window (some cars struggle with warm-up)
7. WIND & TEMPERATURE: Ambient conditions affect aero balance and tyre grip
8. TEAM QUALIFYING STRATEGY: Out-lap preparation, traffic management, tow usage
9. FP SESSION FORM: Practice pace as indicator of qualifying potential
10. NEW UPGRADES: Parts introduced for this weekend affecting qualifying pace
11. CIRCUIT FOR {race_name}: Is it high-downforce (Monaco) or low-drag (Monza)?

Q FORMAT:
- Q1: Bottom 5 eliminated (P16-P20+)
- Q2: Next 5 eliminated (P11-P15)
- Q3: Top 10 shootout for pole (P1-P10)

IMPORTANT: The car performance tier is CRITICAL. No driver can overcome a >1s car deficit in qualifying. Weight the car performance heavily, then driver qualifying skill.

RESPOND IN EXACTLY THIS JSON (no markdown, no code blocks, raw JSON only):
{{
  "predictions": [
    {{"position": 1, "driver": "LEC", "name": "Charles Leclerc", "team": "Ferrari", "confidence": 80.0, "reasoning": "Ferrari's A+ car with Leclerc's 97 qualifying rating makes him the pole favourite", "session": "Q3"}}
  ],
  "pole_sitter": {{"driver": "LEC", "name": "Charles Leclerc", "team": "Ferrari", "reasoning": "Highest qualifying rating combined with A+ tier car"}},
  "analysis": "2-3 paragraph qualifying narrative discussing the Q3 shootout battle, Q2 surprise eliminations, and Q1 casualties",
  "key_factors": ["Car qualifying trim performance", "Driver one-lap pace ability", "Track evolution impact", "Tyre warm-up characteristics", "Sector-specific car strengths"],
  "upset_risk": "Most likely qualifying upset with specific driver"
}}"""
    return prompt


def _build_sprint_prompt(year, round_num, race_name, sprint_quali_data, recent_results):
    prompt = f"""You are an expert Formula 1 analyst. Predict the SPRINT RACE finishing order for the {year} Season, Round {round_num}{f' ({race_name})' if race_name else ''}.

TASK: Predict the top 20 sprint finishing positions. For each driver provide position, confidence %, and reasoning.

CAR PERFORMANCE TIERS:
{_team_tier_summary()}

DRIVER RATINGS:
{_driver_summary()}
"""
    if sprint_quali_data:
        prompt += f"\nSPRINT QUALIFYING GRID: {json.dumps(sprint_quali_data[:10], indent=2)}"
    if recent_results:
        prompt += f"\nPREVIOUS RACE RESULTS: {json.dumps(recent_results[:10], indent=2)}"

    prompt += f"""

SPRINT-SPECIFIC FACTORS - weigh ALL of these:
1. SPRINT DISTANCE: Only ~100km (17-24 laps) — roughly 1/3 of a full race
2. NO MANDATORY PIT STOPS: Most drivers run the entire sprint on one tyre compound
3. GRID POSITION IS CRITICAL: Very limited laps to recover — starting position matters enormously
4. AGGRESSIVE LAP 1: Drivers take more risks on sprint starts (higher chance of position changes)
5. CAR PERFORMANCE: Still the primary determinant — Tier A+ cars dominate even in short formats
6. DRS AVAILABILITY: Overtaking difficulty at this specific circuit
7. TYRE MANAGEMENT: Less important due to short distance but still a factor
8. SPRINT POINTS: P1=8, P2=7, P3=6, P4=5, P5=4, P6=3, P7=2, P8=1 (affects risk-taking)
9. DRIVER OVERTAKING SKILL: Critical for recovering positions in short sprint
10. CHAMPIONSHIP IMPLICATIONS: Points are valuable, impacts risk tolerance

RESPOND IN EXACTLY THIS JSON (no markdown, no code blocks, raw JSON only):
{{
  "predictions": [
    {{"position": 1, "driver": "VER", "name": "Max Verstappen", "team": "Red Bull Racing", "confidence": 82.0, "reasoning": "Excellent sprint record with aggressive starts and Red Bull's strong race pace"}}
  ],
  "sprint_winner": {{"driver": "VER", "name": "Max Verstappen", "team": "Red Bull Racing", "reasoning": "Dominant sprint race ability from pole position"}},
  "analysis": "2-3 paragraph sprint narrative discussing key moves, first-lap drama, and battles",
  "key_factors": ["Grid position criticality", "Sprint distance limitations", "First-lap aggression", "Car pace advantage", "DRS overtaking potential"],
  "upset_risk": "Most likely sprint upset scenario"
}}"""
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
    """Fallback when Gemini unavailable. NOT cached — will retry Gemini next call."""
    import random
    random.seed(year * 100 + round_num + hash(session_type) % 1000)

    predictions = []
    for code, info in DRIVER_DATA.items():
        team_data = TEAM_PERFORMANCE.get(info["team"], {"car_rating": 5.0})
        # Weight: 60% car, 40% driver
        car_score = team_data["car_rating"] / 10.0
        driver_score = info["overall"] / 100.0
        if session_type == "qualifying":
            driver_score = info["qualifying"] / 100.0
        combined = 0.6 * car_score + 0.4 * driver_score
        noise_scale = 0.02 if session_type == "qualifying" else 0.03 if session_type == "sprint" else 0.04
        combined += random.gauss(0, noise_scale)
        predictions.append({"driver": code, "name": info["name"], "team": info["team"], "score": round(combined, 4)})

    predictions.sort(key=lambda x: x["score"], reverse=True)

    result_predictions = []
    for i, pred in enumerate(predictions, 1):
        confidence = max(40, min(99, pred["score"] * 100))
        entry = {
            "position": i,
            "driver": pred["driver"],
            "name": pred["name"],
            "team": pred["team"],
            "confidence": round(confidence, 1),
            "reasoning": f"Weighted model: {TEAM_PERFORMANCE.get(pred['team'], {}).get('tier', '?')} tier car + driver form",
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
        "analysis": f"Heuristic {session_type} prediction — weighted 60% car performance tier + 40% driver rating. Gemini AI was unavailable; will retry on next request.",
        "key_factors": [f"Car performance tier ({session_type})", "Driver skill rating", "Team competitiveness", "Weighted statistical model"],
        "upset_risk": f"Heuristic model has limited upset prediction. Gemini AI provides detailed analysis.",
    }

    if session_type == "qualifying":
        result["pole_sitter"] = {
            "driver": result_predictions[0]["driver"],
            "name": result_predictions[0]["name"],
            "team": result_predictions[0]["team"],
            "reasoning": f"Highest combined car tier + qualifying rating",
        }
    elif session_type == "sprint":
        result["sprint_winner"] = {
            "driver": result_predictions[0]["driver"],
            "name": result_predictions[0]["name"],
            "team": result_predictions[0]["team"],
            "reasoning": f"Highest combined car tier + sprint performance rating",
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

    cached = _pred_cache_get(cache_key)
    if cached is not None:
        return cached

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
            _pred_cache_set(cache_key, result)  # Cache Gemini results
            return result
        except Exception as e:
            logger.error(f"Gemini race prediction failed: {e}")

    # Heuristic fallback — NOT cached, will retry Gemini next time
    result = _predict_heuristic(year, round_num, "race")
    result["model"] = "heuristic"
    return result


async def predict_qualifying_llm(
    year: int, round_num: int, race_name: str = "",
    recent_results: Optional[List[dict]] = None,
) -> dict:
    context_str = json.dumps(recent_results or [])
    cache_key = _get_cache_key(year, round_num, "qualifying", hashlib.md5(context_str.encode()).hexdigest())

    cached = _pred_cache_get(cache_key)
    if cached is not None:
        return cached

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
            _pred_cache_set(cache_key, result)
            return result
        except Exception as e:
            logger.error(f"Gemini qualifying prediction failed: {e}")

    result = _predict_heuristic(year, round_num, "qualifying")
    result["model"] = "heuristic"
    return result


async def predict_sprint_llm(
    year: int, round_num: int, race_name: str = "",
    sprint_quali_data: Optional[List[dict]] = None,
    recent_results: Optional[List[dict]] = None,
) -> dict:
    context_str = json.dumps(sprint_quali_data or []) + json.dumps(recent_results or [])
    cache_key = _get_cache_key(year, round_num, "sprint", hashlib.md5(context_str.encode()).hexdigest())

    cached = _pred_cache_get(cache_key)
    if cached is not None:
        return cached

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
            _pred_cache_set(cache_key, result)
            return result
        except Exception as e:
            logger.error(f"Gemini sprint prediction failed: {e}")

    result = _predict_heuristic(year, round_num, "sprint")
    result["model"] = "heuristic"
    return result
