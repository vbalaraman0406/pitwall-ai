import React, { useState } from 'react';

const TEAM_COLORS = {
  'Red Bull Racing': '#3671C6', 'McLaren': '#FF8000', 'Ferrari': '#E8002D',
  'Mercedes': '#27F4D2', 'Aston Martin': '#229971', 'Alpine': '#FF87BC',
  'Williams': '#64C4FF', 'RB': '#6692FF', 'Sauber': '#52E252', 'Haas': '#B6BABD',
};

/** Sample driver grid data */
const DRIVERS = [
  { code: 'VER', name: 'Max Verstappen', team: 'Red Bull Racing', number: 1, country: 'NED', points: 187, wins: 4, podiums: 8 },
  { code: 'NOR', name: 'Lando Norris', team: 'McLaren', number: 4, country: 'GBR', points: 171, wins: 3, podiums: 7 },
  { code: 'LEC', name: 'Charles Leclerc', team: 'Ferrari', number: 16, country: 'MON', points: 155, wins: 2, podiums: 6 },
  { code: 'HAM', name: 'Lewis Hamilton', team: 'Ferrari', number: 44, country: 'GBR', points: 142, wins: 1, podiums: 5 },
  { code: 'PIA', name: 'Oscar Piastri', team: 'McLaren', number: 81, country: 'AUS', points: 138, wins: 2, podiums: 5 },
  { code: 'RUS', name: 'George Russell', team: 'Mercedes', number: 63, country: 'GBR', points: 120, wins: 1, podiums: 4 },
  { code: 'SAI', name: 'Carlos Sainz', team: 'Williams', number: 55, country: 'ESP', points: 98, wins: 0, podiums: 3 },
  { code: 'ALO', name: 'Fernando Alonso', team: 'Aston Martin', number: 14, country: 'ESP', points: 65, wins: 0, podiums: 1 },
  { code: 'ANT', name: 'Kimi Antonelli', team: 'Mercedes', number: 12, country: 'ITA', points: 58, wins: 0, podiums: 1 },
  { code: 'GAS', name: 'Pierre Gasly', team: 'Alpine', number: 10, country: 'FRA', points: 45, wins: 0, podiums: 0 },
  { code: 'TSU', name: 'Yuki Tsunoda', team: 'RB', number: 22, country: 'JPN', points: 42, wins: 0, podiums: 0 },
  { code: 'LAW', name: 'Liam Lawson', team: 'Red Bull Racing', number: 30, country: 'NZL', points: 38, wins: 0, podiums: 0 },
  { code: 'ALB', name: 'Alexander Albon', team: 'Williams', number: 23, country: 'THA', points: 35, wins: 0, podiums: 0 },
  { code: 'STR', name: 'Lance Stroll', team: 'Aston Martin', number: 18, country: 'CAN', points: 28, wins: 0, podiums: 0 },
  { code: 'HUL', name: 'Nico Hulkenberg', team: 'Sauber', number: 27, country: 'GER', points: 22, wins: 0, podiums: 0 },
  { code: 'OCO', name: 'Esteban Ocon', team: 'Haas', number: 31, country: 'FRA', points: 18, wins: 0, podiums: 0 },
  { code: 'BEA', name: 'Oliver Bearman', team: 'Haas', number: 87, country: 'GBR', points: 12, wins: 0, podiums: 0 },
  { code: 'DOO', name: 'Jack Doohan', team: 'Alpine', number: 7, country: 'AUS', points: 8, wins: 0, podiums: 0 },
  { code: 'BOR', name: 'Gabriel Bortoleto', team: 'Sauber', number: 5, country: 'BRA', points: 5, wins: 0, podiums: 0 },
  { code: 'HAD', name: 'Isack Hadjar', team: 'RB', number: 6, country: 'FRA', points: 3, wins: 0, podiums: 0 },
];

/**
 * @description Driver grid page with expandable stat cards for all 20 drivers.
 */
export default function Drivers() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Drivers</h2>
        <p className="text-f1-muted">2025 Season Driver Standings & Statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DRIVERS.map((driver, idx) => {
          const teamColor = TEAM_COLORS[driver.team] || '#666';
          const isExpanded = expanded === driver.code;
          return (
            <div
              key={driver.code}
              className="card cursor-pointer"
              onClick={() => setExpanded(isExpanded ? null : driver.code)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-10 rounded-full" style={{ backgroundColor: teamColor }} />
                  <div>
                    <p className="text-white font-bold text-lg">{driver.code}</p>
                    <p className="text-f1-muted text-xs">{driver.team}</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-f1-muted/30">#{driver.number}</span>
              </div>
              <p className="text-white font-semibold mb-1">{driver.name}</p>
              <p className="text-f1-muted text-xs mb-3">{driver.country}</p>

              <div className="flex gap-4">
                <div>
                  <p className="text-xl font-bold text-white">{driver.points}</p>
                  <p className="text-xs text-f1-muted">Points</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{driver.wins}</p>
                  <p className="text-xs text-f1-muted">Wins</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{driver.podiums}</p>
                  <p className="text-xs text-f1-muted">Podiums</p>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <p className="text-f1-muted text-sm">Championship Position: <span className="text-white font-bold">P{idx + 1}</span></p>
                  <p className="text-f1-muted text-sm mt-1">Points per Race: <span className="text-white font-bold">{(driver.points / 10).toFixed(1)}</span></p>
                  <p className="text-f1-muted text-sm mt-1">Win Rate: <span className="text-white font-bold">{((driver.wins / 10) * 100).toFixed(0)}%</span></p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
