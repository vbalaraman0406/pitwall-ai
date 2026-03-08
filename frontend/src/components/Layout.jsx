import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '⌂' },
  { path: '/drivers', label: 'Drivers', icon: '⚑' },
  { path: '/predictions', label: 'Predictions', icon: '☄' },
];

/**
 * @description Main layout with dark sidebar navigation and content area.
 * Includes Pitwall.ai branding and responsive sidebar.
 */
export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-f1-card border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-f1-red rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Pitwall<span className="text-f1-red">.ai</span></h1>
              <p className="text-xs text-f1-muted">F1 Analytics</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-f1-red/10 text-f1-red border border-f1-red/20'
                    : 'text-f1-muted hover:text-white hover:bg-f1-card-hover'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="text-xs text-f1-muted">
            <p>Powered by FastF1</p>
            <p className="mt-1">v1.0.0</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-f1-dark">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
