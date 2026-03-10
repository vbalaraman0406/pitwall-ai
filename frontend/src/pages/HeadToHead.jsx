import React, { useState, useEffect } from 'react';
import { getRaceSchedule, getRaceResults, getQualifyingResults, getDriverPhotos } from '../api';
import { CURRENT_SEASON } from '../constants';

const TEAMS = [
  { name: 'McLaren', drivers: ['NOR', 'PIA'], color: '#FF8000' },
  { name: 'Ferrari', drivers: ['LEC', 'HAM'], color: '#E8002D' },
  { name: 'Red Bull Racing', drivers: ['VER', 'HAD'], color: '#3671C6' },
  { name: 'Mercedes', drivers: ['RUS', 'ANT'], color: '#27F4D2' },
  { name: 'Aston Martin', drivers: ['ALO', 'STR'], color: '#229971' },
  { name: 'Williams', drivers: ['SAI', 'ALB'], color: '#64C4FF' },
  { name: 'Alpine', drivers: ['GAS', 'COL'], color: '#FF87BC' },
  { name: 'Haas F1 Team', drivers: ['OCO', 'BEA'], color: '#B6BABD' },
  { name: 'Racing Bulls', drivers: ['LAW', 'LIN'], color: '#6692FF' },
  { name: 'Audi', drivers: ['HUL', 'BOR'], color: '#990000' },
  { name: 'Cadillac', drivers: ['PER', 'BOT'], color: '#1E1E1E' },
];

const POINTS_MAP = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const getPoints = (pos) => pos && pos <= 10 ? POINTS_MAP[pos - 1] : 0;

