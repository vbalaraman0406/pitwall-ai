import React, { useState, useEffect } from 'react';
import { getPredictions, getQualifyingPredictions, getSprintPredictions, getRaceSchedule, getDriverPhotos, getRaceResults, getQualifyingResults } from '../api';
import { CURRENT_SEASON } from '../constants';

const SESSION_TYPES = [
  { key: 'qualifying', label: '⏱ Qualifying', icon: '⏱' },
  { key: 'sprint', label: '🏃 Sprint', icon: '🏃' },
  { key: 'race', label: '🏁 Race', icon: '🏁' },
];

export default function Predictions() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState(1);
  const [sessionType, setSessionType] = useState('race');
  const [schedule, setSchedule] = useState([]);
  const [photos, setPhotos] = useState({});
  const [actualResults, setActualResults] = useState(null);

  useEffect(() => {
    Promise.all([getRaceSchedule(CURRENT_SEASON), getDriverPhotos()])
      .then(([sched, photoData]) => {
        if (Array.isArray(sched)) setSchedule(sched);
        if (photoData) setPhotos(photoData);
      });
  }, []);

  // Fetch predictions + actual results when round or session changes
  useEffect(() => {
    setLoading(true);
    setPrediction(null);
    setActualResults(null);

    const fetchPrediction = sessionType === 'qualifying'
      ? getQualifyingPredictions(CURRENT_SEASON, selectedRound)
      : sessionType === 'sprint'
        ? getSprintPredictions(CURRENT_SEASON, selectedRound)
        : getPredictions(CURRENT_SEASON, selectedRound);

    fetchPrediction.then(data => { setPrediction(data); setLoading(false); });

    // Fetch actual results
    if (sessionType === 'race') {
      getRaceResults(CURRENT_SEASON, selectedRound).then(data => {
        if (data?.results?.length > 0) setActualResults(data.results);
      }).catch(() => {});
    } else if (sessionType === 'qualifying') {
      getQualifyingResults(CURRENT_SEASON, selectedRound).then(data => {
        if (data?.results?.length > 0) setActualResults(data.results);
      }).catch(() => {});
    }
    // Sprint results would need a separate endpoint — skip for now
  }, [selectedRound, sessionType]);

  const getPhoto = (abbr) => photos[abbr]?.headshot_url || '';
  const getTeamColor = (abbr) => photos[abbr]?.team_colour || '#888888';
  const raceInfo = schedule.find(r => r.round === selectedRound);
  const raceName = raceInfo?.name || `Round ${selectedRound}`;
  const isCompleted = actualResults && actualResults.length > 0;

  const getShortName = (name) => {
    if (!name) return '—';
    return name.replace(' Grand Prix', '').replace(' GP', '')
      .replace('Emilia Romagna', 'Imola').replace('United States', 'USA')
      .replace('United Kingdom', 'UK').replace('Great Britain', 'UK');
  };

  // Winner card data
  const getWinner = () => {
    if (!prediction) return null;
    if (sessionType === 'qualifying' && prediction.pole_sitter) return { ...prediction.pole_sitter, label: 'POLE POSITION', icon: '⏱' };
    if (sessionType === 'sprint' && prediction.sprint_winner) return { ...prediction.sprint_winner, label: 'SPRINT WINNER', icon: '🏃' };
    const top = prediction.predictions?.[0];
    if (top) return { driver: top.driver, name: top.name, team: top.team, reasoning: top.reasoning, label: sessionType === 'race' ? 'RACE WINNER' : 'P1', icon: '🏆' };
    return null;
  };

  const getActualWinner = () => {
    if (!actualResults || actualResults.length === 0) return null;
    const w = actualResults.find(r => r.position === 1);
    if (!w) return null;
    return { driver: w.driver, team: w.team, label: sessionType === 'qualifying' ? 'ACTUAL POLE' : 'ACTUAL WINNER', icon: '🏁' };
  };

  const accuracy = (() => {
    if (!actualResults || !prediction?.predictions) return null;
    let exactMatch = 0;
    const actualTop3 = actualResults.filter(r => r.position <= 3).map(r => r.driver);
    const predTop3 = prediction.predictions.slice(0, 3).map(p => p.driver);
    prediction.predictions.forEach(pred => {
      const actual = actualResults.find(r => r.driver === pred.driver);
      if (actual && actual.position === pred.position) exactMatch++;
    });
    const top3Match = predTop3.filter(d => actualTop3.includes(d)).length;
    return { exactMatch, top3Match };
  })();

  const predictedWinner = getWinner();
  const actualWinner = getActualWinner();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <p style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)', fontWeight: 700, letterSpacing: '0.15em' }}>
          AI-POWERED {sessionType.toUpperCase()} ANALYSIS
        </p>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
          {sessionType === 'qualifying' ? 'Qualifying' : sessionType === 'sprint' ? 'Sprint' : 'Race'} <span style={{ color: 'var(--f1-red)' }}>Predictions</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          {prediction?.model === 'gemini'
            ? `🧠 Powered by Google Gemini AI — ${sessionType}-specific analysis.`
            : `📊 Predictions based on ${sessionType} performance ratings.`}
        </p>
      </div>

      {/* Session Type Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {SESSION_TYPES.map(s => (
          <button key={s.key} onClick={() => setSessionType(s.key)}
            className={`tab-btn ${sessionType === s.key ? 'active' : ''}`}
            style={{
              padding: '0.625rem 1.25rem', fontSize: '0.85rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              borderBottom: sessionType === s.key ? '3px solid var(--f1-red)' : '3px solid transparent',
            }}>
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      {/* GP Selector */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
        {(schedule.length > 0 ? schedule : Array.from({length: 24}, (_, i) => ({ round: i+1, name: `Round ${i+1}` }))).map(race => {
          const isActive = selectedRound === race.round;
          const shortName = getShortName(race.name);
          const isPast = race.date && new Date(race.date) < new Date();
          return (
            <button key={race.round} onClick={() => setSelectedRound(race.round)}
              className={`tab-btn ${isActive ? 'active' : ''}`}
              style={{ fontSize: '0.65rem', padding: '0.375rem 0.625rem', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.3, minWidth: '50px', opacity: isPast ? 1 : 0.7 }}
              title={race.name}>
              <span style={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', opacity: 0.7 }}>
                R{String(race.round).padStart(2, '0')} {isPast ? '✓' : ''}
              </span>
              <span style={{ fontWeight: 700, fontSize: '0.6rem', marginTop: '1px' }}>{shortName}</span>
            </button>
          );
        })}
      </div>

      {/* Completion + Accuracy Banner */}
      {isCompleted && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '1.25rem' }}>🏁</span>
          <div>
            <p style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.85rem' }}>
              {sessionType === 'qualifying' ? 'QUALIFYING COMPLETE' : sessionType === 'sprint' ? 'SPRINT COMPLETE' : 'RACE COMPLETED'}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Showing prediction vs actual comparison</p>
          </div>
          {accuracy && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: '#22c55e' }}>{accuracy.top3Match}/3</p>
                <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>{sessionType === 'qualifying' ? 'TOP 3 HIT' : 'PODIUM HIT'}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)' }}>{accuracy.exactMatch}</p>
                <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>EXACT POS</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Winner Cards */}
      {(predictedWinner || actualWinner) && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: actualWinner ? '1fr 1fr' : '1fr', gap: '1rem' }}>
          {/* Predicted Winner */}
          {predictedWinner && (
            <div className="card" style={{ borderTop: `3px solid var(--f1-red)`, textAlign: 'center', padding: '1.5rem' }}>
              <p style={{ fontSize: '0.65rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '0.75rem' }}>
                🧠 PREDICTED {predictedWinner.label}
              </p>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 0.75rem', border: `3px solid ${getTeamColor(predictedWinner.driver)}`, background: 'var(--bg-secondary)' }}>
                {getPhoto(predictedWinner.driver) && <img src={getPhoto(predictedWinner.driver)} alt={predictedWinner.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />}
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: getTeamColor(predictedWinner.driver) }}>{predictedWinner.driver}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.25rem' }}>{predictedWinner.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{predictedWinner.team}</div>
              {predictedWinner.reasoning && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.75rem', lineHeight: 1.6, fontStyle: 'italic' }}>"{predictedWinner.reasoning}"</p>
              )}
            </div>
          )}

          {/* Actual Winner */}
          {actualWinner && (
            <div className="card" style={{ borderTop: '3px solid #22c55e', textAlign: 'center', padding: '1.5rem' }}>
              <p style={{ fontSize: '0.65rem', fontFamily: "'JetBrains Mono', monospace", color: '#22c55e', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '0.75rem' }}>
                🏁 {actualWinner.label}
              </p>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 0.75rem', border: `3px solid ${getTeamColor(actualWinner.driver)}`, background: 'var(--bg-secondary)' }}>
                {getPhoto(actualWinner.driver) && <img src={getPhoto(actualWinner.driver)} alt={actualWinner.driver} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />}
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: getTeamColor(actualWinner.driver) }}>{actualWinner.driver}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{actualWinner.team}</div>
              {predictedWinner && actualWinner.driver === predictedWinner.driver && (
                <div style={{ marginTop: '0.75rem', padding: '0.375rem 0.75rem', background: 'rgba(34, 197, 94, 0.15)', borderRadius: 'var(--radius-sm)', display: 'inline-block' }}>
                  <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.8rem' }}>✓ CORRECTLY PREDICTED</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="stat-value" style={{ color: prediction?.model === 'gemini' ? 'var(--accent-gold-dim)' : 'var(--f1-red)' }}>
            {prediction?.model === 'gemini' ? '🧠 AI' : 'v1'}
          </p>
          <p className="stat-label">{prediction?.model === 'gemini' ? 'Gemini Model' : 'Heuristic Model'}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="stat-value">{prediction?.predictions?.length || 0}</p>
          <p className="stat-label">Drivers Ranked</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="stat-value" style={{ color: 'var(--accent-gold-dim)' }}>{prediction?.key_factors?.length || 0}</p>
          <p className="stat-label">Key Factors</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="f1-spinner" /></div>
      ) : prediction ? (
        <>
          {/* Full Grid Table */}
          <div className="card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem' }}>
              {isCompleted ? 'Prediction vs Actual' : `Predicted ${sessionType === 'qualifying' ? 'Qualifying' : sessionType === 'sprint' ? 'Sprint' : 'Race'} Grid`}
            </h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>PRED.</th>
                  {isCompleted && <th>ACTUAL</th>}
                  {isCompleted && <th>DIFF</th>}
                  <th>DRIVER</th>
                  <th>TEAM</th>
                  {sessionType === 'qualifying' && <th>SESSION</th>}
                  <th>CONFIDENCE</th>
                  {isCompleted && sessionType === 'race' && <th>STATUS</th>}
                  <th>REASONING</th>
                </tr>
              </thead>
              <tbody>
                {prediction.predictions?.map(pred => {
                  const teamColor = getTeamColor(pred.driver);
                  const photoUrl = getPhoto(pred.driver);
                  const actual = actualResults?.find(r => r.driver === pred.driver);
                  const actualPos = actual?.position;
                  const diff = actualPos ? pred.position - actualPos : null;
                  return (
                    <tr key={pred.driver}>
                      <td>
                        <span className={`pos-badge ${pred.position <= 3 ? `pos-${pred.position}` : ''}`}
                          style={pred.position > 3 ? { background: 'var(--bg-surface)', color: 'var(--text-secondary)' } : {}}>
                          {pred.position}
                        </span>
                      </td>
                      {isCompleted && (
                        <td>
                          {actualPos ? (
                            <span className={`pos-badge ${actualPos <= 3 ? `pos-${actualPos}` : ''}`}
                              style={actualPos > 3 ? { background: 'var(--bg-surface)', color: 'var(--text-secondary)' } : {}}>
                              {actualPos}
                            </span>
                          ) : <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>—</span>}
                        </td>
                      )}
                      {isCompleted && (
                        <td>
                          {actualPos && diff !== null ? (
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.75rem',
                              color: diff === 0 ? '#22c55e' : diff > 0 ? '#ef4444' : 'var(--accent-gold-dim)' }}>
                              {diff === 0 ? '✓' : diff > 0 ? `↓${diff}` : `↑${Math.abs(diff)}`}
                            </span>
                          ) : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                        </td>
                      )}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          {photoUrl && <img src={photoUrl} alt={pred.name} style={{ width: '32px', height: '32px', borderRadius: '50%', border: `2px solid ${teamColor}`, objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="team-bar" style={{ background: teamColor }} />
                            <span style={{ fontWeight: 700 }}>{pred.name || pred.driver}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{pred.team}</td>
                      {sessionType === 'qualifying' && (
                        <td><span style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)',
                          background: pred.session === 'Q3' ? 'rgba(239, 26, 45, 0.15)' : pred.session === 'Q2' ? 'rgba(226, 177, 60, 0.15)' : 'var(--bg-surface)',
                          color: pred.session === 'Q3' ? 'var(--f1-red)' : pred.session === 'Q2' ? 'var(--accent-gold-dim)' : 'var(--text-dim)',
                          fontWeight: 700 }}>{pred.session || '—'}</span></td>
                      )}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '60px', height: '4px', background: 'var(--bg-surface)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pred.confidence}%`, background: 'var(--f1-red)', borderRadius: '2px' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>{pred.confidence}%</span>
                        </div>
                      </td>
                      {isCompleted && sessionType === 'race' && (
                        <td style={{ fontSize: '0.75rem', color: actual?.status === 'Finished' ? '#22c55e' : '#ef4444' }}>{actual?.status || '—'}</td>
                      )}
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '250px' }}>{pred.reasoning || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Analysis */}
          {prediction.analysis && (
            <div className="card">
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem' }}>
                {prediction.model === 'gemini' ? '🧠 Gemini AI Analysis' : '📊 Model Analysis'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.9, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{prediction.analysis}</p>
              {prediction.key_factors?.length > 0 && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-default)' }}>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--accent-gold-dim)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em' }}>KEY FACTORS</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {prediction.key_factors.map((f, i) => (
                      <span key={i} style={{ padding: '0.375rem 0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{f}</span>
                    ))}
                  </div>
                </div>
              )}
              {prediction.upset_risk && (
                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--f1-red-soft)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--f1-red)' }}>⚠ UPSET RISK: </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{prediction.upset_risk}</span>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              <span style={{ color: 'var(--accent-gold-dim)', fontWeight: 700 }}>Disclaimer:</span> Predictions are generated
              {prediction.model === 'gemini' ? ' by Google Gemini AI' : ' by a heuristic model'} and are for entertainment purposes only.
              {isCompleted ? ` Actual ${sessionType} results are sourced from official FIA/F1 data via FastF1.` : ''}
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
