import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import { useToast } from '../components/ToastContainer';
import {
  FiCalendar, FiPlus, FiZap, FiEdit3, FiTrash2, FiSave, FiX,
  FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiAward, FiTarget,
} from 'react-icons/fi';

const GOAL_TYPES = [
  { value: 'open_play', label: 'Open Play' },
  { value: 'penalty',   label: 'Penalty' },
  { value: 'free_kick', label: 'Free Kick' },
  { value: 'own_goal',  label: 'Own Goal 🔄' },
];

const emptyGoalEvent = (teamId) => ({
  team:       teamId || '',
  player:     '',
  minute:     '',
  assistedBy: '',
  type:       'open_play',
  // UI state
  _errors: {},
});

// ─── Validate a single goal event row (client-side) ────────────────────────
const validateEvent = (g, homePlayers, awayPlayers) => {
  const errors = {};
  if (!g.player)  errors.player  = 'Select a scorer';
  if (!g.minute || Number(g.minute) < 1 || Number(g.minute) > 120)
    errors.minute = 'Minute must be 1–120';
  if (g.assistedBy && g.assistedBy === g.player)
    errors.assistedBy = 'Player cannot assist their own goal';
  return errors;
};

const AdminFixturesPage = () => {
  const [leagues, setLeagues]   = useState([]);
  const [teams, setTeams]       = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [players, setPlayers]   = useState([]);
  const [form, setForm]         = useState({ league: '', homeTeam: '', awayTeam: '', date: '', venue: '', matchFormat: '11s' });
  const [autoFormat, setAutoFormat] = useState('11s');
  const [selectedAutoTeams, setSelectedAutoTeams] = useState([]);
  const [groupAssignments, setGroupAssignments] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [editingFixtureId, setEditingFixtureId] = useState(null);
  const [editingFixtureMetaId, setEditingFixtureMetaId] = useState('');
  const [metaForm, setMetaForm] = useState({ date: '', venue: '' });
  const [goalEvents, setGoalEvents] = useState([]); // working copy of events for editor
  const [isMetaSaving, setIsMetaSaving] = useState(false);

  const toast = useToast();

  const loadData = async () => {
    const [leaguesRes, teamsRes, fixturesRes, playersRes] = await Promise.all([
      api.get('/leagues'),
      api.get('/teams?includeAll=true'),
      api.get('/fixtures'),
      api.get('/users?all=true'),
    ]);
    const leaguesList = Array.isArray(leaguesRes.data) ? leaguesRes.data : [];
    const teamsList = Array.isArray(teamsRes.data) ? teamsRes.data : teamsRes.data?.teams || [];
    const fixturesList = Array.isArray(fixturesRes.data) ? fixturesRes.data : [];
    const usersList = Array.isArray(playersRes.data) ? playersRes.data : playersRes.data?.players || playersRes.data?.users || [];

    setLeagues(leaguesList);
    setTeams(teamsList);
    setFixtures(fixturesList);
    setPlayers(usersList.filter((p) => p.role === 'player' && p.active));
  };

  const leagueTeams = useMemo(
    () => teams.filter((t) => String(t.league?._id || t.league) === String(form.league)),
    [teams, form.league]
  );

  const availableTeams = useMemo(
    // Bug B fix: When a league is selected, ONLY show teams assigned to that league.
    // The old code fell back to ALL teams when leagueTeams was empty, which allowed
    // cross-league team selection. The warning message below the dropdown handles UX.
    () => (form.league ? leagueTeams : teams),
    [form.league, leagueTeams, teams]
  );

  useEffect(() => {
    const init = async () => { setLoading(true); await loadData(); setLoading(false); };
    init();
  }, []);

  // Initialize team selection ONLY when changing target league
  useEffect(() => {
    if (form.league) {
      const currentLeagueTeamIds = teams
        .filter((t) => t.status === 'approved' && String(t.league?._id || t.league) === String(form.league))
        .map((t) => String(t._id));
      setSelectedAutoTeams(currentLeagueTeamIds);
    } else {
      setSelectedAutoTeams([]);
    }
  }, [form.league, teams]);

  useEffect(() => {
    if (selectedAutoTeams.length > 10) {
      const numGroups = Math.max(2, Math.ceil(selectedAutoTeams.length / 5));
      const initialMap = {};
      selectedAutoTeams.forEach((id, idx) => {
        const gLetter = String.fromCharCode(65 + (idx % numGroups));
        initialMap[id] = `Group ${gLetter}`;
      });
      setGroupAssignments(initialMap);
    } else {
      setGroupAssignments({});
    }
  }, [selectedAutoTeams]);

  const executeGenerateSchedule = async () => {
    setShowConfirmModal(false);
    const isMultiGroup = selectedAutoTeams.length > 10;
    const numGroups = isMultiGroup ? Math.max(2, Math.ceil(selectedAutoTeams.length / 5)) : 1;
    const availableGroupNames = Array.from({ length: numGroups }, (_, i) => `Group ${String.fromCharCode(65 + i)}`);

    let customGroups = null;
    if (isMultiGroup) {
      customGroups = availableGroupNames.map((gName) => {
        const gTeamIds = selectedAutoTeams.filter((id) => groupAssignments[id] === gName);
        return { name: gName, teamIds: gTeamIds };
      });
    }

    setLoading(true);
    try {
      await api.post('/fixtures/generate', {
        leagueId: form.league,
        matchFormat: autoFormat,
        teamIds: selectedAutoTeams,
        customGroups,
      });
      toast?.addToast(`Generated ${isMultiGroup ? `${numGroups}-Group Stage` : 'Single Group'} ${autoFormat.toUpperCase()} schedule for ${selectedAutoTeams.length} teams!`, 'success');
      await loadData();
    } catch (err) {
      toast?.addToast(err.formattedMessage || err.response?.data?.message || 'Failed to generate fixtures', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => name === 'league' ? { ...prev, league: value, homeTeam: '', awayTeam: '' } : { ...prev, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.league || !form.homeTeam || !form.awayTeam || !form.date) {
      toast?.addToast('Fill out league, home team, away team, and date.', 'error'); return;
    }
    if (form.homeTeam === form.awayTeam) {
      toast?.addToast('Home and away teams must be different.', 'error'); return;
    }
    setIsCreating(true);
    try {
      await api.post('/fixtures', form);
      toast?.addToast('Fixture created!', 'success');
      setForm({ league: '', homeTeam: '', awayTeam: '', date: '', venue: '' });
      await loadData();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Could not create fixture', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fixture and reverse any standing changes?')) return;
    try {
      await api.delete(`/fixtures/${id}`);
      toast?.addToast('Fixture deleted', 'info');
      await loadData();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Could not delete fixture', 'error');
    }
  };

  const handleDeleteAllFixtures = async (leagueId) => {
    const targetName = leagueId
      ? leagues.find((l) => String(l._id) === String(leagueId))?.name || 'this league'
      : 'ALL fixtures';

    if (!window.confirm(`⚠️ Permanently delete all fixtures for ${targetName}? This will reset team standings.`)) return;
    setLoading(true);

    try {
      const queryParam = leagueId ? `?leagueId=${encodeURIComponent(leagueId)}` : '';
      const res = await api.delete(`/fixtures/delete-all${queryParam}`);
      toast?.addToast(res.data?.message || 'Deleted fixtures successfully!', 'success');
      await loadData();
    } catch (err) {
      toast?.addToast(err.formattedMessage || err.response?.data?.message || 'Failed to delete fixtures', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Derived score preview (mirrors server virtual) ────────────────────────
  const derivePreviewScores = (events, fixture) => {
    if (!fixture) return { home: 0, away: 0 };
    const homeId = String(fixture.homeTeam?._id || fixture.homeTeam);
    const awayId = String(fixture.awayTeam?._id || fixture.awayTeam);
    let home = 0, away = 0;
    events.forEach((g) => {
      const tId = String(g.team);
      const isOG = g.type === 'own_goal';
      if (!isOG && tId === homeId) home++;
      else if (!isOG && tId === awayId) away++;
      else if (isOG && tId === homeId) away++;
      else if (isOG && tId === awayId) home++;
    });
    return { home, away };
  };

  // ─── Result editor helpers ─────────────────────────────────────────────────
  const openEditor = (fixture) => {
    setEditingFixtureId(fixture._id);
    // Seed from existing goalEvents if any
    const existing = (fixture.goalEvents || []).map((g) => ({
      team:       String(g.team?._id || g.team || ''),
      player:     String(g.player?._id || g.player || ''),
      minute:     g.minute || '',
      assistedBy: String(g.assistedBy?._id || g.assistedBy || ''),
      type:       g.type || 'open_play',
      _errors:    {},
    }));
    setGoalEvents(existing);
  };

  const closeEditor = () => { setEditingFixtureId(''); setGoalEvents([]); };

  const openMetaEditor = (fixture) => {
    setEditingFixtureMetaId(fixture._id);
    const dateValue = fixture.date ? new Date(fixture.date).toISOString().slice(0, 16) : '';
    setMetaForm({ date: dateValue, venue: fixture.venue || '', matchFormat: fixture.matchFormat || '11s' });
  };

  const closeMetaEditor = () => {
    setEditingFixtureMetaId('');
    setMetaForm({ date: '', venue: '', matchFormat: '11s' });
  };

  const handleMetaChange = (e) => {
    const { name, value } = e.target;
    setMetaForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveFixtureMeta = async (fixture) => {
    if (!metaForm.date) {
      toast?.addToast('Match date and time are required', 'error');
      return;
    }
    if (!metaForm.venue.trim()) {
      toast?.addToast('Match venue is required', 'error');
      return;
    }

    setIsMetaSaving(true);
    try {
      await api.put(`/fixtures/${fixture._id}`, {
        date: metaForm.date,
        venue: metaForm.venue.trim(),
        matchFormat: metaForm.matchFormat || '11s',
      });
      toast?.addToast('Fixture schedule updated!', 'success');
      await loadData();
      closeMetaEditor();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Could not update fixture', 'error');
    } finally {
      setIsMetaSaving(false);
    }
  };

  const addEvent = (teamId) => setGoalEvents((prev) => [...prev, emptyGoalEvent(String(teamId))]);

  const removeEvent = (idx) => setGoalEvents((prev) => prev.filter((_, i) => i !== idx));

  const updateEvent = (idx, field, value) => {
    setGoalEvents((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value, _errors: {} };
      // If switching team, clear player & assist
      if (field === 'team') next[idx] = { ...next[idx], player: '', assistedBy: '' };
      return next;
    });
  };

  const getTeamPlayers = (teamId) =>
    players.filter((p) => String(p.team?._id || p.team) === String(teamId));

  // Client-side validation sweep before submit
  const validateAll = (fixture) => {
    let valid = true;
    const updated = goalEvents.map((g) => {
      const hp = getTeamPlayers(fixture.homeTeam?._id);
      const ap = getTeamPlayers(fixture.awayTeam?._id);
      const errors = validateEvent(g, hp, ap);
      if (Object.keys(errors).length > 0) valid = false;
      return { ...g, _errors: errors };
    });
    setGoalEvents(updated);
    return valid;
  };

  const saveResult = async (fixture) => {
    if (!validateAll(fixture)) {
      toast?.addToast('Fix the highlighted errors before saving.', 'error'); return;
    }
    setIsSaving(true);
    try {
      const payload = goalEvents.map(({ _errors, ...g }) => ({
        ...g,
        minute:     Number(g.minute),
        assistedBy: g.assistedBy || null,
      }));
      await api.put(`/fixtures/${fixture._id}/result`, { goalEvents: payload, status: 'completed' });
      toast?.addToast('Match result saved!', 'success');
      await loadData();
      closeEditor();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Could not save result', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <Loading message="Loading match schedule..." />;

  return (
    <div className="space-y-8">
      <header className="glass-card">
        <span className="section-label">Fixtures & Results</span>
        <h1 className="font-display text-3xl font-black text-white">Fixture Management</h1>
        <p className="text-xs text-slate-300">Auto-generate league schedules, schedule single matches, and log goal events.</p>
      </header>

      {/* Auto-Generate Banner */}
      <section className="glass-card border-cyan-500/30 shadow-glow-cyan space-y-4">
        <div className="flex items-center gap-2">
          <FiZap className="text-cyan-400" size={20} />
          <h2 className="font-display text-xl font-bold text-white">Auto-Generate Round Robin Schedule</h2>
        </div>
        <p className="text-xs text-slate-300">
          Automatically select participating teams from the league and generate home &amp; away matches with the chosen match format (5s, 7s, 11s).
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label-dark">Target League</label>
            <select name="league" value={form.league} onChange={handleInputChange} className="select-dark text-xs">
              <option value="">Choose League for Auto-Schedule</option>
              {leagues.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name} ({l.season || 'Season'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-dark">Match Format (Squad Rules)</label>
            <select value={autoFormat} onChange={(e) => setAutoFormat(e.target.value)} className="select-dark text-xs font-semibold text-cyan-300">
              <option value="11s">⚽ 11s — 11-a-side (11 Starters, max 7 subs)</option>
              <option value="7s">⚽ 7s — 7-a-side (7 Starters, max 5 subs)</option>
              <option value="5s">⚽ 5s — 5-a-side (5 Starters, max 5 subs)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                if (!form.league) { toast?.addToast('Select a league first.', 'error'); return; }
                if (selectedAutoTeams.length < 2) { toast?.addToast('Select at least 2 teams to generate a schedule.', 'error'); return; }
                setShowConfirmModal(true);
              }}
              className="btn-primary w-full text-xs py-2.5 px-5 font-bold gap-1.5"
            >
              <FiZap size={14} /> Generate {autoFormat.toUpperCase()} Schedule
            </button>
          </div>
        </div>

        {/* Selected League Teams Checkbox Selector & Format Badges */}
        {form.league && (
          <div className="rounded-xl border border-white/[0.06] bg-slate-900/80 p-4 space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 font-bold">
              <span className="text-slate-200">
                Select Participating Teams ({selectedAutoTeams.length} of {leagueTeams.length} Selected):
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAutoTeams(leagueTeams.map((t) => String(t._id)))}
                  className="text-[11px] text-cyan-400 hover:underline font-bold"
                >
                  Select All
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedAutoTeams([])}
                  className="text-[11px] text-slate-400 hover:underline"
                >
                  Deselect All
                </button>
                <span className="badge-cyan ml-2">
                  Format: {autoFormat.toUpperCase()} ({autoFormat === '5s' ? '5 Starters' : autoFormat === '7s' ? '7 Starters' : '11 Starters'})
                </span>
              </div>
            </div>

            {/* Smart Group Splitting Rule Banner */}
            {selectedAutoTeams.length > 0 && (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-200 flex items-center justify-between">
                <span className="font-semibold">
                  {selectedAutoTeams.length <= 10
                    ? `Single Group Round-Robin — ${selectedAutoTeams.length} teams → each team plays ${selectedAutoTeams.length - 1} matches (${selectedAutoTeams.length * (selectedAutoTeams.length - 1)} total home & away fixtures).`
                    : `Multi-Group Stage Round-Robin — ${selectedAutoTeams.length} teams split into ${Math.max(2, Math.ceil(selectedAutoTeams.length / 5))} groups (~${(selectedAutoTeams.length / Math.max(2, Math.ceil(selectedAutoTeams.length / 5))).toFixed(1)} teams/group). Teams play within their group only.`}
                </span>
                <span className="badge-gold shrink-0 ml-2">
                  {selectedAutoTeams.length <= 10 ? '1 Single Table' : `${Math.max(2, Math.ceil(selectedAutoTeams.length / 5))} Group Tables`}
                </span>
              </div>
            )}

            {leagueTeams.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {leagueTeams.map((t) => {
                  const teamIdStr = String(t._id);
                  const isChecked = selectedAutoTeams.includes(teamIdStr);
                  return (
                    <label
                      key={teamIdStr}
                      className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition cursor-pointer ${
                        isChecked
                          ? 'border-cyan-500/40 bg-cyan-500/10 text-white font-semibold'
                          : 'border-white/10 bg-slate-950/60 text-slate-400 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAutoTeams((prev) => Array.from(new Set([...prev, teamIdStr])));
                          } else {
                            setSelectedAutoTeams((prev) => prev.filter((id) => id !== teamIdStr));
                          }
                        }}
                        className="h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-500 focus:ring-cyan-500/50 cursor-pointer"
                      />
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: t.color || '#22d3ee' }} />
                      <span className="truncate">{t.name}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <FiAlertTriangle size={16} />
                  <span>No approved teams assigned to this league</span>
                </div>
                <p className="text-xs text-slate-300">
                  {teams.filter((t) => t.status === 'approved').length > 0
                    ? `There are ${teams.filter((t) => t.status === 'approved').length} approved teams in the database that are currently unassigned to this league.`
                    : teams.filter((t) => t.status === 'pending').length > 0
                    ? `There are ${teams.filter((t) => t.status === 'pending').length} pending team registration requests waiting for admin approval.`
                    : 'No registered teams exist in the system yet.'}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {teams.filter((t) => t.status === 'approved').length > 0 && (
                    <button
                      type="button"
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const res = await api.post('/teams/assign-league', { leagueId: form.league });
                          toast?.addToast(`Assigned ${res.data?.updatedCount || 0} approved teams to this league!`, 'success');
                          await loadData();
                        } catch (err) {
                          toast?.addToast(err.formattedMessage || err.response?.data?.message || 'Failed to assign teams', 'error');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="btn-primary text-xs py-2 px-4 font-bold gap-1.5"
                    >
                      <FiZap size={14} /> 1-Click Link Approved Teams to This League
                    </button>
                  )}

                  {teams.filter((t) => t.status === 'pending').length > 0 && (
                    <Link
                      to="/admin/pending-teams"
                      className="btn-secondary text-xs py-2 px-4 font-bold gap-1.5 text-amber-300 border-amber-500/40"
                    >
                      Go to Admin Pending Teams ({teams.filter((t) => t.status === 'pending').length}) →
                    </Link>
                  )}

                  <Link
                    to="/register-team"
                    className="text-xs text-slate-400 hover:text-white underline font-semibold ml-auto"
                  >
                    Register New Team →
                  </Link>
                </div>
              </div>
            )}

            {/* Interactive Group Assignment Preview for >10 Teams */}
            {selectedAutoTeams.length > 10 && (
              <div className="rounded-xl border border-cyan-500/30 bg-slate-900/90 p-4 space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-white text-xs flex items-center gap-1.5">
                    <FiGrid className="text-cyan-400" /> Interactive Group Assignment Preview
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const numGroups = Math.max(2, Math.ceil(selectedAutoTeams.length / 5));
                      const shuffled = [...selectedAutoTeams].sort(() => Math.random() - 0.5);
                      const newMap = {};
                      shuffled.forEach((id, idx) => {
                        newMap[id] = `Group ${String.fromCharCode(65 + (idx % numGroups))}`;
                      });
                      setGroupAssignments(newMap);
                    }}
                    className="text-[11px] text-cyan-400 hover:underline font-bold"
                  >
                    🔀 Reshuffle Groups
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: Math.max(2, Math.ceil(selectedAutoTeams.length / 5)) }, (_, i) => `Group ${String.fromCharCode(65 + i)}`).map((gName) => {
                    const groupTeamIds = selectedAutoTeams.filter((id) => groupAssignments[id] === gName);
                    const availableGroupNames = Array.from({ length: Math.max(2, Math.ceil(selectedAutoTeams.length / 5)) }, (_, i) => `Group ${String.fromCharCode(65 + i)}`);

                    return (
                      <div key={gName} className="rounded-lg border border-white/10 bg-slate-950 p-3 space-y-2">
                        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-xs font-bold text-cyan-300">
                          <span>{gName}</span>
                          <span className="text-[10px] text-slate-400">{groupTeamIds.length} Teams</span>
                        </div>

                        <div className="space-y-1.5">
                          {groupTeamIds.map((id) => {
                            const team = teams.find((t) => String(t._id) === String(id));
                            if (!team) return null;
                            return (
                              <div key={id} className="flex items-center justify-between text-[11px] rounded bg-slate-900 p-1.5 border border-white/5">
                                <span className="flex items-center gap-1.5 font-semibold text-slate-200 truncate">
                                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: team.color || '#22d3ee' }} />
                                  {team.name}
                                </span>
                                <select
                                  value={groupAssignments[id] || gName}
                                  onChange={(e) => setGroupAssignments((prev) => ({ ...prev, [id]: e.target.value }))}
                                  className="select-dark py-0.5 text-[10px] bg-slate-950 border-white/20"
                                >
                                  {availableGroupNames.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                          {groupTeamIds.length === 0 && (
                            <p className="text-[10px] text-slate-500 italic py-2 text-center">No teams assigned</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Advance to Knockout */}
      <section className="glass-card border-amber-500/20 space-y-3">
        <div className="flex items-center gap-2">
          <FiAward className="text-amber-400" size={18} />
          <h2 className="font-display text-lg font-bold text-white">Advance to Knockout Stage</h2>
        </div>
        <p className="text-xs text-slate-300">Once all league matches are complete, generate top-4 semifinals (1v4 &amp; 2v3) ranked by points → GD → GF.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={form.league}
            onChange={(e) => setForm((p) => ({ ...p, league: e.target.value }))}
            className="select-dark text-xs flex-1"
          >
            <option value="">Select League</option>
            {leagues.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
          <button
            onClick={async () => {
              if (!form.league) { toast?.addToast('Select a league', 'error'); return; }
              try {
                const { data } = await api.post('/fixtures/advance-knockout', { leagueId: form.league });
                toast?.addToast(`Knockout generated! Qualified: ${data.qualifiedTeams.join(', ')}`, 'success');
                await loadData();
              } catch (err) { toast?.addToast(err.response?.data?.message || 'Could not advance', 'error'); }
            }}
            className="btn-primary text-xs py-2.5 px-5 gap-1.5 shrink-0 border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
          >
            <FiTarget size={14} /> Generate Semifinals
          </button>
        </div>
      </section>

      {/* Single Fixture Creator */}
      <form onSubmit={handleSubmit} className="glass-card space-y-4">
        <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
          <FiPlus className="text-cyan-400" /> Schedule Single Match
        </h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="label-dark">League</label>
            <select name="league" value={form.league} onChange={handleInputChange} className="select-dark" required>
              <option value="">Select League</option>
              {leagues.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
            {form.league && leagueTeams.length === 0 && (
              <p className="mt-2 text-[11px] text-amber-300">No teams are assigned to this league yet. Showing all approved teams.</p>
            )}
          </div>
          <div>
            <label className="label-dark">Home Team</label>
            <select name="homeTeam" value={form.homeTeam} onChange={handleInputChange} className="select-dark" required>
              <option value="">Select Home Team</option>
              {availableTeams.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-dark">Away Team</label>
            <select name="awayTeam" value={form.awayTeam} onChange={handleInputChange} className="select-dark" required>
              <option value="">Select Away Team</option>
              {availableTeams.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-dark">Match Format</label>
            <select name="matchFormat" value={form.matchFormat} onChange={handleInputChange} className="select-dark" required>
              <option value="11s">11-a-side (11s)</option>
              <option value="7s">7-a-side (7s)</option>
              <option value="5s">5-a-side (5s)</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-dark">Match Date & Time</label>
            <input type="datetime-local" name="date" value={form.date} onChange={handleInputChange} className="input-dark" required />
          </div>
          <div>
            <label className="label-dark">Venue</label>
            <input name="venue" value={form.venue} onChange={handleInputChange} className="input-dark" placeholder="Ground Pitch 1" required />
          </div>
        </div>
        <button type="submit" disabled={isCreating} className="btn-primary py-2.5 px-5 text-xs font-bold gap-1.5">
          <FiPlus size={14} />
          <span>{isCreating ? 'Creating...' : 'Create Match'}</span>
        </button>
      </form>

      {/* Fixtures List Header & Delete All Fixtures Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 glass-card py-4 border-rose-500/20">
        <div>
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <FiCalendar className="text-cyan-400" size={20} />
            Scheduled Matches &amp; Results ({fixtures.length})
          </h2>
          <p className="text-xs text-slate-400">
            {form.league
              ? `Showing fixtures for ${leagues.find((l) => String(l._id) === String(form.league))?.name || 'Selected League'}`
              : 'Showing all fixtures across all leagues'}
          </p>
        </div>

        {fixtures.length > 0 && (
          <button
            type="button"
            onClick={() => handleDeleteAllFixtures(form.league)}
            className="btn-secondary text-xs py-2 px-4 font-bold text-rose-400 border-rose-500/40 hover:bg-rose-500/10 gap-1.5"
          >
            <FiTrash2 size={14} />
            <span>Delete All Fixtures {form.league ? 'in League' : '(Global)'}</span>
          </button>
        )}
      </div>

      {/* Fixtures List */}
      <div className="space-y-4">
        {fixtures.map((fixture) => {
          const isEditing = editingFixtureId === fixture._id;
          const preview   = isEditing ? derivePreviewScores(goalEvents, fixture) : null;
          const homeId    = String(fixture.homeTeam?._id || fixture.homeTeam);
          const awayId    = String(fixture.awayTeam?._id || fixture.awayTeam);
          const homePlayers = getTeamPlayers(homeId);
          const awayPlayers = getTeamPlayers(awayId);
          const allEventsValid = isEditing && goalEvents.every((g) => Object.keys(g._errors || {}).length === 0);

          return (
            <div key={fixture._id} className="crt-card !rounded-2xl p-6 space-y-4">
              {/* Fixture Header Row */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    {fixture.homeTeam?.name || 'Home'} vs {fixture.awayTeam?.name || 'Away'}
                  </h3>
                  {editingFixtureMetaId === fixture._id ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="label-dark">Match Date & Time</label>
                        <input
                          type="datetime-local"
                          name="date"
                          value={metaForm.date}
                          onChange={handleMetaChange}
                          className="input-dark"
                        />
                      </div>
                      <div>
                        <label className="label-dark">Venue</label>
                        <input
                          name="venue"
                          value={metaForm.venue}
                          onChange={handleMetaChange}
                          className="input-dark"
                          placeholder="Ground Pitch 1"
                        />
                      </div>
                      <div>
                        <label className="label-dark">Match Format</label>
                        <select
                          name="matchFormat"
                          value={metaForm.matchFormat || '11s'}
                          onChange={handleMetaChange}
                          className="select-dark"
                        >
                          <option value="5s">5s (5-a-side)</option>
                          <option value="7s">7s (7-a-side)</option>
                          <option value="11s">11s (11-a-side)</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <button
                          type="button"
                          onClick={() => saveFixtureMeta(fixture)}
                          disabled={isMetaSaving}
                          className="btn-success text-xs py-2 px-4 gap-1.5"
                        >
                          <FiSave size={14} />
                          {isMetaSaving ? 'Saving...' : 'Save Schedule'}
                        </button>
                        <button
                          type="button"
                          onClick={closeMetaEditor}
                          className="btn-secondary text-xs py-2 px-4"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="shrink-0 rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-black text-cyan-300">
                        {fixture.matchFormat || '11s'}
                      </span>
                      <span>{new Date(fixture.date).toLocaleString()} • {fixture.venue}</span>
                    </p>
                  )}
                  {fixture.status === 'completed' && (
                    <p className="mt-1 text-xs font-bold text-cyan-300">
                      Score: {fixture.homeScore ?? 0} – {fixture.awayScore ?? 0} (Completed) • {(fixture.goalEvents || []).length} Goal Events
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => (isEditing ? closeEditor() : openEditor(fixture))}
                    className="btn-secondary text-xs py-2 px-3 gap-1.5"
                  >
                    <FiEdit3 size={14} />
                    {isEditing ? 'Cancel' : fixture.status === 'completed' ? 'Edit Events' : 'Enter Result'}
                  </button>
                  <button
                    onClick={() => (editingFixtureMetaId === fixture._id ? closeMetaEditor() : openMetaEditor(fixture))}
                    className="btn-secondary text-xs py-2 px-3 gap-1.5"
                  >
                    <FiCalendar size={14} />
                    {editingFixtureMetaId === fixture._id ? 'Cancel Schedule' : 'Edit Schedule'}
                  </button>
                  <button onClick={() => handleDelete(fixture._id)} className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20">
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>

              {/* ── Inline Goal Event Editor ──────────────────────────────── */}
              {isEditing && (
                <div className="border-t border-white/[0.06] pt-5 space-y-5 animate-fade-in">

                  {/* Derived Score Preview */}
                  <div className="flex items-center justify-center gap-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                    <div className="text-center">
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider">{fixture.homeTeam?.name}</p>
                      <p className="font-display text-4xl font-black text-cyan-300">{preview.home}</p>
                    </div>
                    <span className="font-display text-2xl font-black text-slate-500">–</span>
                    <div className="text-center">
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider">{fixture.awayTeam?.name}</p>
                      <p className="font-display text-4xl font-black text-cyan-300">{preview.away}</p>
                    </div>
                    <p className="absolute right-6 text-[10px] text-slate-500 italic">Derived from events</p>
                  </div>

                  {/* Goal Events */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Home Events Column */}
                    {[{ teamId: homeId, teamName: fixture.homeTeam?.name, teamPlayers: homePlayers },
                      { teamId: awayId, teamName: fixture.awayTeam?.name, teamPlayers: awayPlayers }
                    ].map(({ teamId, teamName, teamPlayers }) => (
                      <div key={teamId} className="rounded-xl border border-white/[0.06] bg-slate-900/50 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{teamName} Goals</span>
                          <button type="button" onClick={() => addEvent(teamId)} className="text-xs font-bold text-cyan-400 hover:underline">
                            + Add Goal
                          </button>
                        </div>

                        {goalEvents
                          .map((g, i) => ({ g, i }))
                          .filter(({ g }) => String(g.team) === String(teamId))
                          .map(({ g, i }) => {
                            const otherTeamPlayers = teamPlayers;
                            return (
                              <div key={i} className="space-y-2 rounded-xl border border-white/10 bg-slate-950/60 p-3">
                                {/* Player row */}
                                <div>
                                  <select
                                    value={g.player}
                                    onChange={(e) => updateEvent(i, 'player', e.target.value)}
                                    className={`select-dark text-xs py-1.5 w-full ${g._errors?.player ? 'border-rose-500' : ''}`}
                                  >
                                    <option value="">Select Scorer</option>
                                    {otherTeamPlayers.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                                  </select>
                                  {g._errors?.player && <p className="mt-0.5 text-[10px] text-rose-400 flex items-center gap-1"><FiAlertCircle size={10} />{g._errors.player}</p>}
                                </div>

                                {/* Minute + Type row */}
                                <div className="flex gap-2">
                                  <div className="w-20">
                                    <input
                                      type="number"
                                      placeholder="Min'"
                                      min={1} max={120}
                                      value={g.minute}
                                      onChange={(e) => updateEvent(i, 'minute', e.target.value)}
                                      className={`input-dark text-xs py-1.5 w-full ${g._errors?.minute ? 'border-rose-500' : ''}`}
                                    />
                                    {g._errors?.minute && <p className="mt-0.5 text-[10px] text-rose-400">{g._errors.minute}</p>}
                                  </div>
                                  <select
                                    value={g.type}
                                    onChange={(e) => updateEvent(i, 'type', e.target.value)}
                                    className="select-dark text-xs py-1.5 flex-1"
                                  >
                                    {GOAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                  </select>
                                  <button type="button" onClick={() => removeEvent(i)} className="text-rose-400 hover:text-rose-300 p-1">
                                    <FiX size={14} />
                                  </button>
                                </div>

                                {/* Assist row */}
                                {g.type !== 'own_goal' && (
                                  <div>
                                    <select
                                      value={g.assistedBy}
                                      onChange={(e) => updateEvent(i, 'assistedBy', e.target.value)}
                                      className={`select-dark text-xs py-1.5 w-full ${g._errors?.assistedBy ? 'border-rose-500' : ''}`}
                                    >
                                      <option value="">No Assist</option>
                                      {otherTeamPlayers.filter((p) => p._id !== g.player).map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                                    </select>
                                    {g._errors?.assistedBy && <p className="mt-0.5 text-[10px] text-rose-400 flex items-center gap-1"><FiAlertCircle size={10} />{g._errors.assistedBy}</p>}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                        {goalEvents.filter((g) => String(g.team) === String(teamId)).length === 0 && (
                          <p className="text-[11px] text-slate-500 py-2 italic">No goals added for {teamName}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Save / Cancel */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => saveResult(fixture)}
                      disabled={isSaving}
                      className="btn-success text-xs py-2 px-5 gap-1.5"
                    >
                      {isSaving ? (
                        <>
                          <span className="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full" />
                          Saving...
                        </>
                      ) : (
                        <><FiSave size={14} /> Save Match Result</>
                      )}
                    </button>
                    <button type="button" onClick={closeEditor} className="btn-secondary text-xs py-2 px-4">
                      Cancel
                    </button>
                    {goalEvents.length > 0 && (
                      <span className={`ml-auto text-xs flex items-center gap-1.5 ${allEventsValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {allEventsValid
                          ? <><FiCheckCircle size={13} /> All events valid</>
                          : <><FiAlertCircle size={13} /> Fix errors above</>
                        }
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal Before Generating Fixtures */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-card max-w-lg w-full space-y-5 border-cyan-500/30 p-6 shadow-glow-cyan">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
                <FiZap className="text-cyan-400" size={20} />
                Confirm Fixture Generation
              </h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                You are about to generate a complete <strong className="text-cyan-300">{autoFormat.toUpperCase()}</strong> round-robin schedule for <strong className="text-white">{selectedAutoTeams.length} selected team{selectedAutoTeams.length > 1 ? 's' : ''}</strong> in <strong className="text-white">{leagues.find((l) => String(l._id) === String(form.league))?.name}</strong>.
              </p>

              <div className="rounded-xl border border-white/10 bg-slate-950 p-3 space-y-2">
                <span className="font-bold text-slate-200">Selected Teams ({selectedAutoTeams.length}):</span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {selectedAutoTeams.map((id) => {
                    const team = teams.find((t) => String(t._id) === String(id));
                    if (!team) return null;
                    return (
                      <span key={id} className="inline-flex items-center gap-1 rounded bg-slate-900 border border-cyan-500/20 px-2 py-0.5 text-[11px] font-semibold text-cyan-200">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: team.color || '#22d3ee' }} />
                        {team.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              <p className="text-[11px] text-amber-300 italic">
                ⚠️ Warning: Generating a new schedule will overwrite any existing unplayed fixtures for this league.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 btn-secondary text-xs py-2.5 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeGenerateSchedule}
                disabled={loading}
                className="flex-1 btn-primary text-xs py-2.5 font-bold gap-1.5"
              >
                <FiZap size={14} /> Confirm &amp; Generate Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFixturesPage;
