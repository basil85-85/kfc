import { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import Loading from '../components/Loading';
import { useToast } from '../components/ToastContainer';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import {
  FiSave,
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
  FiUserCheck,
  FiUserMinus,
  FiUsers,
  FiMove,
  FiRotateCcw,
} from 'react-icons/fi';
import { getMatchFormatConfig } from '../utils/matchFormatConfig';

/* ═══════════════════════════════════════════════════════════════════════════
   FORMATIONS
   x, y are CSS percentage coordinates on the pitch container (0-100).
   y=0 → top (attacking end), y=100 → bottom (own goal / GK end).
   ═══════════════════════════════════════════════════════════════════════════ */
const FORMATIONS = {
  '4-4-2': [
    { id: 0,  label: 'GK',  pos: 'GK',  x: 50, y: 88 },
    { id: 1,  label: 'LB',  pos: 'DEF', x: 16, y: 70 },
    { id: 2,  label: 'CB',  pos: 'DEF', x: 37, y: 72 },
    { id: 3,  label: 'CB',  pos: 'DEF', x: 63, y: 72 },
    { id: 4,  label: 'RB',  pos: 'DEF', x: 84, y: 70 },
    { id: 5,  label: 'LM',  pos: 'MID', x: 16, y: 50 },
    { id: 6,  label: 'CM',  pos: 'MID', x: 37, y: 52 },
    { id: 7,  label: 'CM',  pos: 'MID', x: 63, y: 52 },
    { id: 8,  label: 'RM',  pos: 'MID', x: 84, y: 50 },
    { id: 9,  label: 'ST',  pos: 'FWD', x: 37, y: 26 },
    { id: 10, label: 'ST',  pos: 'FWD', x: 63, y: 26 },
  ],
  '4-3-3': [
    { id: 0,  label: 'GK',  pos: 'GK',  x: 50, y: 88 },
    { id: 1,  label: 'LB',  pos: 'DEF', x: 16, y: 70 },
    { id: 2,  label: 'CB',  pos: 'DEF', x: 37, y: 72 },
    { id: 3,  label: 'CB',  pos: 'DEF', x: 63, y: 72 },
    { id: 4,  label: 'RB',  pos: 'DEF', x: 84, y: 70 },
    { id: 5,  label: 'LCM', pos: 'MID', x: 26, y: 52 },
    { id: 6,  label: 'CM',  pos: 'MID', x: 50, y: 55 },
    { id: 7,  label: 'RCM', pos: 'MID', x: 74, y: 52 },
    { id: 8,  label: 'LW',  pos: 'FWD', x: 18, y: 26 },
    { id: 9,  label: 'ST',  pos: 'FWD', x: 50, y: 22 },
    { id: 10, label: 'RW',  pos: 'FWD', x: 82, y: 26 },
  ],
  '3-5-2': [
    { id: 0,  label: 'GK',  pos: 'GK',  x: 50, y: 88 },
    { id: 1,  label: 'LCB', pos: 'DEF', x: 26, y: 72 },
    { id: 2,  label: 'CB',  pos: 'DEF', x: 50, y: 74 },
    { id: 3,  label: 'RCB', pos: 'DEF', x: 74, y: 72 },
    { id: 4,  label: 'LWB', pos: 'MID', x: 12, y: 54 },
    { id: 5,  label: 'CM',  pos: 'MID', x: 34, y: 54 },
    { id: 6,  label: 'CAM', pos: 'MID', x: 50, y: 44 },
    { id: 7,  label: 'CM',  pos: 'MID', x: 66, y: 54 },
    { id: 8,  label: 'RWB', pos: 'MID', x: 88, y: 54 },
    { id: 9,  label: 'ST',  pos: 'FWD', x: 37, y: 26 },
    { id: 10, label: 'ST',  pos: 'FWD', x: 63, y: 26 },
  ],
  '4-2-3-1': [
    { id: 0,  label: 'GK',  pos: 'GK',  x: 50, y: 88 },
    { id: 1,  label: 'LB',  pos: 'DEF', x: 16, y: 70 },
    { id: 2,  label: 'CB',  pos: 'DEF', x: 37, y: 72 },
    { id: 3,  label: 'CB',  pos: 'DEF', x: 63, y: 72 },
    { id: 4,  label: 'RB',  pos: 'DEF', x: 84, y: 70 },
    { id: 5,  label: 'CDM', pos: 'MID', x: 36, y: 58 },
    { id: 6,  label: 'CDM', pos: 'MID', x: 64, y: 58 },
    { id: 7,  label: 'LAM', pos: 'MID', x: 22, y: 40 },
    { id: 8,  label: 'CAM', pos: 'MID', x: 50, y: 38 },
    { id: 9,  label: 'RAM', pos: 'MID', x: 78, y: 40 },
    { id: 10, label: 'ST',  pos: 'FWD', x: 50, y: 20 },
  ],
  '5-3-2': [
    { id: 0,  label: 'GK',  pos: 'GK',  x: 50, y: 88 },
    { id: 1,  label: 'LWB', pos: 'DEF', x: 10, y: 66 },
    { id: 2,  label: 'LCB', pos: 'DEF', x: 28, y: 72 },
    { id: 3,  label: 'CB',  pos: 'DEF', x: 50, y: 74 },
    { id: 4,  label: 'RCB', pos: 'DEF', x: 72, y: 72 },
    { id: 5,  label: 'RWB', pos: 'DEF', x: 90, y: 66 },
    { id: 6,  label: 'LCM', pos: 'MID', x: 28, y: 50 },
    { id: 7,  label: 'CM',  pos: 'MID', x: 50, y: 50 },
    { id: 8,  label: 'RCM', pos: 'MID', x: 72, y: 50 },
    { id: 9,  label: 'ST',  pos: 'FWD', x: 36, y: 26 },
    { id: 10, label: 'ST',  pos: 'FWD', x: 64, y: 26 },
  ],
  // 5s Formations
  '1-2-1': [
    { id: 0, label: 'GK',  pos: 'GK',  x: 50, y: 88 },
    { id: 1, label: 'CB',  pos: 'DEF', x: 50, y: 68 },
    { id: 2, label: 'LM',  pos: 'MID', x: 20, y: 44 },
    { id: 3, label: 'RM',  pos: 'MID', x: 80, y: 44 },
    { id: 4, label: 'ST',  pos: 'FWD', x: 50, y: 22 },
  ],
  '2-1-1': [
    { id: 0, label: 'GK',  pos: 'GK',  x: 50, y: 88 },
    { id: 1, label: 'LB',  pos: 'DEF', x: 25, y: 68 },
    { id: 2, label: 'RB',  pos: 'DEF', x: 75, y: 68 },
    { id: 3, label: 'CM',  pos: 'MID', x: 50, y: 46 },
    { id: 4, label: 'ST',  pos: 'FWD', x: 50, y: 22 },
  ],
  // 7s Formations
  '2-3-1': [
    { id: 0, label: 'GK',  pos: 'GK',  x: 50, y: 88 },
    { id: 1, label: 'LB',  pos: 'DEF', x: 24, y: 72 },
    { id: 2, label: 'RB',  pos: 'DEF', x: 76, y: 72 },
    { id: 3, label: 'LM',  pos: 'MID', x: 18, y: 46 },
    { id: 4, label: 'CM',  pos: 'MID', x: 50, y: 48 },
    { id: 5, label: 'RM',  pos: 'MID', x: 82, y: 46 },
    { id: 6, label: 'ST',  pos: 'FWD', x: 50, y: 22 },
  ],
  '3-2-1': [
    { id: 0, label: 'GK',  pos: 'GK',  x: 50, y: 88 },
    { id: 1, label: 'LCB', pos: 'DEF', x: 20, y: 72 },
    { id: 2, label: 'CB',  pos: 'DEF', x: 50, y: 74 },
    { id: 3, label: 'RCB', pos: 'DEF', x: 80, y: 72 },
    { id: 4, label: 'LCM', pos: 'MID', x: 32, y: 46 },
    { id: 5, label: 'RCM', pos: 'MID', x: 68, y: 46 },
    { id: 6, label: 'ST',  pos: 'FWD', x: 50, y: 22 },
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */
const getInitials = (name) =>
  name
    ?.split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

const posBadge = (pos) => {
  if (pos === 'GK') return 'bg-yellow-500/20 text-yellow-300 border-yellow-600/30';
  if (['CB', 'LB', 'RB', 'LCB', 'RCB', 'LWB', 'RWB', 'DEF'].includes(pos))
    return 'bg-sky-500/20 text-sky-300 border-sky-600/30';
  if (['CM', 'CDM', 'CAM', 'LM', 'RM', 'LCM', 'RCM', 'LAM', 'RAM', 'MID'].includes(pos))
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-600/30';
  return 'bg-rose-500/20 text-rose-300 border-rose-600/30'; // FWD, ST, LW, RW
};

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENT: DroppablePitchSlot
   The outer div is the droppable drop zone.
   If occupied, the inner player circle is also draggable.
   ═══════════════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENT: DroppablePitchSlot
   The outer div is the droppable drop zone.
   If occupied, the inner player circle is also draggable and clickable.
   ═══════════════════════════════════════════════════════════════════════════ */
const DroppablePitchSlot = ({ slot, player, isLocked, isSelectedTarget, onSlotClick }) => {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `slot:${slot.id}`,
    disabled: isLocked,
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `pitch:${slot.id}`,
    disabled: isLocked || !player,
  });

  const dragStyle = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setDropRef}
      className="absolute z-10 flex flex-col items-center cursor-pointer p-2"
      style={{ left: `${slot.x}%`, top: `${slot.y}%`, transform: 'translate(-50%, -50%)' }}
      onClick={() => !isLocked && onSlotClick && onSlotClick(slot.id)}
    >
      <div className="flex flex-col items-center">
        {/* Player token */}
        <div
          ref={player ? setDragRef : null}
          {...(player && !isLocked ? listeners : {})}
          {...(player && !isLocked ? attributes : {})}
          style={player ? dragStyle : undefined}
          className={`
            relative flex h-12 w-12 items-center justify-center rounded-full
            border-2 shadow-xl select-none transition-all duration-150 touch-none
            ${player
              ? isDragging
                ? 'cursor-grabbing scale-90 opacity-30 border-cyan-400 bg-slate-900/80'
                : `cursor-grab border-cyan-400 bg-slate-900
                   hover:scale-115 hover:border-cyan-300
                   hover:shadow-[0_0_20px_rgba(34,211,238,0.6)]`
              : isOver || isSelectedTarget
                ? 'scale-120 border-cyan-300 bg-cyan-500/35 shadow-[0_0_24px_rgba(34,211,238,0.7)] animate-pulse'
                : `border-dashed
                   border-white/30 bg-slate-950/60
                   hover:border-cyan-400 hover:bg-slate-900/80`
            }
          `}
        >
          {player ? (
            player.photoURL ? (
              <img
                src={player.photoURL}
                alt={player.name}
                className="h-full w-full rounded-full object-cover pointer-events-none"
                draggable={false}
              />
            ) : (
              <span className="pointer-events-none font-display text-xs font-black text-cyan-200 select-none">
                {getInitials(player.name)}
              </span>
            )
          ) : (
            <span className="pointer-events-none text-[9px] font-black uppercase text-white/40 select-none">
              {slot.label}
            </span>
          )}

          {/* Jersey number badge */}
          {player?.jersey && (
            <span className="absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-white/15 bg-slate-950 px-1 text-[8px] font-black text-cyan-300 select-none">
              {player.jersey}
            </span>
          )}

          {/* Pulsing ring when something hovers over or target selected */}
          {(isOver || isSelectedTarget) && (
            <div className="absolute inset-0 animate-ping rounded-full border-2 border-cyan-400 opacity-80" />
          )}
        </div>

        {/* Name label */}
        <div
          className={`
            mt-1 rounded-md px-2 py-0.5 text-center shadow-md pointer-events-none
            text-[9px] font-bold leading-tight max-w-[85px] truncate select-none
            ${player
              ? 'bg-slate-950/95 text-white border border-white/10'
              : isSelectedTarget
                ? 'bg-cyan-500/90 text-slate-950 font-black border border-cyan-300'
                : 'bg-slate-950/50 text-white/30 border border-white/5'
            }
          `}
        >
          {player ? player.name.split(' ')[0] : slot.label}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENT: DraggableSidebarRow
   Full row draggable & tap-to-place enabled.
   ═══════════════════════════════════════════════════════════════════════════ */
const DraggableSidebarRow = ({
  player,
  isLocked,
  isSelected,
  actionLabel,
  onAction,
  onRowClick,
  actionColorClass,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sidebar:${player._id}`,
    disabled: isLocked,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...(!isLocked ? listeners : {})}
      {...(!isLocked ? attributes : {})}
      style={style}
      onClick={() => !isLocked && onRowClick && onRowClick(player)}
      className={`
        flex items-center gap-2 rounded-xl border px-2.5 py-2 text-[11px]
        transition-all duration-150 select-none cursor-grab active:cursor-grabbing touch-none
        ${isDragging
          ? 'opacity-30 scale-95 border-cyan-400 bg-cyan-950/50'
          : isSelected
            ? 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
            : 'border-white/8 bg-slate-900/50 hover:border-cyan-500/30 hover:bg-slate-900/90'
        }
      `}
    >
      {/* Move icon indicator */}
      {!isLocked && (
        <div className="shrink-0 text-slate-500 hover:text-cyan-300">
          <FiMove size={12} />
        </div>
      )}

      {/* Avatar */}
      <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slate-800 flex items-center justify-center">
        {player.photoURL ? (
          <img src={player.photoURL} alt="" className="h-full w-full object-cover" draggable={false} />
        ) : (
          <span className="text-[9px] font-black text-slate-400 select-none">{getInitials(player.name)}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="truncate font-semibold text-white flex items-center gap-1">
          <span>{player.name}</span>
          {isSelected && (
            <span className="text-[9px] text-cyan-300 font-bold uppercase">(Selected)</span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className={`rounded border px-1 py-0 text-[8px] font-black uppercase ${posBadge(player.position || 'CM')}`}>
            {player.position || 'CM'}
          </span>
          {player.jersey && (
            <span className="text-[9px] text-slate-500">#{player.jersey}</span>
          )}
        </div>
      </div>

      {/* Section action button */}
      {!isLocked && actionLabel && (
        <button
          onClick={(e) => { e.stopPropagation(); onAction(); }}
          className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold transition ${actionColorClass}`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENT: DragGhost
   Rendered inside DragOverlay — follows the pointer while dragging.
   ═══════════════════════════════════════════════════════════════════════════ */
const DragGhost = ({ player }) => {
  if (!player) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-cyan-400 bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-[0_0_24px_rgba(34,211,238,0.45)] cursor-grabbing">
      <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slate-800 flex items-center justify-center">
        {player.photoURL ? (
          <img src={player.photoURL} alt="" className="h-full w-full object-cover" draggable={false} />
        ) : (
          <span className="text-[9px] font-black text-slate-400 select-none">{getInitials(player.name)}</span>
        )}
      </div>
      <span className="select-none">{player.name}</span>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
const LineupPlannerPage = () => {
  const { user } = useContext(AuthContext);
  const toast    = useToast();
  const navigate = useNavigate();

  const [loading,           setLoading]           = useState(true);
  const [saving,            setSaving]            = useState(false);
  const [fixtures,          setFixtures]          = useState([]);
  const [selectedFixtureId, setSelectedFixtureId] = useState('');
  const [teamRoster,        setTeamRoster]        = useState([]);

  // Lineup state
  const [formation,        setFormation]        = useState('4-4-2');
  const [pitchAssignments, setPitchAssignments] = useState({}); // { slotId: playerObj }
  const [substitutes,      setSubstitutes]      = useState([]);
  const [notSelected,      setNotSelected]      = useState([]);
  const [matchFormat,      setMatchFormat]      = useState('11s');

  // Drag overlay & placement state
  const [activePlayer, setActivePlayer] = useState(null);
  const [selectedPlayerForPlacement, setSelectedPlayerForPlacement] = useState(null);
  const [hasSaveError, setHasSaveError] = useState(false);

  const selectedFixture = useMemo(
    () => fixtures.find((f) => String(f._id) === String(selectedFixtureId)),
    [fixtures, selectedFixtureId]
  );

  const formatConfig = useMemo(() => getMatchFormatConfig(matchFormat), [matchFormat]);
  const isLocked = selectedFixture?.status === 'completed';
  const currentSlots = FORMATIONS[formation] || FORMATIONS[formatConfig.formations[0]] || FORMATIONS['4-4-2'];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 100, tolerance: 8 } }),
  );

  const handleSelectPlayerForPlacement = useCallback((player) => {
    if (isLocked) return;
    if (selectedPlayerForPlacement?._id === player._id) {
      setSelectedPlayerForPlacement(null);
    } else {
      setSelectedPlayerForPlacement(player);
      toast?.addToast(`Selected ${player.name} — now tap any position on the pitch`, 'info');
    }
  }, [isLocked, selectedPlayerForPlacement, toast]);

  const handleSlotClick = useCallback((slotId) => {
    if (isLocked) return;

    if (selectedPlayerForPlacement) {
      const player = selectedPlayerForPlacement;
      const pid = String(player._id);
      const evictedPlayer = pitchAssignments[slotId];

      setPitchAssignments((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (String(next[k]?._id) === pid) delete next[k];
        });
        next[slotId] = player;
        return next;
      });

      setSubstitutes((prev) => prev.filter((x) => String(x._id) !== pid));
      setNotSelected((prev) => prev.filter((x) => String(x._id) !== pid));

      if (evictedPlayer && String(evictedPlayer._id) !== pid) {
        setSubstitutes((prev) =>
          prev.some((x) => String(x._id) === String(evictedPlayer._id)) ? prev : [...prev, evictedPlayer]
        );
      }

      setSelectedPlayerForPlacement(null);
      const slotObj = currentSlots.find((s) => s.id === slotId);
      toast?.addToast(`Placed ${player.name} in ${slotObj?.label || 'position'}`, 'success');
    } else if (pitchAssignments[slotId]) {
      setSelectedPlayerForPlacement(pitchAssignments[slotId]);
      toast?.addToast(`Selected ${pitchAssignments[slotId].name} — tap another slot to swap or tap bench`, 'info');
    }
  }, [isLocked, selectedPlayerForPlacement, pitchAssignments, currentSlots, toast]);

  /* ── Initial data load ─────────────────────────────────────────────── */
  useEffect(() => {
    const init = async () => {
      try {
        const isEligible = user?.role === 'manager' || user?.role === 'admin';
        if (!user || !isEligible) {
          toast?.addToast('Only team managers can access the Lineup Planner', 'error');
          navigate('/dashboard');
          return;
        }

        const teamId = user.team?._id || user.team;

        const [fixturesRes, teamRes] = await Promise.all([
          api.get('/fixtures'),
          teamId
            ? api.get(`/teams/${teamId}/roster`)
            : Promise.resolve({ data: { squadByPosition: {} } }),
        ]);

        const myFixtures = teamId
          ? fixturesRes.data.filter(
              (f) =>
                String(f.homeTeam?._id || f.homeTeam) === String(teamId) ||
                String(f.awayTeam?._id || f.awayTeam) === String(teamId)
            )
          : fixturesRes.data;

        setFixtures(myFixtures);

        const sp = teamRes.data.squadByPosition || {};
        const allPlayers = [
          ...(sp.GK  || []),
          ...(sp.DEF || []),
          ...(sp.MID || []),
          ...(sp.FWD || []),
        ];
        setTeamRoster(allPlayers);

        if (myFixtures.length > 0) {
          setSelectedFixtureId(myFixtures[0]._id);
          setMatchFormat(myFixtures[0].matchFormat || '11s');
        } else {
          setNotSelected(allPlayers);
        }
      } catch (err) {
        console.error(err);
        toast?.addToast('Failed to load team data for Lineup Planner', 'error');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]); // eslint-disable-line

  // Ensure formation is valid for the current match format
  useEffect(() => {
    if (formatConfig && !formatConfig.formations.includes(formation)) {
      setFormation(formatConfig.formations[0]);
    }
  }, [formatConfig, formation]);

  // Keep matchFormat synced with selected fixture changes
  useEffect(() => {
    if (!selectedFixture?.matchFormat) return;
    const fixtureFormat = selectedFixture.matchFormat;
    if (fixtureFormat !== matchFormat) {
      setMatchFormat(fixtureFormat);
      const newFormation = getMatchFormatConfig(fixtureFormat).formations[0];
      setFormation(newFormation);
    }
  }, [selectedFixture, matchFormat]);

  /* ── Load saved lineup or draft when fixture / roster changes ─────── */
  useEffect(() => {
    if (!selectedFixtureId || teamRoster.length === 0) return;

    const effectiveFormat = selectedFixture?.matchFormat || matchFormat;
    const effectiveConfig = getMatchFormatConfig(effectiveFormat);

    const load = async () => {
      const teamId   = user.team?._id || user.team;
      const draftKey = `kfc_lineup_draft_${teamId}_${selectedFixtureId}`;

      // 1. Try server
      try {
        const { data } = await api.get(`/lineups/${selectedFixtureId}`);
        const myLineup = data.lineups?.find(
          (l) => String(l.team?._id || l.team) === String(teamId)
        );

        if (myLineup) {
          const initFormation = effectiveConfig.formations.includes(myLineup.formation)
            ? myLineup.formation
            : effectiveConfig.formations[0];
          setFormation(initFormation);

          const assignments = {};
          myLineup.startingXI?.forEach((item, index) => {
            const p =
              teamRoster.find((r) => String(r._id) === String(item.player?._id || item.player)) ||
              item.player;
            if (p) assignments[index] = p;
          });
          setPitchAssignments(assignments);

          const subList = (myLineup.substitutes || [])
            .map((item) => teamRoster.find((r) => String(r._id) === String(item._id || item)) || item)
            .filter(Boolean);
          setSubstitutes(subList);

          const placedIds = new Set([
            ...Object.values(assignments).map((p) => String(p._id)),
            ...subList.map((p) => String(p._id)),
          ]);
          setNotSelected(teamRoster.filter((p) => !placedIds.has(String(p._id))));
          return;
        }
      } catch { /* no saved lineup yet */ }

      // 2. Try localStorage draft
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          const initFormation = formatConfig.formations.includes(parsed.formation)
            ? parsed.formation
            : formatConfig.formations[0];
          setFormation(initFormation);
          setPitchAssignments(parsed.pitchAssignments || {});
          setSubstitutes(parsed.substitutes           || []);
          setNotSelected(parsed.notSelected           || teamRoster);
          return;
        } catch { /* ignore corrupt draft */ }
      }

      // 3. Default: format startingCount on pitch, maxSubs on bench, rest excluded
      setFormation(formatConfig.formations[0]);
      const def = {};
      teamRoster.slice(0, formatConfig.startingCount).forEach((p, i) => { def[i] = p; });
      setPitchAssignments(def);
      setSubstitutes(teamRoster.slice(formatConfig.startingCount, formatConfig.startingCount + formatConfig.maxSubs));
      setNotSelected(teamRoster.slice(formatConfig.startingCount + formatConfig.maxSubs));
    };

    load();
  }, [selectedFixtureId, teamRoster, formatConfig]); // eslint-disable-line

  /* ── Autosave draft ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!selectedFixtureId || isLocked) return;
    const teamId   = user.team?._id || user.team;
    const draftKey = `kfc_lineup_draft_${teamId}_${selectedFixtureId}`;
    localStorage.setItem(
      draftKey,
      JSON.stringify({ formation, pitchAssignments, substitutes, notSelected })
    );
  }, [formation, pitchAssignments, substitutes, notSelected, selectedFixtureId, isLocked]); // eslint-disable-line

  /* ── Formation change — move all starters to notSelected & reset ───── */
  const handleFormationChange = (f) => {
    if (isLocked) return;
    const currentStarters  = Object.values(pitchAssignments);
    const currentSubs      = substitutes;
    setNotSelected((prev) => {
      const seen = new Set(prev.map((p) => String(p._id)));
      return [
        ...prev,
        ...[...currentStarters, ...currentSubs].filter((p) => !seen.has(String(p._id))),
      ];
    });
    setFormation(f);
    setPitchAssignments({});
    setSubstitutes([]);
  };

  /* ── Move helpers ─────────────────────────────────────────────────── */
  const removeFromPitch = useCallback((playerId, assignments) => {
    const next = { ...assignments };
    Object.keys(next).forEach((k) => {
      if (String(next[k]._id) === playerId) delete next[k];
    });
    return next;
  }, []);

  const moveToSubs = useCallback((player) => {
    if (isLocked) return;
    setPitchAssignments((prev) => removeFromPitch(String(player._id), prev));
    setNotSelected((prev) => prev.filter((p) => String(p._id) !== String(player._id)));
    setSubstitutes((prev) =>
      prev.some((p) => String(p._id) === String(player._id)) ? prev : [...prev, player]
    );
  }, [isLocked, removeFromPitch]);

  const moveToNotSelected = useCallback((player) => {
    if (isLocked) return;
    setPitchAssignments((prev) => removeFromPitch(String(player._id), prev));
    setSubstitutes((prev) => prev.filter((p) => String(p._id) !== String(player._id)));
    setNotSelected((prev) =>
      prev.some((p) => String(p._id) === String(player._id)) ? prev : [...prev, player]
    );
  }, [isLocked, removeFromPitch]);

  const moveNotSelectedToSubs = useCallback((player) => {
    if (isLocked) return;
    setNotSelected((prev) => prev.filter((p) => String(p._id) !== String(player._id)));
    setSubstitutes((prev) =>
      prev.some((p) => String(p._id) === String(player._id)) ? prev : [...prev, player]
    );
  }, [isLocked]);

  /* ── DnD: drag start ──────────────────────────────────────────────── */
  const handleDragStart = useCallback(({ active }) => {
    const id = String(active.id);
    if (id.startsWith('sidebar:')) {
      const pid = id.slice('sidebar:'.length);
      const p =
        substitutes.find((x) => String(x._id) === pid) ||
        notSelected.find((x) => String(x._id) === pid);
      setActivePlayer(p || null);
    } else if (id.startsWith('pitch:')) {
      const slotId = parseInt(id.slice('pitch:'.length));
      setActivePlayer(pitchAssignments[slotId] || null);
    }
  }, [substitutes, notSelected, pitchAssignments]);

  /* ── DnD: drag end ────────────────────────────────────────────────── */
  const handleDragEnd = useCallback(({ active, over }) => {
    setActivePlayer(null);
    if (!over || !active) return;

    const activeId = String(active.id);
    const overId   = String(over.id);

    // Only handle drops on pitch slots
    if (!overId.startsWith('slot:')) return;
    const targetSlotId = parseInt(overId.slice('slot:'.length));

    /* ── SOURCE: sidebar player ─────────────────────────── */
    if (activeId.startsWith('sidebar:')) {
      const pid = activeId.slice('sidebar:'.length);
      const player =
        substitutes.find((x) => String(x._id) === pid) ||
        notSelected.find((x) => String(x._id) === pid);
      if (!player) return;

      const evictedPlayer = pitchAssignments[targetSlotId];

      // Assign dragged player to target slot
      setPitchAssignments((prev) => ({ ...prev, [targetSlotId]: player }));

      // Remove from sidebar lists
      setSubstitutes((prev) => prev.filter((x) => String(x._id) !== pid));
      setNotSelected((prev) => prev.filter((x) => String(x._id) !== pid));

      // If slot was occupied, send previous occupant to substitutes
      if (evictedPlayer && String(evictedPlayer._id) !== pid) {
        setSubstitutes((prev) =>
          prev.some((x) => String(x._id) === String(evictedPlayer._id))
            ? prev
            : [...prev, evictedPlayer]
        );
      }
      return;
    }

    /* ── SOURCE: pitch player — swap ────────────────────── */
    if (activeId.startsWith('pitch:')) {
      const sourceSlotId = parseInt(activeId.slice('pitch:'.length));
      if (sourceSlotId === targetSlotId) return; // dropped on same slot — no-op

      const movingPlayer = pitchAssignments[sourceSlotId];
      const targetPlayer = pitchAssignments[targetSlotId]; // may be undefined

      if (!movingPlayer) return;

      setPitchAssignments((prev) => {
        const next = { ...prev };
        // Move/swap
        if (targetPlayer) {
          next[sourceSlotId] = targetPlayer; // swap
        } else {
          delete next[sourceSlotId]; // move to empty
        }
        next[targetSlotId] = movingPlayer;
        return next;
      });
    }
  }, [pitchAssignments, substitutes, notSelected]);

  /* ── Save lineup ──────────────────────────────────────────────────── */
  const startersCount = Object.keys(pitchAssignments).length;

  const handleSaveLineup = async () => {
    if (isLocked) {
      toast?.addToast('This fixture is completed — lineup is locked.', 'error');
      return;
    }
    if (startersCount !== formatConfig.startingCount) {
      toast?.addToast(
        `You have ${startersCount}/${formatConfig.startingCount} starters placed. Exactly ${formatConfig.startingCount} required before saving for ${formatConfig.label}.`,
        'error'
      );
      return;
    }
    // Auto-adjust substitutes to format maxSubs limit
    let finalSubs = substitutes;
    let finalNotSelected = notSelected;
    if (substitutes.length > formatConfig.maxSubs) {
      finalSubs = substitutes.slice(0, formatConfig.maxSubs);
      const overflow = substitutes.slice(formatConfig.maxSubs);
      finalNotSelected = [...notSelected, ...overflow];
      setSubstitutes(finalSubs);
      setNotSelected(finalNotSelected);
    }

    setSaving(true);
    try {
      // Bug D fix: Re-fetch the fixture's current matchFormat from the server
      // at the moment of save to detect if an admin changed it in another session.
      // The old code silently sent a PUT that would overwrite the server's format
      // with whatever stale value was in local state — that is now removed.
      try {
        const freshRes = await api.get('/fixtures');
        const freshFixtures = Array.isArray(freshRes.data) ? freshRes.data : freshRes.data?.fixtures || [];
        const freshFixture  = freshFixtures.find((f) => String(f._id) === String(selectedFixtureId));
        if (freshFixture && freshFixture.matchFormat && freshFixture.matchFormat !== matchFormat) {
          // Format changed server-side — re-sync local state and block this save.
          const newFmt    = freshFixture.matchFormat;
          const newConfig = getMatchFormatConfig(newFmt);
          setMatchFormat(newFmt);
          setFormation(newConfig.formations[0]);
          setPitchAssignments({});
          setSubstitutes([]);
          setNotSelected(teamRoster);
          toast?.addToast(
            `⚠️ Match format was changed to ${newFmt.toUpperCase()} by an admin since you opened this page. Your lineup has been reset — please rebuild it for the new format.`,
            'error'
          );
          setSaving(false);
          return;
        }
      } catch {
        /* If the fresh-fetch fails (e.g. offline), proceed — backend will re-validate anyway */
      }

      // Save lineup — backend re-validates startingXI count against fixture.matchFormat in DB
      const slots      = FORMATIONS[formation] || FORMATIONS[formatConfig.formations[0]] || FORMATIONS['4-4-2'];
      const startingXI = Object.keys(pitchAssignments).map((slotId) => {
        const meta = slots[Number(slotId)] || { pos: 'CM', x: 50, y: 50 };
        const p    = pitchAssignments[slotId];
        return {
          player:   p._id,
          position: p.position || meta.pos,
          x:        meta.x,
          y:        meta.y,
        };
      });

      await api.post('/lineups', {
        fixtureId:   selectedFixtureId,
        teamId:      user.team?._id || user.team,
        matchFormat,
        formation,
        startingXI,
        substitutes: substitutes.map((p) => p._id),
        notSelected: notSelected.map((p) => p._id),
      });

      toast?.addToast(`Lineup saved successfully for ${formatConfig.label}! ✓`, 'success');
      setHasSaveError(false);
      const teamId   = user.team?._id || user.team;
      localStorage.removeItem(`kfc_lineup_draft_${teamId}_${selectedFixtureId}`);
    } catch (err) {
      setHasSaveError(true);
      setTimeout(() => setHasSaveError(false), 3000);
      toast?.addToast(err.formattedMessage || err.response?.data?.message || 'Failed to save lineup', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── Reset to default ─────────────────────────────────────────────── */
  const handleReset = () => {
    if (isLocked) return;
    const def = {};
    teamRoster.slice(0, formatConfig.startingCount).forEach((p, i) => { def[i] = p; });
    setPitchAssignments(def);
    setSubstitutes(teamRoster.slice(formatConfig.startingCount, formatConfig.startingCount + formatConfig.maxSubs));
    setNotSelected(teamRoster.slice(formatConfig.startingCount + formatConfig.maxSubs));
  };

  /* ── Early returns ────────────────────────────────────────────────── */
  if (loading) return <Loading message="Loading Tactics Board…" />;

  /* ════════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════════ */
  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-5">

        {/* ─── Page header ────────────────────────────────────────── */}
        <header className="glass-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-emerald-500/20">
          <div>
            <span className="section-label">Manager Only</span>
            <h1 className="font-display text-3xl font-black text-white">Tactics Board</h1>
            <p className="mt-1 text-xs text-slate-400">
              Drag players from squad onto pitch · Format: <strong className="text-cyan-300">{formatConfig.label}</strong> ({formatConfig.startingCount} starters required)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Fixture selector */}
            <select
              value={selectedFixtureId}
              onChange={(e) => setSelectedFixtureId(e.target.value)}
              className="select-dark py-2 text-xs"
            >
              {fixtures.map((f) => (
                <option key={f._id} value={f._id}>
                  [{f.matchFormat || '11s'}] {f.homeTeam?.name} vs {f.awayTeam?.name}{' '}
                  ({new Date(f.date).toLocaleDateString()})
                  {f.status === 'completed' ? ' 🔒' : ''}
                </option>
              ))}
              {fixtures.length === 0 && <option value="">No fixtures found</option>}
            </select>

            {/* Match Format selector / switcher */}
            <select
              value={matchFormat}
              onChange={async (e) => {
                const newFormat = e.target.value;
                if (!selectedFixtureId || isLocked) return;

                // 1. Immediately update fixture in React state
                setFixtures((prev) =>
                  prev.map((f) => (f._id === selectedFixtureId ? { ...f, matchFormat: newFormat } : f))
                );

                // 2. Immediately rearrange pitch & squad for the new format
                const newConfig = getMatchFormatConfig(newFormat);
                const newFormation = newConfig.formations[0];
                setMatchFormat(newFormat);
                setFormation(newFormation);

                const currentPlaced = Object.values(pitchAssignments);
                const allSquad = teamRoster.length > 0 ? teamRoster : [
                  ...currentPlaced,
                  ...substitutes,
                  ...notSelected,
                ];

                const newPitch = {};
                allSquad.slice(0, newConfig.startingCount).forEach((p, i) => { newPitch[i] = p; });
                setPitchAssignments(newPitch);
                setSubstitutes(allSquad.slice(newConfig.startingCount, newConfig.startingCount + newConfig.maxSubs));
                setNotSelected(allSquad.slice(newConfig.startingCount + newConfig.maxSubs));

                // 3. Persist to API if fixture exists
                try {
                  await api.put(`/fixtures/${selectedFixtureId}`, {
                    date: selectedFixture?.date,
                    venue: selectedFixture?.venue,
                    matchFormat: newFormat,
                  });
                  toast?.addToast(`Match format updated to ${newFormat.toUpperCase()} (${newConfig.startingCount} starters)!`, 'success');
                } catch {
                  toast?.addToast(`Switched pitch to ${newFormat.toUpperCase()} format (${newConfig.startingCount} starters)`, 'info');
                }
              }}
              disabled={isLocked}
              className="select-dark py-2 text-xs font-bold border-cyan-500/40 text-cyan-300 bg-slate-900"
            >
              <option value="11s">⚽ 11s (11 Starters)</option>
              <option value="7s">⚽ 7s (7 Starters)</option>
              <option value="5s">⚽ 5s (5 Starters)</option>
            </select>

            {/* Formation selector */}
            <select
              value={formation}
              onChange={(e) => handleFormationChange(e.target.value)}
              disabled={isLocked}
              className="select-dark py-2 text-xs font-bold"
            >
              {formatConfig.formations.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            {/* Reset */}
            {!isLocked && (
              <button
                onClick={handleReset}
                className="btn-secondary flex items-center gap-1.5 py-2 px-3 text-xs"
              >
                <FiRotateCcw size={12} /> Reset
              </button>
            )}

            {/* Save */}
            <button
              onClick={handleSaveLineup}
              disabled={saving || isLocked}
              className={`btn-primary flex items-center gap-1.5 py-2 px-4 text-xs font-bold transition-all ${
                hasSaveError
                  ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-500/20 text-rose-300 shadow-glow-crimson animate-pulse'
                  : ''
              } ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {isLocked ? <FiLock size={12} /> : <FiSave size={12} />}
              {saving ? 'Saving…' : isLocked ? 'Locked' : 'Save Lineup'}
            </button>
          </div>
        </header>

        {/* ─── Validation strip ───────────────────────────────────── */}
        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs backdrop-blur-md
          ${startersCount === formatConfig.startingCount && substitutes.length <= formatConfig.maxSubs
            ? 'border-emerald-500/25 bg-emerald-500/5'
            : 'border-amber-500/25 bg-amber-500/5'
          }`}
        >
          <div className="flex flex-wrap items-center gap-4 font-bold">
            {startersCount === formatConfig.startingCount ? (
              <span className="flex items-center gap-1.5 text-emerald-300">
                <FiCheckCircle className="text-emerald-400 shrink-0" size={15} />
                Starting lineup complete — {startersCount}/{formatConfig.startingCount} ({formatConfig.label})
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-300">
                <FiAlertCircle className="text-amber-400 shrink-0" size={15} />
                {startersCount}/{formatConfig.startingCount} starters placed — need {formatConfig.startingCount - startersCount} more for {formatConfig.label}
              </span>
            )}

            <span className={`text-[11px] ${substitutes.length > formatConfig.maxSubs ? 'text-rose-400' : 'text-slate-400'}`}>
              Bench: {substitutes.length}/{formatConfig.maxSubs} max
            </span>
          </div>

          {isLocked && (
            <span className="flex items-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-1 font-bold text-rose-300">
              <FiLock size={11} /> Match completed — lineup locked
            </span>
          )}
        </div>

        {/* ─── Main grid: pitch + sidebar ────────────────────────── */}
        <div className="grid gap-5 xl:grid-cols-[1fr_300px]">

          {/* ── Pitch ───────────────────────────────────────────── */}
          <div className="glass-card overflow-hidden p-4 sm:p-5 border-emerald-500/15">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Pitch — {formation}
              </span>
              <span className="text-[10px] text-slate-500 hidden sm:block">
                {isLocked ? '🔒 Read-only after match' : 'Drag to place · Drag between slots to swap'}
              </span>
            </div>

            {/* Pitch container — portrait 3:4 */}
            <div
              className="relative w-full overflow-hidden rounded-2xl border-2 border-emerald-700/40 shadow-2xl"
              style={{
                aspectRatio: '3 / 4',
                background:
                  'repeating-linear-gradient(180deg, #065f46 0px, #065f46 32px, #064e3b 32px, #064e3b 64px)',
              }}
            >
              {/* SVG pitch markings */}
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 75 100"
                preserveAspectRatio="none"
                style={{ stroke: 'rgba(255,255,255,0.16)', fill: 'none', strokeWidth: '0.55' }}
              >
                {/* Outer boundary */}
                <rect x="2.5" y="2.5" width="70" height="95" />

                {/* Halfway line */}
                <line x1="2.5" y1="50" x2="72.5" y2="50" />

                {/* Center circle + spot */}
                <circle cx="37.5" cy="50" r="9" />
                <circle cx="37.5" cy="50" r="0.7" fill="rgba(255,255,255,0.3)" stroke="none" />

                {/* ── Top penalty area (opponent — attacking end) ── */}
                <rect x="19" y="2.5" width="37" height="14" />
                {/* Top 6-yard box */}
                <rect x="28" y="2.5" width="19" height="5.5" />
                {/* Top penalty spot */}
                <circle cx="37.5" cy="12" r="0.55" fill="rgba(255,255,255,0.3)" stroke="none" />
                {/* Top D-arc (portion above penalty area) */}
                <path d="M 26 16.5 A 11.5 11.5 0 0 1 49 16.5" />

                {/* ── Bottom penalty area (own goal — defending) ── */}
                <rect x="19" y="83.5" width="37" height="14" />
                {/* Bottom 6-yard box */}
                <rect x="28" y="92" width="19" height="5.5" />
                {/* Bottom penalty spot */}
                <circle cx="37.5" cy="88" r="0.55" fill="rgba(255,255,255,0.3)" stroke="none" />
                {/* Bottom D-arc */}
                <path d="M 26 83.5 A 11.5 11.5 0 0 0 49 83.5" />

                {/* Corner arcs */}
                <path d="M 2.5 8   A 5.5 5.5 0 0 0 8   2.5" />
                <path d="M 67 2.5 A 5.5 5.5 0 0 0 72.5 8" />
                <path d="M 2.5 92  A 5.5 5.5 0 0 1 8   97.5" />
                <path d="M 67 97.5 A 5.5 5.5 0 0 1 72.5 92" />

                {/* Attacking-direction indicator */}
                <path
                  d="M 37.5 38 L 37.5 33 M 35 35.5 L 37.5 33 L 40 35.5"
                  strokeOpacity="0.25"
                  strokeWidth="0.9"
                />
              </svg>

              {/* "Attacking" text */}
              <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-widest text-white/18 select-none">
                Attacking ↑
              </div>

              {/* Player slot markers */}
              {currentSlots.map((slot) => (
                <DroppablePitchSlot
                  key={slot.id}
                  slot={slot}
                  player={pitchAssignments[slot.id]}
                  isLocked={isLocked}
                  isSelectedTarget={!!selectedPlayerForPlacement}
                  onSlotClick={handleSlotClick}
                />
              ))}
            </div>
          </div>

          {/* ── Squad sidebar ───────────────────────────────────── */}
          <div className="glass-card flex flex-col overflow-hidden border-white/8 p-4">
            <div className="shrink-0 border-b border-white/[0.06] pb-3 mb-3">
              <span className="section-label">Match Day Squad</span>
              {!isLocked && (
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Drag any player card to pitch · Or tap a player then tap a pitch position
                </p>
              )}
            </div>

            {selectedPlayerForPlacement && (
              <div className="mb-3 flex items-center justify-between rounded-xl border border-cyan-400/50 bg-cyan-950/80 p-2.5 text-xs text-white shadow-glow-cyan">
                <span className="truncate font-bold text-cyan-300">
                  🎯 Tap pitch slot for {selectedPlayerForPlacement.name.split(' ')[0]}
                </span>
                <button
                  onClick={() => setSelectedPlayerForPlacement(null)}
                  className="btn-secondary py-0.5 px-2 text-[9px] font-bold shrink-0 ml-2"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">

              {/* Starting XI list */}
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    <FiUserCheck size={11} /> Starting XI ({formatConfig.badgeLabel})
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                    startersCount === formatConfig.startingCount
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-amber-500/15 text-amber-300'
                  }`}>
                    {startersCount}/{formatConfig.startingCount}
                  </span>
                </div>
                <div className="space-y-1">
                  {startersCount === 0 && (
                    <p className="py-2 text-center text-[10px] text-slate-500">
                      Drag players or tap below to place on pitch
                    </p>
                  )}
                  {Object.keys(pitchAssignments).map((slotId) => {
                    const player  = pitchAssignments[slotId];
                    const slotMeta = currentSlots[Number(slotId)];
                    return (
                      <div
                        key={slotId}
                        onClick={() => handleSelectPlayerForPlacement(player)}
                        className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-[11px] cursor-pointer transition ${
                          selectedPlayerForPlacement?._id === player._id
                            ? 'border-cyan-400 bg-cyan-500/20'
                            : 'border-cyan-500/15 bg-slate-900/60 hover:bg-slate-900/90'
                        }`}
                      >
                        <span className="shrink-0 rounded bg-cyan-500/15 px-1.5 py-0.5 text-[8px] font-black text-cyan-400">
                          {slotMeta?.label || '—'}
                        </span>
                        <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-slate-800 flex items-center justify-center">
                          {player.photoURL
                            ? <img src={player.photoURL} alt="" className="h-full w-full object-cover" />
                            : <span className="text-[8px] font-black text-slate-500 select-none">{getInitials(player.name)}</span>}
                        </div>
                        <span className="flex-1 min-w-0 truncate font-semibold text-white">
                          {player.name}
                        </span>
                        {!isLocked && (
                          <button
                            onClick={(e) => { e.stopPropagation(); moveToSubs(player); }}
                            className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold text-slate-400 transition hover:text-amber-400 bg-slate-800/80"
                            title="Move to substitutes"
                          >
                            Bench
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Substitutes */}
              <section className="border-t border-white/[0.05] pt-3">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  <FiUsers size={11} /> Substitutes ({substitutes.length}/{formatConfig.maxSubs})
                </div>
                <div className="space-y-1">
                  {substitutes.length === 0 && (
                    <p className="py-2 text-center text-[10px] text-slate-500">No substitutes added</p>
                  )}
                  {substitutes.map((player) => (
                    <DraggableSidebarRow
                      key={player._id}
                      player={player}
                      isLocked={isLocked}
                      isSelected={selectedPlayerForPlacement?._id === player._id}
                      actionLabel="Exclude"
                      actionColorClass="text-slate-400 hover:text-rose-400 bg-slate-800/80"
                      onAction={() => moveToNotSelected(player)}
                      onRowClick={handleSelectPlayerForPlacement}
                    />
                  ))}
                </div>
              </section>

              {/* Not Selected */}
              <section className="border-t border-white/[0.05] pt-3">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <FiUserMinus size={11} /> Not Selected ({notSelected.length})
                </div>
                <div className="space-y-1">
                  {notSelected.length === 0 && (
                    <p className="py-2 text-center text-[10px] text-slate-500">All players selected</p>
                  )}
                  {notSelected.map((player) => (
                    <DraggableSidebarRow
                      key={player._id}
                      player={player}
                      isLocked={isLocked}
                      isSelected={selectedPlayerForPlacement?._id === player._id}
                      actionLabel="+ Bench"
                      actionColorClass="text-cyan-400 hover:text-cyan-300 bg-cyan-950/60"
                      onAction={() => moveNotSelectedToSubs(player)}
                      onRowClick={handleSelectPlayerForPlacement}
                    />
                  ))}
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>

      {/* Drag overlay — follows pointer */}
      <DragOverlay dropAnimation={null}>
        {activePlayer ? <DragGhost player={activePlayer} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default LineupPlannerPage;
