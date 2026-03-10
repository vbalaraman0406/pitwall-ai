import React, { useState, useEffect } from 'react';
import { getRaceSchedule, getPredictions, getRaceResults, getDriverPhotos } from '../api';
import { CURRENT_SEASON } from '../constants';

const POINTS_MAP = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const getPoints = (pos) => pos && pos <= 10 ? POINTS_MAP[pos - 1] : 0;

export default function Championship() {
  const [schedule, setSchedule] = useState([]);
  const [photos, setPhotos] = useState({});
  const [driverStandings, setDriverStandings] = useState([]);
  const [constructorStandings, setConstructorStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('drivers');
  const [accuracy, setAccuracy] = useState({ totalRaces: 0, winnerCorrect: 0, podiumCorrect: 0, top5Correct: 0 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [sched, photoData] = await Promise.all([
        getRaceSchedule(CURRENT_SEASON),
        getDriverPhotos(),
      ]);
      if (photoData) setPhotos(photoData);
      if (!Array.isArray(sched)) { setLoading(false); return; }
      setSchedule(sched);

      // Find completed races
      const completedRounds = sched.filter(r => r.date && new Date(r.date) < new Date()).map(r => r.round);
      if (completedRounds.length === 0) { setLoading(false); return; }

      // Fetch all predictions + actual results
      const allData = await Promise.all(completedRounds.map(async (round) => {
        const [pred, actual] = await Promise.all([
          getPredictions(CURRENT_SEASON, round).catch(() => null),
          getRaceResults(CURRENT_SEASON, round).catch(() => null),
        ]);
        return { round, pred, actual: actual?.results || [] };
      }));

      // Aggregate driver standings
      const driverPts = {}; // { driver: { predicted: N, actual: N, team, name } }
      let winnerHits = 0, podiumHits = 0, top5Hits = 0, totalR = 0;

      allData.forEach(({ pred, actual }) => {
        if (!actual.length) return;
        totalR++;
        const predWinner = pred?.predictions?.[0]?.driver;
        const actualWinner = actual[0]?.driver;
        if (predWinner === actualWinner) winnerHits++;

        // Predicted positions
        pred?.predictions?.forEach(p => {
          if (!driverPts[p.driver]) driverPts[p.driver] = { driver: p.driver, name: p.name || p.driver, team: p.team, predicted: 0, actual: 0 };
          driverPts[p.driver].predicted += getPoints(p.position);
        });

        // Actual positions
        actual.forEach(r => {
          if (!driverPts[r.driver]) driverPts[r.driver] = { driver: r.driver, name: r.name || r.driver, team: r.team, predicted: 0, actual: 0 };
          driverPts[r.driver].actual += getPoints(r.position);
        });

        // Podium and top-5 accuracy
        const predPodium = pred?.predictions?.slice(0, 3).map(p => p.driver) || [];
        const actualPodium = actual.slice(0, 3).map(r => r.driver);
        predPodium.forEach(d => { if (actualPodium.includes(d)) podiumHits++; });
        const predTop5 = pred?.predictions?.slice(0, 5).map(p => p.driver) || [];
        const actualTop5 = actual.slice(0, 5).map(r => r.driver);
        predTop5.forEach(d => { if (actualTop5.includes(d)) top5Hits++; });
      });

      setAccuracy({ totalRaces: totalR, winnerCorrect: winnerHits, podiumCorrect: podiumHits, top5Correct: top5Hits });

      // Sort by actual points
      const driverArr = Object.values(driverPts).sort((a, b) => b.actual - a.actual);
      setDriverStandings(driverArr);

      // Constructor aggregation
      const teamPts = {};
      driverArr.forEach(d => {
        if (!d.team) return;
        if (!teamPts[d.team]) teamPts[d.team] = { team: d.team, predicted: 0, actual: 0, drivers: [] };
        teamPts[d.team].predicted += d.predicted;
        teamPts[d.team].actual += d.actual;
        teamPts[d.team].drivers.push(d);
      });
      setConstructorStandings(Object.values(teamPts).sort((a, b) => b.actual - a.actual));
      setLoading(false);
    };
    load();
  }, []);

  const getPhoto = (abbr) => photos[abbr]?.headshot_url || '';

  const TEAM_COLORS = {
    'McLaren': '#FF8000', 'Ferrari': '#E8002D', 'Red Bull Racing': '#3671C6', 'Mercedes': '#27F4D2',
    'Aston Martin': '#229971', 'Williams': '#64C4FF', 'Alpine': '#FF87BC', 'Haas F1 Team': '#B6BABD',
    'Racing Bulls': '#6692FF', 'Audi': '#990000', 'Cadillac': '#1E1E1E',
  };

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <p style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)', fontWeight: 700, letterSpacing: '0.15em' }}>
            {CURRENT_SEASON} SEASON TRACKER
          </p>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
            Championship <span style={{ color: 'var(--f1-red)' }}>Standings</span>
          </h1>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="f1-spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Aggregating results across all completed rounds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <p style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)', fontWeight: 700, letterSpacing: '0.15em' }}>
          {CURRENT_SEASON} SEASON TRACKER
        </p>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
          Championship <span style={{ color: 'var(--f1-red)' }}>Standings</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          Cumulative predicted vs actual standings across {accuracy.totalRaces} completed round{accuracy.totalRaces !== 1 ? 's' : ''}.
        </p>
      </div>

      {/* Accuracy Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'RACES COMPLETED', value: accuracy.totalRaces, sub: `/ ${schedule.length}`, color: 'var(--text-primary)' },
          { label: 'WINNER PREDICTED', value: accuracy.winnerCorrect, sub: `/ ${accuracy.totalRaces}`, color: accuracy.winnerCorrect > 0 ? '#22c55e' : '#ef4444' },
          { label: 'PODIUM HITS', value: accuracy.podiumCorrect, sub: `/ ${accuracy.totalRaces * 3}`, color: '#3b82f6' },
          { label: 'TOP-5 HITS', value: accuracy.top5Correct, sub: `/ ${accuracy.totalRaces * 5}`, color: 'var(--accent-gold-dim)' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <p style={{ fontSize: '0.6rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>{stat.label}</p>
            <p style={{ fontSize: '2rem', fontWeight: 900, color: stat.color, fontFamily: "'JetBrains Mono', monospace" }}>
              {stat.value}<span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>{stat.sub}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {['drivers', 'constructors'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'capitalize' }}>
            {tab === 'drivers' ? '🏎 Drivers' : '🏗️ Constructors'}
          </button>
        ))}
      </div>

      {/* Driver Standings */}
      {activeTab === 'drivers' && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>
            Driver Championship — Predicted vs Actual
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>POS</th>
                <th>DRIVER</th>
                <th>TEAM</th>
                <th>PRED PTS</th>
                <th>ACTUAL PTS</th>
                <th>DIFF</th>
                <th>ACCURACY</th>
              </tr>
            </thead>
            <tbody>
              {driverStandings.map((d, idx) => {
                const diff = d.actual - d.predicted;
                return (
                  <tr key={d.driver}>
                    <td>
                      <span className={`pos-badge ${idx < 3 ? `pos-${idx + 1}` : ''}`}
                        style={idx >= 3 ? { background: 'var(--bg-surface)', color: 'var(--text-secondary)' } : {}}>
                        {idx + 1}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getPhoto(d.driver) && <img src={getPhoto(d.driver)} alt={d.driver} style={{ width: '28px', height: '28px', borderRadius: '50%', border: `2px solid ${TEAM_COLORS[d.team] || '#888'}`, objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />}
                        <div>
                          <span style={{ fontWeight: 700 }}>{d.name}</span>
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)' }}>{d.driver}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <div className="team-bar" style={{ background: TEAM_COLORS[d.team] || '#888' }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d.team}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{d.predicted}</td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, color: '#22c55e' }}>{d.actual}</td>
                    <td>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.75rem',
                        color: diff === 0 ? '#22c55e' : diff > 0 ? '#22c55e' : '#ef4444' }}>
                        {diff === 0 ? '—' : diff > 0 ? `+${diff}` : diff}
                      </span>
                    </td>
                    <td>
                      {d.predicted > 0 && (
                        <div style={{ width: '60px', height: '6px', background: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, d.predicted > 0 ? (Math.min(d.actual, d.predicted) / Math.max(d.actual, d.predicted) * 100) : 0)}%`,
                            background: 'var(--f1-red)', borderRadius: '3px' }} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Constructor Standings */}
      {activeTab === 'constructors' && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>
            Constructor Championship — Predicted vs Actual
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>POS</th>
                <th>CONSTRUCTOR</th>
                <th>PRED PTS</th>
                <th>ACTUAL PTS</th>
                <th>DIFF</th>
                <th>DRIVERS</th>
              </tr>
            </thead>
            <tbody>
              {constructorStandings.map((t, idx) => {
                const diff = t.actual - t.predicted;
                return (
                  <tr key={t.team}>
                    <td>
                      <span className={`pos-badge ${idx < 3 ? `pos-${idx + 1}` : ''}`}
                        style={idx >= 3 ? { background: 'var(--bg-surface)', color: 'var(--text-secondary)' } : {}}>
                        {idx + 1}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="team-bar" style={{ background: TEAM_COLORS[t.team] || '#888' }} />
                        <span style={{ fontWeight: 700 }}>{t.team}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{t.predicted}</td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, color: '#22c55e' }}>{t.actual}</td>
                    <td>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.75rem',
                        color: diff === 0 ? '#22c55e' : diff > 0 ? '#22c55e' : '#ef4444' }}>
                        {diff === 0 ? '—' : diff > 0 ? `+${diff}` : diff}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                        {t.drivers.map(d => (
                          <span key={d.driver} style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", padding: '0.2rem 0.5rem',
                            background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
                            {d.driver} {d.actual}pts
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
