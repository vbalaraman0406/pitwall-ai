import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/** Sample lap time data for demo rendering */
const SAMPLE_DATA = Array.from({ length: 57 }, (_, i) => ({
  lap: i + 1,
  VER: 78.5 + Math.random() * 2 + (i === 20 || i === 40 ? 15 : 0),
  NOR: 78.8 + Math.random() * 2 + (i === 22 || i === 42 ? 15 : 0),
  LEC: 79.0 + Math.random() * 2 + (i === 18 || i === 38 ? 15 : 0),
}));

const DRIVER_COLORS = {
  VER: '#3671C6', NOR: '#FF8000', LEC: '#E8002D',
  HAM: '#E8002D', RUS: '#27F4D2', PIA: '#FF8000',
  SAI: '#64C4FF', ALO: '#229971', STR: '#229971',
};

/**
 * @description Recharts line chart displaying lap times for multiple drivers.
 * @param {Object} props
 * @param {Array} props.data - Array of lap time objects
 * @param {Array} props.drivers - Array of driver abbreviations to display
 */
export default function LapTimeChart({ data = SAMPLE_DATA, drivers = ['VER', 'NOR', 'LEC'] }) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-4">Lap Times</h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="lap" stroke="#6B7280" tick={{ fontSize: 11 }} label={{ value: 'Lap', position: 'insideBottom', offset: -5, fill: '#6B7280' }} />
          <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} domain={['auto', 'auto']} label={{ value: 'Time (s)', angle: -90, position: 'insideLeft', fill: '#6B7280' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1E1E2E', border: '1px solid #333', borderRadius: '8px' }}
            labelStyle={{ color: '#9CA3AF' }}
          />
          <Legend />
          {drivers.map((driver) => (
            <Line
              key={driver}
              type="monotone"
              dataKey={driver}
              stroke={DRIVER_COLORS[driver] || '#FFFFFF'}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
