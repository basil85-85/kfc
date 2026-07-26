import { useEffect, useState } from 'react';
import api from '../services/api';
import Loading from '../components/Loading';
import { useToast } from '../components/ToastContainer';
import { FiShield, FiPlus, FiTrash2, FiUsers, FiChevronDown, FiChevronUp, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

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

const AdminTeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [players, setPlayers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [form, setForm] = useState({ leagueId: '', name: '', color: '#002f34', logo: '', captain: '', players: [] });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const toast = useToast();

  const loadData = async () => {
    try {
      const [teamsRes, leaguesRes, usersRes] = await Promise.all([
        api.get('/teams?includeAll=true'),
        api.get('/leagues'),
        api.get('/users?all=true'),
      ]);
      const usersList = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.players || usersRes.data?.users || [];
      const teamsList = Array.isArray(teamsRes.data) ? teamsRes.data : teamsRes.data?.teams || [];
      const leaguesList = Array.isArray(leaguesRes.data) ? leaguesRes.data : [];

      setTeams(teamsList);
      setLeagues(leaguesList);
      setAllUsers(usersList);
      setPlayers(usersList.filter((u) => u.role === 'player'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.leagueId || !form.name) return;
    setIsSubmitting(true);
    try {
      await api.post('/teams', form);
      toast?.addToast('Team created successfully!', 'success');
      setForm({ leagueId: '', name: '', color: '#002f34', logo: '', captain: '', players: [] });
      loadData();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Could not create team', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (teamId) => {
    if (!window.confirm('Delete this team?')) return;
    try {
      await api.delete(`/teams/${teamId}`);
      toast?.addToast('Team deleted', 'info');
      loadData();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Failed to delete team', 'error');
    }
  };

  // Group members by team ID
  const teamMembersMap = {};
  (Array.isArray(allUsers) ? allUsers : []).forEach((user) => {
    if (user.team) {
      const tId = String(user.team._id || user.team);
      if (!teamMembersMap[tId]) teamMembersMap[tId] = [];
      teamMembersMap[tId].push(user);
    }
  });

  if (loading) return <Loading message="Loading teams..." />;

  return (
    <div className="space-y-8">
      <header className="glass-card">
        <span className="section-label">Club Squads</span>
        <h1 className="font-display text-3xl font-black text-white">Team Management</h1>
        <p className="text-xs text-slate-300">Create team rosters, assign team colors/logos, view members in each team, and select captains.</p>
      </header>

      {/* Create Team Form */}
      <form onSubmit={handleSubmit} className="glass-card space-y-4">
        <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
          <FiPlus className="text-cyan-400" /> Register New Team
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-dark">Select League</label>
            <select name="leagueId" value={form.leagueId} onChange={handleChange} className="select-dark" required>
              <option value="">Choose League</option>
              {leagues.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name} ({l.season})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-dark">Team Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input-dark"
              placeholder="Kadhavu Strikers"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-dark">Team Primary Color</label>
            <input
              type="color"
              name="color"
              value={form.color}
              onChange={handleChange}
              className="h-11 w-full cursor-pointer rounded-xl border border-white/10 bg-slate-900 p-1"
            />
          </div>

          <div>
            <label className="label-dark">Select Captain</label>
            <select name="captain" value={form.captain} onChange={handleChange} className="select-dark">
              <option value="">Select Captain</option>
              {players.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary py-2.5 px-5 text-xs font-bold gap-1.5">
          <FiPlus size={14} />
          <span>{isSubmitting ? 'Creating Team...' : 'Create Team'}</span>
        </button>
      </form>

      {/* Teams List */}
      <div className="grid gap-6 sm:grid-cols-2">
        {teams.map((team) => {
          const members = teamMembersMap[String(team._id)] || team.players || [];
          const isExpanded = expandedTeamId === team._id;
          const isEligible = members.length >= 12;

          return (
            <div key={team._id} className="glass-card space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-full border border-white/20 shadow-md flex items-center justify-center overflow-hidden shrink-0"
                    style={{ backgroundColor: team.color || '#002f34' }}
                  >
                    {team.logo ? (
                      <img src={team.logo} alt={team.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-white">{getInitials(team.name)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">{team.name}</h3>
                    <p className="text-[11px] text-slate-400">{team.league?.name || 'League'}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(team._id)}
                  className="rounded-lg bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                <span>Captain: <strong className="text-white">{team.captain?.name || 'None'}</strong></span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  isEligible ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
                }`}>
                  {isEligible ? <FiCheckCircle size={11} /> : <FiAlertCircle size={11} />}
                  {members.length} Members {isEligible ? '(12+)' : '(Need 12+)'}
                </span>
              </div>

              <button
                onClick={() => setExpandedTeamId(isExpanded ? null : team._id)}
                className="btn-secondary w-full text-xs py-1.5 gap-1.5 justify-center"
              >
                <span>{isExpanded ? 'Hide Team Members' : `Show Team Members (${members.length})`}</span>
                {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
              </button>

              {isExpanded && (
                <div className="mt-3 border-t border-white/[0.06] pt-3 animate-fade-in space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Team Roster</span>
                  {members.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">No members assigned to this team.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {members.map((m) => (
                        <div key={m._id || m} className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/60 px-2.5 py-1.5 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className={`rounded border px-1 py-0 text-[8px] font-black uppercase ${posBadgeClass(m.position || 'CM')}`}>
                              {m.position || 'CM'}
                            </span>
                            <span className="font-semibold text-white truncate">{m.name}</span>
                            {m.jersey && <span className="text-[10px] text-slate-500">#{m.jersey}</span>}
                          </div>
                          {m.overall > 0 && <span className="text-[10px] text-cyan-300 font-bold">{m.overall} OVR</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTeamsPage;
