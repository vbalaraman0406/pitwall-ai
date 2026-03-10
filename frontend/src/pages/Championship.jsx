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
  const [roundData, setRoundData] = useState([]); // per-round data for progress view
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('drivers');
  const [showProgress, setShowProgress] = useState(false);
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

      const completedRounds = sched.filter(r => r.date && new Date(r.date) < new Date()).map(r => r.round);
      if (completedRounds.length === 0) { setLoading(false); return; }

      const allData = await Promise.all(completedRounds.map(async (round) => {
        const [pred, actual] = await Promise.all([
          getPredictions(CURRENT_SEASON, round).catch(() => null),
          getRaceResults(CURRENT_SEASON, round).catch(() => null),
        ]);
        const roundName = sched.find(r => r.round === round)?.name || `R${round}`;
        return { round, roundName, pred, actual: actual?.results || [] };
      }));

      setRoundData(allData);

      // Aggregate driver standings
      const driverPts = {};
      let winnerHits = 0, podiumHits = 0, top5Hits = 0, totalR = 0;

      allData.forEach(({ round, roundName, pred, actual }) => {
        if (!actual.length) return;
        totalR++;
        const predWinner = pred?.predictions?.[0]?.driver;
        const actualWinner = actual[0]?.driver;
        if (predWinner === actualWinner) winnerHits++;

        pred?.predictions?.forEach(p => {
          if (!driverPts[p.driver]) driverPts[p.driver] = { driver: p.driver, name: p.name || p.driver, team: p.team, predicted: 0, actual: 0, rounds: [] };
          driverPts[p.driver].predicted += getPoints(p.position);
        });

        actual.forEach(r => {
          if (!driverPts[r.driver]) driverPts[r.driver] = { driver: r.driver, name: r.name || r.driver, team: r.team, predicted: 0, actual: 0, rounds: [] };
          driverPts[r.driver].actual += getPoints(r.position);
        });

        // Store per-round data for each driver
        Object.keys(driverPts).forEach(d => {
          const predP = pred?.predictions?.find(p => p.driver === d);
          const actP = actual.find(r => r.driver === d);
          const existing = driverPts[d].rounds.find(rr => rr.round === round);
          if (!existing) {
            driverPts[d].rounds.push({
              round, roundName,
              predPos: predP?.position || null,
              actPos: actP?.position || null,
              predPts: getPoints(predP?.position),
              actPts: getPoints(actP?.position),
            });
          }
        });

        const predPodium = pred?.predictions?.slice(0, 3).map(p => p.driver) || [];
        const actualPodium = actual.slice(0, 3).map(r => r.driver);
        predPodium.forEach(d => { if (actualPodium.includes(d)) podiumHits++; });
        const predTop5 = pred?.predictions?.slice(0, 5).map(p => p.driver) || [];
        const actualTop5 = actual.slice(0, 5).map(r => r.driver);
        predTop5.forEach(d => { if (actualTop5.includes(d)) top5Hits++; });
      });

      setAccuracy({ totalRaces: totalR, winnerCorrect: winnerHits, podiumCorrect: podiumHits, top5Correct: top5Hits });

      // Compute predicted position (rank by predicted points)
      const driverArr = Object.values(driverPts);
      const byPred = [...driverArr].sort((a, b) => b.predicted - a.predicted);
      byPred.forEach((d, i) => { d.predPos = i + 1; });
      const byActual = [...driverArr].sort((a, b) => b.actual - a.actual);
      byActual.forEach((d, i) => { d.actPos = i + 1; });
      setDriverStandings(byActual);

      // Constructor aggregation
      const teamPts = {};
      driverArr.forEach(d => {
        if (!d.team) return;
        if (!teamPts[d.team]) teamPts[d.team] = { team: d.team, predicted: 0, actual: 0, drivers: [] };
        teamPts[d.team].predicted += d.predicted;
        teamPts[d.team].actual += d.actual;
        teamPts[d.team].drivers.push(d);
      });
      const teamArr = Object.values(teamPts);
      const teamByPred = [...teamArr].sort((a, b) => b.predicted - a.predicted);
      teamByPred.forEach((t, i) => { t.predPos = i + 1; });
      const teamByActual = [...teamArr].sort((a, b) => b.actual - a.actual);
      teamByActual.forEach((t, i) => { t.actPos = i + 1; });
      setConstructorStandings(teamByActual);
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

  const PosDiff = ({ pred, actual }) => {
    if (!pred || !actual) return <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>—</span>;
    const diff = pred - actual;
    if (diff === 0) return <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace" }}>✓</span>;
    return (
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.7rem',
        color: diff > 0 ? '#22c55e' : '#ef4444',
      }}>
        {diff > 0 ? `↑${diff}` : `↓${Math.abs(diff)}`}
      </span>
    );
  };

  const PointsBar = ({ pred, actual, max }) => {
    const m = max || Math.max(pred, actual, 1);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '0.5rem', color: 'var(--text-dim)', width: '12px' }}>P</span>
          <div style={{ flex: 1, height: '5px', background: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(pred / m) * 100}%`, background: 'var(--accent-gold-dim)', borderRadius: '3px' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '0.5rem', color: 'var(--text-dim)', width: '12px' }}>A</span>
          <div style={{ flex: 1, height: '5px', background: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(actual / m) * 100}%`, background: '#22c55e', borderRadius: '3px' }} />
          </div>
        </div>
      </div>
    );
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

  const maxPts = driverStandings.length ? Math.max(...driverStandings.map(d => Math.max(d.predicted, d.actual))) : 1;
  const maxTeamPts = constructorStandings.length ? Math.max(...constructorStandings.map(t => Math.max(t.predicted, t.actual))) : 1;

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
          AI-predicted vs actual standings across {accuracy.totalRaces} completed round{accuracy.totalRaces !== 1 ? 's' : ''}.
          <span style={{ color: 'var(--accent-gold-dim)', fontWeight: 600 }}> Predicted positions are ranked by cumulative predicted points.</span>
        </p>
      </div>

      {/* Accuracy Cards */}
      <div className="mobile-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
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

      {/* Tab switcher + progress toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {['drivers', 'constructors'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'capitalize' }}>
            {tab === 'drivers' ? '🏎 Drivers' : '🏗️ Constructors'}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {activeTab === 'drivers' && (
          <button onClick={() => setShowProgress(!showProgress)}
            className={`tab-btn ${showProgress ? 'active' : ''}`}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', fontWeight: 600 }}>
            📊 Round-by-Round
          </button>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>
        <span><span style={{ color: 'var(--accent-gold-dim)' }}>■</span> PRED = AI Predicted</span>
        <span><span style={{ color: '#22c55e' }}>■</span> ACT = Actual Result</span>
        <span>↑ = Outperforming prediction</span>
        <span style={{ color: '#ef4444' }}>↓ = Underperforming prediction</span>
      </div>

      {/* Driver Standings */}
      {activeTab === 'drivers' && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>
            Driver Championship — Predicted vs Actual Positions
          </h3>
          <div className="mobile-scroll-x">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '55px' }}>ACT POS</th>
                  <th style={{ width: '55px' }}>PRED POS</th>
                  <th style={{ width: '35px' }}>DIFF</th>
                  <th>DRIVER</th>
                  <th>TEAM</th>
                  <th style={{ width: '65px' }}>PRED PTS</th>
                  <th style={{ width: '65px' }}>ACT PTS</th>
                  <th style={{ width: '55px' }}>PTS DIFF</th>
                  <th style={{ width: '110px' }}>COMPARISON</th>
                </tr>
              </thead>
              <tbody>
                {driverStandings.map((d, idx) => {
                  const ptsDiff = d.actual - d.predicted;
                  return (
                    <tr key={d.driver}>
                      <td>
                        <span className={`pos-badge ${idx < 3 ? `pos-${idx + 1}` : ''}`}
                          style={idx >= 3 ? { background: 'var(--bg-surface)', color: 'var(--text-secondary)' } : {}}>
                          {d.actPos}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '2rem', height: '2rem', borderRadius: '50%',
                          background: 'var(--accent-gold-soft)', border: '1px solid var(--accent-gold-dim)',
                          fontWeight: 900, fontSize: '0.8rem', fontFamily: "'JetBrains Mono', monospace",
                          color: 'var(--accent-gold-dim)',
                        }}>
                          {d.predPos}
                        </span>
                      </td>
                      <td><PosDiff pred={d.predPos} actual={d.actPos} /></td>
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
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--accent-gold-dim)' }}>{d.predicted}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, color: '#22c55e' }}>{d.actual}</td>
                      <td>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.75rem',
                          color: ptsDiff === 0 ? '#22c55e' : ptsDiff > 0 ? '#22c55e' : '#ef4444' }}>
                          {ptsDiff === 0 ? '—' : ptsDiff > 0 ? `+${ptsDiff}` : ptsDiff}
                        </span>
                      </td>
                      <td><PointsBar pred={d.predicted} actual={d.actual} max={maxPts} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Round-by-Round Progress */}
      {activeTab === 'drivers' && showProgress && driverStandings.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            📊 Round-by-Round Prediction Progress
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
            Showing predicted position vs actual position for each completed round. Green = correct or better, Red = worse than predicted.
          </p>
          <div className="mobile-scroll-x">
            <table className="data-table">
              <thead>
                <tr>
                  <th>DRIVER</th>
                  {roundData.map(r => (
                    <th key={r.round} style={{ textAlign: 'center', fontSize: '0.55rem' }}>
                      {r.roundName?.replace(' Grand Prix', '').replace(' GP', '').substring(0, 6) || `R${r.round}`}
                    </th>
                  ))}
                  <th style={{ textAlign: 'center' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {driverStandings.slice(0, 15).map(d => (
                  <tr key={d.driver}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <div className="team-bar" style={{ background: TEAM_COLORS[d.team] || '#888' }} />
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.75rem' }}>{d.driver}</span>
                      </div>
                    </td>
                    {roundData.map(r => {
                      const rd = d.rounds?.find(rr => rr.round === r.round);
                      if (!rd || (!rd.predPos && !rd.actPos)) return <td key={r.round} style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.6rem' }}>—</td>;
                      const diff = (rd.predPos || 0) - (rd.actPos || 0);
                      return (
                        <td key={r.round} style={{ textAlign: 'center', padding: '0.25rem' }}>
                          <div style={{ fontSize: '0.6rem', fontFamily: "'JetBrains Mono', monospace" }}>
                            <span style={{ color: 'var(--accent-gold-dim)' }}>P{rd.predPos || '?'}</span>
                            <span style={{ color: 'var(--text-dim)', margin: '0 1px' }}>→</span>
                            <span style={{ color: '#22c55e', fontWeight: 700 }}>P{rd.actPos || '?'}</span>
                          </div>
                          {rd.predPos && rd.actPos && (
                            <span style={{
                              fontSize: '0.5rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                              color: diff === 0 ? '#22c55e' : diff > 0 ? '#22c55e' : '#ef4444',
                            }}>
                              {diff === 0 ? '✓' : diff > 0 ? `↑${diff}` : `↓${Math.abs(diff)}`}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.6rem', fontFamily: "'JetBrains Mono', monospace" }}>
                        <span style={{ color: 'var(--accent-gold-dim)', fontWeight: 700 }}>{d.predicted}</span>
                        <span style={{ color: 'var(--text-dim)' }}> / </span>
                        <span style={{ color: '#22c55e', fontWeight: 900 }}>{d.actual}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Constructor Standings */}
      {activeTab === 'constructors' && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>
            Constructor Championship — Predicted vs Actual Positions
          </h3>
          <div className="mobile-scroll-x">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '55px' }}>ACT POS</th>
                  <th style={{ width: '55px' }}>PRED POS</th>
                  <th style={{ width: '35px' }}>DIFF</th>
                  <th>CONSTRUCTOR</th>
                  <th style={{ width: '65px' }}>PRED PTS</th>
                  <th style={{ width: '65px' }}>ACT PTS</th>
                  <th style={{ width: '55px' }}>PTS DIFF</th>
                  <th style={{ width: '110px' }}>COMPARISON</th>
                  <th>DRIVERS</th>
                </tr>
              </thead>
              <tbody>
                {constructorStandings.map((t, idx) => {
                  const ptsDiff = t.actual - t.predicted;
                  return (
                    <tr key={t.team}>
                      <td>
                        <span className={`pos-badge ${idx < 3 ? `pos-${idx + 1}` : ''}`}
                          style={idx >= 3 ? { background: 'var(--bg-surface)', color: 'var(--text-secondary)' } : {}}>
                          {t.actPos}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '2rem', height: '2rem', borderRadius: '50%',
                          background: 'var(--accent-gold-soft)', border: '1px solid var(--accent-gold-dim)',
                          fontWeight: 900, fontSize: '0.8rem', fontFamily: "'JetBrains Mono', monospace",
                          color: 'var(--accent-gold-dim)',
                        }}>
                          {t.predPos}
                        </span>
                      </td>
                      <td><PosDiff pred={t.predPos} actual={t.actPos} /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="team-bar" style={{ background: TEAM_COLORS[t.team] || '#888' }} />
                          <span style={{ fontWeight: 700 }}>{t.team}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--accent-gold-dim)' }}>{t.predicted}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, color: '#22c55e' }}>{t.actual}</td>
                      <td>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.75rem',
                          color: ptsDiff === 0 ? '#22c55e' : ptsDiff > 0 ? '#22c55e' : '#ef4444' }}>
                          {ptsDiff === 0 ? '—' : ptsDiff > 0 ? `+${ptsDiff}` : ptsDiff}
                        </span>
                      </td>
                      <td><PointsBar pred={t.predicted} actual={t.actual} max={maxTeamPts} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                          {t.drivers.map(d => (
                            <span key={d.driver} style={{ fontSize: '0.65rem', fontFamily: "'JetBrains Mono', monospace", padding: '0.15rem 0.4rem',
                              background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
                              {d.driver} <span style={{ color: '#22c55e' }}>{d.actual}</span><span style={{ color: 'var(--text-dim)' }}>/</span><span style={{ color: 'var(--accent-gold-dim)' }}>{d.predicted}</span>
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
        </div>
      )}
    </div>
  );
}
