"""Pydantic models for Pitwall.ai API responses."""
from typing import Optional, List
from pydantic import BaseModel

class RaceResult(BaseModel):
    position: int
    driver_number: str
    driver_name: str
    driver_code: str
    team: str
    grid_position: int
    time: Optional[str] = None
    status: str
    points: float

class DriverLap(BaseModel):
    driver: str
    driver_number: Optional[str] = None
    lap_number: int
    lap_time: Optional[float] = None
    sector1: Optional[float] = None
    sector2: Optional[float] = None
    sector3: Optional[float] = None
    speed_i1: Optional[float] = None
    speed_i2: Optional[float] = None
    speed_fl: Optional[float] = None
    speed_st: Optional[float] = None
    compound: Optional[str] = None
    tyre_life: Optional[int] = None
    fresh_tyre: Optional[bool] = None
    stint: Optional[int] = None
    is_personal_best: Optional[bool] = None

class TelemetryPoint(BaseModel):
    distance: float
    speed: float
    throttle: float
    brake: float
    gear: int
    rpm: Optional[int] = None
    drs: Optional[int] = None
    x: Optional[float] = None
    y: Optional[float] = None
    z: Optional[float] = None

class TireStrategy(BaseModel):
    driver: str
    stint: int
    compound: str
    stint_start_lap: int
    stint_end_lap: int
    total_laps: int

class SessionSummary(BaseModel):
    year: int
    round_number: int
    event_name: str
    country: str
    location: str
    session_type: str
    date: Optional[str] = None

class DriverStats(BaseModel):
    driver: str
    year: int
    races: int
    wins: int
    podiums: int
    poles: int
    points: float
    avg_finish: float
    avg_grid: float
    dnfs: int
    fastest_laps: int

class EventInfo(BaseModel):
    round_number: int
    country: str
    location: str
    event_name: str
    event_date: Optional[str] = None
    event_format: Optional[str] = None

class DriverInfo(BaseModel):
    driver_number: str
    broadcast_name: str
    abbreviation: str
    team_name: str

class ComparisonResponse(BaseModel):
    drivers: List[DriverStats]
