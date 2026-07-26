import { useCallback, useEffect, useMemo, useState } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';

const formations = {
  '2-1-1': ['GK', 'DF1', 'DF2', 'MF', 'ST'],
  '1-2-1': ['GK', 'DF1', 'MF1', 'MF2', 'ST'],
  '2-3-1': ['GK', 'LB', 'CB', 'RB', 'CM1', 'CM2', 'CM3', 'ST'],
  '3-2-1': ['GK', 'CB1', 'CB2', 'CB3', 'CM', 'ST'],
  '4-3-3': ['GK', 'LB', 'CB1', 'CB2', 'RB', 'CM1', 'CM2', 'CM3', 'LW', 'ST', 'RW'],
  '4-4-2': ['GK', 'LB', 'CB1', 'CB2', 'RB', 'LM', 'CM1', 'CM2', 'RM', 'ST1', 'ST2'],
  '3-5-2': ['GK', 'CB1', 'CB2', 'CB3', 'LM', 'CM1', 'CM2', 'CM3', 'RM', 'ST1', 'ST2'],
  '4-2-3-1': ['GK', 'LB', 'CB1', 'CB2', 'RB', 'CDM1', 'CDM2', 'CAM', 'LW', 'RW', 'ST'],
};

const formationSizes = {
  '5': ['2-1-1', '1-2-1'],
  '7': ['2-3-1', '3-2-1'],
  '11': ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1'],
};

const formationLabels = {
  '2-1-1': '5-a-side (2-1-1)',
  '1-2-1': '5-a-side (1-2-1)',
  '2-3-1': '7-a-side (2-3-1)',
  '3-2-1': '7-a-side (3-2-1)',
  '4-3-3': '11-a-side (4-3-3)',
  '4-4-2': '11-a-side (4-4-2)',
  '3-5-2': '11-a-side (3-5-2)',
  '4-2-3-1': '11-a-side (4-2-3-1)',
};

const slotRows = {
  '2-1-1': [['GK'], ['DF1', 'DF2'], ['MF'], ['ST']],
  '1-2-1': [['GK'], ['DF1'], ['MF1', 'MF2'], ['ST']],
  '2-3-1': [['GK'], ['LB', 'CB', 'RB'], ['CM1', 'CM2', 'CM3'], ['ST']],
  '3-2-1': [['GK'], ['CB1', 'CB2', 'CB3'], ['CM'], ['ST']],
  '4-3-3': [['GK'], ['LB', 'CB1', 'CB2', 'RB'], ['CM1', 'CM2', 'CM3'], ['LW', 'ST', 'RW']],
  '4-4-2': [['GK'], ['LB', 'CB1', 'CB2', 'RB'], ['LM', 'CM1', 'CM2', 'RM'], ['ST1', 'ST2']],
  '3-5-2': [['GK'], ['CB1', 'CB2', 'CB3'], ['LM', 'CM1', 'CM2', 'CM3', 'RM'], ['ST1', 'ST2']],
  '4-2-3-1': [['GK'], ['LB', 'CB1', 'CB2', 'RB'], ['CDM1', 'CDM2'], ['CAM'], ['LW', 'RW'], ['ST']],
};

