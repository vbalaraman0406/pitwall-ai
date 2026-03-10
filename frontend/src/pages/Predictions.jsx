import React, { useState, useEffect } from 'react';
import { getPredictions, getRaceSchedule, getDriverPhotos } from '../api';

export default function Predictions() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState(1);
  const [schedule, setSchedule] = useState([]);
  const [photos, setPhotos] = useState({});

  useEffect(() => {
    Promise.all([
      getRaceSchedule(2025),
      getDriverPhotos(),
    ]).then(([sched, photoData]) => {
      if (Array.isArray(sched)) setSchedule(sched);
      if (photoData) setPhotos(photoData);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    getPredictions(2025, selectedRound).then(data => {
      setPrediction(data);
      setLoading(false);
    });
  }, [selectedRound]);

  const getPhoto = (abbr) => photos[abbr]?.headshot_url || '';
  const getTeamColor = (abbr) => photos[abbr]?.team_colour || '#888888';
  const raceName = schedule.find(r => r.round === selectedRound)?.name || `Round ${selectedRound}`;

  // Extract short GP name (e.g. "Australian Grand Prix" → "Australia")
  const getShortName = (name) => {
    if (!name) return '—';
    return name
      .replace(' Grand Prix', '')
      .replace(' GP', '')
      .replace('Emilia Romagna', 'Imola')
      .replace('United States', 'USA')
      .replace('United Kingdom', 'UK')
      .replace('Great Britain', 'UK')
      .replace('Arabia', 'Arabia')
      .replace('Abu Dhabi', 'Abu Dhabi')
      .replace('Las Vegas', 'Las Vegas')
      .replace('São Paulo', 'São Paulo');
  };

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
            : '📊 Predictions based on historical performance ratings. Configure GEMINI_API_KEY for AI-powered analysis.'
          }
        </p>
      </div>

      {/* Grand Prix Selector — shows actual GP names */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
        {(schedule.length > 0 ? schedule : Array.from({length: 24}, (_, i) => ({ round: i+1, name: `Round ${i+1}` }))).map((race) => {
          const isActive = selectedRound === race.round;
          const shortName = getShortName(race.name);
          return (
            <button
              key={race.round}
              onClick={() => setSelectedRound(race.round)}
              className={`tab-btn ${isActive ? 'active' : ''}`}
              style={{
                fontSize: '0.65rem',
                padding: '0.375rem 0.625rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                lineHeight: 1.3,
                minWidth: '50px',
              }}
              title={race.name}
            >
              <span style={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', opacity: 0.7 }}>
                R{String(race.round).padStart(2, '0')}
              </span>
              <span style={{ fontWeight: 700, fontSize: '0.6rem', marginTop: '1px' }}>
                {shortName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Model & Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="stat-value" style={{ color: prediction?.model === 'gemini' ? 'var(--accent-gold-dim)' : 'var(--f1-red)' }}>
            {prediction?.model === 'gemini' ? '🧠 AI' : 'v1'}
          </p>
          <p className="stat-label">
            {prediction?.model === 'gemini' ? 'Gemini Model' : 'Heuristic Model'}
          </p>
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
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="f1-spinner" />
        </div>
      ) : prediction ? (
        <>
          {/* Podium */}
          {prediction.predictions && prediction.predictions.length >= 3 && (
            <div className="card" style={{ borderColor: 'var(--border-accent)' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1.5rem' }}>
                🏆 Predicted Podium — <span style={{ color: 'var(--f1-red)' }}>{raceName}</span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {prediction.predictions.slice(0, 3).map((pred, i) => {
                  const teamColor = getTeamColor(pred.driver);
                  const photoUrl = getPhoto(pred.driver);
                  return (
                    <div key={pred.driver} className="card-glass" style={{
                      textAlign: 'center', padding: '1.5rem 1rem',
                      borderTop: `3px solid ${teamColor}`,
                      order: i === 0 ? 1 : i === 1 ? 0 : 2,
                    }}>
                      <div style={{
                        width: i === 0 ? '80px' : '64px', height: i === 0 ? '80px' : '64px',
                        borderRadius: '50%', overflow: 'hidden', margin: '0 auto 0.75rem',
                        border: `3px solid ${teamColor}`, background: 'var(--bg-secondary)',
                        boxShadow: i === 0 ? `0 0 20px ${teamColor}44` : undefined,
                      }}>
                        {photoUrl ? (
                          <img src={photoUrl} alt={pred.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : null}
                      </div>
                      <span className={`pos-badge pos-${pred.position}`} style={{
                        width: i === 0 ? '2.75rem' : '2.25rem', height: i === 0 ? '2.75rem' : '2.25rem',
                        fontSize: i === 0 ? '1rem' : '0.8rem', margin: '0 auto 0.5rem',
                      }}>P{pred.position}</span>
                      <div style={{ fontSize: i === 0 ? '1.75rem' : '1.25rem', fontWeight: 900,
                        fontFamily: "'JetBrains Mono', monospace", color: teamColor }}>{pred.driver}</div>
                      <div style={{ fontWeight: 600, marginTop: '0.25rem', color: 'var(--text-secondary)' }}>{pred.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{pred.team}</div>
                      <div style={{ marginTop: '1rem' }}>
                        <div style={{ height: '4px', background: 'var(--bg-surface)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pred.confidence}%`,
                            background: `linear-gradient(90deg, var(--f1-red), ${teamColor})`,
                            borderRadius: '2px', transition: 'width 1s ease' }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace",
                          color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                          {pred.confidence}% confidence
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full Grid */}
          <div className="card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem' }}>Full Predicted Grid</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>POS</th><th>DRIVER</th><th>TEAM</th><th>CONFIDENCE</th><th>REASONING</th>
                </tr>
              </thead>
              <tbody>
                {prediction.predictions?.map((pred) => {
                  const teamColor = getTeamColor(pred.driver);
                  const photoUrl = getPhoto(pred.driver);
                  return (
                    <tr key={pred.driver}>
                      <td>
                        <span className={`pos-badge ${pred.position <= 3 ? `pos-${pred.position}` : ''}`}
                          style={pred.position > 3 ? { background: 'var(--bg-surface)', color: 'var(--text-secondary)' } : {}}>
                          {pred.position}
                        </span>
                      </td>
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
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '300px' }}>{pred.reasoning || '—'}</td>
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
              purposes only. Actual race outcomes depend on many unpredictable factors.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
