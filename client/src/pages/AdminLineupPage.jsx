import { useContext, useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import Loading from '../components/Loading';
import { useToast } from '../components/ToastContainer';
import { AuthContext } from '../contexts/AuthContext';
import {
  FiUsers, FiCheckCircle, FiClock, FiLock, FiAlertCircle,
  FiEdit2, FiSend, FiX, FiSave, FiRefreshCw,
} from 'react-icons/fi';
import { getMatchFormatConfig } from '../utils/matchFormatConfig';

/* ═══════════════════════════════════════════════════════════════
   FORMATION SLOT MAPS (subset matching LineupPlannerPage)
   ═══════════════════════════════════════════════════════════════ */
const FORMATIONS = {
  '4-4-2':   [{id:0,label:'GK',x:50,y:88},{id:1,label:'LB',x:16,y:70},{id:2,label:'CB',x:37,y:72},{id:3,label:'CB',x:63,y:72},{id:4,label:'RB',x:84,y:70},{id:5,label:'LM',x:16,y:50},{id:6,label:'CM',x:37,y:52},{id:7,label:'CM',x:63,y:52},{id:8,label:'RM',x:84,y:50},{id:9,label:'ST',x:37,y:26},{id:10,label:'ST',x:63,y:26}],
  '4-3-3':   [{id:0,label:'GK',x:50,y:88},{id:1,label:'LB',x:16,y:70},{id:2,label:'CB',x:37,y:72},{id:3,label:'CB',x:63,y:72},{id:4,label:'RB',x:84,y:70},{id:5,label:'LCM',x:26,y:52},{id:6,label:'CM',x:50,y:55},{id:7,label:'RCM',x:74,y:52},{id:8,label:'LW',x:18,y:26},{id:9,label:'ST',x:50,y:22},{id:10,label:'RW',x:82,y:26}],
  '3-5-2':   [{id:0,label:'GK',x:50,y:88},{id:1,label:'LCB',x:26,y:72},{id:2,label:'CB',x:50,y:74},{id:3,label:'RCB',x:74,y:72},{id:4,label:'LWB',x:12,y:54},{id:5,label:'CM',x:34,y:54},{id:6,label:'CAM',x:50,y:44},{id:7,label:'CM',x:66,y:54},{id:8,label:'RWB',x:88,y:54},{id:9,label:'ST',x:37,y:26},{id:10,label:'ST',x:63,y:26}],
  '4-2-3-1': [{id:0,label:'GK',x:50,y:88},{id:1,label:'LB',x:16,y:70},{id:2,label:'CB',x:37,y:72},{id:3,label:'CB',x:63,y:72},{id:4,label:'RB',x:84,y:70},{id:5,label:'CDM',x:36,y:58},{id:6,label:'CDM',x:64,y:58},{id:7,label:'LAM',x:22,y:40},{id:8,label:'CAM',x:50,y:38},{id:9,label:'RAM',x:78,y:40},{id:10,label:'ST',x:50,y:20}],
  '5-3-2':   [{id:0,label:'GK',x:50,y:88},{id:1,label:'LWB',x:10,y:66},{id:2,label:'LCB',x:28,y:72},{id:3,label:'CB',x:50,y:74},{id:4,label:'RCB',x:72,y:72},{id:5,label:'RWB',x:90,y:66},{id:6,label:'LCM',x:28,y:50},{id:7,label:'CM',x:50,y:50},{id:8,label:'RCM',x:72,y:50},{id:9,label:'ST',x:36,y:26},{id:10,label:'ST',x:64,y:26}],
  '1-2-1':   [{id:0,label:'GK',x:50,y:88},{id:1,label:'CB',x:50,y:68},{id:2,label:'LM',x:20,y:44},{id:3,label:'RM',x:80,y:44},{id:4,label:'ST',x:50,y:22}],
  '2-1-1':   [{id:0,label:'GK',x:50,y:88},{id:1,label:'LB',x:25,y:68},{id:2,label:'RB',x:75,y:68},{id:3,label:'CM',x:50,y:46},{id:4,label:'ST',x:50,y:22}],
  '2-3-1':   [{id:0,label:'GK',x:50,y:88},{id:1,label:'LB',x:24,y:72},{id:2,label:'RB',x:76,y:72},{id:3,label:'LM',x:18,y:46},{id:4,label:'CM',x:50,y:48},{id:5,label:'RM',x:82,y:46},{id:6,label:'ST',x:50,y:22}],
  '3-2-1':   [{id:0,label:'GK',x:50,y:88},{id:1,label:'LCB',x:20,y:72},{id:2,label:'CB',x:50,y:74},{id:3,label:'RCB',x:80,y:72},{id:4,label:'LCM',x:32,y:46},{id:5,label:'RCM',x:68,y:46},{id:6,label:'ST',x:50,y:22}],
};

const getInitials = (name) =>
  name?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || '?';

/* ─── Read-only pitch ───────────────────────────────────────── */
const ReadOnlyPitch = ({ lineup, teamColor }) => {
  if (!lineup?.startingXI?.length) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-900/40 text-xs text-slate-500" style={{ minHeight: 200 }}>
        ⏳ Lineup not yet announced
      </div>
    );
  }

  const slots = FORMATIONS[lineup.formation] || FORMATIONS['4-4-2'];

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border-2 border-emerald-700/40 shadow-xl"
      style={{
        aspectRatio: '3/4',
        background: 'repeating-linear-gradient(180deg,#065f46 0px,#065f46 32px,#064e3b 32px,#064e3b 64px)',
      }}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 75 100" preserveAspectRatio="none"
        style={{ stroke: 'rgba(255,255,255,0.14)', fill: 'none', strokeWidth: '0.55' }}>
        <rect x="2.5" y="2.5" width="70" height="95" />
        <line x1="2.5" y1="50" x2="72.5" y2="50" />
        <circle cx="37.5" cy="50" r="9" />
        <rect x="19" y="2.5" width="37" height="14" />
        <rect x="28" y="2.5" width="19" height="5.5" />
        <rect x="19" y="83.5" width="37" height="14" />
        <rect x="28" y="92" width="19" height="5.5" />
      </svg>

      <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 rounded bg-slate-950/70 px-2 py-0.5 text-[9px] font-black text-white/50 select-none">
        {lineup.formation}
      </div>

      {lineup.startingXI.map((item, i) => {
        const slot = slots[i] || { x: 50, y: 50 };
        const player = item.player || item;
        return (
          <div
            key={i}
            className="absolute z-10 flex flex-col items-center pointer-events-none"
            style={{ left: `${slot.x}%`, top: `${slot.y}%`, transform: 'translate(-50%,-50%)' }}
          >
            <div
              className="h-9 w-9 rounded-full border-2 border-white/50 flex items-center justify-center overflow-hidden shadow-lg"
              style={{ backgroundColor: teamColor || '#00d2ff' }}
            >
              {player?.photoURL
                ? <img src={player.photoURL} alt="" className="h-full w-full object-cover" />
                : <span className="text-[9px] font-black text-white select-none">{getInitials(player?.name)}</span>}
            </div>
            <span className="mt-0.5 rounded bg-slate-950/90 px-1 py-0 text-[8px] font-bold text-white max-w-[64px] truncate text-center">
              {player?.name?.split(' ')[0] || `#${i + 1}`}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Status badge ──────────────────────────────────────────── */
const StatusBadge = ({ lineup, fixtureStatus }) => {
  if (fixtureStatus === 'completed')
    return <span className="flex items-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-300"><FiLock size={11} /> Locked</span>;
  if (lineup)
    return <span className="flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300"><FiCheckCircle size={11} /> Submitted — {lineup.formation}</span>;
  return <span className="flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-300"><FiClock size={11} /> Pending</span>;
};

/* ─── Team Panel ────────────────────────────────────────────── */
const TeamPanel = ({
  label, team, lineup, fixtureStatus, formatConfig,
  isOverriding, overrideFormation, setOverrideFormation, overrideSaving,
  onSendReminder, onOverride, onSaveOverride, onCancelOverride,
  sendingReminder, borderColor, accentColor,
}) => {
  const isLocked = fixtureStatus === 'completed';

  return (
    <div className={`glass-card space-y-4 ${borderColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {team?.logo
            ? <img src={team.logo} alt="" className="h-10 w-10 rounded-xl object-contain bg-slate-950 p-1 border border-white/10" />
            : <div className="h-10 w-10 rounded-xl flex items-center justify-center font-display font-black text-lg text-slate-950"
                style={{ backgroundColor: team?.color || '#00d2ff' }}>{team?.name?.charAt(0) || '?'}</div>
          }
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${accentColor}`}>{label} Team</span>
            <div className="font-display text-base font-black text-white">{team?.name || 'Unknown'}</div>
          </div>
        </div>
        <StatusBadge lineup={lineup} fixtureStatus={fixtureStatus} />
      </div>

      {/* Override formation selector */}
      {isOverriding && (
        <div className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs">
          <FiAlertCircle size={13} className="text-purple-300 shrink-0" />
          <span className="text-purple-300 font-bold">Admin Override Mode</span>
          <select
            value={overrideFormation}
            onChange={(e) => setOverrideFormation(e.target.value)}
            className="select-dark py-1 text-[11px] ml-auto"
          >
            {formatConfig.formations.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      )}

      {/* Pitch */}
      <ReadOnlyPitch
        lineup={isOverriding ? { ...lineup, formation: overrideFormation } : lineup}
        teamColor={team?.color}
      />

      {/* Audit trail */}
      {lineup?.lastEditedBy && (
        <div className="flex items-center gap-1.5 rounded-xl border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-[11px] text-purple-300">
          <FiAlertCircle size={11} />
          Overridden by <strong className="ml-1">{lineup.lastEditedBy.name}</strong>
          {lineup.lastEditedAt && <span className="text-purple-400/70 ml-1">· {new Date(lineup.lastEditedAt).toLocaleString()}</span>}
        </div>
      )}

      {/* Bench */}
      {lineup?.substitutes?.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bench ({lineup.substitutes.length})</span>
          <div className="flex flex-wrap gap-1.5">
            {lineup.substitutes.map((sub, i) => (
              <span key={sub._id || i} className="rounded-lg border border-white/10 bg-slate-900/60 px-2 py-0.5 text-[10px] text-slate-300">
                #{sub.jersey || '—'} {sub.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {!isLocked && (
        <div className="flex items-center gap-2 flex-wrap border-t border-white/[0.06] pt-3">
          {isOverriding ? (
            <>
              <button onClick={onSaveOverride} disabled={overrideSaving}
                className="btn-primary flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold">
                <FiSave size={12} /> {overrideSaving ? 'Saving…' : 'Save Override'}
              </button>
              <button onClick={onCancelOverride}
                className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs">
                <FiX size={12} /> Cancel
              </button>
            </>
          ) : (
            <>
              {!lineup && (
                <button onClick={onSendReminder} disabled={sendingReminder}
                  className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold text-amber-300 border-amber-500/30 hover:bg-amber-500/10">
                  <FiSend size={12} /> {sendingReminder ? 'Sending…' : 'Send Reminder'}
                </button>
              )}
              {lineup && (
                <button onClick={onOverride}
                  className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold text-purple-300 border-purple-500/30 hover:bg-purple-500/10">
                  <FiEdit2 size={12} /> Admin Override
                </button>
              )}
            </>
          )}
          {lineup?.setBy && (
            <span className="text-[10px] text-slate-500 ml-auto">
              Submitted by {lineup.setBy.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
const AdminLineupPage = () => {
  const toast = useToast();
  // eslint-disable-next-line no-unused-vars
  const { user } = useContext(AuthContext);

  const [fixtures,        setFixtures]        = useState([]);
  const [selectedId,      setSelectedId]      = useState('');
  const [lineupData,      setLineupData]      = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [loadingLineup,   setLoadingLineup]   = useState(false);
  const [overrideTeamId,  setOverrideTeamId]  = useState(null);
  const [overrideFormation, setOverrideFormation] = useState('4-4-2');
  const [overrideSaving,  setOverrideSaving]  = useState(false);
  const [sendingReminder, setSendingReminder] = useState(null);

  /* load fixtures */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/fixtures');
        const list = Array.isArray(data) ? data : (data.fixtures || []);
        setFixtures(list);
        if (list.length > 0) setSelectedId(list[0]._id);
      } catch { toast?.addToast('Failed to load fixtures', 'error'); }
      finally { setLoading(false); }
    })();
  }, []); // eslint-disable-line

  /* load lineups when fixture changes */
  useEffect(() => {
    if (!selectedId) return;
    setLoadingLineup(true);
    setOverrideTeamId(null);
    api.get(`/lineups/${selectedId}`)
      .then(({ data }) => setLineupData(data))
      .catch(() => setLineupData(null))
      .finally(() => setLoadingLineup(false));
  }, [selectedId]);

  const fixture      = lineupData?.fixture;
  const homeLineup   = lineupData?.homeLineup;
  const awayLineup   = lineupData?.awayLineup;
  const fixtureStatus = fixture?.status;
  const matchFormat   = fixture?.matchFormat || '11s';
  const formatConfig  = useMemo(() => getMatchFormatConfig(matchFormat), [matchFormat]);
  const submitted     = [homeLineup, awayLineup].filter(Boolean).length;

  const refreshLineups = () => {
    if (!selectedId) return;
    setLoadingLineup(true);
    api.get(`/lineups/${selectedId}`)
      .then(({ data }) => setLineupData(data))
      .catch(() => setLineupData(null))
      .finally(() => setLoadingLineup(false));
  };

  const handleReminder = async (teamId, teamName) => {
    setSendingReminder(teamId);
    try {
      await api.post('/lineups/reminder', { fixtureId: selectedId, teamId });
      toast?.addToast(`Reminder sent to ${teamName}'s manager`, 'success');
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Reminder failed', 'error');
    } finally { setSendingReminder(null); }
  };

  const handleOverride = (teamId) => {
    const lineup = String(fixture?.homeTeam?._id || fixture?.homeTeam) === teamId ? homeLineup : awayLineup;
    if (!lineup) { toast?.addToast('No lineup exists to override — send a reminder first', 'warning'); return; }
    setOverrideTeamId(teamId);
    setOverrideFormation(lineup.formation);
  };

  const handleSaveOverride = async () => {
    const lineup = String(fixture?.homeTeam?._id || fixture?.homeTeam) === overrideTeamId ? homeLineup : awayLineup;
    if (!lineup) return;
    setOverrideSaving(true);
    try {
      const slots = FORMATIONS[overrideFormation] || FORMATIONS['4-4-2'];
      await api.post('/lineups', {
        fixtureId: selectedId,
        teamId: overrideTeamId,
        formation: overrideFormation,
        matchFormat,
        startingXI: lineup.startingXI.map((item, i) => ({
          player: item.player?._id || item.player,
          position: item.position || slots[i]?.label || 'CM',
          x: slots[i]?.x ?? 50,
          y: slots[i]?.y ?? 50,
        })),
        substitutes: (lineup.substitutes || []).map((p) => p._id || p),
        notSelected:  (lineup.notSelected  || []).map((p) => p._id || p),
      });
      toast?.addToast('Admin override saved. Manager notified.', 'success');
      setOverrideTeamId(null);
      refreshLineups();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Override failed', 'error');
    } finally { setOverrideSaving(false); }
  };

  if (loading) return <Loading message="Loading lineup oversight..." />;

  const homeId = String(fixture?.homeTeam?._id || fixture?.homeTeam || '');
  const awayId = String(fixture?.awayTeam?._id || fixture?.awayTeam || '');

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <header className="glass-card flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-purple-500/20">
        <div>
          <span className="section-label">Admin Oversight</span>
          <h1 className="font-display text-3xl font-black text-white">Lineup Monitor</h1>
          <p className="mt-1 text-xs text-slate-400">
            View manager-submitted lineups · Send reminders · Override when necessary
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="select-dark py-2 text-xs min-w-[240px]"
          >
            {fixtures.length === 0 && <option value="">No fixtures found</option>}
            {fixtures.map((f) => (
              <option key={f._id} value={f._id}>
                [{f.matchFormat || '11s'}] {f.homeTeam?.name || 'Home'} vs {f.awayTeam?.name || 'Away'}
                {' '}— {new Date(f.date).toLocaleDateString()}
                {f.status === 'completed' ? ' 🔒' : ''}
              </option>
            ))}
          </select>
          <button onClick={refreshLineups} className="btn-secondary p-2" title="Refresh lineups">
            <FiRefreshCw size={15} className={loadingLineup ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Submission status strip */}
      {fixture && (
        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs backdrop-blur-md
          ${submitted === 2 ? 'border-emerald-500/25 bg-emerald-500/5' : submitted === 1 ? 'border-amber-500/25 bg-amber-500/5' : 'border-rose-500/25 bg-rose-500/5'}`}
        >
          <div className="flex items-center gap-2 font-bold">
            <FiUsers size={14} className="text-slate-400" />
            <span className={submitted === 2 ? 'text-emerald-300' : submitted === 1 ? 'text-amber-300' : 'text-rose-300'}>
              {submitted}/2 lineups submitted
            </span>
            <span className="text-slate-500 font-normal">·</span>
            <span className="text-slate-400 font-normal">
              {fixture.homeTeam?.name} vs {fixture.awayTeam?.name} · {formatConfig.label}
            </span>
          </div>
          {fixtureStatus === 'completed' && (
            <span className="flex items-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-1 font-bold text-rose-300">
              <FiLock size={11} /> Match Completed — Lineups Locked
            </span>
          )}
        </div>
      )}

      {/* Dual team panels */}
      {loadingLineup ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="glass-card space-y-3 animate-pulse">
              <div className="skeleton h-8 w-1/2 rounded-xl" />
              <div className="skeleton h-64 w-full rounded-2xl" />
              <div className="skeleton h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      ) : fixture ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <TeamPanel
            label="Home" team={fixture.homeTeam} lineup={homeLineup}
            fixtureStatus={fixtureStatus} formatConfig={formatConfig}
            isOverriding={overrideTeamId === homeId}
            overrideFormation={overrideFormation} setOverrideFormation={setOverrideFormation}
            overrideSaving={overrideSaving}
            onSendReminder={() => handleReminder(homeId, fixture.homeTeam?.name)}
            onOverride={() => handleOverride(homeId)}
            onSaveOverride={handleSaveOverride}
            onCancelOverride={() => setOverrideTeamId(null)}
            sendingReminder={sendingReminder === homeId}
            borderColor="border-cyan-500/20" accentColor="text-cyan-400"
          />
          <TeamPanel
            label="Away" team={fixture.awayTeam} lineup={awayLineup}
            fixtureStatus={fixtureStatus} formatConfig={formatConfig}
            isOverriding={overrideTeamId === awayId}
            overrideFormation={overrideFormation} setOverrideFormation={setOverrideFormation}
            overrideSaving={overrideSaving}
            onSendReminder={() => handleReminder(awayId, fixture.awayTeam?.name)}
            onOverride={() => handleOverride(awayId)}
            onSaveOverride={handleSaveOverride}
            onCancelOverride={() => setOverrideTeamId(null)}
            sendingReminder={sendingReminder === awayId}
            borderColor="border-teal-500/20" accentColor="text-teal-400"
          />
        </div>
      ) : (
        <div className="glass-card py-16 text-center text-xs text-slate-500">
          Select a fixture above to view submitted lineups
        </div>
      )}
    </div>
  );
};

export default AdminLineupPage;


