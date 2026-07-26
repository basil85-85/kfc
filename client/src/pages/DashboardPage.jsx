import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import Loading from '../components/Loading';
import FixtureDetailModal from '../components/FixtureDetailModal';
import { getTeamTintStyle } from '../utils/teamTheme';
import {
  FiCalendar,
  FiCreditCard,
  FiUser,
  FiCheckCircle,
  FiShield,
  FiActivity,
  FiPlusCircle,
  FiEdit3,
  FiClock,
  FiMapPin,
  FiAward,
  FiUsers,
  FiSend,
  FiXCircle,
  FiLock,
} from 'react-icons/fi';

const MatchCountdown = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, mins, secs, totalHours: Math.floor(diff / (1000 * 60 * 60)) });
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft || timeLeft.totalHours > 48) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-xl bg-slate-900/90 border border-cyan-500/40 px-3 py-1.5 text-xs font-mono text-cyan-300 shadow-glow-cyan">
      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
      <span>
        Kicks off in {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.mins).padStart(2, '0')}m{' '}
        {String(timeLeft.secs).padStart(2, '0')}s
      </span>
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const teamColor = user?.team?.color;
  const tintStyle = useMemo(() => getTeamTintStyle(teamColor), [teamColor]);

  const [sessions, setSessions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [teamLineup, setTeamLineup] = useState(null);
  const [lineupFixtureId, setLineupFixtureId] = useState(null);
  const [detailFixtureId, setDetailFixtureId] = useState(null);
  const [loading, setLoading] = useState(true);
  // League join-request state (manager only)
  const [allLeagues,      setAllLeagues]      = useState([]);
  const [myJoinRequests,  setMyJoinRequests]  = useState([]);
  const [requestingId,    setRequestingId]    = useState(null); // league being requested

  const teamId = user?.team?._id || user?.team;
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  useEffect(() => {
    const load = async () => {
      try {
        const [sessionsRes, paymentsRes, fixturesRes] = await Promise.all([
          api.get('/sessions'),
          api.get('/payments/my'),
          api.get('/fixtures'),
        ]);
        const sessionsList = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
        const paymentsList = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
        const fixturesList = Array.isArray(fixturesRes.data) ? fixturesRes.data : [];

        setSessions(sessionsList);
        setPayments(paymentsList);
        setFixtures(fixturesList);

        let effectiveTeamId = user?.team?._id || user?.team;
        if (!effectiveTeamId) {
          try {
            const { data: myTeams } = await api.get('/teams?includeAll=true');
            const myTeam = (Array.isArray(myTeams) ? myTeams : myTeams?.teams || []).find(
              (t) =>
                String(t.createdBy?._id || t.createdBy) === String(user?._id) ||
                (t.players || []).some((p) => String(p._id || p) === String(user?._id))
            );
            if (myTeam) effectiveTeamId = myTeam._id;
          } catch (e) {}
        }

        if (effectiveTeamId) {
          const myTeamFixtures = fixturesList.filter(
            (f) =>
              String(f.homeTeam?._id || f.homeTeam) === String(effectiveTeamId) ||
              String(f.awayTeam?._id || f.awayTeam) === String(effectiveTeamId)
          );

          if (myTeamFixtures.length > 0) {
            const targetFixture =
              myTeamFixtures.find((f) => f.status === 'scheduled') || myTeamFixtures[myTeamFixtures.length - 1];
            setLineupFixtureId(targetFixture._id);

            try {
              const { data: lineupData } = await api.get(`/lineups/${targetFixture._id}`);
              const myLineup = lineupData.lineups?.find(
                (l) => String(l.team?._id || l.team) === String(effectiveTeamId)
              );
              setTeamLineup(myLineup || null);
            } catch {
              /* no saved lineup */
            }
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }

      // Manager: load leagues + own join requests in parallel (non-blocking)
      if (user?.role === 'manager') {
        try {
          const [leaguesRes, myReqsRes] = await Promise.all([
            api.get('/leagues'),
            api.get('/leagues/my-join-requests'),
          ]);
          setAllLeagues(Array.isArray(leaguesRes.data) ? leaguesRes.data : []);
          setMyJoinRequests(Array.isArray(myReqsRes.data) ? myReqsRes.data : []);
        } catch (err) {
          console.error('Could not load league data for manager:', err);
        }
      }
    };
    load();
  }, [user]);

  // Derive player's next upcoming match
  const myUpcomingFixture = useMemo(() => {
    const effectiveTeamId = user?.team?._id || user?.team;
    if (!effectiveTeamId) return null;
    const myFixtures = fixtures.filter(
      (f) =>
        String(f.homeTeam?._id || f.homeTeam) === String(effectiveTeamId) ||
        String(f.awayTeam?._id || f.awayTeam) === String(effectiveTeamId)
    );
    const scheduled = myFixtures.filter((f) => f.status === 'scheduled');
    if (scheduled.length > 0) {
      return scheduled.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    }
    return null;
  }, [fixtures, user]);

  const opponentTeam = useMemo(() => {
    if (!myUpcomingFixture) return null;
    const userTeamId = user?.team?._id || user?.team;
    const isHome = String(myUpcomingFixture.homeTeam?._id || myUpcomingFixture.homeTeam) === String(userTeamId);
    return isHome ? myUpcomingFixture.awayTeam : myUpcomingFixture.homeTeam;
  }, [myUpcomingFixture, user]);

  const userLineupStatus = useMemo(() => {
    if (!teamLineup) return { status: 'NOT_ANNOUNCED', label: 'Lineup not yet announced' };

    const startingXI = teamLineup.startingXI || [];
    const substitutes = teamLineup.substitutes || [];

    const inStarting = startingXI.find((item) => {
      const pId = typeof item === 'object' ? item.player?._id || item.player || item._id : item;
      return String(pId) === String(user?._id);
    });

    if (inStarting) {
      const pos = typeof inStarting === 'object' ? inStarting.position : user?.position;
      return {
        status: 'STARTING_XI',
        label: `You're in the Starting XI ${pos ? `(${pos})` : ''}`,
      };
    }

    const inSub = substitutes.find((item) => {
      const pId = typeof item === 'object' ? item.player?._id || item.player || item._id : item;
      return String(pId) === String(user?._id);
    });

    if (inSub) {
      return { status: 'SUBSTITUTE', label: "You're a Substitute" };
    }

    return { status: 'NOT_SELECTED', label: 'Not selected for this match' };
  }, [teamLineup, user?._id, user?.position]);

  const duePayments = payments.filter((payment) => payment.status !== 'paid');
  const attendance = useMemo(() => {
    const total = sessions.length;
    const attended = sessions.filter((session) =>
      session.attended?.some((id) => String(id) === String(user?._id))
    ).length;
    return total ? Math.round((attended / total) * 100) : 0;
  }, [sessions, user?._id]);

  // Manager helpers — league join
  const teamCurrentLeagueId = user?.team?.league
    ? String(user.team.league?._id || user.team.league)
    : null;

  const requestStatusFor = (leagueId) => {
    return myJoinRequests.find((r) => String(r.league?._id || r.league) === String(leagueId));
  };

  const handleJoinRequest = async (leagueId) => {
    setRequestingId(leagueId);
    try {
      await api.post(`/leagues/${leagueId}/join-request`);
      // Refresh own requests
      const { data } = await api.get('/leagues/my-join-requests');
      setMyJoinRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Join request failed:', err.response?.data?.message || err.message);
      // Surface error via alert for now (no toast import needed — use existing toast from context if available)
      alert(err.response?.data?.message || 'Could not submit join request.');
    } finally {
      setRequestingId(null);
    }
  };

  if (loading) return <Loading message="Loading player dashboard..." />;


  return (
    <div className="space-y-8 transition-all duration-300">
      {/* Welcome Banner Header */}
      <header
        className="glass-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-cyan-500/20 shadow-glow-cyan"
        style={{
          borderColor: user?.team?.color ? `${user.team.color}40` : undefined,
        }}
      >
        <div className="flex items-center gap-4">
          {user?.team?.logo ? (
            <img
              src={user.team.logo}
              alt={user.team.name}
              className="h-14 w-14 object-contain rounded-2xl bg-slate-900/80 p-2 border border-white/10 shrink-0"
            />
          ) : user?.team?.color ? (
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center font-display font-black text-xl text-slate-950 shrink-0 shadow-lg"
              style={{ backgroundColor: user.team.color }}
            >
              {user.team.name?.charAt(0) || 'T'}
            </div>
          ) : null}

          <div>
            <span className="section-label">Player Hub</span>
            <h1 className="font-display text-3xl font-black text-white flex items-center gap-2">
              <span>Welcome Back, {user?.name}!</span>
            </h1>
            <p className="text-xs text-slate-300 flex items-center gap-2 mt-1">
              <span>{user?.position || 'CM'} • Jersey #{user?.jersey || '00'}</span>
              <span className="text-slate-500">•</span>
              <span className="font-bold" style={{ color: user?.team?.color || '#00d2ff' }}>
                {user?.team?.name || 'KFC Free Agent'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {isManager && (
            <Link to="/dashboard/lineup-planner" className="btn-primary text-xs py-2 px-3 gap-1.5 font-bold">
              <FiEdit3 size={14} /> Lineup Planner
            </Link>
          )}
          <Link to="/dashboard/register-team" className="btn-secondary text-xs py-2 px-3 gap-1.5 border-amber-500/30 text-amber-300">
            <FiPlusCircle size={14} /> {user?.team ? 'My Team' : 'Register Team'}
          </Link>
          <Link to="/dashboard/profile" className="btn-secondary text-xs py-2 px-3 gap-1.5">
            <FiUser size={14} /> Edit Profile
          </Link>
        </div>
      </header>

      {/* PROMINENT "YOUR NEXT MATCH" AWARENESS WIDGET */}
      <section
        className="glass-card space-y-4 border-cyan-500/30 shadow-glow-cyan overflow-hidden relative"
        style={{
          borderColor: tintStyle.isTeamTinted ? `${tintStyle.accentColor}50` : undefined,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full animate-pulse"
              style={{ backgroundColor: tintStyle.accentColor }}
            />
            <span className="section-label">Fixture Awareness</span>
            <h2 className="font-display text-xl font-bold text-white">Your Next Match</h2>
          </div>

          {myUpcomingFixture && <MatchCountdown targetDate={myUpcomingFixture.date} />}
        </div>

        {myUpcomingFixture ? (
          <div className="grid gap-6 md:grid-cols-3 items-center">
            {/* Match Information */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-4">
                {opponentTeam?.logo ? (
                  <img
                    src={opponentTeam.logo}
                    alt={opponentTeam.name}
                    className="h-12 w-12 object-contain rounded-xl bg-slate-900/90 p-1.5 border border-white/10 shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white shrink-0 border border-white/10">
                    <FiShield className="text-cyan-400" size={20} />
                  </div>
                )}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    VS {opponentTeam?.name || 'Opponent'}
                  </span>
                  <h3 className="font-display text-2xl font-black text-white">
                    {user?.team?.name || 'My Team'} <span className="text-slate-500 font-normal">vs</span> {opponentTeam?.name || 'Opponent'}
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <FiCalendar className="text-cyan-400" />
                  {new Date(myUpcomingFixture.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {' at '}
                  {new Date(myUpcomingFixture.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <FiMapPin className="text-cyan-400" /> {myUpcomingFixture.venue || 'Main Stadium Ground'}
                </span>
                <span className="badge-cyan uppercase font-mono tracking-wider">
                  {myUpcomingFixture.format || '11s'} Format
                </span>
              </div>
            </div>

            {/* Player's Lineup Status */}
            <div className="flex flex-col items-start md:items-end justify-center gap-2 border-t md:border-t-0 md:border-l border-white/[0.08] pt-4 md:pt-0 md:pl-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Your Selection Status</span>
              {userLineupStatus.status === 'STARTING_XI' && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs font-bold text-emerald-300 shadow-glow-emerald">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{userLineupStatus.label}</span>
                </div>
              )}
              {userLineupStatus.status === 'SUBSTITUTE' && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 text-xs font-bold text-amber-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span>{userLineupStatus.label}</span>
                </div>
              )}
              {userLineupStatus.status === 'NOT_SELECTED' && (
                <div className="flex items-center gap-2 rounded-xl bg-slate-800 border border-white/10 px-3.5 py-2 text-xs font-bold text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                  <span>{userLineupStatus.label}</span>
                </div>
              )}
              {userLineupStatus.status === 'NOT_ANNOUNCED' && (
                <div className="flex items-center gap-2 rounded-xl bg-slate-900/80 border border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                  <span>{userLineupStatus.label}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setDetailFixtureId(myUpcomingFixture._id)}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline mt-1"
              >
                View Match Center & Lineup Details →
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-1">
            <p className="font-display text-base font-bold text-slate-200">No Upcoming Matches Scheduled</p>
            <p className="text-xs text-slate-400">Your team has no active fixtures on the schedule right now.</p>
          </div>
        )}
      </section>

      {/* Main Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Next Match Card */}
        <div className="glass-card space-y-2 border-cyan-500/20">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-cyan-400">
            <span>Next Match</span>
            <FiCalendar />
          </div>
          {myUpcomingFixture ? (
            <>
              <p className="font-display text-base font-bold text-white truncate">
                {user?.team?.name || 'My Team'} vs {opponentTeam?.name || 'Opponent'}
              </p>
              <p className="text-xs text-slate-400">
                {new Date(myUpcomingFixture.date).toLocaleDateString()}
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-base font-bold text-slate-200 truncate">No Scheduled Match</p>
              <p className="text-xs text-slate-400">Standby for fixtures</p>
            </>
          )}
        </div>

        {/* Attendance Percentage */}
        <div className="glass-card space-y-2 border-teal-500/20">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-teal-400">
            <span>Attendance Rate</span>
            <FiCheckCircle />
          </div>
          <p className="font-display text-3xl font-black text-teal-300">{attendance}%</p>
          <p className="text-xs text-slate-400">Sessions Attended</p>
        </div>

        {/* Payments Due */}
        <div className="glass-card space-y-2 border-rose-500/20">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rose-400">
            <span>Payments Due</span>
            <FiCreditCard />
          </div>
          <p className="font-display text-3xl font-black text-rose-400">{duePayments.length}</p>
          <p className="text-xs text-slate-400">Pending Invoices</p>
        </div>

        {/* Sessions Open */}
        <div className="glass-card space-y-2 border-amber-500/20">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-400">
            <span>Active Sessions</span>
            <FiActivity />
          </div>
          <p className="font-display text-3xl font-black text-amber-300">{sessions.length}</p>
          <p className="text-xs text-slate-400">Club Sessions Open</p>
        </div>
      </div>

      {/* TEAM STARTING XI LINEUP CARD (For Managers & Team Members) */}
      {teamId && (
        <section className="glass-card space-y-4 border-emerald-500/20 shadow-glow-cyan">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.06] pb-3">
            <div>
              <span className="section-label">{user.team?.name || 'My Team'}</span>
              <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <FiUsers className="text-emerald-400" /> Matchday Starting XI Lineup
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {lineupFixtureId && (
                <button
                  onClick={() => setDetailFixtureId(lineupFixtureId)}
                  className="btn-secondary text-xs py-1.5 px-3 gap-1.5"
                >
                  <FiUsers size={13} /> Full Match Pitch
                </button>
              )}
              {isManager && (
                <Link to="/dashboard/lineup-planner" className="btn-primary text-xs py-1.5 px-3 font-bold gap-1.5">
                  <FiEdit3 size={13} /> Edit Lineup
                </Link>
              )}
            </div>
          </div>

          {teamLineup && teamLineup.startingXI && teamLineup.startingXI.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-300">
                  Formation: {teamLineup.formation || '4-4-2'}
                </span>
                <span className="text-slate-400">
                  Set by {teamLineup.setBy?.name || 'Team Manager'}
                </span>
              </div>

              {/* Starters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {teamLineup.startingXI.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center rounded-xl border border-cyan-500/20 bg-slate-900/80 p-2.5 text-center shadow-md"
                  >
                    <div className="h-9 w-9 overflow-hidden rounded-full bg-slate-800 flex items-center justify-center border border-white/10 mb-1">
                      {item.player?.photoURL ? (
                        <img src={item.player.photoURL} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-black text-cyan-300">
                          #{item.player?.jersey || idx + 1}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-white text-xs truncate max-w-[90px]">
                      {item.player?.name || 'Player'}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-bold uppercase">{item.position}</span>
                  </div>
                ))}
              </div>

              {/* Substitutes row */}
              {teamLineup.substitutes && teamLineup.substitutes.length > 0 && (
                <div className="rounded-xl border border-white/5 bg-slate-900/50 p-3 space-y-1 text-xs">
                  <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">
                    Substitutes ({teamLineup.substitutes.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {teamLineup.substitutes.map((sub) => (
                      <span key={sub._id || sub} className="badge-teal text-[10px]">
                        #{sub.jersey || '—'} {sub.name || 'Sub'} ({sub.position || 'SUB'})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400 space-y-2">
              <p>No official starting lineup has been published yet for the next fixture.</p>
              {isManager && (
                <Link to="/dashboard/lineup-planner" className="btn-primary text-xs py-1.5 px-4 font-bold inline-flex items-center gap-1.5">
                  <FiEdit3 size={13} /> Create Team Lineup Now
                </Link>
              )}
            </div>
          )}
        </section>
      )}

      {/* Grid: Upcoming Sessions & Recent Payments */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Sessions List */}
        <div className="glass-card space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <span className="section-label">Training & Friendlies</span>
            <Link to="/dashboard/sessions" className="text-xs font-bold text-cyan-400 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {sessions.slice(0, 3).map((session) => (
              <div
                key={session._id}
                className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-slate-900/60 p-3.5"
              >
                <div>
                  <h4 className="font-display text-sm font-bold text-white">{session.name}</h4>
                  <p className="text-xs text-slate-400">
                    {new Date(session.date).toLocaleDateString()} • {session.venue}
                  </p>
                </div>
                <span className="badge-teal">{session.type || 'Training'}</span>
              </div>
            ))}
            {sessions.length === 0 && <p className="py-6 text-center text-xs text-slate-500">No open sessions</p>}
          </div>
        </div>

        {/* Recent Payments List */}
        <div className="glass-card space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <span className="section-label">Payment Activity</span>
            <Link to="/dashboard/my-payments" className="text-xs font-bold text-cyan-400 hover:underline">
              View Invoices
            </Link>
          </div>

          <div className="space-y-3">
            {payments.slice(0, 3).map((payment) => (
              <div
                key={payment._id}
                className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-slate-900/60 p-3.5"
              >
                <div>
                  <h4 className="font-display text-sm font-bold text-white capitalize">
                    {payment.type.replace('_', ' ')}
                  </h4>
                  <p className="text-xs text-slate-400">Due: {new Date(payment.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-bold text-white">₹{payment.amount}</p>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      payment.status === 'paid' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
            {payments.length === 0 && <p className="py-6 text-center text-xs text-slate-500">No payment records</p>}
          </div>
        </div>
      </div>

      {/* Fixture Detail Modal (lineups + full match detail) */}
      <FixtureDetailModal
        fixtureId={detailFixtureId}
        isOpen={!!detailFixtureId}
        onClose={() => setDetailFixtureId(null)}
      />

      {/* ─── Manager: Available Leagues ───────────────────── */}
      {user?.role === 'manager' && allLeagues.length > 0 && (
        <section className="glass-card space-y-4 border-violet-500/20">
          <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
            <FiAward className="text-violet-400" size={18} />
            <div>
              <h2 className="font-display text-lg font-bold text-white">Available Leagues</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Request to join an open competition with your team</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {allLeagues.filter((l) => l.active).map((league) => {
              const req = requestStatusFor(league._id);
              const isCurrentLeague = teamCurrentLeagueId === String(league._id);
              const isBlocked = !isCurrentLeague && !!teamCurrentLeagueId;

              return (
                <div
                  key={league._id}
                  className={`rounded-2xl border p-4 space-y-3 text-xs transition-all
                    ${isCurrentLeague
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : req?.status === 'pending'
                        ? 'border-amber-500/25 bg-amber-500/5'
                        : req?.status === 'rejected'
                          ? 'border-rose-500/20 bg-rose-500/5'
                          : 'border-white/10 bg-slate-900/30'
                    }`}
                >
                  {/* League name + season */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-display font-bold text-sm text-white">{league.name}</div>
                      <div className="text-slate-500 mt-0.5">
                        Season: <span className="text-slate-300">{league.season}</span>
                      </div>
                    </div>

                    {/* Status chip */}
                    {isCurrentLeague && (
                      <span className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-300 text-[10px]">
                        <FiCheckCircle size={10} /> Your League
                      </span>
                    )}
                    {!isCurrentLeague && req?.status === 'pending' && (
                      <span className="flex items-center gap-1 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 font-bold text-amber-300 text-[10px]">
                        <FiClock size={10} /> Pending Approval
                      </span>
                    )}
                    {!isCurrentLeague && req?.status === 'approved' && (
                      <span className="flex items-center gap-1 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-300 text-[10px]">
                        <FiCheckCircle size={10} /> Approved
                      </span>
                    )}
                    {!isCurrentLeague && req?.status === 'rejected' && (
                      <span className="flex items-center gap-1 rounded-lg border border-rose-500/25 bg-rose-500/10 px-2 py-0.5 font-bold text-rose-300 text-[10px]">
                        <FiXCircle size={10} /> Rejected
                      </span>
                    )}
                    {isBlocked && !req && (
                      <span className="flex items-center gap-1 rounded-lg border border-slate-500/25 bg-slate-500/10 px-2 py-0.5 font-bold text-slate-400 text-[10px]">
                        <FiLock size={10} /> In Another League
                      </span>
                    )}
                  </div>

                  {/* Date range */}
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <FiCalendar size={11} className="text-cyan-400" />
                    <span>{new Date(league.startDate).toLocaleDateString()} — {new Date(league.endDate).toLocaleDateString()}</span>
                  </div>

                  {/* Rejection reason */}
                  {req?.status === 'rejected' && req.rejectionReason && (
                    <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-2.5 py-1.5 text-[11px] text-rose-400">
                      Reason: "{req.rejectionReason}"
                    </div>
                  )}

                  {/* Action */}
                  {!isCurrentLeague && !isBlocked && (
                    <>
                      {(!req || req.status === 'rejected') && (
                        <button
                          onClick={() => handleJoinRequest(league._id)}
                          disabled={requestingId === league._id}
                          className="btn-primary flex items-center gap-1.5 py-1.5 px-3 text-[11px] font-bold w-full justify-center"
                        >
                          <FiSend size={11} />
                          {requestingId === league._id
                            ? 'Submitting…'
                            : req?.status === 'rejected'
                              ? 'Re-apply to Join'
                              : 'Request to Join'}
                        </button>
                      )}
                    </>
                  )}

                  {isBlocked && !req && (
                    <div className="text-[11px] text-slate-500 text-center">
                      Leave your current league first to request another.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
};

export default DashboardPage;

