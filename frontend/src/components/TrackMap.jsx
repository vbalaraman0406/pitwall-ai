import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * TrackMap - Interactive circuit visualization with driver position animation.
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
  const svgRef = useRef(null);
  const animRef = useRef(null);
  const lastTimeRef = useRef(null);

  const totalLaps = positionData?.total_laps || 0;
  const drivers = positionData?.drivers || [];
  const coords = trackData?.coordinates || [];

  // Compute SVG viewport from track coordinates
  const { viewBox, transform, trackPath } = React.useMemo(() => {
    if (!coords.length) return { viewBox: '0 0 1000 1000', transform: '', trackPath: '' };

    const xs = coords.map(c => c.x);
    const ys = coords.map(c => c.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const padding = (maxX - minX) * 0.1;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    const vb = `${minX - padding} ${minY - padding} ${width} ${height}`;

    // Build SVG path
    const pathParts = coords.map((c, i) =>
      i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`
    );
    pathParts.push('Z');

    return {
      viewBox: vb,
      transform: '',
      trackPath: pathParts.join(' '),
    };
  }, [coords]);

  // Get driver position for a specific lap
  const getDriverLapData = useCallback((driver, lap) => {
    const driverData = drivers.find(d => d.driver === driver.driver);
    if (!driverData) return null;
    return driverData.laps.find(l => l.lap === lap) || null;
  }, [drivers]);

  // Get interpolated position for a driver
  const getDriverPosition = useCallback((driver, lap, progress) => {
    const lapData = getDriverLapData(driver, lap);
    if (!lapData || !lapData.points || lapData.points.length === 0) {
      // Fallback: place on track path proportionally
      if (coords.length === 0) return null;
      const idx = Math.floor((drivers.indexOf(driver) / drivers.length) * coords.length);
      return coords[idx] || coords[0];
    }

    const points = lapData.points;
    const idx = Math.min(Math.floor(progress * points.length), points.length - 1);
    return points[idx];
  }, [getDriverLapData, coords, drivers]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || totalLaps === 0) return;

    const animate = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Each lap takes ~2 seconds at 1x speed
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

  if (!trackData || coords.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid var(--f1-red)',
          borderTop: '4px solid transparent',
          borderRadius: '50%',
          margin: '0 auto 1rem',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading track data...</p>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
          First load may take 30-60s to fetch telemetry from F1 servers
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Circuit Track Map</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
            LAP {currentLap} / {totalLaps}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Speed selector */}
          {[1, 2, 5, 10].map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.7rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                background: speed === s ? 'var(--f1-red)' : 'var(--bg-surface)',
                color: speed === s ? 'white' : 'var(--text-muted)',
                border: `1px solid ${speed === s ? 'var(--f1-red)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Track SVG */}
      <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)' }}>
        <svg
          ref={svgRef}
          viewBox={viewBox}
          style={{
            width: '100%',
            height: '400px',
            transform: trackData.rotation ? `rotate(${trackData.rotation}deg)` : undefined,
          }}
        >
          {/* Track outline - glow */}
          <path
            d={trackPath}
            fill="none"
            stroke="rgba(225, 6, 0, 0.15)"
            strokeWidth="800"
            strokeLinejoin="round"
          />
          {/* Track surface */}
          <path
            d={trackPath}
            fill="none"
            stroke="#333340"
            strokeWidth="400"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Track center line */}
          <path
            d={trackPath}
            fill="none"
            stroke="#555568"
            strokeWidth="40"
            strokeDasharray="200 150"
            strokeLinejoin="round"
          />

          {/* Corner numbers */}
          {(trackData.corners || []).map(corner => (
            <g key={corner.number}>
              <circle cx={corner.x} cy={corner.y} r="200" fill="var(--bg-surface)" stroke="var(--border-default)" strokeWidth="30" />
              <text
                x={corner.x}
                y={corner.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--text-muted)"
                fontSize="160"
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="700"
              >
                {corner.number}
              </text>
            </g>
          ))}

          {/* Driver dots */}
          {drivers.map((driver) => {
            const pos = getDriverPosition(driver, currentLap, animProgress);
            if (!pos) return null;

            const lapData = getDriverLapData(driver, currentLap);
            const driverPos = lapData?.position;

            return (
              <g key={driver.driver}>
                {/* Glow */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="350"
                  fill={driver.team_color || '#888'}
                  opacity="0.3"
                />
                {/* Dot */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="200"
                  fill={driver.team_color || '#888'}
                  stroke="white"
                  strokeWidth="40"
                />
                {/* Label */}
                <text
                  x={pos.x + 350}
                  y={pos.y - 200}
                  fill="white"
                  fontSize="180"
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="700"
                >
                  {driver.driver}
                </text>
                {driverPos && (
                  <text
                    x={pos.x + 350}
                    y={pos.y + 100}
                    fill="var(--text-muted)"
                    fontSize="130"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    P{driverPos}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Controls */}
      <div style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
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
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.8125rem' }}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        <button
          onClick={() => { setCurrentLap(1); setAnimProgress(0); setIsPlaying(false); }}
          className="btn-secondary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
        >
          ⏮ Reset
        </button>

        {/* Lap slider */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
            LAP
          </span>
          <input
            type="range"
            min="1"
            max={totalLaps || 1}
            value={currentLap}
            onChange={(e) => {
              setCurrentLap(parseInt(e.target.value));
              setAnimProgress(0);
            }}
            style={{
              flex: 1,
              height: '4px',
              accentColor: 'var(--f1-red)',
              cursor: 'pointer',
            }}
          />
          <span style={{
            fontSize: '0.8rem',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            color: 'var(--f1-red)',
            minWidth: '3rem',
            textAlign: 'right',
          }}>
            {currentLap}/{totalLaps}
          </span>
        </div>
      </div>

      {/* Driver Legend */}
      <div style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid var(--border-default)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        {drivers.slice(0, 10).map(driver => {
          const lapData = getDriverLapData(driver, currentLap);
          return (
            <div
              key={driver.driver}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.25rem 0.5rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                fontSize: '0.7rem',
              }}
            >
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: driver.team_color || '#888',
              }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                {driver.driver}
              </span>
              {lapData?.lap_time && (
                <span style={{ color: 'var(--text-muted)' }}>
                  {lapData.lap_time.toFixed(1)}s
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
