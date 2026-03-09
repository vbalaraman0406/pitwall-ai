import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRaces } from '../api';

interface Race {
  round: number;
  raceName: string;
  date: string;
  Circuit?: { circuitName?: string };
}

export default function Dashboard() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year] = useState(2024);

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getRaces(year);
        if (Array.isArray(data)) {
          setRaces(data);
        } else {
          setRaces([]);
          console.warn('getRaces returned non-array:', data);
        }
      } catch (err: any) {
        console.error('Failed to fetch races:', err);
        setError(err?.message || 'Failed to fetch races');
        setRaces([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRaces();
  }, [year]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          <span className="text-pitwall-accent">PITWALL</span>.ai
        </h1>
        <p className="text-pitwall-text-muted text-lg">F1 Analytics Dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-pitwall-card rounded-lg p-6 border border-pitwall-border">
          <p className="text-pitwall-text-muted text-sm">Season</p>
          <p className="text-3xl font-bold text-white">{year}</p>
        </div>
        <div className="bg-pitwall-card rounded-lg p-6 border border-pitwall-border">
          <p className="text-pitwall-text-muted text-sm">Races</p>
          <p className="text-3xl font-bold text-white">{races.length}</p>
        </div>
        <div className="bg-pitwall-card rounded-lg p-6 border border-pitwall-border">
          <p className="text-pitwall-text-muted text-sm">Status</p>
          <p className="text-3xl font-bold text-green-400">{loading ? 'Loading...' : 'Live'}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-400">API Error: {error}</p>
          <p className="text-pitwall-text-muted text-sm mt-1">The dashboard will show cached data when available.</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-pitwall-text-muted text-lg">Loading race data...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {races.length > 0 ? races.map((race) => (
            <Link
              key={race.round}
              to={`/race/${year}/${race.round}`}
              className="bg-pitwall-card rounded-lg p-5 border border-pitwall-border hover:border-pitwall-accent transition-colors group"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-pitwall-accent font-mono text-sm">R{String(race.round).padStart(2, '0')}</span>
                <span className="text-pitwall-text-muted text-xs">{race.date}</span>
              </div>
              <h3 className="text-white font-semibold text-lg group-hover:text-pitwall-accent transition-colors">
                {race.raceName}
              </h3>
              <p className="text-pitwall-text-muted text-sm mt-1">
                {race.Circuit?.circuitName || 'Circuit TBD'}
              </p>
            </Link>
          )) : (
            <div className="col-span-full text-center py-10">
              <p className="text-pitwall-text-muted text-lg">No race data available for {year}</p>
              <p className="text-pitwall-text-muted text-sm mt-2">The FastF1 API may be loading. Try refreshing in a moment.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
