import React, { useState, useEffect } from 'react';
import { getPredictions, getRaceSchedule, getDriverPhotos, getRaceResults } from '../api';
import { CURRENT_SEASON } from '../constants';

export default function Predictions() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState(1);
  const [schedule, setSchedule] = useState([]);
  const [photos, setPhotos] = useState({});
  const [actualResults, setActualResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      getRaceSchedule(CURRENT_SEASON),
      getDriverPhotos(),
    ]).then(([sched, photoData]) => {
      if (Array.isArray(sched)) setSchedule(sched);
      if (photoData) setPhotos(photoData);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    setActualResults(null);
    getPredictions(CURRENT_SEASON, selectedRound).then(data => {
      setPrediction(data);
      setLoading(false);
    });
    // Try to fetch actual race results (will 500 if race hasn't happened yet)
    setResultsLoading(true);
    getRaceResults(CURRENT_SEASON, selectedRound).then(data => {
      if (data && data.results && data.results.length > 0) {
        setActualResults(data.results);
      }
      setResultsLoading(false);
    }).catch(() => setResultsLoading(false));
  }, [selectedRound]);

  const getPhoto = (abbr) => photos[abbr]?.headshot_url || '';
  const getTeamColor = (abbr) => photos[abbr]?.team_colour || '#888888';
  const raceInfo = schedule.find(r => r.round === selectedRound);
  const raceName = raceInfo?.name || `Round ${selectedRound}`;
  const raceDate = raceInfo?.date;
  const isRaceCompleted = actualResults && actualResults.length > 0;
  const isPastDate = raceDate && new Date(raceDate) < new Date();

  const getShortName = (name) => {
    if (!name) return '—';
    return name
      .replace(' Grand Prix', '').replace(' GP', '')
      .replace('Emilia Romagna', 'Imola').replace('United States', 'USA')
      .replace('United Kingdom', 'UK').replace('Great Britain', 'UK');
  };

  // Build prediction accuracy stats
  const getAccuracyStats = () => {
    if (!actualResults || !prediction?.predictions) return null;
    let exactMatch = 0;
    let top3Match = 0;
    let top10Match = 0;
    const actualTop3 = actualResults.filter(r => r.position <= 3).map(r => r.driver);
    const predTop3 = prediction.predictions.slice(0, 3).map(p => p.driver);

    prediction.predictions.forEach(pred => {
      const actual = actualResults.find(r => r.driver === pred.driver);
      if (actual) {
        if (actual.position === pred.position) exactMatch++;
        if (actual.position <= 10 && pred.position <= 10) top10Match++;
      }
    });
    top3Match = predTop3.filter(d => actualTop3.includes(d)).length;

    return { exactMatch, top3Match, top10Match, total: actualResults.length };
  };

  const accuracy = isRaceCompleted ? getAccuracyStats() : null;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <p style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)', fontWeight: 700, letterSpacing: '0.15em' }}>
          AI-POWERED RACE ANALYSIS
        </p>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
          Race <span style={{ color: 'var(--f1-red)' }}>Predictions</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          {prediction?.model === 'gemini'
            ? '🧠 Powered by Google Gemini AI with real qualifying and race data analysis.'
            : '📊 Predictions based on historical performance ratings.'
          }
        </p>
      </div>

      {/* Grand Prix Selector */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
        {(schedule.length > 0 ? schedule : Array.from({length: 24}, (_, i) => ({ round: i+1, name: `Round ${i+1}` }))).map((race) => {
          const isActive = selectedRound === race.round;
          const shortName = getShortName(race.name);
          const isPast = race.date && new Date(race.date) < new Date();
          return (
            <button key={race.round} onClick={() => setSelectedRound(race.round)}
              className={`tab-btn ${isActive ? 'active' : ''}`}
              style={{
                fontSize: '0.65rem', padding: '0.375rem 0.625rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                lineHeight: 1.3, minWidth: '50px',
                opacity: isPast ? 1 : 0.7,
              }}
              title={race.name}
            >
              <span style={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', opacity: 0.7 }}>
                R{String(race.round).padStart(2, '0')} {isPast ? '✓' : ''}
              </span>
              <span style={{ fontWeight: 700, fontSize: '0.6rem', marginTop: '1px' }}>{shortName}</span>
            </button>
          );
        })}
      </div>

      {/* Race Status Badge */}
      {isRaceCompleted && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.75rem 1.25rem', background: 'rgba(34, 197, 94, 0.08)',
          border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 'var(--radius-md)',
        }}>
          <span style={{ fontSize: '1.25rem' }}>🏁</span>
          <div>
            <p style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.85rem' }}>RACE COMPLETED</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Showing AI prediction vs actual results comparison
            </p>
          </div>
          {accuracy && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: '#22c55e' }}>
                  {accuracy.top3Match}/3
                </p>
                <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>PODIUM HIT</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)' }}>
                  {accuracy.exactMatch}
                </p>
                <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>EXACT POS</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: isRaceCompleted ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: '1rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="stat-value" style={{ color: prediction?.model === 'gemini' ? 'var(--accent-gold-dim)' : 'var(--f1-red)' }}>
            {prediction?.model === 'gemini' ? '🧠 AI' : 'v1'}
          </p>
          <p className="stat-label">{prediction?.model === 'gemini' ? 'Gemini Model' : 'Heuristic Model'}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="stat-value">{prediction?.predictions?.length || 20}</p>
          <p className="stat-label">Drivers Ranked</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="stat-value" style={{ color: 'var(--accent-gold-dim)' }}>
            {prediction?.key_factors?.length || 0}
          </p>
          <p className="stat-label">Key Factors</p>
        </div>
        {isRaceCompleted && (
          <div className="card" style={{ textAlign: 'center', borderColor: '#22c55e' }}>
            <p className="stat-value" style={{ color: '#22c55e' }}>🏁</p>
            <p className="stat-label">Results Available</p>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="f1-spinner" />
        </div>
      ) : prediction ? (
        <>
          {/* Podium — show Predicted and Actual side by side if race completed */}
          {prediction.predictions && prediction.predictions.length >= 3 && (
            <div className="card" style={{ borderColor: 'var(--border-accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>
                  {isRaceCompleted ? '🏆 Podium Comparison' : '🏆 Predicted Podium'} — <span style={{ color: 'var(--f1-red)' }}>{raceName}</span>
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isRaceCompleted ? '1fr 1fr' : '1fr', gap: '2rem' }}>
                {/* Predicted Podium */}
                <div>
                  <h3 style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '1rem', textAlign: 'center' }}>
                    🧠 AI PREDICTION
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    {prediction.predictions.slice(0, 3).map((pred, i) => {
                      const teamColor = getTeamColor(pred.driver);
                      const photoUrl = getPhoto(pred.driver);
                      return (
                        <div key={pred.driver} className="card-glass" style={{
                          textAlign: 'center', padding: '1rem 0.5rem',
                          borderTop: `3px solid ${teamColor}`,
                          order: i === 0 ? 1 : i === 1 ? 0 : 2,
                        }}>
                          <div style={{
                            width: i === 0 ? '56px' : '48px', height: i === 0 ? '56px' : '48px',
                            borderRadius: '50%', overflow: 'hidden', margin: '0 auto 0.5rem',
                            border: `2px solid ${teamColor}`, background: 'var(--bg-secondary)',
                          }}>
                            {photoUrl && <img src={photoUrl} alt={pred.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.target.style.display = 'none'; }} />}
                          </div>
                          <span className={`pos-badge pos-${pred.position}`} style={{ width: '2rem', height: '2rem', fontSize: '0.75rem', margin: '0 auto 0.25rem' }}>P{pred.position}</span>
                          <div style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: teamColor }}>{pred.driver}</div>
                          <div style={{ fontWeight: 500, marginTop: '0.125rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{pred.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.125rem' }}>{pred.team}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actual Podium */}
                {isRaceCompleted && (
                  <div>
                    <h3 style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: '#22c55e', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '1rem', textAlign: 'center' }}>
                      🏁 ACTUAL RESULT
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                      {actualResults.filter(r => r.position <= 3).sort((a, b) => a.position - b.position).map((res, i) => {
                        const teamColor = getTeamColor(res.driver);
                        const photoUrl = getPhoto(res.driver);
                        const wasPredicted = prediction.predictions.find(p => p.driver === res.driver && p.position === res.position);
                        return (
                          <div key={res.driver} className="card-glass" style={{
                            textAlign: 'center', padding: '1rem 0.5rem',
                            borderTop: `3px solid ${teamColor}`,
                            order: i === 0 ? 1 : i === 1 ? 0 : 2,
                            boxShadow: wasPredicted ? '0 0 15px rgba(34, 197, 94, 0.2)' : undefined,
                          }}>
                            <div style={{
                              width: i === 0 ? '56px' : '48px', height: i === 0 ? '56px' : '48px',
                              borderRadius: '50%', overflow: 'hidden', margin: '0 auto 0.5rem',
                              border: `2px solid ${teamColor}`, background: 'var(--bg-secondary)',
                            }}>
                              {photoUrl && <img src={photoUrl} alt={res.driver} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; }} />}
                            </div>
                            <span className={`pos-badge pos-${res.position}`} style={{ width: '2rem', height: '2rem', fontSize: '0.75rem', margin: '0 auto 0.25rem' }}>P{res.position}</span>
                            <div style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: teamColor }}>{res.driver}</div>
                            <div style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{res.team}</div>
                            {wasPredicted && (
                              <div style={{ fontSize: '0.6rem', color: '#22c55e', marginTop: '0.25rem', fontWeight: 700 }}>✓ PREDICTED</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full Grid — with actual results column */}
          <div className="card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem' }}>
              {isRaceCompleted ? 'Prediction vs Actual' : 'Full Predicted Grid'}
            </h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>PRED.</th>
                  {isRaceCompleted && <th>ACTUAL</th>}
                  {isRaceCompleted && <th>DIFF</th>}
                  <th>DRIVER</th>
                  <th>TEAM</th>
                  <th>CONFIDENCE</th>
                  {isRaceCompleted && <th>STATUS</th>}
                  <th>REASONING</th>
                </tr>
              </thead>
              <tbody>
                {prediction.predictions?.map((pred) => {
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
                      {isRaceCompleted && (
                        <td>
                          {actualPos ? (
                            <span className={`pos-badge ${actualPos <= 3 ? `pos-${actualPos}` : ''}`}
                              style={actualPos > 3 ? { background: 'var(--bg-surface)', color: 'var(--text-secondary)' } : {}}>
                              {actualPos}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>DNF</span>
                          )}
                        </td>
                      )}
                      {isRaceCompleted && (
                        <td>
                          {actualPos && diff !== null ? (
                            <span style={{
                              fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.75rem',
                              color: diff === 0 ? '#22c55e' : diff > 0 ? '#ef4444' : 'var(--accent-gold-dim)',
                            }}>
                              {diff === 0 ? '✓' : diff > 0 ? `↓${diff}` : `↑${Math.abs(diff)}`}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)' }}>—</span>
                          )}
                        </td>
                      )}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          {photoUrl && (
                            <img src={photoUrl} alt={pred.name}
                              style={{ width: '32px', height: '32px', borderRadius: '50%', border: `2px solid ${teamColor}`, objectFit: 'cover' }}
                              onError={(e) => { e.target.style.display = 'none'; }} />
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="team-bar" style={{ background: teamColor }} />
                            <span style={{ fontWeight: 700 }}>{pred.name || pred.driver}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{pred.team}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '60px', height: '4px', background: 'var(--bg-surface)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pred.confidence}%`, background: 'var(--f1-red)', borderRadius: '2px' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
                            {pred.confidence}%
                          </span>
                        </div>
                      </td>
                      {isRaceCompleted && (
                        <td style={{ fontSize: '0.75rem', color: actual?.status === 'Finished' ? '#22c55e' : '#ef4444' }}>
                          {actual?.status || '—'}
                        </td>
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
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.9, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                {prediction.analysis}
              </p>
              {prediction.key_factors && prediction.key_factors.length > 0 && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-default)' }}>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--accent-gold-dim)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em' }}>
                    KEY FACTORS
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {prediction.key_factors.map((factor, i) => (
                      <span key={i} style={{
                        padding: '0.375rem 0.75rem', background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem', color: 'var(--text-secondary)',
                      }}>{factor}</span>
                    ))}
                  </div>
                </div>
              )}
              {prediction.upset_risk && (
                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem',
                  background: 'var(--f1-red-soft)', border: '1px solid var(--border-accent)',
                  borderRadius: 'var(--radius-sm)' }}>
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
              {prediction.model === 'gemini' ? ' by Google Gemini AI' : ' by a heuristic model'} and are for entertainment
              purposes only. {isRaceCompleted ? 'Actual race results are sourced from official FIA/F1 data via FastF1.' : ''}
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
