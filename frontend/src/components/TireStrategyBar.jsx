import React from 'react';

const COMPOUND_COLORS = {
  SOFT: '#FF3333',
  MEDIUM: '#FFD700',
  HARD: '#FFFFFF',
  INTERMEDIATE: '#39B54A',
  WET: '#0067FF',
};

/** Sample tire strategy data */
const SAMPLE_STRATEGIES = [
  { driver: 'VER', stints: [{ compound: 'SOFT', laps: 18 }, { compound: 'HARD', laps: 22 }, { compound: 'MEDIUM', laps: 17 }] },
  { driver: 'NOR', stints: [{ compound: 'MEDIUM', laps: 22 }, { compound: 'HARD', laps: 20 }, { compound: 'SOFT', laps: 15 }] },
  { driver: 'LEC', stints: [{ compound: 'SOFT', laps: 15 }, { compound: 'MEDIUM', laps: 25 }, { compound: 'HARD', laps: 17 }] },
  { driver: 'HAM', stints: [{ compound: 'MEDIUM', laps: 20 }, { compound: 'HARD', laps: 25 }, { compound: 'SOFT', laps: 12 }] },
  { driver: 'PIA', stints: [{ compound: 'SOFT', laps: 16 }, { compound: 'HARD', laps: 28 }, { compound: 'MEDIUM', laps: 13 }] },
];

/**
 * @description Horizontal stacked bar chart showing tire compounds per stint.
 * @param {Object} props
 * @param {Array} props.strategies - Array of driver strategy objects
 */
export default function TireStrategyBar({ strategies = SAMPLE_STRATEGIES }) {
  const maxLaps = Math.max(...strategies.map(s => s.stints.reduce((sum, st) => sum + st.laps, 0)));

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-4">Tire Strategy</h3>
      <div className="space-y-3">
        {strategies.map((strategy) => {
          const totalLaps = strategy.stints.reduce((sum, st) => sum + st.laps, 0);
          return (
            <div key={strategy.driver} className="flex items-center gap-3">
              <span className="text-sm font-mono text-f1-muted w-10">{strategy.driver}</span>
              <div className="flex-1 flex h-7 rounded overflow-hidden">
                {strategy.stints.map((stint, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center text-xs font-bold"
                    style={{
                      width: `${(stint.laps / maxLaps) * 100}%`,
                      backgroundColor: COMPOUND_COLORS[stint.compound] || '#666',
                      color: stint.compound === 'HARD' || stint.compound === 'MEDIUM' ? '#000' : '#FFF',
                    }}
                    title={`${stint.compound}: ${stint.laps} laps`}
                  >
                    {stint.laps}
                  </div>
                ))}
              </div>
              <span className="text-xs text-f1-muted w-8 text-right">{totalLaps}L</span>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex gap-4 mt-4 pt-3 border-t border-gray-800">
        {Object.entries(COMPOUND_COLORS).map(([compound, color]) => (
          <div key={compound} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-f1-muted">{compound}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
