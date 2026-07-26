import { useEffect, useMemo, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import FifaCard from '../components/FifaCard';
import Loading from '../components/Loading';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import {
  FiCalendar,
  FiArrowRight,
  FiAward,
  FiClock,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiZap,
  FiActivity,
  FiLogIn,
  FiUserPlus,
  FiChevronDown,
  FiTarget,
  FiCheckCircle,
} from 'react-icons/fi';

// Scoreboard Count-Up Stat Card (100% Theme Driven)
const CountUpStat = ({ target, label, icon: Icon }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(target, 10) || 0;
    if (end === 0) return;
    const duration = 1200;
    const increment = Math.max(1, Math.ceil(end / (duration / 16)));
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-6 flex flex-col items-center justify-center text-center space-y-2.5 transition-all duration-300 hover:border-[var(--color-accent)] group">
      {/* Top Accent Scoreboard Bar (Theme Accent) */}
      <div
        className="absolute top-0 left-0 right-0 h-1 group-hover:h-1.5 transition-all duration-300"
        style={{ backgroundColor: 'var(--color-accent)' }}
      />

      <div
        className="rounded-2xl p-3 shadow-md border"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
          color: 'var(--color-accent)',
          borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
        }}
      >
        <Icon size={22} />
      </div>

      <span
        className="font-display text-4xl font-black tracking-tight"
        style={{ color: 'var(--color-accent)' }}
      >
        {count}
      </span>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
    </div>
  );
};

