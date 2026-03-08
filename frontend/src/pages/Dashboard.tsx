import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRaces } from '../api'

interface RaceEvent {
  round_number: number
  country: string
  location: string
  event_name: string
  event_date: string | null
  event_format: string
}

export default function Dashboard() {
  const [races, setRaces] = useState<RaceEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [year] = useState(2025)

  useEffect(() => {
    getRaces(year)
      .then((res) => setRaces(res.data.events || []))
      .catch((err) => console.error('Failed to load races:', err))
      .finally(() => setLoading(false))
  }, [year])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-mono">
          <span className="text-pitwall-accent">F1</span> {year} Season
        </h1>
        <p className="text-pitwall-text-muted mt-1">Race calendar and analytics dashboard</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pitwall-accent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {races.map((race) => (
            <Link key={race.round_number} to={`/race/${year}/${race.round_number}`}
              className="group border border-pitwall-border bg-pitwall-card rounded-lg p-5 hover:border-pitwall-accent/50 transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-pitwall-accent font-mono text-sm font-bold">R{String(race.round_number).padStart(2, '0')}</span>
                  <h3 className="text-lg font-semibold mt-1 group-hover:text-pitwall-accent transition-colors">{race.country}</h3>
                  <p className="text-pitwall-text-muted text-sm">{race.location}</p>
                </div>
                <span className="text-xs text-pitwall-text-muted font-mono bg-pitwall-bg px-2 py-1 rounded">{race.event_format}</span>
              </div>
              {race.event_date && (
                <p className="text-xs text-pitwall-text-muted mt-3 font-mono">
                  {new Date(race.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
