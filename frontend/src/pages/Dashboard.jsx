import React from 'react';
import Navbar from '../components/Navbar';
import RaceCard from '../components/RaceCard';
import LapTimeChart from '../components/LapTimeChart';
import DriverComparison from '../components/DriverComparison';

/** 2026 F1 Calendar (imported inline for standalone rendering) */
const CALENDAR_2026 = [
  { round: 1, raceName: "Australian Grand Prix", circuitName: "Albert Park Circuit", country: "Australia", city: "Melbourne", raceDate: "2026-03-08" },
  { round: 2, raceName: "Chinese Grand Prix", circuitName: "Shanghai International Circuit", country: "China", city: "Shanghai", raceDate: "2026-03-15" },
  { round: 3, raceName: "Japanese Grand Prix", circuitName: "Suzuka International Racing Course", country: "Japan", city: "Suzuka", raceDate: "2026-03-28" },
  { round: 4, raceName: "Bahrain Grand Prix", circuitName: "Bahrain International Circuit", country: "Bahrain", city: "Sakhir", raceDate: "2026-04-12" },
  { round: 5, raceName: "Saudi Arabian Grand Prix", circuitName: "Jeddah Corniche Circuit", country: "Saudi Arabia", city: "Jeddah", raceDate: "2026-04-19" },
  { round: 6, raceName: "Miami Grand Prix", circuitName: "Miami International Autodrome", country: "USA", city: "Miami", raceDate: "2026-05-03" },
  { round: 7, raceName: "Emilia Romagna Grand Prix", circuitName: "Autodromo Enzo e Dino Ferrari", country: "Italy", city: "Imola", raceDate: "2026-05-17" },
  { round: 8, raceName: "Monaco Grand Prix", circuitName: "Circuit de Monaco", country: "Monaco", city: "Monte Carlo", raceDate: "2026-05-24" },
  { round: 9, raceName: "Spanish Grand Prix", circuitName: "Circuit de Barcelona-Catalunya", country: "Spain", city: "Barcelona", raceDate: "2026-06-01" },
  { round: 10, raceName: "Canadian Grand Prix", circuitName: "Circuit Gilles Villeneuve", country: "Canada", city: "Montreal", raceDate: "2026-06-14" },
  { round: 11, raceName: "Austrian Grand Prix", circuitName: "Red Bull Ring", country: "Austria", city: "Spielberg", raceDate: "2026-06-28" },
  { round: 12, raceName: "British Grand Prix", circuitName: "Silverstone Circuit", country: "United Kingdom", city: "Silverstone", raceDate: "2026-07-05" },
  { round: 13, raceName: "Belgian Grand Prix", circuitName: "Circuit de Spa-Francorchamps", country: "Belgium", city: "Spa", raceDate: "2026-07-26" },
  { round: 14, raceName: "Hungarian Grand Prix", circuitName: "Hungaroring", country: "Hungary", city: "Budapest", raceDate: "2026-08-02" },
  { round: 15, raceName: "Dutch Grand Prix", circuitName: "Circuit Zandvoort", country: "Netherlands", city: "Zandvoort", raceDate: "2026-08-30" },
  { round: 16, raceName: "Italian Grand Prix", circuitName: "Autodromo Nazionale di Monza", country: "Italy", city: "Monza", raceDate: "2026-09-06" },
  { round: 17, raceName: "Azerbaijan Grand Prix", circuitName: "Baku City Circuit", country: "Azerbaijan", city: "Baku", raceDate: "2026-09-20" },
  { round: 18, raceName: "Singapore Grand Prix", circuitName: "Marina Bay Street Circuit", country: "Singapore", city: "Singapore", raceDate: "2026-10-04" },
  { round: 19, raceName: "United States Grand Prix", circuitName: "Circuit of the Americas", country: "USA", city: "Austin", raceDate: "2026-10-18" },
  { round: 20, raceName: "Mexican Grand Prix", circuitName: "Autodromo Hermanos Rodriguez", country: "Mexico", city: "Mexico City", raceDate: "2026-10-25" },
  { round: 21, raceName: "Brazilian Grand Prix", circuitName: "Autodromo Jose Carlos Pace", country: "Brazil", city: "Sao Paulo", raceDate: "2026-11-08" },
  { round: 22, raceName: "Las Vegas Grand Prix", circuitName: "Las Vegas Strip Circuit", country: "USA", city: "Las Vegas", raceDate: "2026-11-22" },
  { round: 23, raceName: "Qatar Grand Prix", circuitName: "Lusail International Circuit", country: "Qatar", city: "Lusail", raceDate: "2026-11-29" },
  { round: 24, raceName: "Abu Dhabi Grand Prix", circuitName: "Yas Marina Circuit", country: "UAE", city: "Abu Dhabi", raceDate: "2026-12-06" },
];

/**
 * @description Main dashboard page showing 2026 season calendar grid,
 * hero section with latest race result, lap time chart, and driver comparison.
 */
export default function Dashboard() {
  return (
    <div>
      <Navbar />

      {/* Hero Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          2026 Season <span className="text-f1-red">Dashboard</span>
        </h2>
        <p className="text-f1-muted">Track every race, analyze performance, predict outcomes.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <p className="stat-value">24</p>
          <p className="stat-label">Races</p>
        </div>
        <div className="card text-center">
          <p className="stat-value">10</p>
          <p className="stat-label">Teams</p>
        </div>
        <div className="card text-center">
          <p className="stat-value">20</p>
          <p className="stat-label">Drivers</p>
        </div>
        <div className="card text-center">
          <p className="stat-value text-f1-red">NEW</p>
          <p className="stat-label">2026 Regulations</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <LapTimeChart />
        <DriverComparison />
      </div>

      {/* Race Calendar Grid */}
      <h3 className="text-xl font-semibold text-white mb-4">2026 Race Calendar</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CALENDAR_2026.map((race) => (
          <RaceCard key={race.round} race={race} year={2026} />
        ))}
      </div>
    </div>
  );
}
