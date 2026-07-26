import { useEffect, useMemo, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import FifaCard from '../components/FifaCard';
import Loading from '../components/Loading';
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
  FiMapPin,
  FiCheckCircle,
  FiTag,
  FiStar,
  FiChevronRight
} from 'react-icons/fi';

export default function HomePage() {
  const { user } = useContext(AuthContext);

  const [fixtures, setFixtures] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ hours: '24', mins: '00', secs: '00' });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Safe data fetching with individual fallbacks so public guests never trigger 401 errors
        const [fixturesRes, ratingsRes, teamsRes] = await Promise.all([
          api.get('/fixtures').catch(() => ({ data: [] })),
          api.get('/ratings').catch(() => ({ data: [] })),
          api.get('/teams?includeAll=true').catch(() => ({ data: [] })),
        ]);

        const fx = Array.isArray(fixturesRes.data) ? fixturesRes.data : [];
        setFixtures(fx);

        const rt = Array.isArray(ratingsRes.data) ? ratingsRes.data : [];
        setRatings(rt);

        const tm = Array.isArray(teamsRes.data) ? teamsRes.data : teamsRes.data?.teams || [];
        setTeams(tm);
      } catch (err) {
        console.error('Failed to load homepage data safely:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Find next upcoming fixture
  const nextFixture = useMemo(() => {
    if (!Array.isArray(fixtures) || fixtures.length === 0) return null;
    const scheduled = fixtures.filter((f) => f && f.status === 'scheduled');
    return scheduled.sort((a, b) => new Date(a.date) - new Date(b.date))[0] || fixtures[0] || null;
  }, [fixtures]);

  // Live Countdown timer for next match
  useEffect(() => {
    if (!nextFixture?.date) {
      setCountdown({ hours: '24', mins: '00', secs: '00' });
      return;
    }

    const updateTimer = () => {
      const matchTime = new Date(nextFixture.date).getTime();
      const now = new Date().getTime();
      const diff = matchTime - now;

      if (diff <= 0) {
        setCountdown({ hours: '00', mins: '00', secs: '00' });
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({
          hours: String(h).padStart(2, '0'),
          mins: String(m).padStart(2, '0'),
          secs: String(s).padStart(2, '0')
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextFixture]);

  // Top featured player cards
  const topPlayers = useMemo(() => {
    if (Array.isArray(ratings) && ratings.length > 0) {
      return ratings.filter(r => r && (r.player || r.name)).slice(0, 4);
    }
    return [];
  }, [ratings]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loading message="Loading Malabar United FC..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04150e] text-[#f8fafc] font-space selection:bg-[#10b981] selection:text-slate-950 -mx-4 sm:-mx-6 lg:-mx-8 -my-8 px-4 sm:px-6 lg:px-8 py-4">
      {/* ═════════════════════════════════════════════════════════════
          HERO SECTION (SIGNATURE MOMENT: ANIMATED GOAL & SAVE)
          ═════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:py-20 border-b border-emerald-900/30">
        {/* Background Floodlight Glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[36rem] w-[50rem] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="pointer-events-none absolute top-1/3 -right-20 h-[25rem] w-[25rem] bg-amber-500/10 blur-[100px] rounded-full" />

        <div className="relative mx-auto max-w-7xl">
          {/* Header Tagline & Club Identity */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-900/40 pb-6 mb-8">
            <div className="flex items-center gap-3">
              {/* Gold Crest Badge */}
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/20 font-anton text-2xl">
                MU
              </div>
              <div>
                <h2 className="font-anton text-xl tracking-wider text-white uppercase leading-none">
                  MALABAR UNITED FC
                </h2>
                <p className="text-xs font-medium text-emerald-400">Kozhikode, Kerala • Est. 1998</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>OFFICIAL CLUB HOMEPAGE</span>
            </div>
          </div>

          {/* Hero Content Grid: Headline Left, Flat Vector SVG Centerpiece Right */}
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Headline & Copy */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <span className="inline-block font-anton text-sm sm:text-base tracking-widest uppercase text-amber-400">
                  KOZHIKODE’S PRIDE
                </span>
                <h1 className="font-anton text-5xl sm:text-7xl xl:text-8xl leading-[0.9] text-white tracking-tight uppercase">
                  ONE CLUB.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                    ONE CITY.
                  </span>
                </h1>
              </div>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg font-normal">
                Welcome to the official home of Malabar United FC. From the roaring stands of Kozhikode to tactical pitch action, we bleed green & gold. Experience matchdays, player stats, and club glory.
              </p>

              {/* Hero Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to={user ? "/fixtures" : "/register"}
                  className="flex min-h-[52px] items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-slate-950 shadow-xl shadow-emerald-500/25 transition hover:brightness-110 hover:scale-105 active:scale-95"
                >
                  <FiTag className="h-5 w-5" />
                  <span>GET MATCH TICKETS</span>
                </Link>

                <Link
                  to="/squad"
                  className="flex min-h-[52px] items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-md transition hover:bg-emerald-900/60 hover:text-white"
                >
                  <FiUsers className="h-5 w-5" />
                  <span>EXPLORE SQUAD</span>
                </Link>
              </div>
            </div>

            {/* Right: Signature Flat Vector SVG Goal & Save Centerpiece */}
            <div className="lg:col-span-6">
              <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-b from-[#062016] to-[#03110b] p-4 sm:p-6 shadow-2xl">
                {/* Stadium Crowd Roar Light Flash Overlay */}
                <div className="animate-crowd-flash pointer-events-none absolute inset-0 bg-gradient-to-tr from-amber-400/30 via-white/40 to-emerald-400/30 z-20" />

                {/* Top Badge Overlay */}
                <div className="absolute top-6 left-6 z-30 flex items-center gap-2 rounded-lg bg-black/60 px-3 py-1.5 backdrop-blur-md border border-white/10">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white">KEY MOMENT • TOP CORNER SAVE</span>
                </div>

                {/* SVG Canvas (800 x 450) */}
                <svg
                  viewBox="0 0 800 450"
                  className="w-full h-auto rounded-2xl relative z-10 bg-[#041910] border border-emerald-900/50"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    {/* Goal Net Pattern */}
                    <pattern id="goalNetPattern" width="16" height="16" patternUnits="userSpaceOnUse">
                      <path d="M 16 0 L 0 16 M 0 0 L 16 16" fill="none" stroke="rgba(248, 250, 252, 0.12)" strokeWidth="1" />
                    </pattern>

                    {/* Floodlight Beam Gradient */}
                    <linearGradient id="floodlightBeam" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#04150e" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Stadium Pitch Background & Lines */}
                  <rect width="800" height="450" fill="#041910" />

                  {/* Floodlight Rays */}
                  <polygon points="0,0 300,0 800,450 0,450" fill="url(#floodlightBeam)" />
                  <polygon points="500,0 800,0 800,450 200,450" fill="url(#floodlightBeam)" opacity="0.6" />

                  {/* Pitch Turf Stripes */}
                  <rect x="0" y="320" width="800" height="130" fill="#062619" />
                  <rect x="0" y="360" width="800" height="40" fill="#041f14" />
                  <line x1="0" y1="340" x2="800" y2="340" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="2" strokeDasharray="8 8" />

                  {/* GOALPOST STRUCTURE (Right Side Goal Frame) */}
                  {/* Goal Net Background */}
                  <rect x="520" y="80" width="230" height="240" fill="url(#goalNetPattern)" stroke="rgba(248,250,252,0.2)" strokeWidth="2" />

                  {/* Goal Post & Crossbar (Bright White Vector Frame) */}
                  <path d="M 515 320 L 515 75 L 755 75 L 755 320" fill="none" stroke="#f8fafc" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M 515 75 L 545 110 L 745 110 L 755 75" fill="none" stroke="rgba(248,250,252,0.4)" strokeWidth="3" />

                  {/* Pitch Goal Line */}
                  <line x1="100" y1="320" x2="770" y2="320" stroke="#f8fafc" strokeWidth="4" opacity="0.8" />
                  <ellipse cx="635" cy="320" rx="40" ry="12" fill="none" stroke="rgba(248,250,252,0.3)" strokeWidth="2" />

                  {/* GOALKEEPER SILHOUETTE (Diving Vector) */}
                  <g className="animate-keeper-dive">
                    {/* Goalkeeper Body & Arms Extended */}
                    <path
                      d="M -30 -10 Q -10 -25, 15 -20 Q 35 -15, 55 -5 Q 70 5, 85 10 L 95 0 L 80 -15 Q 50 -30, 20 -35 Q -10 -40, -40 -20 Z"
                      fill="#fbbf24"
                    />
                    {/* Gloves (Catching Hands right at the top corner) */}
                    <circle cx="95" cy="0" r="10" fill="#10b981" />
                    <circle cx="85" cy="-8" r="9" fill="#10b981" />
                    {/* Keeper Head */}
                    <circle cx="20" cy="-25" r="12" fill="#0f172a" />
                    {/* Keeper Legs */}
                    <path d="M -40 -20 L -80 -10 L -65 -35 Z" fill="#1e293b" />
                  </g>

                  {/* FOOTBALL (Curling Trajectory Vector) */}
                  <g className="animate-ball-curl">
                    {/* Football Circle */}
                    <circle cx="0" cy="0" r="14" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
                    {/* Pentagon Markings */}
                    <polygon points="0,-7 6,-2 4,5 -4,5 -6,-2" fill="#0f172a" />
                    <line x1="0" y1="-7" x2="0" y2="-14" stroke="#0f172a" strokeWidth="1.5" />
                    <line x1="6" y1="-2" x2="12" y2="-5" stroke="#0f172a" strokeWidth="1.5" />
                    <line x1="4" y1="5" x2="9" y2="11" stroke="#0f172a" strokeWidth="1.5" />
                    <line x1="-4" y1="5" x2="-9" y2="11" stroke="#0f172a" strokeWidth="1.5" />
                    <line x1="-6" y1="-2" x2="-12" y2="-5" stroke="#0f172a" strokeWidth="1.5" />
                  </g>
                </svg>

                {/* "SAVED!" Freeze Badge Pop Overlay */}
                <div className="animate-saved-badge absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-500 px-6 py-3 shadow-2xl shadow-rose-600/50 border-2 border-white/40">
                    <span className="font-anton text-3xl sm:text-5xl tracking-widest text-white uppercase drop-shadow-md">
                      SAVED! 🧤
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-200">
                      CLUTCH TOP-CORNER STOP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 1: MARQUEE STRIP (STADIUM BANNER)
          ═════════════════════════════════════════════════════════════ */}
      <section className="overflow-hidden border-y border-emerald-500/20 bg-gradient-to-r from-[#03130c] via-[#082b1c] to-[#03130c] py-4">
        <div className="animate-marquee flex items-center whitespace-nowrap">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4">
              <span className="font-anton text-2xl sm:text-4xl tracking-widest text-white uppercase">
                ONE CLUB. ONE CITY.
              </span>
              <span className="text-amber-400 font-anton text-2xl sm:text-4xl">★</span>
              <span className="font-anton text-2xl sm:text-4xl tracking-widest text-emerald-400 uppercase">
                MALABAR UNITED FC
              </span>
              <span className="text-amber-400 font-anton text-2xl sm:text-4xl">★</span>
              <span className="font-anton text-2xl sm:text-4xl tracking-widest text-slate-300 uppercase">
                KOZHIKODE, KERALA
              </span>
              <span className="text-amber-400 font-anton text-2xl sm:text-4xl">★</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 2: CLUB STATS BAR (BIG EDITORIAL NUMBERS)
          ═════════════════════════════════════════════════════════════ */}
      <section className="py-14 border-b border-emerald-900/30">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 sm:gap-6">
            <div className="rounded-2xl border border-emerald-500/20 bg-[#061d14]/80 p-6 text-center space-y-1">
              <span className="font-anton text-5xl sm:text-6xl text-amber-400 tracking-tight block">
                1998
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">FOUNDED YEAR</span>
              <p className="text-[11px] text-slate-400">Kozhikode Legacy</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-[#061d14]/80 p-6 text-center space-y-1">
              <span className="font-anton text-5xl sm:text-6xl text-emerald-400 tracking-tight block">
                30,000+
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">HOME GROUND CAPACITY</span>
              <p className="text-[11px] text-slate-400">EMSC Stadium, Kozhikode</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-[#061d14]/80 p-6 text-center space-y-1">
              <span className="font-anton text-5xl sm:text-6xl text-amber-400 tracking-tight block">
                14
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">MAJOR TROPHIES</span>
              <p className="text-[11px] text-slate-400">State & Regional Cups</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-[#061d14]/80 p-6 text-center space-y-1">
              <span className="font-anton text-5xl sm:text-6xl text-emerald-400 tracking-tight block">
                100%
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">CITY PASSION</span>
              <p className="text-[11px] text-slate-400">One Club. One City.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 3: NEXT MATCH CARD (COUNTDOWN & MATCHDAY DETAILS)
          ═════════════════════════════════════════════════════════════ */}
      <section className="py-16 border-b border-emerald-900/30">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="font-anton text-xs tracking-widest text-emerald-400 uppercase">MATCHDAY FOCUS</span>
              <h2 className="font-anton text-4xl sm:text-5xl text-white tracking-tight uppercase">NEXT MATCH fixture</h2>
            </div>
            <Link
              to="/fixtures"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase text-emerald-400 hover:text-emerald-300 transition"
            >
              <span>View Full Match Schedule</span>
              <FiChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Next Match Banner Card */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-r from-[#062016] via-[#0a3022] to-[#041710] p-6 sm:p-10 shadow-2xl">
            {/* Crimson Live Tag */}
            <div className="absolute top-6 left-6 flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-xs font-bold text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <span>OFFICIAL MATCHDAY</span>
            </div>

            <div className="grid gap-8 lg:grid-cols-12 lg:items-center pt-6">
              {/* Teams Matchup */}
              <div className="lg:col-span-7 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                {/* Home Team */}
                <div className="flex flex-col items-center sm:items-start gap-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 font-anton text-2xl shadow-lg shadow-amber-400/20">
                    MU
                  </div>
                  <div>
                    <h3 className="font-anton text-2xl text-white tracking-wide">
                      {nextFixture?.homeTeam?.name || 'MALABAR UNITED FC'}
                    </h3>
                    <span className="text-xs text-emerald-400 font-semibold">HOME TEAM</span>
                  </div>
                </div>

                <div className="font-anton text-4xl text-amber-400 italic px-4">VS</div>

                {/* Away Team */}
                <div className="flex flex-col items-center sm:items-end gap-2 text-center sm:text-right">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-cyan-400 border border-cyan-500/30 font-anton text-2xl shadow-lg">
                    {nextFixture?.awayTeam?.name?.substring(0, 2).toUpperCase() || 'ES'}
                  </div>
                  <div>
                    <h3 className="font-anton text-2xl text-white tracking-wide">
                      {nextFixture?.awayTeam?.name || 'EAGLE STARS KOZHIKODE'}
                    </h3>
                    <span className="text-xs text-slate-400 font-semibold">CHALLENGERS</span>
                  </div>
                </div>
              </div>

              {/* Countdown & RSVP CTA */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-[#03150d]/80 p-6 space-y-4 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">KICK-OFF COUNTDOWN</span>
                <div className="flex items-center gap-3 font-anton text-3xl sm:text-4xl text-amber-400">
                  <div className="flex flex-col items-center">
                    <span className="bg-slate-900 px-3 py-1.5 rounded-xl border border-white/10">{countdown.hours}</span>
                    <span className="text-[10px] font-space text-slate-400 mt-1 uppercase">HRS</span>
                  </div>
                  <span>:</span>
                  <div className="flex flex-col items-center">
                    <span className="bg-slate-900 px-3 py-1.5 rounded-xl border border-white/10">{countdown.mins}</span>
                    <span className="text-[10px] font-space text-slate-400 mt-1 uppercase">MINS</span>
                  </div>
                  <span>:</span>
                  <div className="flex flex-col items-center">
                    <span className="bg-slate-900 px-3 py-1.5 rounded-xl border border-white/10">{countdown.secs}</span>
                    <span className="text-[10px] font-space text-slate-400 mt-1 uppercase">SECS</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <FiMapPin className="text-emerald-400" />
                  <span>EMSC Stadium, Kozhikode • {nextFixture?.date ? new Date(nextFixture.date).toLocaleDateString() : 'Saturday 4:00 PM'}</span>
                </div>

                <Link
                  to={nextFixture ? `/fixtures/${nextFixture._id}` : '/fixtures'}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 transition"
                >
                  RESERVE MATCHDAY PASS
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 4: SQUAD HIGHLIGHT (PLAYER CARDS)
          ═════════════════════════════════════════════════════════════ */}
      <section className="py-16 border-b border-emerald-900/30">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="font-anton text-xs tracking-widest text-emerald-400 uppercase">SQUAD SPOTLIGHT</span>
              <h2 className="font-anton text-4xl sm:text-5xl text-white tracking-tight uppercase">KEY PLAYERS & CARDS</h2>
            </div>
            <Link
              to="/squad"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase text-emerald-400 hover:text-emerald-300 transition"
            >
              <span>Explore Entire Roster</span>
              <FiChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Player Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {topPlayers.length > 0 ? (
              topPlayers.map((player) => (
                <div key={player._id} className="flex justify-center">
                  <FifaCard player={player} />
                </div>
              ))
            ) : (
              /* Fallback Styled Squad Cards if ratings API is empty */
              [
                { name: 'Rahul K.V.', pos: 'ST', num: '9', ovr: 88, pace: 91, sho: 89, pas: 82 },
                { name: 'Anas N.P.', pos: 'CM', num: '8', ovr: 86, pace: 84, sho: 82, pas: 90 },
                { name: 'Fahad Kozhikode', pos: 'CB', num: '4', ovr: 87, pace: 82, sho: 65, pas: 78 },
                { name: 'Jithin V.', pos: 'GK', num: '1', ovr: 89, pace: 75, sho: 40, pas: 85 }
              ].map((p, idx) => (
                <div key={idx} className="rounded-2xl border border-emerald-500/20 bg-[#061d14]/90 p-5 space-y-4 hover:border-amber-400/50 transition duration-300 group">
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-amber-400/20 px-2.5 py-1 text-xs font-extrabold text-amber-300 border border-amber-400/30">
                      OVR {p.ovr}
                    </span>
                    <span className="font-anton text-lg text-emerald-400">#{p.num} • {p.pos}</span>
                  </div>
                  <div className="h-40 rounded-xl bg-gradient-to-t from-slate-950 via-slate-900 to-emerald-950/40 flex items-center justify-center border border-white/10 relative overflow-hidden group-hover:scale-102 transition">
                    <div className="font-anton text-5xl text-emerald-400/20 uppercase">{p.pos}</div>
                    <span className="absolute bottom-3 font-anton text-lg text-white tracking-wide">{p.name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase text-slate-300">
                    <div className="bg-slate-900/60 p-1.5 rounded-lg">PAC {p.pace}</div>
                    <div className="bg-slate-900/60 p-1.5 rounded-lg">SHO {p.sho}</div>
                    <div className="bg-slate-900/60 p-1.5 rounded-lg">PAS {p.pas}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 5: MEMBERSHIP & TICKET CTA
          ═════════════════════════════════════════════════════════════ */}
      <section className="py-20 border-b border-emerald-900/30">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-950 via-[#06291b] to-slate-950 p-8 sm:p-14 shadow-2xl text-center space-y-6">
            {/* Background Glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-96 bg-amber-400/10 blur-3xl rounded-full" />

            <span className="font-anton text-xs tracking-widest text-amber-400 uppercase">OFFICIAL CLUB MEMBERSHIP</span>
            <h2 className="font-anton text-4xl sm:text-6xl text-white tracking-tight uppercase leading-tight">
              BECOME PART OF MALABAR UNITED
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-normal">
              Join 30,000+ passionate supporters in Kozhikode. Unlock priority matchday tickets, exclusive squad training session signups, and official member perks.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                to={user ? "/dashboard" : "/register"}
                className="flex min-h-[52px] items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-slate-950 shadow-xl shadow-amber-500/25 hover:brightness-110 hover:scale-105 transition"
              >
                <span>JOIN AS A MEMBER</span>
                <FiArrowRight className="h-4 w-4" />
              </Link>

              {!user && (
                <Link
                  to="/login"
                  className="flex min-h-[52px] items-center gap-2 rounded-xl border border-white/20 bg-slate-900/80 px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white hover:bg-slate-800 transition"
                >
                  <span>SIGN IN TO PORTAL</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 6: FOOTER WITH CREST & SOCIAL LINKS
          ═════════════════════════════════════════════════════════════ */}
      <footer className="pt-12 pb-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-emerald-900/40 pb-8 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 font-anton text-2xl">
                MU
              </div>
              <div>
                <h3 className="font-anton text-xl text-white tracking-wide uppercase">MALABAR UNITED FC</h3>
                <p className="text-xs text-emerald-400 font-semibold">One Club. One City. Kozhikode, Kerala.</p>
              </div>
            </div>

            {/* Social media links */}
            <div className="flex items-center gap-4 text-sm text-slate-400 font-semibold">
              <a href="#instagram" className="hover:text-amber-400 transition">INSTAGRAM</a>
              <span>•</span>
              <a href="#twitter" className="hover:text-amber-400 transition">TWITTER / X</a>
              <span>•</span>
              <a href="#youtube" className="hover:text-amber-400 transition">YOUTUBE</a>
              <span>•</span>
              <a href="#facebook" className="hover:text-amber-400 transition">FACEBOOK</a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Malabar United FC. All rights reserved.</p>
            <p>Built with Editorial Sports Design • EMSC Stadium, Kozhikode</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
