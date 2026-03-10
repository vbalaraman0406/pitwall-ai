import React, { useState, useEffect } from 'react';
import { getDrivers, getDriverStats, getDriverPhotos } from '../api';

// Comprehensive driver bio data — career stats as of 2025 season start
const DRIVER_BIOS = {
  NOR: { dob: '1999-11-13', nationality: '🇬🇧 British', birthplace: 'Bristol, England', championships: 1, careerWins: 9, careerPodiums: 35, careerPoles: 10, careerPoints: 1130, debut: '2019 Australian GP', bio: 'The 2024 World Champion. Lando became the youngest British champion, leading McLaren back to the top with electrifying pace and racecraft. Known for his sim-racing roots and fierce wheel-to-wheel battles.' },
  VER: { dob: '1997-09-30', nationality: '🇳🇱 Dutch', birthplace: 'Hasselt, Belgium', championships: 3, careerWins: 63, careerPodiums: 112, careerPoles: 40, careerPoints: 2998, debut: '2015 Australian GP', bio: 'Three-time World Champion and the youngest-ever race winner. Max dominated 2021-2023 but lost his crown to Norris in 2024. Still regarded as the fastest man in F1 by many, racing with Red Bull since their RB-era dominance.' },
  LEC: { dob: '1997-10-16', nationality: '🇲🇨 Monégasque', birthplace: 'Monte Carlo, Monaco', championships: 0, careerWins: 8, careerPodiums: 40, careerPoles: 26, careerPoints: 1060, debut: '2018 Australian GP', bio: 'The pride of Ferrari. Charles is known for blistering qualifying speed and Monza heroics. A childhood friend of the late Jules Bianchi, he carries enormous emotional weight as Scuderia\'s lead driver alongside new teammate Hamilton.' },
  HAM: { dob: '1985-01-07', nationality: '🇬🇧 British', birthplace: 'Stevenage, England', championships: 7, careerWins: 105, careerPodiums: 202, careerPoles: 104, careerPoints: 4829, debut: '2007 Australian GP', bio: 'A living legend. Sir Lewis Hamilton holds nearly every major F1 record — most wins (105), most poles, most podiums. In 2025 he embarks on a historic move to Ferrari, fulfilling a lifelong dream to drive for the Scuderia.' },
  PIA: { dob: '2001-04-06', nationality: '🇦🇺 Australian', birthplace: 'Melbourne, Australia', championships: 0, careerWins: 3, careerPodiums: 16, careerPoles: 3, careerPoints: 420, debut: '2023 Australian GP', bio: 'Oscar brings a surgeon\'s precision to racecraft. The 2021 F2 champion made an immediate impact at McLaren, winning his first Grand Prix in Hungary 2024. His calm demeanor belies fierce competitive instincts.' },
  RUS: { dob: '1998-02-15', nationality: '🇬🇧 British', birthplace: 'King\'s Lynn, England', championships: 0, careerWins: 3, careerPodiums: 22, careerPoles: 5, careerPoints: 670, debut: '2019 Australian GP', bio: 'Mercedes\' team leader for 2025 following Hamilton\'s departure. George combines blinding one-lap speed with strategic intelligence. The 2018 F2 champion took his maiden win in São Paulo 2022 in the rain.' },
  ALO: { dob: '1981-07-29', nationality: '🇪🇸 Spanish', birthplace: 'Oviedo, Spain', championships: 2, careerWins: 32, careerPodiums: 106, careerPoles: 22, careerPoints: 2312, debut: '2001 Australian GP', bio: 'The eternal competitor. At 43, Fernando is the most experienced driver in F1 history. A two-time champion (2005-06) with Renault, his passion and wheel-to-wheel skills remain undiminished at Aston Martin.' },
  ANT: { dob: '2006-08-25', nationality: '🇮🇹 Italian', birthplace: 'Bologna, Italy', championships: 0, careerWins: 0, careerPodiums: 0, careerPoles: 0, careerPoints: 0, debut: '2025 Australian GP', bio: 'Kimi Antonelli is the youngest F1 driver of 2025, handpicked by Toto Wolff as Hamilton\'s successor at Mercedes. The F2 prodigy stunned with his raw speed in junior categories and carries the weight of a nation\'s expectations.' },
  SAI: { dob: '1994-09-01', nationality: '🇪🇸 Spanish', birthplace: 'Madrid, Spain', championships: 0, careerWins: 4, careerPodiums: 25, careerPoles: 6, careerPoints: 985, debut: '2015 Australian GP', bio: 'The Smooth Operator. Carlos moved to Williams for 2025 after being displaced by Hamilton at Ferrari. A four-time race winner with silky racecraft, he proved at Ferrari he can lead a top team.' },
  ALB: { dob: '1996-03-23', nationality: '🇹🇭 Thai-British', birthplace: 'London, England', championships: 0, careerWins: 0, careerPodiums: 2, careerPoles: 1, careerPoints: 260, debut: '2019 Australian GP', bio: 'Alex rebuilt his career from scratch. Dropped by Red Bull in 2021, he became Williams\' talisman with consistent points finishes. Known for his incredible overtaking ability and likeable personality.' },
  GAS: { dob: '1996-02-07', nationality: '🇫🇷 French', birthplace: 'Rouen, France', championships: 0, careerWins: 1, careerPodiums: 5, careerPoles: 0, careerPoints: 395, debut: '2017 Malaysian GP', bio: 'Pierre\'s emotional Monza 2020 victory with AlphaTauri remains one of F1\'s most iconic moments. Now at Alpine, the Frenchman continues to push the midfield boundaries with grit and flair.' },
  HUL: { dob: '1987-08-19', nationality: '🇩🇪 German', birthplace: 'Emmerich am Rhein, Germany', championships: 0, careerWins: 0, careerPodiums: 0, careerPoles: 1, careerPoints: 530, debut: '2010 Bahrain GP', bio: 'One of F1\'s longest-serving drivers without a podium — but numbers don\'t tell the story. Nico is universally respected for speed, consistency, and the ability to extract maximum from any machinery. Now at Audi for their factory F1 entry.' },
  LAW: { dob: '2002-02-11', nationality: '🇳🇿 New Zealander', birthplace: 'Hastings, New Zealand', championships: 0, careerWins: 0, careerPodiums: 0, careerPoles: 0, careerPoints: 20, debut: '2023 Dutch GP', bio: 'New Zealand\'s first F1 driver in decades. Liam impressed as a stand-in for both AlphaTauri and Red Bull Racing before earning a full-time Racing Bulls seat for 2025 with his tenacious driving style.' },
  HAD: { dob: '2004-09-28', nationality: '🇫🇷 French', birthplace: 'Lyon, France', championships: 0, careerWins: 0, careerPodiums: 0, careerPoles: 0, careerPoints: 0, debut: '2025 Australian GP', bio: 'The Red Bull junior prodigy. Isack was runner-up in the 2024 F2 championship and earned his F1 seat with consistent brilliance. As Verstappen\'s teammate, he faces the ultimate baptism of fire.' },
  STR: { dob: '1998-10-29', nationality: '🇨🇦 Canadian', birthplace: 'Montreal, Canada', championships: 0, careerWins: 0, careerPodiums: 3, careerPoles: 1, careerPoints: 290, debut: '2017 Australian GP', bio: 'Lance brings financial stability and occasional flashes of brilliance to Aston Martin. The youngest front-row starter in F1 history (2017 Italian GP), he thrives in changeable conditions.' },
  OCO: { dob: '1996-09-17', nationality: '🇫🇷 French', birthplace: 'Évreux, France', championships: 0, careerWins: 1, careerPodiums: 4, careerPoles: 0, careerPoints: 440, debut: '2016 Belgian GP', bio: 'Esteban won the 2021 Hungarian GP in dramatic fashion. The former Mercedes junior moved to Haas for 2025 seeking a fresh challenge after five seasons at Alpine/Renault.' },
  BEA: { dob: '2005-05-08', nationality: '🇬🇧 British', birthplace: 'Chelmsford, England', championships: 0, careerWins: 0, careerPodiums: 0, careerPoles: 0, careerPoints: 7, debut: '2024 Saudi Arabian GP', bio: 'Oliver made his F1 debut as a last-minute replacement for Sainz in Jeddah 2024, scoring points on debut — a remarkable feat. The Ferrari Academy graduate secured a full-time Haas seat for 2025.' },
  COL: { dob: '2003-09-27', nationality: '🇦🇷 Argentine', birthplace: 'Buenos Aires, Argentina', championships: 0, careerWins: 0, careerPodiums: 0, careerPoles: 0, careerPoints: 5, debut: '2024 Italian GP', bio: 'Franco became the first Argentine in F1 since 2001– when he replaced Logan Sargeant mid-2024 at Williams. His raw speed and passion won over fans, leading to an Alpine seat for 2025.' },
  BOR: { dob: '2004-10-14', nationality: '🇧🇷 Brazilian', birthplace: 'São Paulo, Brazil', championships: 0, careerWins: 0, careerPodiums: 0, careerPoles: 0, careerPoints: 0, debut: '2025 Australian GP', bio: 'Gabriel is the 2024 F2 champion and the next great Brazilian hope. Mentored by Lewis Hamilton, his pace in junior formulae was devastating. Joins Audi for their first full F1 season as a factory team.' },
  TSU: { dob: '2000-05-11', nationality: '🇯🇵 Japanese', birthplace: 'Sagamihara, Japan', championships: 0, careerWins: 0, careerPodiums: 1, careerPoles: 0, careerPoints: 80, debut: '2021 Bahrain GP', bio: 'Japan\'s F1 standard-bearer. Yuki\'s aggressive driving style and fiery radio messages have made him a fan favourite. Now in his fifth F1 season with Racing Bulls, he seeks his breakthrough victory.' },
};

