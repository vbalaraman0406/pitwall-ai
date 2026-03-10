import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getRaceResults, getRaceLaps, getRaceStrategy, getTrackCoordinates, getDriverPositions } from "../api";
import TrackMap from "../components/TrackMap";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

const TEAM_COLORS = {
  "Red Bull Racing": "#3671C6",
  "McLaren": "#FF8000",
  "Ferrari": "#E8002D",
  "Mercedes": "#27F4D2",
  "Aston Martin": "#229971",
  "Alpine": "#00A1E8",
  "Williams": "#1868DB",
  "Racing Bulls": "#6692FF",
  "RB": "#6692FF",
  "Audi": "#F50537",
  "Sauber": "#52E252",
  "Haas F1 Team": "#B6BABD",
  "Haas": "#B6BABD",
  "Cadillac": "#909090",
};

const COMPOUND_COLORS = {
  SOFT: "var(--compound-soft)",
  MEDIUM: "var(--compound-medium)",
  HARD: "var(--compound-hard)",
  INTERMEDIATE: "var(--compound-inter)",
  WET: "var(--compound-wet)",
};

export default function RaceDashboard() {
  const { year, round } = useParams();
  const [results, setResults] = useState(null);
  const [laps, setLaps] = useState(null);
  const [strategy, setStrategy] = useState(null);
  const [trackData, setTrackData] = useState(null);
  const [positionData, setPositionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("results");
  const [error, setError] = useState(null);

  const y = parseInt(year);
  const r = parseInt(round);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [resResults, resLaps, resStrategy] = await Promise.allSettled([
          getRaceResults(y, r),
          getRaceLaps(y, r),
          getRaceStrategy(y, r),
        ]);
        if (resResults.status === "fulfilled") setResults(resResults.value);
        if (resLaps.status === "fulfilled") setLaps(resLaps.value);
        if (resStrategy.status === "fulfilled") setStrategy(resStrategy.value);
      } catch (err) {
        setError("Failed to load race data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [y, r]);

  // Lazy load track data only when tab is activated
  useEffect(() => {
    if (activeTab !== "track") return;
    if (trackData && positionData) return;

    const fetchTrack = async () => {
      const [track, positions] = await Promise.allSettled([
        getTrackCoordinates(y, r),
        getDriverPositions(y, r),
      ]);
      if (track.status === "fulfilled") setTrackData(track.value);
      if (positions.status === "fulfilled") setPositionData(positions.value);
    };
    fetchTrack();
  }, [activeTab, y, r, trackData, positionData]);

  // Process lap data for chart
  const getChartData = () => {
    if (!laps || !laps.laps) return { chartData: [], drivers: [] };
    const drivers = [...new Set(laps.laps.map((l) => l.driver))].slice(0, 5);
    const maxLap = Math.max(...laps.laps.map((l) => l.lap_number));
    const chartData = [];
    for (let lap = 1; lap <= maxLap; lap++) {
      const point = { lap };
      drivers.forEach((drv) => {
        const lapData = laps.laps.find(
          (l) => l.driver === drv && l.lap_number === lap
        );
        if (lapData && lapData.lap_time) {
          point[drv] = parseFloat(lapData.lap_time.toFixed(3));
        }
      });
      chartData.push(point);
    }
    return { chartData, drivers };
  };

  const getTeamColor = (team) => {
    for (const [key, color] of Object.entries(TEAM_COLORS)) {
      if (team && team.includes(key)) return color;
    }
    return "#888888";
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px',
            border: '4px solid var(--f1-red)',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading race data...</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
            First load may take 30-60s to fetch from F1 servers
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem', borderColor: 'rgba(225, 6, 0, 0.3)' }}>
        <p style={{ color: 'var(--f1-red)', fontSize: '1.125rem', marginBottom: '0.5rem' }}>{error}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Make sure the backend is running.</p>
      </div>
    );
  }

  const { chartData, drivers: chartDrivers } = getChartData();
  const TABS = ["results", "laptimes", "strategy", "track"];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
        <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</Link>
        <span style={{ color: 'var(--text-dim)' }}>›</span>
        <span style={{ color: 'var(--f1-red)', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
          Round {round}
        </span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--f1-red)', fontWeight: 600, marginBottom: '0.25rem' }}>
            ROUND {round} / {year}
          </p>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Race Dashboard</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            >
              {tab === "results" ? "Classification" : tab === "laptimes" ? "Lap Times" : tab === "strategy" ? "Strategy" : "Track Map"}
            </button>
          ))}
        </div>
      </div>

      {/* Results Table */}
      {activeTab === "results" && results && (
        <div className="card animate-fade-in" style={{ overflow: 'auto' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Race Classification</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>POS</th>
                <th>DRIVER</th>
                <th>TEAM</th>
                <th>GRID</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>POINTS</th>
              </tr>
            </thead>
            <tbody>
              {results.results &&
                results.results.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <span className={`pos-badge ${row.position <= 3 ? `pos-${row.position}` : ''}`}
                        style={row.position > 3 ? { background: 'var(--bg-surface)', color: 'var(--text-secondary)' } : {}}>
                        {row.position || "--"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '3px', height: '2rem', borderRadius: '2px',
                          background: getTeamColor(row.team),
                        }} />
                        <div>
                          <div style={{ fontWeight: 700 }}>{row.driver}</div>
                          {row.full_name && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.full_name}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{row.team}</td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>{row.grid_position || "--"}</td>
                    <td>
                      <span style={{
                        fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)',
                        background: row.status === "Finished" ? 'rgba(34, 197, 94, 0.15)' : 'rgba(225, 6, 0, 0.15)',
                        color: row.status === "Finished" ? '#22c55e' : '#ef4444',
                      }}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{row.points}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lap Times Chart */}
      {activeTab === "laptimes" && chartData && chartData.length > 0 && (
        <div className="card animate-fade-in">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Lap Time Comparison (Top 5)</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
              <XAxis dataKey="lap" stroke="var(--text-muted)" fontSize={12}
                label={{ value: "Lap", position: "insideBottom", offset: -5, fill: "var(--text-muted)" }} />
              <YAxis stroke="var(--text-muted)" fontSize={12} domain={["auto", "auto"]}
                label={{ value: "Time (s)", angle: -90, position: "insideLeft", fill: "var(--text-muted)" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.8rem",
                }}
              />
              <Legend />
              {chartDrivers &&
                chartDrivers.map((drv, i) => (
                  <Line
                    key={drv}
                    type="monotone"
                    dataKey={drv}
                    stroke={["#e10600", "#3671C6", "#FF8000", "#27F4D2", "#FF87BC"][i]}
                    dot={false}
                    strokeWidth={2}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tire Strategy */}
      {activeTab === "strategy" && strategy && (
        <div className="card animate-fade-in">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Tire Strategy</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {strategy.strategies &&
              strategy.strategies.map((s, i) => {
                const totalLaps = strategy.strategies[0]
                  ? Math.max(...strategy.strategies.flatMap((st) => st.stints.map((sn) => sn.end_lap)))
                  : 58;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '3rem', fontWeight: 700, fontSize: '0.8rem',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {s.driver}
                    </div>
                    <div style={{ flex: 1, display: 'flex', gap: '2px', height: '2rem' }}>
                      {s.stints.map((stint, j) => {
                        const widthPct = (stint.laps / totalLaps) * 100;
                        return (
                          <div
                            key={j}
                            style={{
                              width: `${widthPct}%`,
                              minWidth: '24px',
                              height: '100%',
                              borderRadius: 'var(--radius-sm)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              fontFamily: "'JetBrains Mono', monospace",
                              background: COMPOUND_COLORS[stint.compound] || '#888',
                              color: stint.compound === 'MEDIUM' || stint.compound === 'HARD' ? '#000' : '#fff',
                            }}
                            title={`${stint.compound} - Laps ${stint.start_lap}-${stint.end_lap} (${stint.laps} laps)`}
                          >
                            {stint.compound ? stint.compound[0] : "?"}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', width: '5rem', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>
                      {s.stints.map((st) => st.compound ? st.compound[0] : "?").join(" › ")}
                    </div>
                  </div>
                );
              })}
          </div>
          {/* Compound Legend */}
          <div style={{
            display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem',
            borderTop: '1px solid var(--border-default)',
          }}>
            {Object.entries(COMPOUND_COLORS).map(([compound, color]) => (
              <div key={compound} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <div style={{
                  width: '12px', height: '12px', borderRadius: '3px', background: color,
                  border: compound === 'HARD' ? '1px solid var(--border-default)' : 'none',
                }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {compound.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Track Map */}
      {activeTab === "track" && (
        <div className="animate-fade-in">
          <TrackMap trackData={trackData} positionData={positionData} />
        </div>
      )}
    </div>
  );
}
