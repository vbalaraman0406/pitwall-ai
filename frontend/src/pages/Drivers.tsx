import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getDrivers } from '../api'

interface Driver {
  driver_number: string
  broadcast_name: string
  abbreviation: string
  team_name: string
}

export default function Drivers() {
  const { year } = useParams()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!year) return
    getDrivers(parseInt(year))
      .then((res) => setDrivers(res.data.drivers || []))
      .catch((err) => console.error('Failed to load drivers:', err))
      .finally(() => setLoading(false))
  }, [year])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pitwall-accent"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold font-mono mb-6">
        <span className="text-pitwall-accent">Drivers</span> - {year} Season
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {drivers.map((d) => (
          <div key={d.driver_number}
            className="border border-pitwall-border bg-pitwall-card rounded-lg p-5 hover:border-pitwall-accent/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold font-mono text-pitwall-accent">{d.abbreviation}</span>
              <span className="text-pitwall-text-muted font-mono text-sm">#{d.driver_number}</span>
            </div>
            <p className="font-semibold">{d.broadcast_name}</p>
            <p className="text-pitwall-text-muted text-sm mt-1">{d.team_name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
