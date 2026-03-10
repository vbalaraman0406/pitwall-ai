import React, { useState, useEffect, useRef } from 'react';
import { getOpenF1Locations, getOpenF1Positions, getOpenF1Drivers } from '../api';

/* ─── F1 Team Color Map ─── */
const TEAM_COLORS = {
  'Mercedes': '#27F4D2', 'McLaren': '#FF8000', 'Ferrari': '#E8002D',
  'Red Bull Racing': '#3671C6', 'Red Bull': '#3671C6', 'Aston Martin': '#229971',
  'Alpine': '#0093CC', 'Williams': '#64C4FF', 'Racing Bulls': '#6692FF',
  'Haas F1 Team': '#B6BABD', 'Haas': '#B6BABD', 'Cadillac': '#1E1E1E',
  'Kick Sauber': '#52E252', 'Sauber': '#52E252', 'Audi': '#E00000',
};

function getTeamColor(teamName) {
  if (!teamName) return '#888';
  for (const [k, v] of Object.entries(TEAM_COLORS)) {
    if (teamName.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return '#888';
}

/**
 * LiveTrackMap — Real-time driver positions from OpenF1 API
 *
 * Plots drivers on an SVG using x,y coordinates directly from OpenF1.
 * Polls every 4 seconds for fresh data.
 */
export default function LiveTrackMap({ sessionInfo }) {
  const [driverData, setDriverData] = useState([]);
  const [driverMeta, setDriverMeta] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const [polling, setPolling] = useState(true);
  const intervalRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Fetch driver metadata once
  useEffect(() => {
    const sk = sessionInfo?.session_key || 'latest';
    getOpenF1Drivers(sk).then(resp => {
      if (resp?.drivers) {
        const map = {};
        for (const d of resp.drivers) {
          map[d.driver_number] = {
            abbr: d.name_acronym || d.last_name?.substring(0, 3)?.toUpperCase() || `#${d.driver_number}`,
            firstName: d.first_name || '',
            lastName: d.last_name || '',
            team: d.team_name || '',
            color: d.team_colour ? `#${d.team_colour}` : getTeamColor(d.team_name || ''),
            number: d.driver_number,
            headshot: d.headshot_url,
          };
        }
        setDriverMeta(map);
      }
    });
  }, [sessionInfo]);

  // Poll for live data
  useEffect(() => {
    const fetchLive = async () => {
      try {
        const [locResp, posResp] = await Promise.all([
          getOpenF1Locations(),
          getOpenF1Positions(),
        ]);

        const locations = locResp?.locations || [];
        const positions = posResp?.positions || [];

        // Create position lookup
        const posMap = {};
        for (const p of positions) {
          posMap[p.driver_number] = p.position;
        }

        // Merge location + position
        const merged = locations
          .filter(loc => loc.x !== 0 || loc.y !== 0) // Filter out zeroed-out positions
          .map(loc => ({
            number: loc.driver_number,
            x: loc.x,
            y: loc.y,
            position: posMap[loc.driver_number] || null,
            date: loc.date,
          }));

        if (merged.length > 0) {
          setDriverData(merged);
          setLastUpdate(new Date());
          setConnectionStatus('live');
        } else {
          setConnectionStatus('no-data');
        }
      } catch {
        setConnectionStatus('error');
      }
    };

    fetchLive();
    if (polling) {
      intervalRef.current = setInterval(fetchLive, 4000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [polling]);

  // Calculate bounds for SVG viewBox
  const { viewBox, scale, drivers: renderedDrivers } = React.useMemo(() => {
    if (driverData.length === 0) return { viewBox: '0 0 1000 1000', scale: 1, drivers: [] };

    const xs = driverData.map(d => d.x);
    const ys = driverData.map(d => d.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const padding = Math.max(maxX - minX, maxY - minY) * 0.15;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    const sc = Math.max(width, height) / 100;

    const sorted = [...driverData].sort((a, b) => (a.position || 99) - (b.position || 99));

    return {
      viewBox: `${minX - padding} ${minY - padding} ${width} ${height}`,
      scale: sc,
      drivers: sorted.map(d => ({
        ...d,
        meta: driverMeta[d.number] || {
          abbr: `#${d.number}`,
          team: '',
          color: '#888',
          number: d.number,
        }
      })),
    };
  }, [driverData, driverMeta]);

  const dotR = scale * 1.4;
  const pillW = scale * 7;
  const pillH = scale * 3;
  const fontSz = scale * 1.6;
  const smallFontSz = scale * 1.2;

  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: connectionStatus === 'live' ? 'rgba(239,68,68,0.15)' : 'rgba(100,100,100,0.15)',
            padding: '0.3rem 0.75rem', borderRadius: '20px',
            border: connectionStatus === 'live' ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(100,100,100,0.3)',
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: connectionStatus === 'live' ? '#ef4444' : '#666',
              animation: connectionStatus === 'live' ? 'pulse 1.5s ease infinite' : 'none',
            }} />
            <span style={{
              fontSize: '0.65rem', fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              color: connectionStatus === 'live' ? '#ef4444' : '#666',
              letterSpacing: '0.1em',
            }}>
              {connectionStatus === 'live' ? 'LIVE' :
               connectionStatus === 'connecting' ? 'CONNECTING...' :
               connectionStatus === 'no-data' ? 'AWAITING DATA' : 'OFFLINE'}
            </span>
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>
              {sessionInfo?.session_name || 'Live Session'}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
              {sessionInfo?.circuit_short_name || ''}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {lastUpdate && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => setPolling(p => !p)}
            className="tab-btn"
            style={{
              fontSize: '0.65rem', padding: '0.25rem 0.6rem',
              background: polling ? 'rgba(34,197,94,0.15)' : 'rgba(100,100,100,0.15)',
              border: polling ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(100,100,100,0.3)',
              color: polling ? '#22c55e' : '#888',
            }}>
            {polling ? '⏸ Pause' : '▶ Resume'}
          </button>
        </div>
      </div>

      {/* Track SVG */}
      {renderedDrivers.length > 0 ? (
        <svg
          viewBox={viewBox}
          style={{ width: '100%', height: '600px', background: '#0a0a14', borderRadius: '12px' }}
        >
          {/* Grid reference */}
          <defs>
            <filter id="live-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={scale * 0.6} result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Draw each driver */}
          {renderedDrivers.map((d, i) => {
            const isLeader = d.position === 1;
            const isPodium = d.position <= 3;
            const teamColor = d.meta.color;

            return (
              <g key={d.number}
                 style={{ transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
                 transform={`translate(${d.x},${d.y})`}
                 filter={isLeader ? 'url(#live-glow)' : undefined}
              >
                {/* Background pill */}
                <rect
                  x={-pillW / 2} y={-pillH / 2}
                  width={pillW} height={pillH}
                  rx={pillH / 2}
                  fill={isLeader ? '#1a1a2e' : '#111125'}
                  stroke={teamColor}
                  strokeWidth={isLeader ? scale * 0.4 : scale * 0.2}
                  opacity={0.95}
                />

                {/* Position circle */}
                <circle
                  cx={-pillW / 2 + pillH / 2}
                  cy={0}
                  r={dotR}
                  fill={isPodium ? teamColor : '#333'}
                  opacity={0.9}
                />

                {/* Position number */}
                <text
                  x={-pillW / 2 + pillH / 2}
                  y={fontSz * 0.05}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isPodium ? '#000' : '#ddd'}
                  fontSize={smallFontSz}
                  fontWeight="900"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {d.position || '?'}
                </text>

                {/* Driver abbreviation */}
                <text
                  x={dotR * 0.5}
                  y={fontSz * 0.05}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={teamColor}
                  fontSize={fontSz}
                  fontWeight="900"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {d.meta.abbr}
                </text>

                {/* Leader pulse ring */}
                {isLeader && (
                  <rect
                    x={-pillW / 2 - scale * 0.3} y={-pillH / 2 - scale * 0.3}
                    width={pillW + scale * 0.6} height={pillH + scale * 0.6}
                    rx={pillH / 2 + scale * 0.3}
                    fill="none"
                    stroke="gold"
                    strokeWidth={scale * 0.2}
                    opacity={0.6}
                  >
                    <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite" />
                  </rect>
                )}
              </g>
            );
          })}
        </svg>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#0a0a14', borderRadius: '12px' }}>
          <div className="f1-spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>
            {connectionStatus === 'connecting' ? 'Connecting to OpenF1 live timing...' :
             'Waiting for live position data...'}
          </p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Live data appears during active F1 sessions (FP, Qualifying, Race)
          </p>
        </div>
      )}

      {/* Driver legend sidebar */}
      {renderedDrivers.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {renderedDrivers.slice(0, 22).map(d => (
            <div key={d.number} style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              background: 'rgba(255,255,255,0.03)', padding: '0.2rem 0.5rem',
              borderRadius: '4px', borderLeft: `2px solid ${d.meta.color}`,
              fontSize: '0.6rem', fontFamily: "'JetBrains Mono', monospace",
            }}>
              <span style={{ fontWeight: 900, color: d.meta.color }}>{d.meta.abbr}</span>
              <span style={{ color: 'var(--text-dim)' }}>P{d.position || '?'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
