import React from 'react';
import { useParams } from 'react-router-dom';
import LapTimeChart from '../components/LapTimeChart';
import TireStrategyBar from '../components/TireStrategyBar';

/** Sample race results for standalone rendering */
const SAMPLE_RESULTS = [
  { pos: 1, driver: 'VER', name: 'Max Verstappen', team: 'Red Bull Racing', time: '1:28:45.123', gap: 'WINNER', points: 25, teamColor: '#3671C6' },
  { pos: 2, driver: 'NOR', name: 'Lando Norris', team: 'McLaren', time: '+3.456s', gap: '+3.456s', points: 18, teamColor: '#FF8000' },
  { pos: 3, driver: 'LEC', name: 'Charles Leclerc', team: 'Ferrari', time: '+8.912s', gap: '+8.912s', points: 15, teamColor: '#E8002D' },
  { pos: 4, driver: 'HAM', name: 'Lewis Hamilton', team: 'Ferrari', time: '+12.345s', gap: '+12.345s', points: 12, teamColor: '#E8002D' },
  { pos: 5, driver: 'PIA', name: 'Oscar Piastri', team: 'McLaren', time: '+15.678s', gap: '+15.678s', points: 10, teamColor: '#FF8000' },
  { pos: 6, driver: 'RUS', name: 'George Russell', team: 'Mercedes', time: '+22.111s', gap: '+22.111s', points: 8, teamColor: '#27F4D2' },
  { pos: 7, driver: 'SAI', name: 'Carlos Sainz', team: 'Williams', time: '+28.456s', gap: '+28.456s', points: 6, teamColor: '#64C4FF' },
  { pos: 8, driver: 'ALO', name: 'Fernando Alonso', team: 'Aston Martin', time: '+35.789s', gap: '+35.789s', points: 4, teamColor: '#229971' },
  { pos: 9, driver: 'GAS', name: 'Pierre Gasly', team: 'Alpine', time: '+42.012s', gap: '+42.012s', points: 2, teamColor: '#FF87BC' },
  { pos: 10, driver: 'TSU', name: 'Yuki Tsunoda', team: 'RB', time: '+48.345s', gap: '+48.345s', points: 1, teamColor: '#6692FF' },
];

/** Sample sector times */
const SAMPLE_SECTORS = [
  { driver: 'VER', s1: 28.123, s2: 33.456, s3: 16.789, best: true },
  { driver: 'NOR', s1: 28.234, s2: 33.567, s3: 16.890, best: false },
  { driver: 'LEC', s1: 28.345, s2: 33.234, s3: 17.012, best: false },
  { driver: 'HAM', s1: 28.456, s2: 33.678, s3: 16.934, best: false },
  { driver: 'PIA', s1: 28.567, s2: 33.789, s3: 17.123, best: false },
];

/**
 * @description Full race analysis page with results table, lap chart,
 * tire strategy visualization, and sector time breakdown.
 */
export default function RaceDetail() {
  const { year, round } = useParams();

  return (
    <div>
      <div className="mb-8">
        <p className="text-f1-muted text-sm mb-1">Season {year} • Round {round}</p>
        <h2 className="text-3xl font-bold text-white">Race Analysis</h2>
      </div>

      {/* Results Table */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Race Results</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-2 text-f1-muted font-medium">POS</th>
                <th className="text-left py-3 px-2 text-f1-muted font-medium">DRIVER</th>
                <th className="text-left py-3 px-2 text-f1-muted font-medium">TEAM</th>
                <th className="text-right py-3 px-2 text-f1-muted font-medium">TIME/GAP</th>
                <th className="text-right py-3 px-2 text-f1-muted font-medium">PTS</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_RESULTS.map((r) => (
                <tr key={r.pos} className="border-b border-gray-800/50 hover:bg-f1-dark/50">
                  <td className="py-3 px-2">
                    <span className={`font-bold ${
                      r.pos === 1 ? 'text-yellow-400' :
                      r.pos === 2 ? 'text-gray-300' :
                      r.pos === 3 ? 'text-amber-600' : 'text-white'
                    }`}>P{r.pos}</span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 rounded-full" style={{ backgroundColor: r.teamColor }} />
                      <div>
                        <p className="text-white font-semibold">{r.name}</p>
                        <p className="text-f1-muted text-xs">{r.driver}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-f1-muted">{r.team}</td>
                  <td className="py-3 px-2 text-right font-mono text-white">{r.gap}</td>
                  <td className="py-3 px-2 text-right font-bold text-f1-red">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <LapTimeChart />
        <TireStrategyBar />
      </div>

      {/* Sector Times */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Best Sector Times</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-2 text-f1-muted">DRIVER</th>
                <th className="text-right py-3 px-2 text-f1-muted">SECTOR 1</th>
                <th className="text-right py-3 px-2 text-f1-muted">SECTOR 2</th>
                <th className="text-right py-3 px-2 text-f1-muted">SECTOR 3</th>
                <th className="text-right py-3 px-2 text-f1-muted">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_SECTORS.map((s) => (
                <tr key={s.driver} className={`border-b border-gray-800/50 ${s.best ? 'bg-purple-900/20' : ''}`}>
                  <td className="py-3 px-2 text-white font-semibold">{s.driver}</td>
                  <td className="py-3 px-2 text-right font-mono text-white">{s.s1.toFixed(3)}</td>
                  <td className="py-3 px-2 text-right font-mono text-white">{s.s2.toFixed(3)}</td>
                  <td className="py-3 px-2 text-right font-mono text-white">{s.s3.toFixed(3)}</td>
                  <td className="py-3 px-2 text-right font-mono text-f1-red font-bold">{(s.s1 + s.s2 + s.s3).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
