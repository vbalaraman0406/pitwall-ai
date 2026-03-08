import React from 'react';
import { Link } from 'react-router-dom';

const COUNTRY_FLAGS = {
  'Australia': '🇦🇺', 'China': '🇨🇳', 'Japan': '🇯🇵',
  'Bahrain': '🇧🇭', 'Saudi Arabia': '🇸🇦', 'USA': '🇺🇸',
  'Italy': '🇮🇹', 'Monaco': '🇲🇨', 'Spain': '🇪🇸',
  'Canada': '🇨🇦', 'Austria': '🇦🇹', 'United Kingdom': '🇬🇧',
  'Belgium': '🇧🇪', 'Hungary': '🇭🇺', 'Netherlands': '🇳🇱',
  'Azerbaijan': '🇦🇿', 'Singapore': '🇸🇬', 'Mexico': '🇲🇽',
  'Brazil': '🇧🇷', 'Qatar': '🇶🇦', 'UAE': '🇦🇪',
};

/**
 * @description Card component displaying race info with country flag,
 * circuit name, date, and link to race detail page.
 * @param {Object} props
 * @param {Object} props.race - Race data object
 * @param {number} props.year - Season year
 */
export default function RaceCard({ race, year = 2026 }) {
  const flag = COUNTRY_FLAGS[race.country] || '🏁';
  const date = new Date(race.raceDate);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <Link to={`/race/${year}/${race.round}`} className="card block group cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{flag}</span>
        <span className="text-xs font-mono text-f1-muted bg-f1-dark px-2 py-1 rounded">
          R{String(race.round).padStart(2, '0')}
        </span>
      </div>
      <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-f1-red transition-colors">
        {race.raceName}
      </h3>
      <p className="text-f1-muted text-sm mb-2">{race.circuitName}</p>
      <div className="flex items-center justify-between">
        <span className="text-f1-muted text-xs">{race.city}, {race.country}</span>
        <span className="text-f1-red text-sm font-semibold">{dateStr}</span>
      </div>
    </Link>
  );
}
