import React from 'react';

const TEAM_COLORS = {
  'Red Bull Racing': '#3671C6', 'McLaren': '#FF8000', 'Ferrari': '#E8002D',
  'Mercedes': '#27F4D2', 'Aston Martin': '#229971', 'Alpine': '#FF87BC',
  'Williams': '#64C4FF', 'RB': '#6692FF', 'Sauber': '#52E252',
  'Haas': '#B6BABD',
};

/** Sample prediction data */
const SAMPLE_PREDICTIONS = [
  { position: 1, driver: 'VER', name: 'Max Verstappen', team: 'Red Bull Racing', confidence: 89.2 },
  { position: 2, driver: 'NOR', name: 'Lando Norris', team: 'McLaren', confidence: 85.7 },
  { position: 3, driver: 'LEC', name: 'Charles Leclerc', team: 'Ferrari', confidence: 82.1 },
  { position: 4, driver: 'HAM', name: 'Lewis Hamilton', team: 'Ferrari', confidence: 79.5 },
  { position: 5, driver: 'PIA', name: 'Oscar Piastri', team: 'McLaren', confidence: 76.3 },
  { position: 6, driver: 'RUS', name: 'George Russell', team: 'Mercedes', confidence: 73.8 },
  { position: 7, driver: 'SAI', name: 'Carlos Sainz', team: 'Williams', confidence: 70.2 },
  { position: 8, driver: 'ALO', name: 'Fernando Alonso', team: 'Aston Martin', confidence: 67.9 },
  { position: 9, driver: 'GAS', name: 'Pierre Gasly', team: 'Alpine', confidence: 64.1 },
  { position: 10, driver: 'TSU', name: 'Yuki Tsunoda', team: 'RB', confidence: 61.5 },
];

/**
 * @description Predicted finishing order card with confidence percentages.
 * @param {Object} props
 * @param {Array} props.predictions - Array of prediction objects
 * @param {string} props.raceName - Name of the race
 */
export default function PredictionCard({ predictions = SAMPLE_PREDICTIONS, raceName = 'Next Race' }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Predicted Order</h3>
        <span className="text-xs text-f1-muted bg-f1-dark px-2 py-1 rounded">AI Model v1.0</span>
      </div>
      <div className="space-y-2">
        {predictions.map((pred) => {
          const teamColor = TEAM_COLORS[pred.team] || '#666';
          return (
            <div key={pred.driver} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-f1-dark/50 transition-colors">
              <span className={`text-lg font-bold w-8 text-center ${
                pred.position === 1 ? 'text-yellow-400' :
                pred.position === 2 ? 'text-gray-300' :
                pred.position === 3 ? 'text-amber-600' : 'text-f1-muted'
              }`}>
                P{pred.position}
              </span>
              <div className="w-1 h-8 rounded-full" style={{ backgroundColor: teamColor }} />
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">{pred.name}</p>
                <p className="text-f1-muted text-xs">{pred.team}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-mono text-white">{pred.confidence}%</span>
                <div className="w-20 h-1.5 bg-f1-dark rounded-full mt-1">
                  <div className="h-full rounded-full" style={{ width: `${pred.confidence}%`, backgroundColor: teamColor }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
