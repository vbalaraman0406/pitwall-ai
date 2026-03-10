import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * TrackMap — Professional F1-style circuit visualization with race replay.
 *
 * Design approach (inspired by F1 TV "Track Mode"):
 * - Drivers are distributed ALONG the track outline path, not at raw GPS positions
 * - Minimum spacing enforced so dots never overlap
 * - Every driver has a visible labeled pill (team-colored)
 * - Leader has a gold border + pulse, smooth animation
 * - 1x speed = ~5s per lap for readable replay
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

  // ─── Build track path + cumulative distances ───
  const { viewBox, trackPath, pathPoints, totalLength, startPos, scale } = React.useMemo(() => {
    if (!coords.length) return { viewBox: '0 0 1000 1000', trackPath: '', pathPoints: [], totalLength: 0, startPos: null, scale: 1 };

    const xs = coords.map(c => c.x);
    const ys = coords.map(c => c.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const padding = (maxX - minX) * 0.08;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    const sc = Math.max(width, height) / 100;

    // Build cumulative distance array for placing drivers along path
    let cumDist = 0;
    const pts = coords.map((c, i) => {
      if (i > 0) {
        const dx = c.x - coords[i - 1].x;
        const dy = c.y - coords[i - 1].y;
        cumDist += Math.sqrt(dx * dx + dy * dy);
      }
      return { ...c, dist: cumDist };
    });

    const pathParts = coords.map((c, i) => i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`);
    pathParts.push('Z');

    const next = coords[1] || coords[0];
    const angle = Math.atan2(next.y - coords[0].y, next.x - coords[0].x) * (180 / Math.PI);

    return {
      viewBox: `${minX - padding} ${minY - padding} ${width} ${height}`,
      trackPath: pathParts.join(' '),
      pathPoints: pts,
      totalLength: cumDist,
      startPos: { x: coords[0].x, y: coords[0].y, angle },
      scale: sc,
    };
  }, [coords]);

  // ─── Get point on track at a given fraction (0-1) ───
  const getPointOnTrack = useCallback((fraction) => {
    if (pathPoints.length === 0) return { x: 0, y: 0 };
    const targetDist = (fraction % 1) * totalLength;
    for (let i = 1; i < pathPoints.length; i++) {
      if (pathPoints[i].dist >= targetDist) {
        const prev = pathPoints[i - 1];
        const curr = pathPoints[i];
        const segLen = curr.dist - prev.dist;
        if (segLen === 0) return { x: curr.x, y: curr.y };
        const t = (targetDist - prev.dist) / segLen;
        return { x: prev.x + (curr.x - prev.x) * t, y: prev.y + (curr.y - prev.y) * t };
      }
    }
    const last = pathPoints[pathPoints.length - 1];
    return { x: last.x, y: last.y };
  }, [pathPoints, totalLength]);

  // ─── Get driver lap data ───
  const getDriverLapData = useCallback((driver, lap) => {
    const d = drivers.find(dd => dd.driver === driver.driver);
    if (!d) return null;
    return d.laps.find(l => l.lap === lap) || null;
  }, [drivers]);

  // ─── Sorted positions for current lap ───
  const currentPositions = React.useMemo(() => {
    return drivers
      .map(d => {
        const lapData = getDriverLapData(d, currentLap);
        return { ...d, position: lapData?.position || 99, lapTime: lapData?.lap_time };
      })
      .sort((a, b) => a.position - b.position);
  }, [drivers, currentLap, getDriverLapData]);

  // ─── Compute driver positions along track with anti-overlap ───
  const driverTrackPositions = React.useMemo(() => {
    if (!currentPositions.length || pathPoints.length === 0) return [];

    const numDrivers = currentPositions.length;
    // Spacing: leader is at the current animation progress point
    // Each subsequent driver is spaced behind by a minimum gap
    const minGap = 0.035; // minimum fraction of track between drivers
    const baseGap = 0.025; // base gap per position

    return currentPositions.map((driver, idx) => {
      // Leader at animProgress, each subsequent driver spaced behind
      const fraction = animProgress - idx * Math.max(minGap, baseGap);
      const point = getPointOnTrack(fraction);
      return { ...driver, trackX: point.x, trackY: point.y, idx };
    });
  }, [currentPositions, animProgress, getPointOnTrack, pathPoints]);

  // ─── Animation loop (slower: 5s per lap at 1x) ───
  useEffect(() => {
    if (!isPlaying || totalLaps === 0) return;

    const animate = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const lapDuration = 5000 / speed; // 5s per lap at 1x
      const progressDelta = delta / lapDuration;

      setAnimProgress(prev => {
        let p = prev + progressDelta;
        if (p >= 1) {
          p = 0;
          setCurrentLap(prevLap => {
            if (prevLap >= totalLaps) { setIsPlaying(false); return totalLaps; }
            return prevLap + 1;
          });
        }
        return p;
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); lastTimeRef.current = null; };
  }, [isPlaying, speed, totalLaps]);

  // Sizing — pills must fit inside track surface width
  const dotR = scale * 1.6;
  const pillW = scale * 4.5;
  const pillH = scale * 1.8;
  const fontSz = scale * 1.1;
  const smallFontSz = scale * 0.8;

  if (!trackData || coords.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="f1-spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading track data...</p>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
          First load may take 30-60s to fetch telemetry
        </p>
      </div>
    );
  }

  const formatTime = (s) => s > 60 ? `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}` : `${s.toFixed(1)}s`;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* ── Header ── */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>🏁 Race Replay</h3>
          <div style={{
            background: isPlaying ? 'rgba(34,197,94,0.12)' : 'var(--bg-surface)',
            border: `1px solid ${isPlaying ? '#22c55e' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-sm)', padding: '0.2rem 0.5rem',
            fontSize: '0.6rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
            color: isPlaying ? '#22c55e' : 'var(--text-dim)',
          }}>
            {isPlaying ? '● LIVE' : '◻ PAUSED'}
          </div>
          <div style={{
            background: 'var(--f1-red-soft)', border: '1px solid var(--f1-red)',
            borderRadius: 'var(--radius-sm)', padding: '0.2rem 0.6rem',
          }}>
            <span style={{ fontSize: '1rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: 'var(--f1-red)' }}>
              {currentLap}<span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>/{totalLaps}</span>
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginRight: '0.25rem', fontWeight: 600 }}>SPEED</span>
          {[0.5, 1, 2, 5].map(s => (
            <button key={s} onClick={() => setSpeed(s)} style={{
              padding: '0.2rem 0.5rem', fontSize: '0.65rem',
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
              background: speed === s ? 'var(--f1-red)' : 'var(--bg-surface)',
              color: speed === s ? 'white' : 'var(--text-muted)',
              border: `1px solid ${speed === s ? 'var(--f1-red)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            }}>{s}x</button>
          ))}
        </div>
      </div>

      {/* ── Lap progress bar ── */}
      <div style={{ height: '3px', background: 'var(--bg-surface)' }}>
        <div style={{
          height: '100%',
          width: `${(((currentLap - 1) + animProgress) / totalLaps) * 100}%`,
          background: 'linear-gradient(90deg, var(--f1-red), var(--accent-gold-dim))',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>

      {/* ── Main area: Track + Leaderboard ── */}
      <div style={{ display: 'flex' }}>
        {/* Track SVG */}
        <div style={{ flex: 1, padding: '0.75rem', background: '#060610', position: 'relative', minHeight: '600px' }}>
          <svg ref={svgRef} viewBox={viewBox} style={{
            width: '100%', height: '600px',
            transform: trackData.rotation ? `rotate(${trackData.rotation}deg)` : undefined,
          }}>
            {/* Track glow */}
            <path d={trackPath} fill="none" stroke="rgba(225,6,0,0.06)" strokeWidth={scale * 16} strokeLinejoin="round" />
            {/* Track asphalt */}
            <path d={trackPath} fill="none" stroke="#222230" strokeWidth={scale * 10} strokeLinejoin="round" strokeLinecap="round" />
            {/* Track edge white lines */}
            <path d={trackPath} fill="none" stroke="#444454" strokeWidth={scale * 10.3} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={`${scale * 1.2} ${scale * 2.4}`} />
            {/* Center racing line */}
            <path d={trackPath} fill="none" stroke="rgba(100,100,130,0.2)" strokeWidth={scale * 0.3} strokeLinejoin="round" />

            {/* Start/Finish line */}
            {startPos && (
              <g transform={`translate(${startPos.x}, ${startPos.y}) rotate(${startPos.angle + 90})`}>
                {/* Line across track */}
                <line x1={-scale * 3.5} y1={0} x2={scale * 3.5} y2={0} stroke="white" strokeWidth={scale * 0.6} />
                <line x1={-scale * 3.5} y1={scale * 0.3} x2={scale * 3.5} y2={scale * 0.3} stroke="white" strokeWidth={scale * 0.3} strokeDasharray={`${scale * 0.7} ${scale * 0.7}`} />
              </g>
            )}
            {startPos && (
              <g transform={`translate(${startPos.x + Math.cos((startPos.angle + 90) * Math.PI / 180) * scale * 6}, ${startPos.y + Math.sin((startPos.angle + 90) * Math.PI / 180) * scale * 6})`}>
                {/* Checkered flag */}
                <rect x={-scale * 1.8} y={-scale * 1.5} width={scale * 3.6} height={scale * 2.4} rx={scale * 0.3} fill="#111" stroke="white" strokeWidth={scale * 0.15} />
                {[0, 1, 2, 3].map(r => [0, 1, 2, 3].map(c => (
                  <rect key={`${r}_${c}`}
                    x={-scale * 1.8 + c * scale * 0.9}
                    y={-scale * 1.5 + r * scale * 0.6}
                    width={scale * 0.9} height={scale * 0.6}
                    fill={(r + c) % 2 === 0 ? '#eee' : '#111'} />
                )))}
                <text x={0} y={scale * 2} textAnchor="middle" fill="white" fontSize={fontSz * 0.65}
                  fontFamily="'JetBrains Mono', monospace" fontWeight="700">S/F</text>
              </g>
            )}

            {/* Pit Lane indicator (opposite side of S/F flag) */}
            {startPos && (
              <g transform={`translate(${startPos.x - Math.cos((startPos.angle + 90) * Math.PI / 180) * scale * 7}, ${startPos.y - Math.sin((startPos.angle + 90) * Math.PI / 180) * scale * 7})`}>
                <rect x={-scale * 1.6} y={-scale * 0.8} width={scale * 3.2} height={scale * 1.6} rx={scale * 0.3}
                  fill="rgba(34,197,94,0.15)" stroke="#22c55e" strokeWidth={scale * 0.12} />
                <text x={0} y={scale * 0.1} textAnchor="middle" dominantBaseline="central"
                  fill="#22c55e" fontSize={fontSz * 0.7} fontFamily="'JetBrains Mono', monospace" fontWeight="800">
                  PIT
                </text>
                {/* Pit entry dashed line */}
                <line x1={scale * 1.6} y1={0} x2={scale * 3.5} y2={0}
                  stroke="#22c55e" strokeWidth={scale * 0.2} strokeDasharray={`${scale * 0.4} ${scale * 0.3}`} opacity="0.5" />
              </g>
            )}

            {/* Corner markers (subtle) */}
            {(trackData.corners || []).map(corner => (
              <g key={corner.number} opacity="0.5">
                <circle cx={corner.x} cy={corner.y} r={scale * 1.2} fill="rgba(50,50,70,0.6)" stroke="rgba(100,100,130,0.3)" strokeWidth={scale * 0.15} />
                <text x={corner.x} y={corner.y} textAnchor="middle" dominantBaseline="central"
                  fill="rgba(150,150,180,0.6)" fontSize={fontSz * 0.6} fontFamily="'JetBrains Mono', monospace" fontWeight="600">
                  {corner.number}
                </text>
              </g>
            ))}

            {/* ── Driver pills (render back to front: last place first, P1 on top) ── */}
            {[...driverTrackPositions].reverse().map(driver => {
              const isLeader = driver.position === 1;
              const isSelected = selectedDriver === driver.driver;
              const isPodium = driver.position <= 3;
              const color = driver.team_color || '#888';
              const x = driver.trackX;
              const y = driver.trackY;

              const borderColor = isLeader ? '#FFD700' : isSelected ? 'white' : color;
              const borderW = isLeader ? scale * 0.35 : scale * 0.2;

              return (
                <g key={driver.driver} style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedDriver(selectedDriver === driver.driver ? null : driver.driver)}>

                  {/* Leader golden pulse */}
                  {isLeader && (
                    <circle cx={x} cy={y} r={dotR * 2} fill="none" stroke="#FFD700" strokeWidth={scale * 0.2} opacity="0.4">
                      <animate attributeName="r" values={`${dotR * 1.5};${dotR * 2.5};${dotR * 1.5}`} dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Driver pill background */}
                  <rect
                    x={x - pillW / 2} y={y - pillH / 2}
                    width={pillW} height={pillH}
                    rx={pillH / 2}
                    fill={color}
                    stroke={borderColor}
                    strokeWidth={borderW}
                    opacity={isSelected || isPodium ? 1 : 0.9}
                  />

                  {/* Position number (left side) */}
                  <circle cx={x - pillW / 2 + pillH / 2} cy={y} r={pillH * 0.38}
                    fill={isLeader ? '#FFD700' : isPodium ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.4)'} />
                  <text x={x - pillW / 2 + pillH / 2} y={y}
                    textAnchor="middle" dominantBaseline="central"
                    fill={isLeader ? '#000' : 'white'}
                    fontSize={smallFontSz * 0.9} fontFamily="'JetBrains Mono', monospace" fontWeight="900">
                    {driver.position || ''}
                  </text>

                  {/* Driver abbreviation (right side) */}
                  <text x={x + pillW * 0.08} y={y}
                    textAnchor="middle" dominantBaseline="central"
                    fill="white"
                    fontSize={fontSz * 0.85} fontFamily="'JetBrains Mono', monospace" fontWeight="800">
                    {driver.driver}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Track legend overlay */}
          <div style={{
            position: 'absolute', top: '0.75rem', left: '0.75rem',
            background: 'rgba(6,6,16,0.85)', borderRadius: 'var(--radius-sm)',
            padding: '0.375rem 0.5rem', border: '1px solid var(--border-subtle)',
            fontSize: '0.55rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace",
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
              <div style={{ width: '10px', height: '6px', borderRadius: '3px', background: 'var(--f1-red)' }} />
              <span>= Driver (Position + Name)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '10px', height: '10px', border: '2px solid #FFD700', borderRadius: '50%' }} />
              <span>= Race Leader</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '10px', height: '6px', borderRadius: '2px', background: 'rgba(34,197,94,0.3)', border: '1px solid #22c55e' }} />
              <span>= Pit Lane</span>
            </div>
          </div>
        </div>

        {/* ── Live Leaderboard Sidebar ── */}
        <div className="mobile-hide" style={{
          width: '210px', minWidth: '210px',
          borderLeft: '1px solid var(--border-default)',
          background: 'var(--bg-card)', overflowY: 'auto', maxHeight: '640px',
        }}>
          <div style={{
            padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-default)',
            position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1,
          }}>
            <p style={{ fontSize: '0.55rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)', fontWeight: 700, letterSpacing: '0.1em' }}>
              LAP {currentLap} — STANDINGS
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
                  padding: '0.35rem 0.75rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--bg-surface)' : isLeader ? 'rgba(255,215,0,0.05)' : 'transparent',
                }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 900,
                  fontSize: '0.6rem', width: '1.1rem', textAlign: 'right',
                  color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'var(--text-dim)',
                }}>
                  {driver.position || idx + 1}
                </span>
                <div style={{ width: '3px', height: '14px', borderRadius: '2px', background: color, flexShrink: 0 }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                  fontSize: '0.65rem', color: isSelected ? 'white' : 'var(--text-secondary)', flex: 1,
                }}>
                  {driver.driver}
                </span>
                {driver.lapTime && (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.5rem', color: 'var(--text-dim)' }}>
                    {formatTime(driver.lapTime)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{
        padding: '0.625rem 1.25rem',
        borderTop: '1px solid var(--border-default)',
        display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap',
      }}>
        <button onClick={() => {
          if (currentLap >= totalLaps && !isPlaying) { setCurrentLap(1); setAnimProgress(0); }
          setIsPlaying(!isPlaying);
        }} className="btn-primary" style={{ padding: '0.4rem 1.25rem', fontSize: '0.75rem', fontWeight: 800 }}>
          {isPlaying ? '⏸ Pause' : currentLap >= totalLaps ? '🔄 Replay' : '▶ Play'}
        </button>
        <button onClick={() => { setCurrentLap(1); setAnimProgress(0); setIsPlaying(false); }}
          className="btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem' }}>⏮</button>
        <button onClick={() => { setCurrentLap(Math.max(1, currentLap - 5)); setAnimProgress(0); }}
          className="btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem' }}>-5</button>
        <button onClick={() => { setCurrentLap(Math.min(totalLaps, currentLap + 5)); setAnimProgress(0); }}
          className="btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem' }}>+5</button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '100px' }}>
          <input type="range" min="1" max={totalLaps || 1} value={currentLap}
            onChange={(e) => { setCurrentLap(parseInt(e.target.value)); setAnimProgress(0); }}
            style={{ flex: 1, height: '4px', accentColor: 'var(--f1-red)', cursor: 'pointer' }} />
          <span style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--f1-red)', minWidth: '3rem', textAlign: 'right' }}>
            {currentLap}/{totalLaps}
          </span>
        </div>
      </div>

      {/* ── Mobile driver legend ── */}
      <div style={{
        padding: '0.5rem 0.75rem', borderTop: '1px solid var(--border-default)',
        display: 'flex', flexWrap: 'wrap', gap: '0.25rem',
      }}>
        {currentPositions.slice(0, 12).map(driver => (
          <div key={driver.driver}
            onClick={() => setSelectedDriver(selectedDriver === driver.driver ? null : driver.driver)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.2rem',
              padding: '0.15rem 0.4rem', borderRadius: '10px',
              background: driver.team_color || '#888',
              border: selectedDriver === driver.driver ? '1.5px solid white' : '1.5px solid transparent',
              fontSize: '0.55rem', cursor: 'pointer', opacity: selectedDriver === driver.driver ? 1 : 0.85,
            }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '0.5rem', color: 'rgba(0,0,0,0.6)' }}>
              P{driver.position}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: 'white', fontSize: '0.55rem' }}>
              {driver.driver}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
