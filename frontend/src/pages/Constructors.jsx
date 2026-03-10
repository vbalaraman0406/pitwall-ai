import React, { useState, useEffect } from 'react';
import { getDriverPhotos, getRaceSchedule, getPredictions, getQualifyingPredictions } from '../api';
import { CURRENT_SEASON } from '../constants';

// 2026 Constructor data
const CONSTRUCTORS = {
  'McLaren': {
    fullName: 'McLaren F1 Team', base: 'Woking, United Kingdom', teamPrincipal: 'Andrea Stella',
    powerUnit: 'Mercedes', chassis: 'MCL61', tier: 'A+', carRating: 9.5,
    aero: 'Excellent', founded: 1966, championships: 8, raceWins: 188,
    drivers: ['NOR', 'PIA'],
    color: '#FF8000', secondaryColor: '#47C7FC',
    strengths: 'Downforce and straight-line speed balance, excellent race pace',
    weakness: 'Tyre warm-up in cold conditions',
    season2026: 'Defending constructors\' champions with reigning WDC Norris and Piastri. The MCL61 is the benchmark.',
  },
  'Ferrari': {
    fullName: 'Scuderia Ferrari HP', base: 'Maranello, Italy', teamPrincipal: 'Frédéric Vasseur',
    powerUnit: 'Ferrari', chassis: 'SF-26', tier: 'A+', carRating: 9.4,
    aero: 'Excellent', founded: 1950, championships: 16, raceWins: 245,
    drivers: ['LEC', 'HAM'],
    color: '#E8002D', secondaryColor: '#FFEB3B',
    strengths: 'Power unit and traction, strong qualifying pace',
    weakness: 'High-speed corner stability under new regulations',
    season2026: 'The Hamilton-Leclerc dream pairing. Ferrari targets its first constructors\' title since 2008 with the strongest driver lineup on the grid.',
  },
  'Red Bull Racing': {
    fullName: 'Oracle Red Bull Racing', base: 'Milton Keynes, United Kingdom', teamPrincipal: 'Christian Horner',
    powerUnit: 'Honda RBPT', chassis: 'RB22', tier: 'A', carRating: 9.2,
    aero: 'Very Good', founded: 2005, championships: 6, raceWins: 120,
    drivers: ['VER', 'HAD'],
    color: '#3671C6', secondaryColor: '#FFD700',
    strengths: 'Low-drag efficiency and excellent race pace',
    weakness: 'Adapting to 2026 regulation reset, rookie teammate',
    season2026: 'Verstappen leads with rookie Hadjar. Red Bull aims to prove their aero philosophy translates to the new regulations.',
  },
  'Mercedes': {
    fullName: 'Mercedes-AMG PETRONAS F1 Team', base: 'Brackley, United Kingdom', teamPrincipal: 'Toto Wolff',
    powerUnit: 'Mercedes', chassis: 'W17', tier: 'A', carRating: 9.0,
    aero: 'Very Good', founded: 2010, championships: 8, raceWins: 128,
    drivers: ['RUS', 'ANT'],
    color: '#27F4D2', secondaryColor: '#00A19C',
    strengths: 'Race pace consistency and power unit reliability',
    weakness: 'One-lap qualifying pace, young second driver',
    season2026: 'Post-Hamilton era begins with Russell as team leader alongside teenage sensation Antonelli.',
  },
  'Aston Martin': {
    fullName: 'Aston Martin Aramco F1 Team', base: 'Silverstone, United Kingdom', teamPrincipal: 'Mike Krack',
    powerUnit: 'Honda RBPT', chassis: 'AMR26', tier: 'B+', carRating: 8.0,
    aero: 'Good', founded: 2021, championships: 0, raceWins: 0,
    drivers: ['ALO', 'STR'],
    color: '#229971', secondaryColor: '#CEDC00',
    strengths: 'High-speed stability, Newey influence on 2026 design',
    weakness: 'Low-speed corners and tyre warm-up',
    season2026: 'New Silverstone factory fully operational. Adrian Newey\'s first full design could be a dark horse.',
  },
  'Williams': {
    fullName: 'Williams Racing', base: 'Grove, United Kingdom', teamPrincipal: 'James Vowles',
    powerUnit: 'Mercedes', chassis: 'FW47', tier: 'B', carRating: 7.5,
    aero: 'Good', founded: 1977, championships: 9, raceWins: 114,
    drivers: ['SAI', 'ALB'],
    color: '#64C4FF', secondaryColor: '#041E42',
    strengths: 'Straight-line speed and Mercedes PU integration',
    weakness: 'Midcorner balance and development budget',
    season2026: 'Sainz arrival signals serious ambition. Williams are investing heavily to return to the front.',
  },
  'Alpine': {
    fullName: 'BWT Alpine F1 Team', base: 'Enstone, United Kingdom', teamPrincipal: 'Oliver Oakes',
    powerUnit: 'Renault', chassis: 'A526', tier: 'B', carRating: 7.3,
    aero: 'Average', founded: 1981, championships: 2, raceWins: 21,
    drivers: ['GAS', 'COL'],
    color: '#FF87BC', secondaryColor: '#0090FF',
    strengths: 'Reliability and factory team resources',
    weakness: 'Overall pace gap to frontrunners, Renault PU behind',
    season2026: 'Alpine continue their renovation under Oakes. Gasly leads with exciting rookie Colapinto.',
  },
  'Haas F1 Team': {
    fullName: 'MoneyGram Haas F1 Team', base: 'Kannapolis, United States', teamPrincipal: 'Ayao Komatsu',
    powerUnit: 'Ferrari', chassis: 'VF-26', tier: 'B-', carRating: 7.0,
    aero: 'Average', founded: 2016, championships: 0, raceWins: 0,
    drivers: ['OCO', 'BEA'],
    color: '#B6BABD', secondaryColor: '#E6002D',
    strengths: 'Ferrari power unit synergy and cost efficiency',
    weakness: 'Limited development budget and wind tunnel time',
    season2026: 'Komatsu\'s second full season as TP. Ocon and Bearman form a solid midfield partnership.',
  },
  'Racing Bulls': {
    fullName: 'Visa Cash App Racing Bulls', base: 'Faenza, Italy', teamPrincipal: 'Laurent Mekies',
    powerUnit: 'Honda RBPT', chassis: 'VCARB 02', tier: 'B-', carRating: 6.8,
    aero: 'Average', founded: 2006, championships: 0, raceWins: 2,
    drivers: ['LAW', 'LIN'],
    color: '#6692FF', secondaryColor: '#FFFFFF',
    strengths: 'Red Bull technology sharing and young driver development',
    weakness: 'Inconsistency between circuits and limited budget',
    season2026: 'Full youth movement: Lawson and teenage prodigy Lindblad form the youngest pairing on the grid.',
  },
  'Audi': {
    fullName: 'Audi F1 Team', base: 'Hinwil, Switzerland', teamPrincipal: 'Mattia Binotto',
    powerUnit: 'Audi', chassis: 'AUD26', tier: 'C+', carRating: 6.5,
    aero: 'Developing', founded: 2026, championships: 0, raceWins: 0,
    drivers: ['HUL', 'BOR'],
    color: '#990000', secondaryColor: '#FFFFFF',
    strengths: 'Massive manufacturer investment and VW Group resources',
    weakness: 'Brand new power unit in first competitive season',
    season2026: 'First race as Audi (ex-Sauber). Binotto leads the rebuild with Hulkenberg\'s experience and Bortoleto\'s raw speed.',
  },
  'Cadillac': {
    fullName: 'Cadillac F1 Team', base: 'United States', teamPrincipal: 'TBC',
    powerUnit: 'Ferrari', chassis: 'CAD01', tier: 'C', carRating: 6.0,
    aero: 'Basic', founded: 2026, championships: 0, raceWins: 0,
    drivers: ['PER', 'BOT'],
    color: '#1E1E1E', secondaryColor: '#C4A747',
    strengths: 'GM/Cadillac backing and experienced drivers',
    weakness: 'Brand new team with no F1 heritage data',
    season2026: 'The 11th team joins F1 backed by General Motors. Perez and Bottas bring vital experience to the startup operation.',
  },
};

