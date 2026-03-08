import React from 'react';

/** Sample driver comparison data */
const SAMPLE_DRIVERS = {
  driver1: {
    name: 'Max Verstappen', code: 'VER', team: 'Red Bull Racing', teamColor: '#3671C6',
    stats: { wins: 4, podiums: 8, poles: 5, fastestLaps: 3, points: 187, avgFinish: 2.1 },
  },
  driver2: {
    name: 'Lando Norris', code: 'NOR', team: 'McLaren', teamColor: '#FF8000',
    stats: { wins: 3, podiums: 7, poles: 3, fastestLaps: 2, points: 171, avgFinish: 2.8 },
  },
};

/**
 * @description Side-by-side driver stat comparison component.
 * @param {Object} props
 * @param {Object} props.driver1 - First driver data
 * @param {Object} props.driver2 - Second driver data
 */
export default function DriverComparison({ driver1 = SAMPLE_DRIVERS.driver1, driver2 = SAMPLE_DRIVERS.driver2 }) {
  const statKeys = [
    { key: 'wins', label: 'Wins' },
    { key: 'podiums', label: 'Podiums' },
    { key: 'poles', label: 'Poles' },
    { key: 'fastestLaps', label: 'Fastest Laps' },
    { key: 'points', label: 'Points' },
    { key: 'avgFinish', label: 'Avg Finish', lower: true },
  ];

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-6">Driver Comparison</h3>
      {/* Headers */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: driver1.teamColor + '33', color: driver1.teamColor }}>
            {driver1.code}
          </div>
          <p className="text-white font-semibold">{driver1.name}</p>
          <p className="text-f1-muted text-xs">{driver1.team}</p>
        </div>
        <span className="text-f1-muted text-2xl font-bold">VS</span>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: driver2.teamColor + '33', color: driver2.teamColor }}>
            {driver2.code}
          </div>
          <p className="text-white font-semibold">{driver2.name}</p>
          <p className="text-f1-muted text-xs">{driver2.team}</p>
        </div>
      </div>
      {/* Stats */}
      <div className="space-y-3">
        {statKeys.map(({ key, label, lower }) => {
          const v1 = driver1.stats[key];
          const v2 = driver2.stats[key];
          const winner1 = lower ? v1 < v2 : v1 > v2;
          const winner2 = lower ? v2 < v1 : v2 > v1;
          return (
            <div key={key} className="flex items-center justify-between py-2 border-b border-gray-800">
              <span className={`text-sm font-mono w-16 text-right ${winner1 ? 'text-green-400 font-bold' : 'text-f1-muted'}`}>{v1}</span>
              <span className="text-xs text-f1-muted uppercase tracking-wider">{label}</span>
              <span className={`text-sm font-mono w-16 ${winner2 ? 'text-green-400 font-bold' : 'text-f1-muted'}`}>{v2}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
