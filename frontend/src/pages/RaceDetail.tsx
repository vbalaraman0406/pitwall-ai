import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getRaceResults, getStrategy } from '../api'

interface Result {
  Position: number
  Abbreviation: string
  BroadcastName: string
  TeamName: string
  GridPosition: number
  Status: string
  Points: number
}

interface Stint {
  Driver: string
  Stint: number
  Compound: string
  StintStartLap: number
  StintEndLap: number
  TotalLaps: number
}

const compoundColors: Record<string, string> = {
  SOFT: 'bg-red-500',
  MEDIUM: 'bg-yellow-400',
  HARD: 'bg-gray-200',
  INTERMEDIATE: 'bg-green-500',
  WET: 'bg-blue-500',
}

export default function RaceDetail() {
  const { year, round } = useParams()
  const [results, setResults] = useState<Result[]>([])
  const [strategy, setStrategy] = useState<Stint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!year || !round) return
    const y = parseInt(year)
    const r = parseInt(round)
    Promise.all([
      getRaceResults(y, r).then((res) => setResults(res.data.results || [])),
      getStrategy(y, r).then((res) => setStrategy(res.data.strategy || [])),
    ])
      .catch((err) => console.error('Failed to load race data:', err))
      .finally(() => setLoading(false))
  }, [year, round])

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
        <span className="text-pitwall-accent">Round {round}</span> - {year} Season
      </h1>
      <div className="border border-pitwall-border bg-pitwall-card rounded-lg overflow-hidden mb-8">
        <div className="px-5 py-3 border-b border-pitwall-border">
          <h2 className="font-semibold font-mono text-sm text-pitwall-accent">RACE CLASSIFICATION</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-pitwall-border text-pitwall-text-muted text-xs font-mono">
              <th className="px-4 py-2 text-left">POS</th>
              <th className="px-4 py-2 text-left">DRIVER</th>
              <th className="px-4 py-2 text-left">TEAM</th>
              <th className="px-4 py-2 text-center">GRID</th>
              <th className="px-4 py-2 text-left">STATUS</th>
              <th className="px-4 py-2 text-right">PTS</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} className="border-b border-pitwall-border/50 hover:bg-pitwall-bg/50 transition-colors">
                <td className="px-4 py-2 font-mono font-bold">
                  {r.Position <= 3 ? (
                    <span className={r.Position === 1 ? 'text-yellow-400' : r.Position === 2 ? 'text-gray-300' : 'text-amber-600'}>
                      P{r.Position}
                    </span>
                  ) : (<span>P{r.Position}</span>)}
                </td>
                <td className="px-4 py-2 font-semibold">{r.Abbreviation}</td>
                <td className="px-4 py-2 text-pitwall-text-muted">{r.TeamName}</td>
                <td className="px-4 py-2 text-center font-mono">{r.GridPosition}</td>
                <td className="px-4 py-2 text-pitwall-text-muted text-xs">{r.Status}</td>
                <td className="px-4 py-2 text-right font-mono font-bold">{r.Points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border border-pitwall-border bg-pitwall-card rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-pitwall-border">
          <h2 className="font-semibold font-mono text-sm text-pitwall-accent">TIRE STRATEGY</h2>
        </div>
        <div className="p-5 space-y-2">
          {Array.from(new Set(strategy.map((s) => s.Driver))).map((driver) => {
            const driverStints = strategy.filter((s) => s.Driver === driver)
            const maxLap = Math.max(...strategy.map((s) => s.StintEndLap))
            return (
              <div key={driver} className="flex items-center gap-3">
                <span className="w-10 font-mono text-xs font-bold text-pitwall-text-muted">{driver}</span>
                <div className="flex-1 flex h-6 gap-px">
                  {driverStints.map((stint, i) => {
                    const width = ((stint.TotalLaps / maxLap) * 100).toFixed(1)
                    return (
                      <div key={i}
                        className={`${compoundColors[stint.Compound] || 'bg-gray-500'} rounded-sm flex items-center justify-center text-[10px] font-mono font-bold text-black`}
                        style={{ width: `${width}%` }}
                        title={`${stint.Compound} - Laps ${stint.StintStartLap}-${stint.StintEndLap} (${stint.TotalLaps} laps)`}>
                        {stint.TotalLaps > 5 ? stint.Compound[0] : ''}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
