import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import {
  FiUsers,
  FiCalendar,
  FiAward,
  FiLayout,
  FiCreditCard,
  FiShield,
  FiChevronDown,
  FiChevronUp,
  FiAlertCircle,
  FiCheckCircle,
  FiUser,
} from 'react-icons/fi';

const posBadgeClass = (pos) => {
  if (pos === 'GK') return 'bg-yellow-500/20 text-yellow-300 border-yellow-600/30';
  if (['CB', 'LB', 'RB', 'DEF'].includes(pos)) return 'bg-sky-500/20 text-sky-300 border-sky-600/30';
  if (['CDM', 'CM', 'CAM', 'MID'].includes(pos)) return 'bg-emerald-500/20 text-emerald-300 border-emerald-600/30';
  return 'bg-rose-500/20 text-rose-300 border-rose-600/30';
};

const getInitials = (name) =>
  name
    ?.split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({ players: 0, sessions: 0, leagues: 0, fixtures: 0, payments: 0 });
  const [teams, setTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeamId, setExpandedTeamId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, sessionsRes, leaguesRes, fixturesRes, paymentsRes, teamsRes] = await Promise.all([
          api.get('/users?all=true'),
          api.get('/sessions'),
          api.get('/leagues'),
          api.get('/fixtures'),
          api.get('/payments'),
          api.get('/teams?includeAll=true'),
        ]);

        const usersList = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.users || [];
        const teamsList = Array.isArray(teamsRes.data) ? teamsRes.data : teamsRes.data?.teams || [];
        const sessionsList = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
        const leaguesList = Array.isArray(leaguesRes.data) ? leaguesRes.data : [];
        const fixturesList = Array.isArray(fixturesRes.data) ? fixturesRes.data : [];
        const paymentsList = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];

        setAllUsers(usersList);
        setTeams(teamsList);
        setStats({
          players: usersList.length,
          sessions: sessionsList.length,
          leagues: leaguesList.length,
          fixtures: fixturesList.length,
          payments: paymentsList.length,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loading message="Loading admin control panel..." />;

  const statCards = [
    { label: 'Registered Players', value: stats.players, icon: FiUsers, color: 'text-cyan-400', border: 'border-cyan-500/20' },
    { label: 'Club Sessions', value: stats.sessions, icon: FiCalendar, color: 'text-teal-400', border: 'border-teal-500/20' },
    { label: 'Active Leagues', value: stats.leagues, icon: FiAward, color: 'text-amber-400', border: 'border-amber-500/20' },
    { label: 'Scheduled Fixtures', value: stats.fixtures, icon: FiLayout, color: 'text-emerald-400', border: 'border-emerald-500/20' },
    { label: 'Payment Records', value: stats.payments, icon: FiCreditCard, color: 'text-rose-400', border: 'border-rose-500/20' },
  ];

  // Group players by team ID
  const teamMembersMap = {};
  const unassignedPlayers = [];

  (Array.isArray(allUsers) ? allUsers : []).forEach((user) => {
    if (user.team) {
      const teamId = String(user.team._id || user.team);
      if (!teamMembersMap[teamId]) teamMembersMap[teamId] = [];
      teamMembersMap[teamId].push(user);
    } else if (user.role === 'player') {
      unassignedPlayers.push(user);
    }
  });

  const toggleExpand = (id) => {
    setExpandedTeamId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="glass-card border-cyan-500/20 shadow-glow-cyan">
        <span className="section-label">Club Management</span>
        <h1 className="font-display text-3xl font-black text-white">Admin Dashboard</h1>
        <p className="text-xs text-slate-300">Overview of club operations, team rosters, entity metrics, and member controls.</p>
      </header>

      {/* Top Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`glass-card space-y-4 ${item.border}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.label}</span>
                <Icon className={item.color} size={20} />
              </div>
              <p className={`font-display text-4xl font-black ${item.color}`}>{item.value}</p>
            </div>
          );
        })}
      </div>

      {/* Team Roster & Members Overview Section */}
      <section className="glass-card space-y-6 border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.06] pb-4">
          <div>
            <span className="section-label">Roster Breakdown</span>
            <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
              <FiShield className="text-cyan-400" /> Team Members & Roster Status
            </h2>
            <p className="text-xs text-slate-400">
              Inspect team member counts, squad eligibility (min. 12 players), and full player lists per team.
            </p>
          </div>
          <Link to="/dashboard/admin/teams" className="btn-secondary text-xs py-2 px-4 gap-1.5 self-start sm:self-auto">
            <FiShield size={14} /> Manage Teams
          </Link>
        </div>

        <div className="space-y-4">
          {teams.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">No teams registered yet.</p>
          ) : (
            teams.map((team) => {
              const members = teamMembersMap[String(team._id)] || team.players || [];
              const playerCount = members.filter((m) => m.role === 'player' || !m.role).length;
              const isEligible = playerCount >= 12;
              const isExpanded = expandedTeamId === team._id;

              return (
                <div
                  key={team._id}
                  className="crt-card !rounded-2xl p-5 space-y-4 transition-all duration-200 hover:border-white/15"
                >
                  {/* Team Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 shrink-0 rounded-full border border-white/20 shadow-md flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: team.color || '#002f34' }}
                      >
                        {team.logo ? (
                          <img src={team.logo} alt={team.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="font-display text-xs font-black text-white">{getInitials(team.name)}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-lg font-bold text-white">{team.name}</h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              team.status === 'approved'
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : team.status === 'pending'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {team.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Manager: <strong className="text-slate-200">{team.managerName || 'Admin'}</strong>
                          {team.managerEmail && ` (${team.managerEmail})`}
                          {team.league?.name && ` • ${team.league.name}`}
                        </p>
                      </div>
                    </div>

                    {/* Eligibility Badge & Expand Button */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${
                          isEligible
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                        }`}
                      >
                        {isEligible ? <FiCheckCircle size={13} /> : <FiAlertCircle size={13} />}
                        <span>
                          {playerCount} Players {isEligible ? '(Eligible)' : `(Need ${12 - playerCount} more for fixtures)`}
                        </span>
                      </span>

                      <button
                        onClick={() => toggleExpand(team._id)}
                        className="btn-secondary text-xs py-1.5 px-3 gap-1.5"
                      >
                        <span>{isExpanded ? 'Hide Members' : `View Members (${members.length})`}</span>
                        {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Member List */}
                  {isExpanded && (
                    <div className="mt-4 border-t border-white/[0.06] pt-4 animate-fade-in space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Registered Squad Members ({members.length})
                        </span>
                        {team.captain && (
                          <span className="text-xs text-amber-400 font-semibold">
                            ★ Captain: {team.captain.name || team.captain}
                          </span>
                        )}
                      </div>

                      {members.length === 0 ? (
                        <p className="py-4 text-center text-xs text-slate-500 italic">
                          No players assigned to this team yet.
                        </p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {members.map((member) => (
                            <div
                              key={member._id || member}
                              className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-2.5 text-xs"
                            >
                              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-800 flex items-center justify-center">
                                {member.photoURL ? (
                                  <img src={member.photoURL} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-[10px] font-black text-slate-400">{getInitials(member.name)}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate font-semibold text-white">{member.name || 'Member'}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`rounded border px-1 py-0 text-[8px] font-black uppercase ${posBadgeClass(member.position || 'CM')}`}>
                                    {member.position || 'CM'}
                                  </span>
                                  {member.jersey && <span className="text-[10px] text-slate-400">#{member.jersey}</span>}
                                  {member.overall > 0 && <span className="text-[10px] text-cyan-300 font-bold">{member.overall} OVR</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Unassigned / Free Agent Players Section */}
      {unassignedPlayers.length > 0 && (
        <section className="glass-card space-y-4 border-amber-500/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="section-label">Free Agents</span>
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <FiUser className="text-amber-400" /> Unassigned Players ({unassignedPlayers.length})
              </h3>
            </div>
            <Link to="/dashboard/admin/users" className="btn-secondary text-xs py-1.5 px-3">
              Assign to Team
            </Link>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unassignedPlayers.map((player) => (
              <div
                key={player._id}
                className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs"
              >
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-800 flex items-center justify-center">
                  {player.photoURL ? (
                    <img src={player.photoURL} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-black text-amber-300">{getInitials(player.name)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold text-white">{player.name}</p>
                  <p className="text-[10px] text-slate-400">{player.email}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminDashboardPage;
