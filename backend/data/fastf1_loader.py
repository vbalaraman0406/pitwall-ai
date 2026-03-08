"""FastF1 Data Loader for Pitwall.ai"""
import os, logging
from typing import Optional
import fastf1
import pandas as pd

logger = logging.getLogger(__name__)
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

def get_event_schedule(year: int) -> pd.DataFrame:
    schedule = fastf1.get_event_schedule(year)
    return schedule[schedule["RoundNumber"] > 0]

def _load_session(year: int, rnd: int, stype: str) -> fastf1.core.Session:
    session = fastf1.get_session(year, rnd, stype)
    session.load(telemetry=True, laps=True, weather=False, messages=False)
    return session

def get_session_results(year: int, rnd: int, stype: str = "R") -> pd.DataFrame:
    session = _load_session(year, rnd, stype)
    results = session.results
    if results is None or results.empty:
        return pd.DataFrame()
    cols = ["DriverNumber","BroadcastName","Abbreviation","TeamName","Position","ClassifiedPosition","GridPosition","Time","Status","Points"]
    available = [c for c in cols if c in results.columns]
    return results[available].reset_index(drop=True)

def get_lap_data(year: int, rnd: int, stype: str = "R", driver: Optional[str] = None) -> pd.DataFrame:
    session = _load_session(year, rnd, stype)
    laps = session.laps
    if laps is None or laps.empty:
        return pd.DataFrame()
    if driver:
        laps = laps.pick_drivers(driver)
    cols = ["Driver","DriverNumber","LapNumber","LapTime","Sector1Time","Sector2Time","Sector3Time","SpeedI1","SpeedI2","SpeedFL","SpeedST","Compound","TyreLife","FreshTyre","Stint","IsPersonalBest"]
    available = [c for c in cols if c in laps.columns]
    df = laps[available].copy()
    for col in ["LapTime","Sector1Time","Sector2Time","Sector3Time"]:
        if col in df.columns:
            df[col] = df[col].dt.total_seconds()
    return df.reset_index(drop=True)

def get_telemetry(year: int, rnd: int, driver: str, stype: str = "R", lap_number: Optional[int] = None) -> pd.DataFrame:
    session = _load_session(year, rnd, stype)
    laps = session.laps.pick_drivers(driver)
    if laps.empty:
        return pd.DataFrame()
    if lap_number is not None:
        lap = laps[laps["LapNumber"] == lap_number]
        if lap.empty:
            return pd.DataFrame()
        lap = lap.iloc[0]
    else:
        lap = laps.pick_fastest()
    telemetry = lap.get_telemetry()
    if telemetry is None or telemetry.empty:
        return pd.DataFrame()
    cols = ["Distance","Speed","Throttle","Brake","nGear","RPM","DRS","X","Y","Z"]
    available = [c for c in cols if c in telemetry.columns]
    return telemetry[available].reset_index(drop=True)

def get_tire_strategy(year: int, rnd: int, stype: str = "R") -> pd.DataFrame:
    session = _load_session(year, rnd, stype)
    laps = session.laps
    if laps is None or laps.empty:
        return pd.DataFrame()
    stints = (laps.groupby(["Driver","Stint","Compound"]).agg(StintStartLap=("LapNumber","min"),StintEndLap=("LapNumber","max"),TotalLaps=("LapNumber","count")).reset_index())
    return stints.sort_values(["Driver","Stint"]).reset_index(drop=True)

def get_race_results(year: int, rnd: int) -> pd.DataFrame:
    return get_session_results(year, rnd, "R")

def get_driver_season_stats(year: int, driver: str) -> dict:
    schedule = get_event_schedule(year)
    stats = {"driver": driver, "year": year, "races": 0, "wins": 0, "podiums": 0, "poles": 0, "points": 0.0, "avg_finish": 0.0, "avg_grid": 0.0, "dnfs": 0, "fastest_laps": 0}
    finishes, grids = [], []
    for _, event in schedule.iterrows():
        r = int(event["RoundNumber"])
        try:
            results = get_session_results(year, r, "R")
        except Exception:
            continue
        if results.empty:
            continue
        drv = results[results["Abbreviation"] == driver]
        if drv.empty:
            continue
        row = drv.iloc[0]
        stats["races"] += 1
        pos = row.get("Position")
        grid = row.get("GridPosition")
        pts = row.get("Points", 0)
        status = str(row.get("Status", ""))
        if pos is not None and not pd.isna(pos):
            pos = int(pos)
            finishes.append(pos)
            if pos == 1: stats["wins"] += 1
            if pos <= 3: stats["podiums"] += 1
        if grid is not None and not pd.isna(grid):
            grids.append(int(grid))
            if int(grid) == 1: stats["poles"] += 1
        stats["points"] += float(pts) if pts and not pd.isna(pts) else 0.0
        if "Finished" not in status and "+" not in status:
            stats["dnfs"] += 1
    if finishes: stats["avg_finish"] = round(sum(finishes)/len(finishes), 2)
    if grids: stats["avg_grid"] = round(sum(grids)/len(grids), 2)
    return stats

def get_drivers_comparison(year: int, drivers: list) -> list:
    return [get_driver_season_stats(year, d) for d in drivers]