const PlayerToken = ({ player }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `player:${player._id}` });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-xl border border-white/10 bg-slate-900/90 p-3 text-left shadow-lg backdrop-blur-md transition hover:border-cyan-400/50 ${
        isDragging ? 'opacity-40 scale-95' : 'hover:-translate-y-0.5'
      }`}
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-sm font-bold text-white">{player.name}</p>
        <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
          #{player.jersey || '—'}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
        <span>{player.position}</span>
        {player.team?.name && <span className="text-[11px] text-slate-500">{player.team.name}</span>}
      </div>
    </div>
  );
};

const PitchDropZone = ({ slot, value }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `slot:${slot}` });
  return (
    <div
      ref={setNodeRef}
      className={`group relative flex min-h-[90px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-2 transition duration-200 ${
        isOver
          ? 'border-cyan-400 bg-cyan-500/20 shadow-glow-cyan'
          : value
          ? 'border-emerald-500/40 bg-slate-900/90 shadow-md'
          : 'border-emerald-500/20 bg-slate-950/60 hover:border-emerald-400/40'
      }`}
    >
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400/80">{slot}</span>
      {value ? (
        <div className="mt-1.5 w-full rounded-xl border border-cyan-500/30 bg-slate-900/95 p-2 text-center shadow-lg">
          <p className="font-display text-xs font-bold text-white truncate">{value.name}</p>
          <span className="text-[10px] font-semibold text-cyan-400">#{value.jersey || '—'}</span>
        </div>
      ) : (
        <span className="mt-1 text-[11px] font-medium text-emerald-300/40">Drop Player</span>
      )}
    </div>
  );
};

const formationToSize = Object.fromEntries(
  Object.entries(formationSizes).flatMap(([size, keys]) => keys.map((key) => [key, size]))
);

const LineupBuilder = ({ players = [], fixtureId, initialLineup, onSave }) => {
  const initialFormation = initialLineup?.formation || '4-3-3';
  const initialSize = formationToSize[initialFormation] || '11';
  const [side, setSide] = useState(initialSize);
  const [formation, setFormation] = useState(initialFormation);
  const [positions, setPositions] = useState(initialLineup?.positions || {});
  const [activePlayer, setActivePlayer] = useState(null);

  useEffect(() => {
    if (!formationSizes[side].includes(formation)) {
      setFormation(formationSizes[side][0]);
      setPositions({});
    }
  }, [side, formation]);

  const assignedPlayerIds = useMemo(() => Object.values(positions).filter(Boolean), [positions]);
  const benchPlayers = useMemo(
    () => players.filter((player) => !assignedPlayerIds.includes(String(player._id))),
    [players, assignedPlayerIds]
  );

  const handleDragStart = useCallback(
    (event) => {
      const id = event.active.id;
      if (id.startsWith('player:')) {
        const playerId = id.replace('player:', '');
        const player = players.find((item) => String(item._id) === playerId);
        setActivePlayer(player);
      }
    },
    [players]
  );

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || !over.id || !active.id) {
      setActivePlayer(null);
      return;
    }
    const playerId = active.id.replace('player:', '');
    if (!over.id.startsWith('slot:')) {
      setActivePlayer(null);
      return;
    }
    const slotKey = over.id.replace('slot:', '');
    setPositions((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (String(next[key]) === playerId) {
          next[key] = '';
        }
      });
      next[slotKey] = playerId;
      return next;
    });
    setActivePlayer(null);
  }, []);

  const saveLineup = async () => {
    const bench = benchPlayers.map((player) => player._id);
    if (onSave) {
      await onSave({ fixture: fixtureId, formation, positions, bench });
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="glass-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="section-label">Tactics Board</span>
          <h2 className="font-display text-2xl font-bold text-white">Lineup & Formation Builder</h2>
          <p className="text-xs text-slate-400">Drag players onto pitch slots to build your starting 11/7/5 squad.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={side} onChange={(e) => setSide(e.target.value)} className="select-dark text-xs py-2">
            <option value="11">11-a-side</option>
            <option value="7">7-a-side</option>
            <option value="5">5-a-side</option>
          </select>
          <select value={formation} onChange={(e) => setFormation(e.target.value)} className="select-dark text-xs py-2">
            {formationSizes[side].map((value) => (
              <option key={value} value={value}>
                {formationLabels[value]}
              </option>
            ))}
          </select>
          <button onClick={saveLineup} className="btn-primary text-xs py-2">
            Save Lineup
          </button>
        </div>
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          {/* Tactical Pitch Surface */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-emerald-950/60 p-6 shadow-2xl backdrop-blur-xl">
            {/* Pitch Grass Texture & Lines */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.15)_0%,_transparent_70%)]" />
            <div className="pointer-events-none absolute inset-4 rounded-2xl border-2 border-emerald-500/20" />
            <div className="pointer-events-none absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 bg-emerald-500/20" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-500/20" />

            <div className="relative z-10 space-y-4">
              {slotRows[formation].map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-3">
                  {row.map((slot) => {
                    const player = players.find((item) => String(item._id) === String(positions[slot]));
                    return (
                      <div key={slot} className="w-28 sm:w-32">
                        <PitchDropZone slot={slot} value={player} />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Bench Roster Sidebar */}
          <div className="glass-card flex flex-col">
            <div className="border-b border-white/[0.06] pb-4">
              <span className="section-label">Available Players</span>
              <h3 className="font-display text-lg font-bold text-white">Bench ({benchPlayers.length})</h3>
            </div>
            <div className="mt-4 flex-1 space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {benchPlayers.length > 0 ? (
                benchPlayers.map((player) => <PlayerToken key={player._id} player={player} />)
              ) : (
                <p className="py-8 text-center text-xs text-slate-500">All players assigned to the pitch!</p>
              )}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activePlayer ? (
            <div className="rounded-xl border border-cyan-400 bg-slate-900 p-3 shadow-glow-cyan">
              <p className="font-display text-sm font-bold text-white">{activePlayer.name}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default LineupBuilder;