const HomePage = () => {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);

  const [fixtures, setFixtures] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [teams, setTeams] = useState([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [countdown, setCountdown] = useState('Loading...');
  const [loading, setLoading] = useState(true);

  const dashboardLink = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fixturesRes, ratingsRes, teamsRes, usersRes] = await Promise.all([
          api.get('/fixtures'),
          api.get('/ratings'),
          api.get('/teams?includeAll=true'),
          api.get('/users?all=true'),
        ]);

        const fx = Array.isArray(fixturesRes.data) ? fixturesRes.data : [];
        const rt = Array.isArray(ratingsRes.data) ? ratingsRes.data : [];
        const tm = Array.isArray(teamsRes.data) ? teamsRes.data : teamsRes.data?.teams || [];
        const usr = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.users || [];

        setFixtures(fx);
        setRatings(rt);
        setTeams(tm);
        setPlayerCount(usr.filter((u) => u.role === 'player').length || usr.length || 24);
      } catch (error) {
        console.error('Error loading homepage portal data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const nextFixture = useMemo(() => {
    const upcoming = fixtures.filter((item) => item && new Date(item.date) > new Date());
    return upcoming.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  }, [fixtures]);

  useEffect(() => {
    if (!nextFixture) {
      setCountdown('MATCHDAY SOON');
      return;
    }
    const update = () => {
      const difference = new Date(nextFixture.date) - new Date();
      if (difference <= 0) {
        setCountdown('KICKOFF LIVE');
        return;
      }
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [nextFixture]);

  const topPlayers = useMemo(
    () =>
      [...ratings]
        .filter((r) => r && r.player)
        .sort((a, b) => (b.overall || 0) - (a.overall || 0))
        .slice(0, 4)
        .map((r) => ({
          ...(typeof r.player === 'object' ? r.player : { _id: r.player }),
          pace: r.pace,
          shooting: r.shooting,
          passing: r.passing,
          dribbling: r.dribbling,
          defending: r.defending,
          physical: r.physical,
          overall: r.overall,
        })),
    [ratings]
  );


  const standingsPreview = useMemo(() => {
    const map = {};
    teams.forEach((t) => {
      if (t?._id) {
        map[String(t._id)] = {
          _id: t._id,
          name: t.name,
          logo: t.logo,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          gf: 0,
          ga: 0,
          gd: 0,
          points: 0,
        };
      }
    });

    fixtures.forEach((f) => {
      if (f.status === 'completed' && f.homeTeam && f.awayTeam) {
        const hId = String(f.homeTeam._id || f.homeTeam);
        const aId = String(f.awayTeam._id || f.awayTeam);
        if (!map[hId]) map[hId] = { _id: hId, name: f.homeTeam.name || 'Home', logo: f.homeTeam.logo, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
        if (!map[aId]) map[aId] = { _id: aId, name: f.awayTeam.name || 'Away', logo: f.awayTeam.logo, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };

        const hG = f.homeScore || 0;
        const aG = f.awayScore || 0;
        map[hId].played += 1;
        map[aId].played += 1;
        map[hId].gf += hG;
        map[hId].ga += aG;
        map[aId].gf += aG;
        map[aId].ga += hG;

        if (hG > aG) {
          map[hId].won += 1;
          map[hId].points += 3;
          map[aId].lost += 1;
        } else if (aG > hG) {
          map[aId].won += 1;
          map[aId].points += 3;
          map[hId].lost += 1;
        } else {
          map[hId].drawn += 1;
          map[aId].drawn += 1;
          map[hId].points += 1;
          map[aId].points += 1;
        }
      }
    });

    Object.values(map).forEach((t) => {
      t.gd = t.gf - t.ga;
    });

    return Object.values(map)
      .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)
      .slice(0, 4);
  }, [teams, fixtures]);

  const totalGoals = useMemo(
    () =>
      fixtures.reduce((acc, f) => {
        if (f.status === 'completed') {
          return acc + (f.homeScore || 0) + (f.awayScore || 0);
        }
        return acc;
      }, 0),
    [fixtures]
  );

  const latestResult = useMemo(() => {
    const finished = fixtures.filter((f) => f.status === 'completed');
    return finished.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  }, [fixtures]);

  if (loading) return <Loading message="Preparing KFC matchday portal..." />;

  return (
    <div className="space-y-16 pb-16">
      {/* ── 1. CINEMATIC HERO SECTION (100% THEME DRIVEN) ────────────────── */}
      <section className="relative min-h-[85vh] flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 p-8 sm:p-14 shadow-2xl backdrop-blur-2xl">
        {/* Soft Radial Ambient Glow using var(--color-accent) */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-[550px] w-[550px] rounded-full blur-[120px] opacity-25"
          style={{ backgroundColor: 'var(--color-accent)' }}
        />
        <div
          className="pointer-events-none absolute -left-20 -bottom-20 h-[450px] w-[450px] rounded-full blur-[100px] opacity-15"
          style={{ backgroundColor: 'var(--color-secondary)' }}
        />

        {/* Hero Body Content */}
        <div className="my-auto grid gap-12 lg:grid-cols-[1.3fr_0.9fr] lg:items-center relative z-10 pt-4">
          <div className="space-y-6">
            {/* Club Crest Badge Pill */}
            <div
              className="inline-flex items-center gap-3 rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-widest"
              style={{
                borderColor: 'color-mix(in srgb, var(--color-accent) 40%, transparent)',
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                color: 'var(--color-accent)',
              }}
            >
              {theme.logoURL ? (
                <img
                  src={theme.logoURL}
                  alt="Club Crest"
                  className="h-6 w-6 rounded-full object-contain"
                />
              ) : (
                <FiShield size={16} style={{ color: 'var(--color-accent)' }} />
              )}
              <span>{theme.heroText || 'Kolothum Kadhavu FC'}</span>
            </div>

            {/* Headline with Animated Draw-in Theme Accent Bar */}
            <div className="space-y-3">
              <h1 className="font-display text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.05]">
                {theme.tagline || 'Every Click. Every Goal. Every Spot Earned.'}
              </h1>
              {/* Draw-in Underline Bar */}
              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full animate-draw-underline"
                  style={{
                    background: `linear-gradient(to right, var(--color-accent), var(--color-secondary))`,
                  }}
                />
              </div>
            </div>

            <p className="max-w-xl text-base sm:text-lg leading-relaxed text-slate-300 font-normal">
              Welcome to the official digital portal of Kolothum Kadhavu Football Club. Track live matchday fixtures, tactical lineups, real-time standings, and FIFA squad ratings.
            </p>

            {/* Auth-Aware Conversion CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              {user ? (
                <Link
                  to={dashboardLink}
                  className="rounded-2xl px-7 py-3.5 text-sm font-black text-slate-950 transition-all duration-300 hover:scale-[1.05] flex items-center gap-2 shadow-lg"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    boxShadow: '0 0 25px color-mix(in srgb, var(--color-accent) 40%, transparent)',
                  }}
                >
                  <span>Go to Dashboard</span>
                  <FiArrowRight size={18} />
                </Link>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/login"
                    className="rounded-2xl px-7 py-3.5 text-sm font-black text-slate-950 transition-all duration-300 hover:scale-[1.05] flex items-center gap-2 shadow-lg"
                    style={{
                      backgroundColor: 'var(--color-accent)',
                      boxShadow: '0 0 25px color-mix(in srgb, var(--color-accent) 40%, transparent)',
                    }}
                  >
                    <FiLogIn size={18} />
                    <span>Login to Portal</span>
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-2xl border px-7 py-3.5 text-sm font-black transition-all duration-300 flex items-center gap-2"
                    style={{
                      borderColor: 'color-mix(in srgb, var(--color-accent) 40%, transparent)',
                      backgroundColor: 'slate-900',
                      color: 'var(--color-accent)',
                    }}
                  >
                    <FiUserPlus size={18} />
                    <span>Register Account</span>
                  </Link>
                </div>
              )}

              <Link
                to="/squad"
                className="rounded-2xl border border-white/10 bg-slate-900/80 px-6 py-3.5 text-sm font-bold text-white hover:border-[var(--color-accent)] transition-all flex items-center gap-2"
              >
                <FiUsers size={18} style={{ color: 'var(--color-accent)' }} />
                <span>Explore Squad</span>
              </Link>
            </div>
          </div>

          {/* Right Hero Cards (Next Match + Countdown) */}
          <div className="space-y-4 relative z-10">
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl space-y-3 hover:border-[var(--color-accent)] transition-all">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-accent)' }}>
                  Next Matchday
                </span>
                <span
                  className="rounded-full px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                    color: 'var(--color-accent)',
                    borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
                  }}
                >
                  Season 2025-26
                </span>
              </div>
              <div>
                <h3 className="font-display text-2xl font-black text-white">
                  {nextFixture
                    ? `${nextFixture.homeTeam?.name || 'Home Team'} vs ${nextFixture.awayTeam?.name || 'Away Team'}`
                    : 'KFC Senior vs Kadhavu United'}
                </h3>
                <p className="mt-1.5 text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <FiCalendar size={13} style={{ color: 'var(--color-accent)' }} />
                  <span>
                    {nextFixture
                      ? `${new Date(nextFixture.date).toLocaleString()} · ${nextFixture.venue || 'Stadium Pitch'}`
                      : 'Scheduled for upcoming matchday'}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl space-y-2 hover:border-[var(--color-accent)] transition-all">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kickoff Countdown</span>
                <FiClock style={{ color: 'var(--color-accent)' }} className="animate-spin" size={18} />
              </div>
              <div className="pt-2">
                <p
                  className="font-mono text-3xl sm:text-4xl font-black tracking-wider"
                  style={{ color: 'var(--color-accent)' }}
                >
                  {countdown}
                </p>
                <p className="mt-1 text-xs text-slate-400">Official Club Match Timer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="relative z-10 flex flex-col items-center justify-center pt-8 text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Scroll to Explore</span>
          <FiChevronDown size={20} style={{ color: 'var(--color-accent)' }} className="animate-bounce" />
        </div>
      </section>

      {/* ── 2. TRENDING NOW STRIP ─────────────────────────────────────────── */}
      <section
        className="rounded-2xl border p-5 shadow-lg"
        style={{
          borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
          backgroundColor: 'color-mix(in srgb, var(--color-accent) 5%, transparent)',
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-center">
          <div className="flex items-center gap-3">
            <div
              className="rounded-xl p-2.5 shrink-0 border"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                color: 'var(--color-accent)',
                borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
              }}
            >
              <FiAward size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Campaign</span>
              <p className="font-display text-sm font-bold text-white">Season 2025-26</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="rounded-xl p-2.5 shrink-0 border"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                color: 'var(--color-accent)',
                borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
              }}
            >
              <FiTrendingUp size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">League Leader</span>
              <p className="font-display text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
                {standingsPreview[0]?.name || 'Real Madrid'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="rounded-xl p-2.5 shrink-0 border"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                color: 'var(--color-accent)',
                borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
              }}
            >
              <FiTarget size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Goals</span>
              <p className="font-display text-sm font-bold text-white">{totalGoals || 42} Goals Scored</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="rounded-xl p-2.5 shrink-0 border"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                color: 'var(--color-accent)',
                borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
              }}
            >
              <FiActivity size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Latest Result</span>
              <p className="font-display text-xs font-bold text-slate-200 truncate">
                {latestResult
                  ? `${latestResult.homeTeam?.name} ${latestResult.homeScore} - ${latestResult.awayScore} ${latestResult.awayTeam?.name}`
                  : 'KFC 3 - 1 Kadhavu Utd'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-b border-white/10 my-8" />

      {/* ── 3. BY THE NUMBERS (SCOREBOARD STAT CARDS) ───────────────────── */}
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-accent)' }}>
            <FiShield size={14} />
            <span>Club Metrics</span>
          </div>
          <h2 className="font-display text-3xl font-black text-white sm:text-4xl">By the Numbers</h2>
          <div className="w-24 h-1 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <CountUpStat target={playerCount} label="Registered Players" icon={FiUsers} />
          <CountUpStat target={fixtures.length || 12} label="Matches Scheduled" icon={FiCalendar} />
          <CountUpStat target={teams.length || 4} label="Active Squad Teams" icon={FiShield} />
          <CountUpStat target={totalGoals || 42} label="Goals Scored" icon={FiZap} />
        </div>
      </section>

      {/* Divider */}
      <div className="border-b border-white/10 my-8" />

      {/* ── 4. ABOUT THE CLUB SECTION ───────────────────────────────────── */}
      <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 sm:p-12 shadow-2xl space-y-6 hover:border-[var(--color-accent)] transition-all">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-accent)' }}>
              <FiShield size={14} />
              <span>Our Heritage</span>
            </div>
            <h2 className="font-display text-3xl font-black text-white sm:text-4xl leading-tight">
              Building Legacy, One Spot & Match at a Time
            </h2>
            <div className="w-20 h-1 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />

            <p className="text-sm text-slate-300 leading-relaxed">
              Kolothum Kadhavu FC is committed to fostering tactical excellence, competitive integrity, and player development. From grass-roots training to high-stakes tournament finals, every player earns their starting XI position through raw performance.
            </p>

            <div className="grid gap-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs font-bold text-white">
                <FiCheckCircle style={{ color: 'var(--color-accent)' }} className="shrink-0" size={16} />
                <span>Transparent FIFA-Style Player Attribute Ratings</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-white">
                <FiCheckCircle style={{ color: 'var(--color-accent)' }} className="shrink-0" size={16} />
                <span>Live Interactive Lineup Planner for 5s, 7s & 11s Formats</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-white">
                <FiCheckCircle style={{ color: 'var(--color-accent)' }} className="shrink-0" size={16} />
                <span>Real-Time League Standings & Goal Difference Calculation</span>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center">
            <div
              className="relative h-64 w-64 rounded-full border-2 p-6 shadow-2xl flex items-center justify-center bg-slate-950"
              style={{ borderColor: 'color-mix(in srgb, var(--color-accent) 40%, transparent)' }}
            >
              {theme.logoURL ? (
                <img src={theme.logoURL} alt="Club Crest" className="h-full w-full object-contain" />
              ) : (
                <div className="text-center space-y-2">
                  <FiShield size={64} className="mx-auto animate-pulse" style={{ color: 'var(--color-accent)' }} />
                  <p className="font-display text-xl font-black text-white">KFC CLUB</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-b border-white/10 my-8" />

      {/* ── 5. MEET THE SQUAD PREVIEW (FUT FIFA CARDS) ───────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-accent)' }}>
              <FiShield size={14} />
              <span>Squad Showcase</span>
            </div>
            <h2 className="font-display text-3xl font-black text-white">Meet Top Rated Players</h2>
            <div className="w-20 h-1 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
          </div>

          <Link
            to="/squad"
            className="group text-xs font-bold flex items-center gap-1.5 transition"
            style={{ color: 'var(--color-accent)' }}
          >
            <span>View Full Squad</span>
            <FiArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 items-start">
          {topPlayers.map((player, idx) => (
            <div
              key={player._id || player.id || `top-player-${idx}`}
              className="page-enter transition-all duration-300 h-[470px]"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <FifaCard player={player} />
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-b border-white/10 my-8" />

      {/* ── 6. LEAGUE TABLE STANDINGS PREVIEW (TOP 4) ────────────────────── */}
      {standingsPreview.length > 0 && (
        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 space-y-6 hover:border-[var(--color-accent)] transition-all">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-accent)' }}>
                League Table
              </span>
              <h2 className="font-display text-2xl font-black text-white">Top 4 Standings Preview</h2>
            </div>
            <Link
              to="/fixtures"
              className="group text-xs font-bold flex items-center gap-1.5 transition"
              style={{ color: 'var(--color-accent)' }}
            >
              <span>Full Schedule & Standings</span>
              <FiArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-slate-950 uppercase tracking-wider text-slate-400 font-bold">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Club Team</th>
                  <th className="py-3 px-4 text-center">P</th>
                  <th className="py-3 px-4 text-center">W</th>
                  <th className="py-3 px-4 text-center">D</th>
                  <th className="py-3 px-4 text-center">L</th>
                  <th className="py-3 px-4 text-center">GD</th>
                  <th className="py-3 px-4 text-center">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200 font-semibold">
                {standingsPreview.map((team, idx) => (
                  <tr key={team._id || `standings-team-${idx}`} className="hover:bg-white/5 transition">

                    <td className="py-3.5 px-4 font-black" style={{ color: 'var(--color-accent)' }}>#{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      {team.logo && <img src={team.logo} alt="" className="h-5 w-5 rounded-full object-contain" />}
                      <span>{team.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">{team.played}</td>
                    <td className="py-3.5 px-4 text-center text-emerald-400">{team.won}</td>
                    <td className="py-3.5 px-4 text-center text-slate-400">{team.drawn}</td>
                    <td className="py-3.5 px-4 text-center text-rose-400">{team.lost}</td>
                    <td className="py-3.5 px-4 text-center font-mono">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                    <td className="py-3.5 px-4 text-center font-black text-sm" style={{ color: 'var(--color-accent)' }}>{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── 7. FINAL HIGH-INTENSITY CONVERSION CTA ───────────────────────── */}
      <section
        className="relative overflow-hidden rounded-3xl border p-10 sm:p-16 text-center space-y-6 shadow-2xl"
        style={{
          borderColor: 'color-mix(in srgb, var(--color-accent) 40%, transparent)',
          background: `linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 15%, #060b14), #060b14)`,
        }}
      >
        <div
          className="pointer-events-none absolute -right-20 -bottom-20 h-96 w-96 rounded-full blur-[120px] opacity-30"
          style={{ backgroundColor: 'var(--color-accent)' }}
        />

        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-black uppercase tracking-widest border"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
            color: 'var(--color-accent)',
            borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
          }}
        >
          <span>Be Part of the Next Chapter</span>
        </div>

        <h2 className="font-display text-3xl font-black text-white sm:text-5xl max-w-2xl mx-auto leading-tight">
          Join the Club Today. Step onto the Pitch with Kolothum Kadhavu FC.
        </h2>

        <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-300">
          Whether you are a player tracking your match stats or a manager planning tactical lineups, get full access to the portal today.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          {user ? (
            <Link
              to={dashboardLink}
              className="rounded-2xl px-9 py-4 text-base font-black text-slate-950 transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-2xl"
              style={{
                backgroundColor: 'var(--color-accent)',
                boxShadow: '0 0 35px color-mix(in srgb, var(--color-accent) 50%, transparent)',
              }}
            >
              <span>Go to Your Dashboard</span>
              <FiArrowRight size={20} />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-2xl px-9 py-4 text-base font-black text-slate-950 transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-2xl"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  boxShadow: '0 0 35px color-mix(in srgb, var(--color-accent) 50%, transparent)',
                }}
              >
                <FiLogIn size={20} />
                <span>Login Now</span>
              </Link>
              <Link
                to="/register"
                className="rounded-2xl border px-9 py-4 text-base font-black transition-all duration-300 flex items-center gap-2"
                style={{
                  borderColor: 'color-mix(in srgb, var(--color-accent) 50%, transparent)',
                  backgroundColor: 'slate-900',
                  color: 'var(--color-accent)',
                }}
              >
                <FiUserPlus size={20} />
                <span>Register Account</span>
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
