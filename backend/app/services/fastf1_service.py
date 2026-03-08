"""Core FastF1 wrapper service for Pitwall.ai."""
import fastf1
import pandas as pd
from typing import Any
from app.config import CACHE_DIR, CURRENT_SEASON


class FastF1Service:
    """Service class wrapping FastF1 library for F1 data access."""

    def __init__(self):
        """Initialize FastF1 with caching enabled."""
        fastf1.Cache.enable_cache(CACHE_DIR)

    def get_schedule(self, year: int) -> list[dict[str, Any]]:
        """Get the full race schedule for a season."""
        schedule = fastf1.get_event_schedule(year)
        races = []
        for _, event in schedule.iterrows():
            if event.get("EventFormat", "") == "testing":
                continue
            races.append({
                "round": int(event.get("RoundNumber", 0)),
                "raceName": str(event.get("EventName", "")),
                "country": str(event.get("Country", "")),
                "location": str(event.get("Location", "")),
                "eventDate": str(event.get("EventDate", "")),
                "eventFormat": str(event.get("EventFormat", "")),
            })
        return [r for r in races if r["round"] > 0]

    def _load_session(self, year: int, round_num: int, session_type: str):
        """Load a FastF1 session with data."""
        session = fastf1.get_session(year, round_num, session_type)
        session.load()
        return session

    def get_race_results(self, year: int, round_num: int) -> list[dict[str, Any]]:
        """Get race results for a specific round."""
        session = self._load_session(year, round_num, "R")
        results = session.results
        output = []
        for _, row in results.iterrows():
            output.append({
                "position": _safe_int(row.get("Position")),
                "driverNumber": str(row.get("DriverNumber", "")),
                "abbreviation": str(row.get("Abbreviation", "")),
                "fullName": str(row.get("FullName", "")),
                "team": str(row.get("TeamName", "")),
                "teamColor": str(row.get("TeamColor", "")),
                "gridPosition": _safe_int(row.get("GridPosition")),
                "status": str(row.get("Status", "")),
                "points": float(row.get("Points", 0)),
                "time": str(row.get("Time", "")),
            })
        return output

    def get_drivers(self, year: int) -> list[dict[str, Any]]:
        """Get all drivers for a season using Ergast API."""
        try:
            ergast = fastf1.ergast.Ergast()
            driver_info = ergast.get_driver_info(season=year)
            df = driver_info.content[0]
            drivers = []
            for _, row in df.iterrows():
                drivers.append({
                    "driverId": str(row.get("driverId", "")),
                    "givenName": str(row.get("givenName", "")),
                    "familyName": str(row.get("familyName", "")),
                    "nationality": str(row.get("nationality", "")),
                    "permanentNumber": str(row.get("permanentNumber", "")),
                    "code": str(row.get("code", "")),
                })
            return drivers
        except Exception:
            return []

    def get_driver_stats(self, driver_id: str, year: int) -> dict[str, Any]:
        """Get aggregated season stats for a driver."""
        try:
            ergast = fastf1.ergast.Ergast()
            standings = ergast.get_driver_standings(season=year)
            df = standings.content[0]
            driver_row = df[df["driverId"] == driver_id]
            if driver_row.empty:
                return {"error": "Driver not found in standings"}
            row = driver_row.iloc[0]
            return {
                "position": int(row.get("position", 0)),
                "points": float(row.get("points", 0)),
                "wins": int(row.get("wins", 0)),
                "driverId": driver_id,
            }
        except Exception as e:
            return {"error": str(e)}

    def get_telemetry(
        self, year: int, round_num: int, session_type: str, driver: str
    ) -> dict[str, Any]:
        """Get telemetry data for a driver in a session."""
        session = self._load_session(year, round_num, session_type)
        laps = session.laps.pick_drivers(driver)

        # Get fastest lap telemetry
        fastest = laps.pick_fastest()
        telemetry = fastest.get_telemetry()

        # Downsample telemetry to reduce payload size (every 5th point)
        sampled = telemetry.iloc[::5]

        lap_times = []
        for _, lap in laps.iterrows():
            lt = lap.get("LapTime")
            lap_times.append({
                "lapNumber": int(lap.get("LapNumber", 0)),
                "lapTime": str(lt) if pd.notna(lt) else None,
                "lapTimeSeconds": lt.total_seconds() if pd.notna(lt) else None,
                "sector1": _td_to_seconds(lap.get("Sector1Time")),
                "sector2": _td_to_seconds(lap.get("Sector2Time")),
                "sector3": _td_to_seconds(lap.get("Sector3Time")),
                "compound": str(lap.get("Compound", "")),
                "tyreLife": _safe_float(lap.get("TyreLife")),
                "position": _safe_int(lap.get("Position")),
            })

        return {
            "lapTimes": lap_times,
            "fastestLap": {
                "lapNumber": int(fastest.get("LapNumber", 0)),
                "lapTime": str(fastest.get("LapTime", "")),
                "compound": str(fastest.get("Compound", "")),
            },
            "telemetrySample": {
                "speed": sampled["Speed"].tolist(),
                "throttle": sampled["Throttle"].tolist(),
                "brake": sampled["Brake"].astype(int).tolist(),
                "gear": sampled["nGear"].tolist(),
                "rpm": sampled["RPM"].tolist(),
                "drs": sampled["DRS"].tolist(),
                "distance": sampled["Distance"].tolist() if "Distance" in sampled.columns else [],
            },
        }


def _safe_int(val) -> int:
    """Safely convert to int."""
    try:
        if pd.isna(val):
            return 0
        return int(val)
    except (ValueError, TypeError):
        return 0


def _safe_float(val) -> float:
    """Safely convert to float."""
    try:
        if pd.isna(val):
            return 0.0
        return float(val)
    except (ValueError, TypeError):
        return 0.0


def _td_to_seconds(val) -> float | None:
    """Convert timedelta to seconds."""
    try:
        if pd.isna(val):
            return None
        return val.total_seconds()
    except (AttributeError, TypeError):
        return None
