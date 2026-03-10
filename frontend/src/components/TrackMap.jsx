import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * TrackMap - Interactive circuit visualization with race replay.
 *
 * Props:
 *   trackData    - { coordinates: [{x,y}], rotation, corners: [{number,x,y}] }
 *   positionData - { drivers: [{driver, team, team_color, laps: [{lap, lap_time, position, points: [{x,y}]}]}], total_laps }
 */
export default function TrackMap({ trackData, positionData }) {
  const [currentLap, setCurrentLap] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [animProgress, setAnimProgress] = useState(0);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const svgRef = useRef(null);
  const animRef = useRef(null);
  const lastTimeRef = useRef(null);

  const totalLaps = positionData?.total_laps || 0;
  const drivers = positionData?.drivers || [];
  const coords = trackData?.coordinates || [];

  // Compute SVG viewport
  const { viewBox, trackPath, startPos, vbData } = React.useMemo(() => {
    if (!coords.length) return { viewBox: '0 0 1000 1000', trackPath: '', startPos: null, vbData: null };

    const xs = coords.map(c => c.x);
    const ys = coords.map(c => c.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const padding = (maxX - minX) * 0.15;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    const vb = `${minX - padding} ${minY - padding} ${width} ${height}`;
    const pathParts = coords.map((c, i) =>
      i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`
    );
    pathParts.push('Z');

    // Start/finish = first coordinate
    const start = coords[0];
    // Get direction for flag orientation
    const next = coords[1] || coords[0];
    const flagAngle = Math.atan2(next.y - start.y, next.x - start.x) * (180 / Math.PI);

    return {
      viewBox: vb,
      trackPath: pathParts.join(' '),
      startPos: { ...start, angle: flagAngle },
      vbData: { width, height, minX: minX - padding, minY: minY - padding },
    };
  }, [coords]);

  // Get driver lap data
  const getDriverLapData = useCallback((driver, lap) => {
    const driverData = drivers.find(d => d.driver === driver.driver);
    if (!driverData) return null;
    return driverData.laps.find(l => l.lap === lap) || null;
  }, [drivers]);

  // Get interpolated driver position on track
  const getDriverPosition = useCallback((driver, lap, progress) => {
    const lapData = getDriverLapData(driver, lap);
    if (!lapData || !lapData.points || lapData.points.length === 0) {
      if (coords.length === 0) return null;
      const idx = Math.floor((drivers.indexOf(driver) / drivers.length) * coords.length);
      return coords[idx] || coords[0];
    }
    const points = lapData.points;
    const idx = Math.min(Math.floor(progress * points.length), points.length - 1);
    return points[idx];
  }, [getDriverLapData, coords, drivers]);

  // Get sorted positions for current lap
  const currentPositions = React.useMemo(() => {
    return drivers
      .map(d => {
        const lapData = getDriverLapData(d, currentLap);
        return {
          ...d,
          position: lapData?.position || 99,
          lapTime: lapData?.lap_time,
        };
      })
      .sort((a, b) => a.position - b.position);
  }, [drivers, currentLap, getDriverLapData]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || totalLaps === 0) return;

    const animate = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const lapDuration = 2000 / speed;
      const progressDelta = delta / lapDuration;

      setAnimProgress(prev => {
        let newProgress = prev + progressDelta;
        if (newProgress >= 1) {
          newProgress = 0;
          setCurrentLap(prevLap => {
            if (prevLap >= totalLaps) {
              setIsPlaying(false);
              return totalLaps;
            }
            return prevLap + 1;
          });
        }
        return newProgress;
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      lastTimeRef.current = null;
    };
  }, [isPlaying, speed, totalLaps]);

  // Scale factor for consistent sizing
  const scale = vbData ? Math.max(vbData.width, vbData.height) / 100 : 1;
  const dotSize = scale * 2.5;
  const fontSize = scale * 1.8;
  const labelFontSize = scale * 1.4;

  if (!trackData || coords.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="f1-spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading track data...</p>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
          First load may take 30-60s to fetch telemetry from F1 servers
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header with lap info and speed */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>
              🏁 Race Replay
            </h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>
              {isPlaying ? '● LIVE' : '◻ PAUSED'} — {speed}x SPEED
            </p>
          </div>
          <div style={{
            background: currentLap === totalLaps ? '#22c55e22' : 'var(--f1-red-soft)',
            border: `1px solid ${currentLap === totalLaps ? '#22c55e' : 'var(--f1-red)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '0.375rem 0.75rem', textAlign: 'center',
          }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: currentLap === totalLaps ? '#22c55e' : 'var(--f1-red)' }}>
              {currentLap}<span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>/{totalLaps}</span>
            </p>
            <p style={{ fontSize: '0.55rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.1em' }}>LAP</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          {[1, 2, 5, 10].map(s => (
            <button key={s} onClick={() => setSpeed(s)} style={{
              padding: '0.3rem 0.6rem', fontSize: '0.7rem',
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
              background: speed === s ? 'var(--f1-red)' : 'var(--bg-surface)',
              color: speed === s ? 'white' : 'var(--text-muted)',
              border: `1px solid ${speed === s ? 'var(--f1-red)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            }}>{s}x</button>
          ))}
        </div>
      </div>

      {/* Main track + sidebar layout */}
      <div style={{ display: 'flex' }}>
        {/* Track SVG */}
        <div style={{ flex: 1, padding: '1rem', background: '#080810', position: 'relative', minHeight: '420px' }}>
          {/* Lap progress overlay */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px', zIndex: 1,
            background: 'var(--bg-surface)',
          }}>
            <div style={{
              height: '100%', width: `${(((currentLap - 1) + animProgress) / totalLaps) * 100}%`,
              background: 'linear-gradient(90deg, var(--f1-red), var(--accent-gold-dim))',
              transition: 'none', borderRadius: '0 2px 2px 0',
            }} />
          </div>

          <svg ref={svgRef} viewBox={viewBox} style={{
            width: '100%', height: '400px',
            transform: trackData.rotation ? `rotate(${trackData.rotation}deg)` : undefined,
          }}>
            {/* Track ambient glow */}
            <path d={trackPath} fill="none" stroke="rgba(225, 6, 0, 0.08)" strokeWidth={scale * 12} strokeLinejoin="round" />
            {/* Track surface */}
            <path d={trackPath} fill="none" stroke="#2a2a38" strokeWidth={scale * 6} strokeLinejoin="round" strokeLinecap="round" />
            {/* Track edge marks */}
            <path d={trackPath} fill="none" stroke="#444454" strokeWidth={scale * 0.5} strokeDasharray={`${scale * 3} ${scale * 2}`} strokeLinejoin="round" />

            {/* Start/Finish line */}
            {startPos && (
              <g transform={`translate(${startPos.x}, ${startPos.y})`}>
                {/* Checkered flag line across track */}
                <line
                  x1={-scale * 3} y1={0} x2={scale * 3} y2={0}
                  stroke="white" strokeWidth={scale * 0.8}
                  transform={`rotate(${startPos.angle + 90})`}
                />
                {/* Flag icon */}
                <g transform={`translate(${Math.cos((startPos.angle + 90) * Math.PI / 180) * scale * 5}, ${Math.sin((startPos.angle + 90) * Math.PI / 180) * scale * 5})`}>
                  <rect x={-scale * 1.5} y={-scale * 2.5} width={scale * 3} height={scale * 2} fill="#222" rx={scale * 0.2} />
                  {/* Checkered pattern */}
                  {[0, 1, 2].map(row => [0, 1, 2].map(col => (
                    <rect key={`${row}_${col}`}
                      x={-scale * 1.5 + col * scale}
                      y={-scale * 2.5 + row * scale * 0.67}
                      width={scale} height={scale * 0.67}
                      fill={(row + col) % 2 === 0 ? 'white' : '#222'}
                    />
                  )))}
                  <text
                    x={0} y={scale * 1}
                    textAnchor="middle" fill="white"
                    fontSize={fontSize * 0.6}
                    fontFamily="'JetBrains Mono', monospace"
                    fontWeight="700"
                  >START</text>
                </g>
              </g>
            )}

            {/* Corner markers */}
            {(trackData.corners || []).map(corner => (
              <g key={corner.number}>
                <circle cx={corner.x} cy={corner.y} r={scale * 1.5} fill="rgba(80,80,100,0.7)" stroke="rgba(130,130,160,0.4)" strokeWidth={scale * 0.2} />
                <text x={corner.x} y={corner.y} textAnchor="middle" dominantBaseline="central"
                  fill="rgba(180,180,200,0.7)" fontSize={fontSize * 0.7} fontFamily="'JetBrains Mono', monospace" fontWeight="700">
                  {corner.number}
                </text>
              </g>
            ))}

            {/* Driver dots — render P1 last (on top) */}
            {[...currentPositions].reverse().map(driver => {
              const pos = getDriverPosition(driver, currentLap, animProgress);
              if (!pos) return null;

              const isLeader = driver.position === 1;
              const isSelected = selectedDriver === driver.driver;
              const r = isLeader ? dotSize * 1.3 : (isSelected ? dotSize * 1.15 : dotSize);
              const color = driver.team_color || '#888';

              return (
                <g key={driver.driver} style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedDriver(selectedDriver === driver.driver ? null : driver.driver)}>
                  {/* Leader pulse ring */}
                  {isLeader && (
                    <circle cx={pos.x} cy={pos.y} r={r * 1.8} fill="none" stroke={color} strokeWidth={scale * 0.3} opacity="0.5">
                      <animate attributeName="r" values={`${r * 1.3};${r * 2.2};${r * 1.3}`} dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* Selection ring */}
                  {isSelected && !isLeader && (
                    <circle cx={pos.x} cy={pos.y} r={r * 1.6} fill="none" stroke="white" strokeWidth={scale * 0.2} opacity="0.4" />
                  )}
                  {/* Glow */}
                  <circle cx={pos.x} cy={pos.y} r={r * 1.5} fill={color} opacity="0.2" />
                  {/* Main dot */}
                  <circle cx={pos.x} cy={pos.y} r={r} fill={color} stroke="white" strokeWidth={scale * 0.3} />
                  {/* Position number inside dot */}
                  <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                    fill="white" fontSize={r * 0.9} fontFamily="'JetBrains Mono', monospace" fontWeight="900">
                    {driver.position || ''}
                  </text>
                  {/* Driver abbreviation label */}
                  {(isLeader || isSelected || driver.position <= 5) && (
                    <g>
                      <rect
                        x={pos.x + r * 1.3} y={pos.y - r * 0.7}
                        width={labelFontSize * 2.8} height={labelFontSize * 1.3}
                        rx={scale * 0.3} fill="rgba(0,0,0,0.8)"
                        stroke={color} strokeWidth={scale * 0.15}
                      />
                      <text
                        x={pos.x + r * 1.3 + labelFontSize * 1.4} y={pos.y}
                        textAnchor="middle" dominantBaseline="central"
                        fill="white" fontSize={labelFontSize * 0.85}
                        fontFamily="'JetBrains Mono', monospace" fontWeight="700">
                        {driver.driver}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Live Leaderboard Sidebar */}
        <div className="mobile-hide" style={{
          width: '200px', minWidth: '200px',
          borderLeft: '1px solid var(--border-default)',
          background: 'var(--bg-card)',
          overflowY: 'auto', maxHeight: '460px',
        }}>
          <div style={{
            padding: '0.75rem', borderBottom: '1px solid var(--border-default)',
            position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1,
          }}>
            <p style={{ fontSize: '0.6rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)', fontWeight: 700, letterSpacing: '0.1em' }}>
              LIVE STANDINGS
            </p>
          </div>
          {currentPositions.map((driver, idx) => {
            const color = driver.team_color || '#888';
            const isLeader = idx === 0;
            const isSelected = selectedDriver === driver.driver;
            return (
              <div key={driver.driver}
                onClick={() => setSelectedDriver(selectedDriver === driver.driver ? null : driver.driver)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.375rem 0.75rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--bg-surface)' : isLeader ? 'rgba(34,197,94,0.06)' : 'transparent',
                  transition: 'background 0.15s ease',
                }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 900,
                  fontSize: '0.65rem', width: '1.25rem', textAlign: 'right',
                  color: idx < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][idx] : 'var(--text-dim)',
                }}>
                  {driver.position || idx + 1}
                </span>
                <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: color, flexShrink: 0 }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                  fontSize: '0.7rem', color: isSelected ? 'white' : 'var(--text-secondary)',
                  flex: 1,
                }}>
                  {driver.driver}
                </span>
                {driver.lapTime && (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: 'var(--text-dim)' }}>
                    {driver.lapTime > 60 
                      ? `${Math.floor(driver.lapTime / 60)}:${(driver.lapTime % 60).toFixed(1).padStart(4, '0')}` 
                      : `${driver.lapTime.toFixed(1)}s`}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div style={{
        padding: '0.75rem 1.5rem',
        borderTop: '1px solid var(--border-default)',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={() => {
            if (currentLap >= totalLaps && !isPlaying) {
              setCurrentLap(1);
              setAnimProgress(0);
            }
            setIsPlaying(!isPlaying);
          }}
          className="btn-primary"
          style={{ padding: '0.5rem 1.5rem', fontSize: '0.8rem', fontWeight: 800 }}>
          {isPlaying ? '⏸ Pause' : currentLap >= totalLaps ? '🔄 Replay' : '▶ Play Race'}
        </button>

        <button
          onClick={() => { setCurrentLap(1); setAnimProgress(0); setIsPlaying(false); }}
          className="btn-secondary"
          style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>
          ⏮
        </button>

        {/* Skip back/forward */}
        <button onClick={() => { setCurrentLap(Math.max(1, currentLap - 5)); setAnimProgress(0); }}
          className="btn-secondary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>-5</button>
        <button onClick={() => { setCurrentLap(Math.min(totalLaps, currentLap + 5)); setAnimProgress(0); }}
          className="btn-secondary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>+5</button>

        {/* Lap slider */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '120px' }}>
          <input type="range" min="1" max={totalLaps || 1} value={currentLap}
            onChange={(e) => { setCurrentLap(parseInt(e.target.value)); setAnimProgress(0); }}
            style={{ flex: 1, height: '4px', accentColor: 'var(--f1-red)', cursor: 'pointer' }} />
          <span style={{
            fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700, color: 'var(--f1-red)', minWidth: '3.5rem', textAlign: 'right',
          }}>
            {currentLap}/{totalLaps}
          </span>
        </div>
      </div>

      {/* Mobile driver legend (hidden on desktop where sidebar shows) */}
      <div style={{
        padding: '0.75rem 1rem', borderTop: '1px solid var(--border-default)',
        display: 'flex', flexWrap: 'wrap', gap: '0.375rem',
      }}>
        {currentPositions.slice(0, 10).map(driver => (
          <div key={driver.driver}
            onClick={() => setSelectedDriver(selectedDriver === driver.driver ? null : driver.driver)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              padding: '0.2rem 0.5rem', background: selectedDriver === driver.driver ? 'var(--bg-elevated)' : 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)', border: `1px solid ${selectedDriver === driver.driver ? driver.team_color || '#888' : 'var(--border-default)'}`,
              fontSize: '0.65rem', cursor: 'pointer',
            }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, color: driver.team_color || '#888', fontSize: '0.6rem' }}>
              P{driver.position}
            </span>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: driver.team_color || '#888' }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{driver.driver}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