const TEAM_ORDER = [
  'McLaren', 'Ferrari', 'Red Bull Racing', 'Mercedes', 'Aston Martin',
  'Williams', 'Alpine', 'Haas F1 Team', 'Racing Bulls', 'Audi', 'Cadillac',
];

export default function Constructors() {
  const [photos, setPhotos] = useState({});
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [selectedRound, setSelectedRound] = useState(1);
  const [racePrediction, setRacePrediction] = useState(null);
  const [qualiPrediction, setQualiPrediction] = useState(null);
  const [predLoading, setPredLoading] = useState(false);

  useEffect(() => {
    Promise.all([getDriverPhotos(), getRaceSchedule(CURRENT_SEASON)])
      .then(([photoData, sched]) => {
        if (photoData) setPhotos(photoData);
        if (Array.isArray(sched)) setSchedule(sched);
      });
  }, []);

  // Load predictions when round changes
  useEffect(() => {
    setPredLoading(true);
    setRacePrediction(null);
    setQualiPrediction(null);
    Promise.all([
      getPredictions(CURRENT_SEASON, selectedRound),
      getQualifyingPredictions(CURRENT_SEASON, selectedRound),
    ]).then(([race, quali]) => {
      setRacePrediction(race);
      setQualiPrediction(quali);
      setPredLoading(false);
    }).catch(() => setPredLoading(false));
  }, [selectedRound]);

  const getPhoto = (abbr) => photos[abbr]?.headshot_url || '';
  const getTeamColor = (team) => CONSTRUCTORS[team]?.color || '#888';

  // Aggregate predictions to constructor level
  const getConstructorPrediction = (prediction, type) => {
    if (!prediction?.predictions) return [];
    const teamScores = {};
    prediction.predictions.forEach(p => {
      const team = p.team;
      if (!teamScores[team]) teamScores[team] = { team, bestPosition: 99, bestDriver: '', totalPoints: 0, drivers: [] };
      const points = p.position <= 10 ? [25, 18, 15, 12, 10, 8, 6, 4, 2, 1][p.position - 1] : 0;
      teamScores[team].totalPoints += points;
      teamScores[team].drivers.push({ ...p, points });
      if (p.position < teamScores[team].bestPosition) {
        teamScores[team].bestPosition = p.position;
        teamScores[team].bestDriver = p.driver;
        teamScores[team].bestName = p.name;
        teamScores[team].reasoning = p.reasoning;
        teamScores[team].confidence = p.confidence;
      }
    });
    return Object.values(teamScores).sort((a, b) => type === 'qualifying'
      ? a.bestPosition - b.bestPosition
      : b.totalPoints - a.totalPoints
    );
  };

  const raceConstructors = getConstructorPrediction(racePrediction, 'race');
  const qualiConstructors = getConstructorPrediction(qualiPrediction, 'qualifying');
  const raceWinnerTeam = raceConstructors[0];
  const qualiWinnerTeam = qualiConstructors[0];
  const raceInfo = schedule.find(r => r.round === selectedRound);

  const getShortName = (name) => {
    if (!name) return '—';
    return name.replace(' Grand Prix', '').replace(' GP', '').replace('United States', 'USA').replace('Great Britain', 'UK');
  };

  const tierColor = (tier) => {
    if (tier === 'A+') return '#22c55e';
    if (tier === 'A') return '#3b82f6';
    if (tier === 'B+') return '#eab308';
    if (tier === 'B') return '#f59e0b';
    if (tier === 'B-') return '#f97316';
    if (tier === 'C+') return '#ef4444';
    return '#dc2626';
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <p style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)', fontWeight: 700, letterSpacing: '0.15em' }}>
          {CURRENT_SEASON} FORMULA 1 CHAMPIONSHIP
        </p>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
          Constructors & <span style={{ color: 'var(--f1-red)' }}>Teams</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          {TEAM_ORDER.length} teams competing in the {CURRENT_SEASON} season. Click any team to explore car specs, driver lineup, and performance data.
        </p>
      </div>

      {/* Team Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
        {TEAM_ORDER.map(teamName => {
          const team = CONSTRUCTORS[teamName];
          if (!team) return null;
          return (
            <div key={teamName} className="card card-hover" onClick={() => setSelectedTeam(selectedTeam === teamName ? null : teamName)}
              style={{ cursor: 'pointer', borderLeft: `4px solid ${team.color}`, padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
              {/* Tier badge */}
              <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-sm)',
                background: tierColor(team.tier) + '22', border: `1px solid ${tierColor(team.tier)}55` }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '0.7rem', color: tierColor(team.tier) }}>
                  TIER {team.tier}
                </span>
              </div>

              {/* Team name */}
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: team.color, marginBottom: '0.125rem' }}>{teamName}</h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>{team.base}</p>

              {/* Quick stats */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                <div>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1rem', color: 'var(--accent-gold-dim)' }}>{team.carRating}</p>
                  <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>CAR RATING</p>
                </div>
                <div>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1rem' }}>{team.championships}</p>
                  <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>TITLES</p>
                </div>
                <div>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1rem', color: 'var(--f1-red)' }}>{team.raceWins}</p>
                  <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>WINS</p>
                </div>
              </div>

              {/* Driver photos */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {team.drivers.map(driverCode => (
                  <div key={driverCode} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${team.color}`, background: 'var(--bg-secondary)' }}>
                      {getPhoto(driverCode) && <img src={getPhoto(driverCode)} alt={driverCode} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />}
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.75rem', color: team.color }}>{driverCode}</span>
                  </div>
                ))}
              </div>

              {/* Expanded detail */}
              {selectedTeam === teamName && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${team.color}33` }} onClick={e => e.stopPropagation()}>
                  {/* Car specs */}
                  <h4 style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-gold-dim)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: '0.75rem' }}>CAR SPECIFICATIONS</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                    {[
                      ['Chassis', team.chassis],
                      ['Power Unit', team.powerUnit],
                      ['Aero Level', team.aero],
                      ['Team Principal', team.teamPrincipal],
                      ['Founded', team.founded],
                      ['Full Name', team.fullName],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>{label}</p>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Strengths / Weaknesses */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.5rem', background: 'rgba(34, 197, 94, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                      <p style={{ fontSize: '0.6rem', color: '#22c55e', fontWeight: 700 }}>✓ STRENGTHS</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{team.strengths}</p>
                    </div>
                    <div style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <p style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 700 }}>✗ WEAKNESS</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{team.weakness}</p>
                    </div>
                  </div>

                  {/* Season outlook */}
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic' }}>"{team.season2026}"</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Constructor Predictions Section */}
      <div style={{ borderTop: '2px solid var(--border-default)', paddingTop: '1.5rem' }}>
        <div>
          <p style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)', fontWeight: 700, letterSpacing: '0.15em' }}>
            AI-POWERED CONSTRUCTOR ANALYSIS
          </p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
            Constructor <span style={{ color: 'var(--f1-red)' }}>Predictions</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.85rem' }}>
            {racePrediction?.model === 'gemini' ? '🧠 Powered by Gemini AI — aggregated driver predictions to constructor level.' : 'Loading predictions...'}
          </p>
        </div>

        {/* GP Selector */}
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          {(schedule.length > 0 ? schedule : Array.from({length: 24}, (_, i) => ({ round: i+1, name: `Round ${i+1}` }))).map(race => {
            const isActive = selectedRound === race.round;
            const isPast = race.date && new Date(race.date) < new Date();
            return (
              <button key={race.round} onClick={() => setSelectedRound(race.round)}
                className={`tab-btn ${isActive ? 'active' : ''}`}
                style={{ fontSize: '0.6rem', padding: '0.3rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2, minWidth: '45px', opacity: isPast ? 1 : 0.7 }}
                title={race.name}>
                <span style={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.5rem', opacity: 0.7 }}>
                  R{String(race.round).padStart(2, '0')}
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.55rem' }}>{getShortName(race.name)}</span>
              </button>
            );
          })}
        </div>

        {predLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="f1-spinner" /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            {/* Race Winner Constructor */}
            <div className="card" style={{ borderTop: '3px solid var(--f1-red)' }}>
              <p style={{ fontSize: '0.65rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '0.75rem' }}>
                🏁 PREDICTED CONSTRUCTOR RACE WINNER
              </p>
              {raceWinnerTeam ? (
                <>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: getTeamColor(raceWinnerTeam.team) }}>{raceWinnerTeam.team}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Best driver: <strong>{raceWinnerTeam.bestDriver}</strong> (P{raceWinnerTeam.bestPosition})
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Combined points: <strong style={{ color: 'var(--accent-gold-dim)' }}>{raceWinnerTeam.totalPoints} pts</strong>
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {raceWinnerTeam.drivers.map(d => (
                      <div key={d.driver} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.625rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                        {getPhoto(d.driver) && <img src={getPhoto(d.driver)} alt={d.driver} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />}
                        <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>{d.driver} P{d.position}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{d.points}pts</span>
                      </div>
                    ))}
                  </div>
                  {raceWinnerTeam.reasoning && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic' }}>"{raceWinnerTeam.reasoning}"</p>
                  )}
                </>
              ) : <p style={{ color: 'var(--text-dim)' }}>Loading...</p>}
            </div>

            {/* Qualifying Winner Constructor */}
            <div className="card" style={{ borderTop: '3px solid #3b82f6' }}>
              <p style={{ fontSize: '0.65rem', fontFamily: "'JetBrains Mono', monospace", color: '#3b82f6', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '0.75rem' }}>
                ⏱ PREDICTED CONSTRUCTOR QUALIFYING WINNER
              </p>
              {qualiWinnerTeam ? (
                <>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: getTeamColor(qualiWinnerTeam.team) }}>{qualiWinnerTeam.team}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Pole sitter: <strong>{qualiWinnerTeam.bestDriver}</strong> (P{qualiWinnerTeam.bestPosition})
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {qualiWinnerTeam.drivers.map(d => (
                      <div key={d.driver} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.625rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                        {getPhoto(d.driver) && <img src={getPhoto(d.driver)} alt={d.driver} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />}
                        <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>{d.driver} P{d.position}</span>
                      </div>
                    ))}
                  </div>
                  {qualiWinnerTeam.reasoning && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic' }}>"{qualiWinnerTeam.reasoning}"</p>
                  )}
                </>
              ) : <p style={{ color: 'var(--text-dim)' }}>Loading...</p>}
            </div>
          </div>
        )}

        {/* Full Constructor Standings */}
        {raceConstructors.length > 0 && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>
              Predicted Constructor Standings — {raceInfo?.name || `Round ${selectedRound}`}
            </h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>POS</th>
                  <th>CONSTRUCTOR</th>
                  <th>TIER</th>
                  <th>BEST DRIVER</th>
                  <th>BEST POS</th>
                  <th>TOTAL POINTS</th>
                  <th>DRIVERS</th>
                </tr>
              </thead>
              <tbody>
                {raceConstructors.map((team, idx) => (
                  <tr key={team.team}>
                    <td>
                      <span className={`pos-badge ${idx < 3 ? `pos-${idx + 1}` : ''}`}
                        style={idx >= 3 ? { background: 'var(--bg-surface)', color: 'var(--text-secondary)' } : {}}>
                        {idx + 1}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="team-bar" style={{ background: getTeamColor(team.team) }} />
                        <span style={{ fontWeight: 700 }}>{team.team}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.7rem', padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-sm)', color: tierColor(CONSTRUCTORS[team.team]?.tier || 'C'),
                        background: tierColor(CONSTRUCTORS[team.team]?.tier || 'C') + '22' }}>
                        {CONSTRUCTORS[team.team]?.tier || '?'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        {getPhoto(team.bestDriver) && <img src={getPhoto(team.bestDriver)} alt={team.bestDriver} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />}
                        <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{team.bestName || team.bestDriver}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>P{team.bestPosition}</td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, color: 'var(--accent-gold-dim)' }}>{team.totalPoints}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        {team.drivers.map(d => (
                          <span key={d.driver} style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", padding: '0.2rem 0.4rem',
                            background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
                            {d.driver} P{d.position}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
