import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CURRENT_SEASON } from '../constants';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '🏠' },
  { path: '/drivers', label: 'Drivers', icon: '🏎️' },
  { path: '/constructors', label: 'Constructors', icon: '🏗️' },
  { path: '/predictions', label: 'AI Predictions', icon: '🤖' },
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside className="carbon-bg" style={{
        width: '260px',
        minWidth: '260px',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-default)',
        }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              background: 'linear-gradient(135deg, var(--f1-red), var(--f1-red-dark))',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
            }}>
              <span style={{ color: 'white', fontWeight: 900, fontSize: '1.375rem', fontFamily: "'JetBrains Mono', monospace" }}>P</span>
            </div>
            <div>
              <h1 style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}>
                Pitwall<span style={{ color: 'var(--f1-red)' }}>.ai</span>
              </h1>
              <p style={{
                fontSize: '0.65rem',
                color: 'var(--accent-gold-dim)',
                marginTop: '3px',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                letterSpacing: '0.15em',
              }}>
                F1 ANALYTICS
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 700 : 500,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: isActive ? 'var(--f1-red-soft)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--f1-red)' : '3px solid transparent',
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: '1.125rem' }}>{item.icon}</span>
                {item.label}
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    bottom: '-1px',
                    left: '1rem',
                    right: '1rem',
                    height: '2px',
                    background: 'linear-gradient(90deg, var(--f1-red), var(--accent-gold-dim))',
                    borderRadius: '2px',
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Season Badge */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-default)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 6px rgba(34, 197, 94, 0.5)',
            }} />
            <span style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)', fontWeight: 700 }}>
              {CURRENT_SEASON} SEASON
            </span>
          </div>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
            Powered by FastF1 + Gemini AI
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        background: 'var(--bg-primary)',
      }} className="gradient-bg">
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
