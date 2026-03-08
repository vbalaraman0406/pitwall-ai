"""FastF1 data service module for Pitwall.ai."""
import os
import fastf1
import pandas as pd
from typing import Optional

CACHE_DIR = os.environ.get("CACHE_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "cache"))
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)


def _load_session(year: int, round_num: int, session_type: str):
    """Load and return a FastF1 session with data."""
    session = fastf1.get_session(year, round_num, session_type)
    session.load()
    return session


def get_race_results(year: int, round_num: int) -> list:
    """Fetch race classification results."""
    session = _load_session(year, round_num, "R")
    results = session.results
    output = []
    for _, row in results.iterrows():
        first = row.get("FirstName", "")
        last = row.get("LastName", "")
        output.append({
            "position": int(row["Position"]) if pd.notna(row["Position"]) else None,
            "driver_number": str(row["DriverNumber"]),
            "driver": row["Abbreviation"],
            "full_name": first + " " + last,
            "team": row["TeamName"],
            "status": row["Status"],
            "points": float(row["Points"]) if pd.notna(row["Points"]) else 0,
            "grid_position": int(row["GridPosition"]) if pd.notna(row["GridPosition"]) else None,
            "time": str(row["Time"]) if pd.notna(row.get("Time")) else None,
        })
    return output


def get_qualifying_results(year: int, round_num: int) -> list:
    """Fetch qualifying session results."""
    session = _load_session(year, round_num, "Q")
    results = session.results
    output = []
    for _, row in results.iterrows():
        first = row.get("FirstName", "")
        last = row.get("LastName", "")
        output.append({
            "position": int(row["Position"]) if pd.notna(row["Position"]) else None,
            "driver": row["Abbreviation"],
            "full_name": first + " " + last,
            "team": row["TeamName"],
            "q1": str(row["Q1"]) if pd.notna(row.get("Q1")) else None,
            "q2": str(row["Q2"]) if pd.notna(row.get("Q2")) else None,
            "q3": str(row["Q3"]) if pd.notna(row.get("Q3")) else None,
        })
    return output


def get_lap_data(year: int, round_num: int) -> list:
    """Fetch lap-by-lap timing data for all drivers."""
    session = _load_session(year, round_num, "R")
    laps = session.laps
    output = []
    for _, lap in laps.iterrows():
        lap_time_sec = lap["LapTime"].total_seconds() if pd.notna(lap["LapTime"]) else None
        output.append({
            "driver": lap["Driver"],
            "lap_number": int(lap["LapNumber"]),
            "lap_time": lap_time_sec,
            "sector1": lap["Sector1Time"].total_seconds() if pd.notna(lap["Sector1Time"]) else None,
            "sector2": lap["Sector2Time"].total_seconds() if pd.notna(lap["Sector2Time"]) else None,
            "sector3": lap["Sector3Time"].total_seconds() if pd.notna(lap["Sector3Time"]) else None,
            "compound": lap["Compound"] if pd.notna(lap["Compound"]) else None,
            "tyre_life": int(lap["TyreLife"]) if pd.notna(lap["TyreLife"]) else None,
            "position": int(lap["Position"]) if pd.notna(lap["Position"]) else None,
        })
    return output


def get_driver_telemetry(year: int, round_num: int, driver_code: str) -> dict:
    """Fetch telemetry data for a specific driver's fastest lap."""
    session = _load_session(year, round_num, "R")
    laps = session.laps
    driver_laps = laps.pick_driver(driver_code)
    fastest = driver_laps.pick_fastest()
    telemetry = fastest.get_telemetry()
    tel_data = []
    # Sample every 5th point to reduce payload size
    for i, (_, t) in enumerate(telemetry.iterrows()):
        if i % 5 != 0:
            continue
        tel_data.append({
            "distance": float(t["Distance"]) if pd.notna(t["Distance"]) else None,
            "speed": float(t["Speed"]) if pd.notna(t["Speed"]) else None,
            "throttle": float(t["Throttle"]) if pd.notna(t["Throttle"]) else None,
            "brake": bool(t["Brake"]) if pd.notna(t["Brake"]) else None,
            "gear": int(t["nGear"]) if pd.notna(t["nGear"]) else None,
            "rpm": int(t["RPM"]) if pd.notna(t["RPM"]) else None,
            "drs": int(t["DRS"]) if pd.notna(t["DRS"]) else None,
        })
    return {
        "driver": driver_code,
        "lap_time": str(fastest["LapTime"]),
        "lap_number": int(fastest["LapNumber"]),
        "compound": fastest["Compound"],
        "telemetry": tel_data,
    }


def get_tire_strategy(year: int, round_num: int) -> list:
    """Fetch tire strategy data for all drivers."""
    session = _load_session(year, round_num, "R")
    laps = session.laps
    strategies = []
    for driver in session.drivers:
        d_laps = laps.pick_driver(driver)
        if d_laps.empty:
            continue
        info = session.get_driver(driver)
        first = info.get("FirstName", "")
        last = info.get("LastName", "")
        stints = []
        for stint_num, stint_laps in d_laps.groupby("Stint"):
            first_lap = stint_laps.iloc[0]
            stints.append({
                "stint": int(stint_num),
                "compound": first_lap["Compound"] if pd.notna(first_lap["Compound"]) else "UNKNOWN",
                "laps": len(stint_laps),
                "start_lap": int(stint_laps["LapNumber"].min()),
                "end_lap": int(stint_laps["LapNumber"].max()),
            })
        strategies.append({
            "driver": info["Abbreviation"],
            "full_name": first + " " + last,
            "team": info["TeamName"],
            "stints": stints,
        })
    return strategies
