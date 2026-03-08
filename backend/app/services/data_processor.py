"""Data transformation utilities for Pitwall.ai."""
import pandas as pd
from typing import Any


def format_lap_time(td) -> str:
    """Format a timedelta lap time to M:SS.mmm string."""
    if pd.isna(td):
        return "--"
    total_seconds = td.total_seconds()
    minutes = int(total_seconds // 60)
    seconds = total_seconds % 60
    return f"{minutes}:{seconds:06.3f}"


def calculate_gap(leader_time, driver_time) -> str:
    """Calculate gap between two lap times."""
    if pd.isna(leader_time) or pd.isna(driver_time):
        return "--"
    gap = (driver_time - leader_time).total_seconds()
    if gap == 0:
        return "LEADER"
    return f"+{gap:.3f}s"


def extract_tire_strategy(laps_df: pd.DataFrame, driver: str) -> list[dict[str, Any]]:
    """Extract tire strategy (stints) for a driver."""
    driver_laps = laps_df[laps_df["Driver"] == driver]
    stints = (
        driver_laps.groupby(["Stint", "Compound"])
        .agg({
            "TyreLife": "max",
            "LapNumber": ["min", "max"],
        })
        .reset_index()
    )
    stints.columns = ["stint", "compound", "tyreLife", "startLap", "endLap"]
    return stints.to_dict(orient="records")


def aggregate_sector_times(laps_df: pd.DataFrame, driver: str) -> dict[str, Any]:
    """Get best and average sector times for a driver."""
    driver_laps = laps_df[laps_df["Driver"] == driver]
    accurate = driver_laps[driver_laps["IsAccurate"] == True]

    def _sec(td):
        return td.total_seconds() if pd.notna(td) else None

    return {
        "bestSector1": _sec(accurate["Sector1Time"].min()),
        "bestSector2": _sec(accurate["Sector2Time"].min()),
        "bestSector3": _sec(accurate["Sector3Time"].min()),
        "avgSector1": _sec(accurate["Sector1Time"].mean()),
        "avgSector2": _sec(accurate["Sector2Time"].mean()),
        "avgSector3": _sec(accurate["Sector3Time"].mean()),
    }


COMPOUND_COLORS = {
    "SOFT": "#FF3333",
    "MEDIUM": "#FFD700",
    "HARD": "#FFFFFF",
    "INTERMEDIATE": "#39B54A",
    "WET": "#0067FF",
}
