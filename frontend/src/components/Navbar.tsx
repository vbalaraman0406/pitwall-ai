import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="border-b border-pitwall-border bg-pitwall-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-pitwall-accent font-bold text-2xl font-mono">PITWALL</span>
          <span className="text-pitwall-text-muted text-sm">.ai</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-pitwall-text-muted hover:text-pitwall-text transition-colors text-sm font-medium">Dashboard</Link>
          <Link to="/drivers/2025" className="text-pitwall-text-muted hover:text-pitwall-text transition-colors text-sm font-medium">Drivers</Link>
          <div className="h-4 w-px bg-pitwall-border"></div>
          <span className="text-xs text-pitwall-text-muted font-mono">2025</span>
        </div>
      </div>
    </nav>
  )
}
