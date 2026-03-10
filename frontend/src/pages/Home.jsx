import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRaceSchedule, getDriverPhotos } from '../api';

const F1_FACTS = [
  "An F1 car can accelerate from 0-100mph and brake back to 0 in under 5 seconds",
  "F1 drivers experience up to 6G of force during heavy braking",
  "A Formula 1 car has about 80,000 components and loses ~4kg in weight during a race",
  "The brake discs on an F1 car can reach temperatures of 1,000°C",
  "F1 steering wheels cost around $50,000 and have over 20 buttons",
  "Lewis Hamilton holds the record for most career wins with 105 victories",
  "An F1 car generates enough downforce to drive upside down on a ceiling at speed",
  "The average F1 pitstop takes less than 2.5 seconds",
  "F1 cars can produce 1,000+ horsepower from their hybrid power units",
  "Monaco GP is the shortest circuit at 3.337 km but has the most corners (19)",
];

export default function Home() {
  const [schedule, setSchedule] = useState([]);
  const [photos, setPhotos] = useState({});
  const [loading, setLoading] = useState(true);
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    Promise.all([
      getRaceSchedule(2025),
      getDriverPhotos(),
    ]).then(([schedData, photoData]) => {
      if (Array.isArray(schedData)) setSchedule(schedData);
      if (photoData) setPhotos(photoData);
      setLoading(false);
    }).catch(() => setLoading(false));

    setFactIndex(Math.floor(Math.random() * F1_FACTS.length));
  }, []);

  // Find next upcoming race
  const now = new Date();
  const nextRace = schedule.find(r => new Date(r.date) > now) || schedule[0];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Section */}
      <div className="gradient-ferrari" style={{
        padding: '3rem 2.5rem',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-accent)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '220px', height: '220px',
          background: 'radial-gradient(circle, rgba(239, 26, 45, 0.18) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', right: '100px',
          width: '150px', height: '150px',
          background: 'radial-gradient(circle, rgba(226, 177, 60, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <p style={{
          fontSize: '0.7rem',
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          color: 'var(--accent-gold-dim)',
          letterSpacing: '0.2em',
          marginBottom: '1rem',
        }}>
          FORMULA 1 ANALYTICS PLATFORM
        </p>
        <h1 style={{
          fontSize: '3.25rem',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          marginBottom: '0.75rem',
          lineHeight: 1.1,
        }}>
          Welcome to<br/>
          <span style={{ color: 'var(--f1-red)' }}>Pitwall</span><span style={{ color: 'var(--accent-gold-dim)' }}>.</span><span>ai</span>
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-secondary)',
          maxWidth: '640px',
          lineHeight: 1.8,
        }}>
          Deep analytics, live telemetry replays, AI-powered predictions, and comprehensive driver & team data.
          Your ultimate pit wall companion for the 2025 season.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
          {nextRace && (
            <Link to={`/race/2025/${nextRace.round}`} className="btn-primary">
              🏁 {nextRace.name || 'Latest Race'}
            </Link>
          )}
          <Link to="/predictions" className="btn-secondary">
            🤖 AI Predictions
          </Link>
          <Link to="/drivers" className="btn-secondary">
            🏎️ Drivers
          </Link>
        </div>
      </div>

      {/* F1 Fun Fact */}
      <div className="card card-gold" style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '1rem 1.25rem',
        cursor: 'pointer',
      }} onClick={() => setFactIndex((factIndex + 1) % F1_FACTS.length)}>
        <span style={{ fontSize: '1.5rem' }}>💡</span>
        <div>
          <p style={{ fontSize: '0.65rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)', fontWeight: 700, marginBottom: '0.25rem', letterSpacing: '0.1em' }}>
            F1 FAST FACT • CLICK FOR MORE
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {F1_FACTS[factIndex]}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'RACES', value: schedule.length || 24, color: 'var(--f1-red)' },
          { label: 'DRIVERS', value: 22, color: 'var(--accent-gold-dim)' },
          { label: 'TEAMS', value: 11, color: '#00D7B6' },
          { label: 'SEASON', value: 2025, color: 'var(--text-primary)' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ textAlign: 'center' }}>
            <p className="stat-value" style={{ color: stat.color }}>{stat.value}</p>
            <p className="stat-label">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Feature Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          {
            icon: '🗺️',
            title: 'Track Map Replays',
            desc: 'Replay race action with animated driver positions on the real circuit layout using telemetry data.',
            link: schedule.length > 0 ? `/race/2025/${schedule[0].round}` : '/race/2025/1',
            tag: 'TELEMETRY',
          },
          {
            icon: '🧠',
            title: 'Gemini AI Predictions',
            desc: 'Multi-factor AI analysis predicting race outcomes with confidence scores and upset risk assessment.',
            link: '/predictions',
            tag: 'AI-POWERED',
          },
          {
            icon: '📊',
            title: 'Driver Performance',
            desc: 'Season-long driver comparisons with official F1 headshots, stats, and team analysis.',
            link: '/drivers',
            tag: 'ANALYTICS',
          },
        ].map(feature => (
          <Link key={feature.title} to={feature.link} className="card" style={{
            textDecoration: 'none', color: 'inherit', display: 'block',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '2rem' }}>{feature.icon}</span>
              <span style={{
                fontSize: '0.6rem', fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700, color: 'var(--accent-gold-dim)',
                padding: '0.2rem 0.5rem', background: 'var(--accent-gold-soft)',
                borderRadius: 'var(--radius-sm)', letterSpacing: '0.08em',
              }}>
                {feature.tag}
              </span>
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>{feature.title}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>{feature.desc}</p>
          </Link>
        ))}
      </div>

      {/* Top Drivers Quick Glance */}
      {Object.keys(photos).length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>2025 Grid Spotlight</h2>
            <Link to="/drivers" style={{ fontSize: '0.8rem', color: 'var(--f1-red)', textDecoration: 'none', fontWeight: 600 }}>
              View All →
            </Link>
          </div>
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {['NOR', 'VER', 'LEC', 'HAM', 'PIA', 'RUS', 'ALO', 'ANT'].map(abbr => {
              const d = photos[abbr];
              if (!d) return null;
              return (
                <Link key={abbr} to="/drivers" style={{
                  textDecoration: 'none', color: 'inherit', textAlign: 'center',
                  minWidth: '100px', flexShrink: 0,
                }}>
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    overflow: 'hidden', margin: '0 auto',
                    border: `2px solid ${d.team_colour}`,
                    background: 'var(--bg-secondary)',
                    boxShadow: `0 0 12px ${d.team_colour}33`,
                  }}>
                    <img src={d.headshot_url} alt={d.full_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <p style={{ fontSize: '0.8rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", marginTop: '0.5rem', color: d.team_colour }}>{abbr}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d.team_name}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <hr className="gold-divider" />

      {/* Race Calendar */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            2025 Race Calendar
          </h2>
          <span style={{
            fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--accent-gold-dim)', fontWeight: 700,
          }}>
            {schedule.length} ROUNDS
          </span>
        </div>

        {loading ? (
          <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        ) : (
          <div className="stagger-children" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem',
          }}>
            {schedule.map((race) => {
              const isPast = new Date(race.date) < now;
              return (
                <Link
                  key={race.round}
                  to={`/race/2025/${race.round}`}
                  className="card"
                  style={{
                    textDecoration: 'none', color: 'inherit',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    opacity: isPast ? 0.7 : 1,
                  }}
                >
                  <div style={{
                    width: '3rem', height: '3rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 'var(--radius-md)',
                    background: isPast ? 'var(--bg-surface)' : 'var(--f1-red-soft)',
                    border: `1px solid ${isPast ? 'var(--border-default)' : 'var(--border-accent)'}`,
                  }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 900, fontSize: '1rem',
                      color: isPast ? 'var(--text-dim)' : 'var(--f1-red)',
                    }}>
                      {String(race.round).padStart(2, '0')}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.125rem' }}>
                      {race.name || 'TBD'}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {race.country} • {race.date || 'Date TBD'}
                    </p>
                  </div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '1rem' }}>›</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