export default function DriverStats() {
  const [drivers, setDrivers] = useState([]);
  const [photos, setPhotos] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverStats, setDriverStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      getDrivers(2025),
      getDriverPhotos(),
    ]).then(([driverData, photoData]) => {
      if (driverData && driverData.drivers) setDrivers(driverData.drivers);
      else if (Array.isArray(driverData)) setDrivers(driverData);
      if (photoData) setPhotos(photoData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDriver) return;
    setStatsLoading(true);
    getDriverStats(2025, selectedDriver.abbreviation).then(data => {
      setDriverStats(data);
      setStatsLoading(false);
    }).catch(() => setStatsLoading(false));
  }, [selectedDriver]);

  const getPhoto = (abbr) => photos[abbr]?.headshot_url || '';
  const getTeamColor = (abbr) => photos[abbr]?.team_colour || '#888888';

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  const getAge = (dateStr) => {
    const today = new Date();
    const birth = new Date(dateStr);
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
    return age;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <p style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)', fontWeight: 700, letterSpacing: '0.15em' }}>
          2025 FORMULA 1 CHAMPIONSHIP
        </p>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
          Drivers & <span style={{ color: 'var(--f1-red)' }}>Teams</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Click any driver card to explore their full biography and career statistics
        </p>
      </div>

      <hr className="gold-divider" />

      {loading ? (
        <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : (
        <>
          {/* Driver Grid */}
          <div className="stagger-children" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem',
          }}>
            {drivers.map((driver) => {
              const abbr = driver.abbreviation;
              const teamColor = getTeamColor(abbr);
              const photoUrl = getPhoto(abbr);
              const driverNum = photos[abbr]?.driver_number || driver.number;
              const teamName = photos[abbr]?.team_name || driver.team;
              const isSelected = selectedDriver?.abbreviation === abbr;
              const bio = DRIVER_BIOS[abbr];

              return (
                <div
                  key={abbr}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    padding: 0,
                    overflow: 'hidden',
                    borderColor: isSelected ? teamColor : undefined,
                    boxShadow: isSelected ? `0 0 20px ${teamColor}44` : undefined,
                    transform: isSelected ? 'scale(1.02)' : undefined,
                  }}
                  onClick={() => setSelectedDriver(driver)}
                >
                  {/* Card Header */}
                  <div style={{
                    background: `linear-gradient(135deg, ${teamColor}22 0%, ${teamColor}08 100%)`,
                    padding: '1.25rem 1rem 0.75rem',
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    borderBottom: `2px solid ${teamColor}`,
                  }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden',
                      border: `2px solid ${teamColor}`, background: 'var(--bg-secondary)',
                      flexShrink: 0, boxShadow: `0 0 12px ${teamColor}33`,
                    }}>
                      {photoUrl ? (
                        <img src={photoUrl} alt={driver.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none'; }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1.25rem', color: teamColor }}>
                          {abbr}
                        </div>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: '1.5rem', fontFamily: "'JetBrains Mono', monospace", color: teamColor, lineHeight: 1 }}>{abbr}</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {driver.first_name} {driver.last_name}
                      </div>
                      {bio && <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>{bio.nationality}</div>}
                    </div>
                    <div style={{
                      marginLeft: 'auto', width: '2.25rem', height: '2.25rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${teamColor}22`, borderRadius: 'var(--radius-sm)',
                      fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '0.9rem',
                      color: teamColor, border: `1px solid ${teamColor}33`,
                    }}>
                      {driverNum || '—'}
                    </div>
                  </div>
                  {/* Team Footer */}
                  <div style={{ padding: '0.625rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: teamColor, boxShadow: `0 0 4px ${teamColor}66` }} />
                      <span style={{ fontWeight: 500 }}>{teamName}</span>
                    </div>
                    {bio && bio.careerWins > 0 && (
                      <span style={{ fontSize: '0.6rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)', fontWeight: 700 }}>
                        {bio.careerWins} WINS
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Driver Detail Panel with Bio */}
          {selectedDriver && (() => {
            const abbr = selectedDriver.abbreviation;
            const teamColor = getTeamColor(abbr);
            const photoUrl = getPhoto(abbr);
            const bio = DRIVER_BIOS[abbr];
            const driverNum = photos[abbr]?.driver_number || selectedDriver.number;
            const teamName = photos[abbr]?.team_name || selectedDriver.team;

            return (
              <div className="card animate-slide-in" style={{ padding: 0, overflow: 'hidden', borderColor: teamColor }}>
                {/* Hero Section */}
                <div className="gradient-ferrari" style={{
                  padding: '2rem 2.5rem',
                  display: 'flex', alignItems: 'center', gap: '2rem',
                  borderBottom: `2px solid ${teamColor}`,
                  position: 'relative',
                }}>
                  {/* Photo */}
                  <div style={{
                    width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden',
                    border: `3px solid ${teamColor}`, background: 'var(--bg-secondary)', flexShrink: 0,
                    boxShadow: `0 0 24px ${teamColor}44`,
                  }}>
                    {photoUrl ? (
                      <img src={photoUrl} alt={selectedDriver.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '2.5rem', color: teamColor }}>
                        {abbr}
                      </div>
                    )}
                  </div>

                  {/* Name & Info */}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: 'var(--accent-gold-dim)', fontWeight: 700, letterSpacing: '0.15em' }}>
                      #{driverNum || '—'} • {teamName}
                    </p>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.25rem', lineHeight: 1.1 }}>
                      {selectedDriver.first_name} <span style={{ color: teamColor }}>{selectedDriver.last_name}</span>
                    </h2>
                    {bio && (
                      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{bio.nationality}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Age: {getAge(bio.dob)}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Born: {formatDate(bio.dob)}</span>
                      </div>
                    )}
                  </div>

                  {/* Watermark */}
                  <div style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '5rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: teamColor, opacity: 0.1 }}>
                    {abbr}
                  </div>
                </div>

                {/* Bio Paragraph */}
                {bio && (
                  <div style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid var(--border-default)' }}>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.9, fontSize: '0.9rem' }}>{bio.bio}</p>
                    {bio.debut && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.75rem', fontFamily: "'JetBrains Mono', monospace" }}>
                        F1 Debut: {bio.debut}
                      </p>
                    )}
                  </div>
                )}

                {/* Career Stats Grid */}
                {bio && (
                  <div style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid var(--border-default)' }}>
                    <h3 style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '1rem' }}>
                      CAREER STATISTICS
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem' }}>
                      {[
                        { label: 'Championships', value: bio.championships, color: bio.championships > 0 ? 'var(--accent-gold-dim)' : 'var(--text-primary)', icon: '🏆' },
                        { label: 'Race Wins', value: bio.careerWins, color: bio.careerWins > 0 ? 'var(--accent-gold-dim)' : 'var(--text-primary)', icon: '🥇' },
                        { label: 'Podiums', value: bio.careerPodiums, color: 'var(--f1-red)', icon: '🏆' },
                        { label: 'Pole Positions', value: bio.careerPoles, color: '#a855f7', icon: '⚡' },
                        { label: 'Career Points', value: bio.careerPoints.toLocaleString(), color: 'var(--text-primary)', icon: '📊' },
                        { label: 'Birthplace', value: bio.birthplace?.split(',')[0] || '—', color: 'var(--text-secondary)', icon: '📍' },
                      ].map(stat => (
                        <div key={stat.label} style={{
                          textAlign: 'center', padding: '0.75rem 0.5rem',
                          background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                        }}>
                          <p style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>{stat.icon}</p>
                          <p className="stat-value" style={{ fontSize: '1.25rem', color: stat.color }}>{stat.value}</p>
                          <p className="stat-label" style={{ fontSize: '0.6rem' }}>{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2025 Season Stats */}
                <div style={{ padding: '1.5rem 2.5rem' }}>
                  <h3 style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold-dim)', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '1rem' }}>
                    2025 SEASON
                  </h3>
                  {statsLoading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: '70px' }} />
                      ))}
                    </div>
                  ) : driverStats && driverStats.stats ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
                      {[
                        { label: 'Races', value: driverStats.stats.races, color: 'var(--text-primary)' },
                        { label: 'Wins', value: driverStats.stats.wins, color: 'var(--accent-gold-dim)' },
                        { label: 'Podiums', value: driverStats.stats.podiums, color: 'var(--f1-red)' },
                        { label: 'Points', value: driverStats.stats.points, color: 'var(--text-primary)' },
                        { label: 'Best Finish', value: driverStats.stats.best_finish ? `P${driverStats.stats.best_finish}` : '—', color: '#22c55e' },
                      ].map(stat => (
                        <div key={stat.label} style={{
                          textAlign: 'center', padding: '0.75rem',
                          background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                        }}>
                          <p className="stat-value" style={{ fontSize: '1.5rem', color: stat.color }}>{stat.value ?? '—'}</p>
                          <p className="stat-label">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Season data will appear when races are completed.
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
