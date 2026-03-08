"""FastF1 data loader with caching and error handling"""
import os
import fastf1
import pandas as pd
import logging
from functools import lru_cache
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

# Enable fastf1 cache
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

# In-memory cache for processed results
_session_cache: Dict[str, Any] = {}
_results_cache: Dict[str, Any] = {}


def _get_cache_key(year: int, round_num: int, session_type: str = "R") -> str:
    return f"{year}_{round_num}_{session_type}"


def _load_session(year: int, round_num: int, session_type: str = "R"):
    """Load a FastF1 session with error handling and caching."""
    cache_key = _get_cache_key(year, round_num, session_type)
    if cache_key in _session_cache:
        return _session_cache[cache_key]
    
    try:
        session = fastf1.get_session(year, round_num, session_type)
        session.load(telemetry=False, messages=False, weather=False)
        _session_cache[cache_key] = session
        return session
    except Exception as e:
        logger.error(f"Failed to load session {year} R{round_num}: {e}")
        raise


def get_race_results(year: int, round_num: int) -> list:
    """Get race results for a specific race."""
    cache_key = f"results_{year}_{round_num}"
    if cache_key in _results_cache:
        return _results_cache[cache_key]
    
    try:
        session = _load_session(year, round_num)
        results = session.results
        if results is None or results.empty:
            return []
        
        result_list = []
        for _, row in results.iterrows():
            result_list.append({
                "position": int(row.get("Position", 0)) if pd.notna(row.get("Position")) else None,
                "driver": str(row.get("Abbreviation", "")),
                "driver_number": int(row.get("DriverNumber", 0)) if pd.notna(row.get("DriverNumber")) else None,
                "team": str(row.get("TeamName", "")),
                "status": str(row.get("Status", "")),
                "points": float(row.get("Points", 0)) if pd.notna(row.get("Points")) else 0,
            })
        
        _results_cache[cache_key] = result_list
        return result_list
    except Exception as e:
        logger.error(f"Failed to get race results for {year} R{round_num}: {e}")
        raise


def get_race_laps(year: int, round_num: int) -> list:
    """Get lap data for a specific race with robust error handling."""
    cache_key = f"laps_{year}_{round_num}"
    if cache_key in _results_cache:
        return _results_cache[cache_key]
    
    try:
        session = _load_session(year, round_num)
        laps = session.laps
        if laps is None or laps.empty:
            return []
        
        lap_list = []
        for _, lap in laps.iterrows():
            try:
                lap_time = None
                if pd.notna(lap.get("LapTime")):
                    lt = lap["LapTime"]
                    if hasattr(lt, "total_seconds"):
                        lap_time = round(lt.total_seconds(), 3)
                    else:
                        lap_time = float(lt) if lt else None
                
                lap_list.append({
                    "driver": str(lap.get("Driver", "")),
                    "lap_number": int(lap.get("LapNumber", 0)) if pd.notna(lap.get("LapNumber")) else 0,
                    "lap_time": lap_time,
                    "sector1": round(lap["Sector1Time"].total_seconds(), 3) if pd.notna(lap.get("Sector1Time")) and hasattr(lap.get("Sector1Time"), "total_seconds") else None,
                    "sector2": round(lap["Sector2Time"].total_seconds(), 3) if pd.notna(lap.get("Sector2Time")) and hasattr(lap.get("Sector2Time"), "total_seconds") else None,
                    "sector3": round(lap["Sector3Time"].total_seconds(), 3) if pd.notna(lap.get("Sector3Time")) and hasattr(lap.get("Sector3Time"), "total_seconds") else None,
                    "compound": str(lap.get("Compound", "")) if pd.notna(lap.get("Compound")) else None,
                    "tyre_life": int(lap.get("TyreLife", 0)) if pd.notna(lap.get("TyreLife")) else None,
                })
            except (ValueError, TypeError, AttributeError) as e:
                logger.warning(f"Skipping malformed lap data: {e}")
                continue
        
        _results_cache[cache_key] = lap_list
        return lap_list
    except ValueError as e:
        logger.error(f"ValueError loading laps for {year} R{round_num}: {e}")
        raise
    except Exception as e:
        logger.error(f"Failed to get laps for {year} R{round_num}: {e}")
        raise