export default function HeadToHead() {
  const [photos, setPhotos] = useState({});
  const [selectedTeam, setSelectedTeam] = useState(TEAMS[0]);
  const [h2hData, setH2hData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    Promise.all([getDriverPhotos(), getRaceSchedule(CURRENT_SEASON)])
      .then(([photoData, sched]) => {
        if (photoData) setPhotos(photoData);
        if (Array.isArray(sched)) setSchedule(sched);
      });
  }, []);

  useEffect(() => {
    if (schedule.length === 0) return;
    setLoading(true);
    const completedRounds = schedule.filter(r => r.date && new Date(r.date) < new Date()).map(r => r.round);
    if (completedRounds.length === 0) { setLoading(false); return; }

    const [d1, d2] = selectedTeam.drivers;
    Promise.all(completedRounds.map(async (round) => {
      const [race, quali] = await Promise.all([
        getRaceResults(CURRENT_SEASON, round).catch(() => null),
        getQualifyingResults(CURRENT_SEASON, round).catch(() => null),
      ]);
      const raceInfo = schedule.find(r => r.round === round);
      const raceResults = race?.results || [];
      const qualiResults = quali?.results || [];
      const d1Race = raceResults.find(r => r.driver === d1);
      const d2Race = raceResults.find(r => r.driver === d2);
      const d1Quali = qualiResults.find(r => r.driver === d1);
      const d2Quali = qualiResults.find(r => r.driver === d2);
      return {
        round, name: raceInfo?.name || `R${round}`,
        d1Race: d1Race?.position, d2Race: d2Race?.position,
        d1Quali: d1Quali?.position, d2Quali: d2Quali?.position,
        d1Status: d1Race?.status, d2Status: d2Race?.status,
      };
    })).then(rounds => {
      let raceH2H_d1 = 0, raceH2H_d2 = 0, qualiH2H_d1 = 0, qualiH2H_d2 = 0;
      let d1Points = 0, d2Points = 0, d1BestRace = 99, d2BestRace = 99, d1DNFs = 0, d2DNFs = 0;
      let d1BestQuali = 99, d2BestQuali = 99;

      rounds.forEach(r => {
        if (r.d1Race && r.d2Race) {
          if (r.d1Race < r.d2Race) raceH2H_d1++; else if (r.d2Race < r.d1Race) raceH2H_d2++;
        }
        if (r.d1Quali && r.d2Quali) {
          if (r.d1Quali < r.d2Quali) qualiH2H_d1++; else if (r.d2Quali < r.d1Quali) qualiH2H_d2++;
        }
        if (r.d1Race) { d1Points += getPoints(r.d1Race); d1BestRace = Math.min(d1BestRace, r.d1Race); }
        if (r.d2Race) { d2Points += getPoints(r.d2Race); d2BestRace = Math.min(d2BestRace, r.d2Race); }
        if (r.d1Quali) d1BestQuali = Math.min(d1BestQuali, r.d1Quali);
        if (r.d2Quali) d2BestQuali = Math.min(d2BestQuali, r.d2Quali);
        if (r.d1Status && r.d1Status !== 'Finished' && r.d1Status !== 'Lapped') d1DNFs++;
        if (r.d2Status && r.d2Status !== 'Finished' && r.d2Status !== 'Lapped') d2DNFs++;
      });

      setH2hData({
        rounds, d1, d2,
        raceH2H: [raceH2H_d1, raceH2H_d2],
        qualiH2H: [qualiH2H_d1, qualiH2H_d2],
        points: [d1Points, d2Points],
        bestRace: [d1BestRace === 99 ? '—' : `P${d1BestRace}`, d2BestRace === 99 ? '—' : `P${d2BestRace}`],
        bestQuali: [d1BestQuali === 99 ? '—' : `P${d1BestQuali}`, d2BestQuali === 99 ? '—' : `P${d2BestQuali}`],
        dnfs: [d1DNFs, d2DNFs],
      });
      setLoading(false);
    });
  }, [selectedTeam, schedule]);

  const getPhoto = (abbr) => photos[abbr]?.headshot_url || '';

  const ComparisonBar = ({ label, v1, v2, higher = 'more' }) => {
    const total = v1 + v2 || 1;
    const p1 = (v1 / total) * 100;
    const w1 = higher === 'more' ? v1 >= v2 : v1 <= v2;
    const w2 = higher === 'more' ? v2 >= v1 : v2 <= v1;
    return (
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1.1rem', color: w1 ? selectedTeam.color : 'var(--text-dim)' }}>{v1}</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1.1rem', color: w2 ? selectedTeam.color : 'var(--text-dim)' }}>{v2}</span>
        </div>
        <div style={{ height: '8px', borderRadius: '4px', background: 'var(--bg-surface)', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${p1}%`, background: w1 ? selectedTeam.color : 'var(--text-dim)', borderRadius: '4px 0 0 4px', transition: 'width 0.5s ease' }} />
          <div style={{ width: `${100 - p1}%`, background: w2 ? selectedTeam.color : 'var(--text-dim)', opacity: 0.5, borderRadius: '0 4px 4px 0', transition: 'width 0.5s ease' }} />
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <p style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)', fontWeight: 700, letterSpacing: '0.15em' }}>
          TEAMMATE BATTLE
        </p>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
          Head to <span style={{ color: 'var(--f1-red)' }}>Head</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          Compare teammates across qualifying and race results.
        </p>
      </div>

      {/* Team Selector */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {TEAMS.map(team => (
          <button key={team.name} onClick={() => setSelectedTeam(team)}
            className={`tab-btn ${selectedTeam.name === team.name ? 'active' : ''}`}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, borderColor: selectedTeam.name === team.name ? team.color : undefined,
              background: selectedTeam.name === team.name ? team.color + '22' : undefined, color: selectedTeam.name === team.name ? team.color : undefined }}>
            {team.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="f1-spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading teammate data...</p>
        </div>
      ) : h2hData ? (
        <>
          {/* Driver header cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: '1rem', alignItems: 'center' }}>
            {[0, 1].map(i => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: '1.5rem', borderTop: `3px solid ${selectedTeam.color}`, order: i === 0 ? 0 : 2 }}>
                {getPhoto(h2hData[i === 0 ? 'd1' : 'd2']) && (
                  <img src={getPhoto(h2hData[i === 0 ? 'd1' : 'd2'])} alt={h2hData[i === 0 ? 'd1' : 'd2']}
                    style={{ width: '80px', height: '80px', borderRadius: '50%', border: `3px solid ${selectedTeam.color}`, objectFit: 'cover', margin: '0 auto 0.75rem' }}
                    onError={e => e.target.style.display = 'none'} />
                )}
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: selectedTeam.color }}>{h2hData[i === 0 ? 'd1' : 'd2']}</h3>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1.5rem', color: '#22c55e', marginTop: '0.5rem' }}>{h2hData.points[i]} <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>PTS</span></p>
              </div>
            ))}
            <div style={{ textAlign: 'center', order: 1 }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--f1-red)' }}>VS</p>
            </div>
          </div>

          {/* Comparison bars */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <ComparisonBar label="Race H2H" v1={h2hData.raceH2H[0]} v2={h2hData.raceH2H[1]} />
            <ComparisonBar label="Qualifying H2H" v1={h2hData.qualiH2H[0]} v2={h2hData.qualiH2H[1]} />
            <ComparisonBar label="Points" v1={h2hData.points[0]} v2={h2hData.points[1]} />
            <ComparisonBar label="DNFs" v1={h2hData.dnfs[0]} v2={h2hData.dnfs[1]} higher="less" />
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: 'Best Race', vals: h2hData.bestRace },
              { label: 'Best Qualifying', vals: h2hData.bestQuali },
              { label: 'Total Points', vals: h2hData.points },
              { label: 'Retirements', vals: h2hData.dnfs },
            ].map(stat => (
              <div key={stat.label} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1.25rem', color: selectedTeam.color }}>{stat.vals[0]}</p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{h2hData.d1}</p>
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</p>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1.25rem', color: selectedTeam.color }}>{stat.vals[1]}</p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{h2hData.d2}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Round-by-round table */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>Round-by-Round Breakdown</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ROUND</th>
                  <th>GRAND PRIX</th>
                  <th>{h2hData.d1} QUALI</th>
                  <th>{h2hData.d2} QUALI</th>
                  <th>{h2hData.d1} RACE</th>
                  <th>{h2hData.d2} RACE</th>
                  <th>WINNER</th>
                </tr>
              </thead>
              <tbody>
                {h2hData.rounds.map(r => {
                  const qualiWinner = r.d1Quali && r.d2Quali ? (r.d1Quali < r.d2Quali ? h2hData.d1 : h2hData.d2) : '—';
                  const raceWinner = r.d1Race && r.d2Race ? (r.d1Race < r.d2Race ? h2hData.d1 : h2hData.d2) : '—';
                  return (
                    <tr key={r.round}>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.75rem' }}>R{String(r.round).padStart(2, '0')}</td>
                      <td style={{ fontWeight: 600, fontSize: '0.8rem' }}>{r.name?.replace(' Grand Prix', '')}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: qualiWinner === h2hData.d1 ? '#22c55e' : 'var(--text-muted)' }}>{r.d1Quali ? `P${r.d1Quali}` : '—'}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: qualiWinner === h2hData.d2 ? '#22c55e' : 'var(--text-muted)' }}>{r.d2Quali ? `P${r.d2Quali}` : '—'}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: raceWinner === h2hData.d1 ? '#22c55e' : 'var(--text-muted)' }}>{r.d1Race ? `P${r.d1Race}` : '—'}{r.d1Status && r.d1Status !== 'Finished' && r.d1Status !== 'Lapped' ? ` (${r.d1Status})` : ''}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: raceWinner === h2hData.d2 ? '#22c55e' : 'var(--text-muted)' }}>{r.d2Race ? `P${r.d2Race}` : '—'}{r.d2Status && r.d2Status !== 'Finished' && r.d2Status !== 'Lapped' ? ` (${r.d2Status})` : ''}</td>
                      <td>
                        <span style={{ fontWeight: 900, color: selectedTeam.color, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}>
                          {raceWinner !== '—' ? raceWinner : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No race data available yet for comparison.</p>
        </div>
      )}
    </div>
  );
}
