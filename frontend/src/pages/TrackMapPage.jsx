import React, { useState, useEffect } from 'react';
import { getRaceSchedule, getTrackCoordinates, getDriverPositions, getRaceResults, getOpenF1Session } from '../api';
import TrackMap from '../components/TrackMap';
import LiveTrackMap from '../components/LiveTrackMap';
import { CURRENT_SEASON } from '../constants';

export default function TrackMapPage() {
  const [schedule, setSchedule] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null); // null = auto-select
  const [trackData, setTrackData] = useState(null);
  const [positionData, setPositionData] = useState(null);
  const [raceResults, setRaceResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Live mode state
  const [liveSession, setLiveSession] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [mode, setMode] = useState('replay'); // 'live' or 'replay'

  // Determine if a race date has passed
  const isRacePast = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  useEffect(() => {
    getRaceSchedule(CURRENT_SEASON).then(sched => {
      if (Array.isArray(sched) && sched.length > 0) {
        setSchedule(sched);
        // Auto-select the latest completed race
        const pastRaces = sched.filter(r => isRacePast(r.date));
        if (pastRaces.length > 0) {
          setSelectedRound(pastRaces[pastRaces.length - 1].round);
        } else {
          setSelectedRound(1);
        }
      }
    });

    // Check for live session
    getOpenF1Session().then(resp => {
      if (resp?.is_live && resp?.session) {
        setLiveSession(resp.session);
        setIsLive(true);
        setMode('live');
      } else if (resp?.session) {
        setLiveSession(resp.session);
      }
    });
  }, []);

  // Poll for live status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      getOpenF1Session().then(resp => {
        if (resp?.is_live && resp?.session) {
          setLiveSession(resp.session);
          setIsLive(true);
        } else {
          setIsLive(false);
          if (mode === 'live') setMode('replay');
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [mode]);

  // Determine if the selected race is in the future
  const selectedRaceInfo = schedule.find(r => r.round === selectedRound);
  const isSelectedRaceFuture = selectedRaceInfo && !isRacePast(selectedRaceInfo.date);

  useEffect(() => {
    if (mode === 'live' || !selectedRound || isSelectedRaceFuture) return;
    setLoading(true);
    setTrackData(null);
    setPositionData(null);
    setRaceResults(null);
    Promise.all([
      getTrackCoordinates(CURRENT_SEASON, selectedRound),
      getDriverPositions(CURRENT_SEASON, selectedRound),
      getRaceResults(CURRENT_SEASON, selectedRound).catch(() => null),
    ]).then(([track, positions, results]) => {
      setTrackData(track);
      setPositionData(positions);
      if (results?.results?.length > 0) setRaceResults(results.results);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedRound, mode, isSelectedRaceFuture]);

  const getShortName = (name) => {
    if (!name) return '—';
    return name.replace(' Grand Prix', '').replace(' GP', '').replace('United States', 'USA').replace('Great Britain', 'UK');
  };

  // Countdown to race
  const getCountdown = (dateStr) => {
    if (!dateStr) return '';
    const diff = new Date(dateStr) - new Date();
    if (diff <= 0) return '';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <p style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)', fontWeight: 700, letterSpacing: '0.15em' }}>
          CIRCUIT VISUALIZATION
        </p>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
          Track <span style={{ color: 'var(--f1-red)' }}>Map</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          {mode === 'live'
            ? 'Real-time driver positions powered by OpenF1 live timing data.'
            : 'Interactive circuit replay with lap-by-lap driver positions from telemetry data.'}
        </p>
      </div>

      {/* Mode selector: LIVE / REPLAY */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          onClick={() => isLive && setMode('live')}
          className={`tab-btn ${mode === 'live' ? 'active' : ''}`}
          style={{
            fontSize: '0.7rem', padding: '0.4rem 0.9rem',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            opacity: isLive ? 1 : 0.4,
            cursor: isLive ? 'pointer' : 'not-allowed',
            background: mode === 'live' ? 'rgba(239,68,68,0.15)' : undefined,
            border: mode === 'live' ? '1px solid rgba(239,68,68,0.4)' : undefined,
          }}
          title={isLive ? 'Switch to live timing' : 'No active session — live mode available during F1 sessions'}
        >
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: isLive ? '#ef4444' : '#666',
            animation: isLive && mode === 'live' ? 'pulse 1.5s ease infinite' : 'none',
          }} />
          <span style={{ fontWeight: 800, color: mode === 'live' ? '#ef4444' : undefined }}>LIVE</span>
        </button>

        <button
          onClick={() => setMode('replay')}
          className={`tab-btn ${mode === 'replay' ? 'active' : ''}`}
          style={{ fontSize: '0.7rem', padding: '0.4rem 0.9rem', fontWeight: 800 }}
        >
          📼 REPLAY
        </button>

        {liveSession && !isLive && (
          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", marginLeft: '0.5rem' }}>
            Latest: {liveSession.session_name} — {liveSession.circuit_short_name} ({liveSession.session_type})
          </span>
        )}

        {isLive && mode !== 'live' && (
          <span style={{
            fontSize: '0.65rem', fontWeight: 700,
            color: '#ef4444', marginLeft: '0.5rem',
            animation: 'pulse 2s ease infinite',
          }}>
            ⚡ Session is LIVE! Click LIVE to watch.
          </span>
        )}
      </div>

      {/* LIVE MODE */}
      {mode === 'live' && liveSession ? (
        <LiveTrackMap sessionInfo={liveSession} />
      ) : (
        <>
          {/* GP Selector for Replay — with proper race names */}
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            {(schedule.length > 0 ? schedule : Array.from({length: 24}, (_, i) => ({ round: i+1, name: `Round ${i+1}` }))).map(race => {
              const isActive = selectedRound === race.round;
              const isPast = isRacePast(race.date);
              return (
                <button key={race.round} onClick={() => setSelectedRound(race.round)}
                  className={`tab-btn ${isActive ? 'active' : ''}`}
                  style={{
                    fontSize: '0.6rem', padding: '0.3rem 0.5rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    lineHeight: 1.2, minWidth: '50px',
                    opacity: isPast ? 1 : 0.4,
                    borderBottom: isActive && !isPast ? '2px solid #f59e0b' : undefined,
                  }}
                  title={race.name}>
                  <span style={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.5rem', opacity: 0.7 }}>
                    R{String(race.round).padStart(2, '0')} {isPast ? '✓' : ''}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.55rem' }}>{getShortName(race.name)}</span>
                </button>
              );
            })}
          </div>

          {/* Race info banner */}
          {selectedRaceInfo && (
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
              <div style={{ width: '4px', height: '40px', background: isSelectedRaceFuture ? '#f59e0b' : 'var(--f1-red)', borderRadius: '2px' }} />
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900 }}>{selectedRaceInfo.name}</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {selectedRaceInfo.circuit || 'Circuit'} • {selectedRaceInfo.date ? new Date(selectedRaceInfo.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                </p>
              </div>
              {isSelectedRaceFuture ? (
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ fontSize: '0.6rem', color: '#f59e0b', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '0.1em' }}>UPCOMING RACE</p>
                  <p style={{ fontSize: '1rem', fontWeight: 900, color: '#f59e0b' }}>
                    {getCountdown(selectedRaceInfo.date) ? `In ${getCountdown(selectedRaceInfo.date)}` : 'Coming Soon'}
                  </p>
                </div>
              ) : raceResults && raceResults[0] ? (
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ fontSize: '0.6rem', color: 'var(--accent-gold-dim)', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '0.1em' }}>RACE WINNER</p>
                  <p style={{ fontSize: '1rem', fontWeight: 900, color: '#22c55e' }}>{raceResults[0].driver} — {raceResults[0].team}</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Upcoming Race Card — shown instead of Track Map for future rounds */}
          {isSelectedRaceFuture ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏎️</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                {selectedRaceInfo?.name || 'Upcoming Race'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                This race hasn't happened yet — track telemetry will be available after the race.
              </p>
              {getCountdown(selectedRaceInfo?.date) && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '0.5rem 1.25rem', borderRadius: '20px',
                }}>
                  <span style={{ fontSize: '1.1rem' }}>⏳</span>
                  <span style={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#f59e0b' }}>
                    {getCountdown(selectedRaceInfo?.date)} until race day
                  </span>
                </div>
              )}
              <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
                💡 Check <b>AI Predictions</b> for our race forecast, or switch to the <b>LIVE</b> tab during the session to watch in real-time.
              </p>
            </div>
          ) : loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
              <div className="f1-spinner" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>Loading track telemetry data...</p>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                First load may take 30–60s to fetch from F1 servers
              </p>
            </div>
          ) : (
            <TrackMap trackData={trackData} positionData={positionData} />
          )}

          {/* Race results mini-table — only for completed races */}
          {!isSelectedRaceFuture && raceResults && raceResults.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>
                Race Results — {selectedRaceInfo?.name || `Round ${selectedRound}`}
              </h3>
              <table className="data-table">
                <thead>
                  <tr><th>POS</th><th>DRIVER</th><th>TEAM</th><th>STATUS</th></tr>
                </thead>
                <tbody>
                  {raceResults.slice(0, 10).map(r => (
                    <tr key={r.driver}>
                      <td>
                        <span className={`pos-badge ${r.position <= 3 ? `pos-${r.position}` : ''}`}
                          style={r.position > 3 ? { background: 'var(--bg-surface)', color: 'var(--text-secondary)' } : {}}>
                          {r.position}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{r.driver}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.team}</td>
                      <td style={{ fontSize: '0.75rem', color: r.status === 'Finished' ? '#22c55e' : '#ef4444' }}>{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