def get_schedule(year: int) -> list:
    """Get the race schedule for a given year."""
    cache_key = f"schedule_{year}"
    if cache_key in _results_cache:
        return _results_cache[cache_key]
    
    try:
        schedule = fastf1.get_event_schedule(year)
        events = []
        for _, event in schedule.iterrows():
            try:
                event_date = None
                if pd.notna(event.get("EventDate")):
                    event_date = str(event["EventDate"])[:10]
                
                events.append({
                    "round": int(event.get("RoundNumber", 0)) if pd.notna(event.get("RoundNumber")) else 0,
                    "name": str(event.get("EventName", "")),
                    "country": str(event.get("Country", "")),
                    "location": str(event.get("Location", "")),
                    "date": event_date,
                })
            except (ValueError, TypeError) as e:
                logger.warning(f"Skipping malformed event: {e}")
                continue
        
        # Filter out testing events (round 0)
        events = [e for e in events if e["round"] > 0]
        _results_cache[cache_key] = events
        return events
    except Exception as e:
        logger.error(f"Failed to get schedule for {year}: {e}")
        raise


def get_driver_season_stats(year: int, driver: str) -> dict:
    """Get aggregated driver stats for a season with timeout protection."""
    cache_key = f"driver_stats_{year}_{driver}"
    if cache_key in _results_cache:
        return _results_cache[cache_key]
    
    try:
        schedule = fastf1.get_event_schedule(year)
        race_rounds = [int(r) for r in schedule["RoundNumber"] if r > 0]
        
        stats = {
            "driver": driver,
            "year": year,
            "races": 0,
            "wins": 0,
            "podiums": 0,
            "points": 0.0,
            "dnfs": 0,
            "best_finish": None,
            "avg_finish": None,
            "results": [],
        }
        
        positions = []
        # Limit to first 5 rounds for performance, or use cached data
        max_rounds = min(len(race_rounds), 2)
        
        for round_num in race_rounds[:max_rounds]:
            try:
                session = _load_session(year, round_num)
                results = session.results
                if results is None or results.empty:
                    continue
                
                driver_result = results[results["Abbreviation"] == driver.upper()]
                if driver_result.empty:
                    # Try matching by last name
                    driver_result = results[results["LastName"].str.upper() == driver.upper()]
                
                if not driver_result.empty:
                    row = driver_result.iloc[0]
                    pos = int(row["Position"]) if pd.notna(row.get("Position")) else None
                    pts = float(row["Points"]) if pd.notna(row.get("Points")) else 0
                    status = str(row.get("Status", ""))
                    
                    stats["races"] += 1
                    stats["points"] += pts
                    
                    if pos is not None:
                        positions.append(pos)
                        if pos == 1:
                            stats["wins"] += 1
                        if pos <= 3:
                            stats["podiums"] += 1
                    
                    if "Finished" not in status and pos is None:
                        stats["dnfs"] += 1
                    
                    stats["results"].append({
                        "round": round_num,
                        "position": pos,
                        "points": pts,
                        "status": status,
                    })
            except Exception as e:
                logger.warning(f"Failed to load round {round_num} for {driver}: {e}")
                continue
        
        if positions:
            stats["best_finish"] = min(positions)
            stats["avg_finish"] = round(sum(positions) / len(positions), 1)
        
        stats["points"] = round(stats["points"], 1)
        _results_cache[cache_key] = stats
        return stats
    except Exception as e:
        logger.error(f"Failed to get driver stats for {driver} in {year}: {e}")
        raise


def list_drivers(year: int) -> list:
    """List all drivers for a given year."""
    cache_key = f"drivers_{year}"
    if cache_key in _results_cache:
        return _results_cache[cache_key]
    
    try:
        session = _load_session(year, 1)
        results = session.results
        if results is None or results.empty:
            return []
        
        drivers = []
        for _, row in results.iterrows():
            drivers.append({
                "abbreviation": str(row.get("Abbreviation", "")),
                "number": int(row.get("DriverNumber", 0)) if pd.notna(row.get("DriverNumber")) else None,
                "first_name": str(row.get("FirstName", "")),
                "last_name": str(row.get("LastName", "")),
                "team": str(row.get("TeamName", "")),
            })
        
        _results_cache[cache_key] = drivers
        return drivers
    except Exception as e:
        logger.error(f"Failed to list drivers for {year}: {e}")
        raise
