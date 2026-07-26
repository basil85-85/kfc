import { useState, useMemo, useEffect } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';

const PlayerComparisonModal = ({ players = [], isOpen, onClose }) => {
  const [player1Id, setPlayer1Id] = useState('');
  const [player2Id, setPlayer2Id] = useState('');

  useEffect(() => {
    if (players && players.length > 0) {
      const p1Exists = players.some((p) => String(p._id) === String(player1Id));
      const p2Exists = players.some((p) => String(p._id) === String(player2Id));

      if (!player1Id || !p1Exists) {
        setPlayer1Id(players[0]._id);
      }
      if (!player2Id || !p2Exists || (players.length > 1 && String(player2Id) === String(players[0]._id))) {
        setPlayer2Id(players[1]?._id || players[0]._id);
      }
    }
  }, [players, isOpen]);

  const player1 = useMemo(() => players.find((p) => String(p._id) === String(player1Id)), [players, player1Id]);
  const player2 = useMemo(() => players.find((p) => String(p._id) === String(player2Id)), [players, player2Id]);

  if (!isOpen) return null;

  const statsList = [
    { key: 'pace', label: 'Pace (PAC)' },
    { key: 'shooting', label: 'Shooting (SHO)' },
    { key: 'passing', label: 'Passing (PAS)' },
    { key: 'dribbling', label: 'Dribbling (DRI)' },
    { key: 'defending', label: 'Defending (DEF)' },
    { key: 'physical', label: 'Physical (PHY)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="glass-card relative w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-cyan-500/30 shadow-glow-cyan">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-slate-800/80 p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
        >
          <FiX size={20} />
        </button>

        <div className="mb-6 border-b border-white/[0.06] pb-4">
          <span className="section-label">Head-to-Head</span>
          <h2 className="font-display text-2xl font-bold text-white">Player Comparison</h2>
          <p className="text-xs text-slate-400">Compare physical attributes, overall ratings, and pitch positions side-by-side.</p>
        </div>

        {/* Player Selection Header */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Player 1 Picker */}
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4">
            <label className="label-dark">Player 1</label>
            <select
              value={player1Id}
              onChange={(e) => setPlayer1Id(e.target.value)}
              className="select-dark text-cyan-300 font-semibold"
            >
              {players.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.position || 'CM'}) — OVR {p.overall || 55}
                </option>
              ))}
            </select>
          </div>

          {/* Player 2 Picker */}
          <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-4">
            <label className="label-dark">Player 2</label>
            <select
              value={player2Id}
              onChange={(e) => setPlayer2Id(e.target.value)}
              className="select-dark text-teal-300 font-semibold"
            >
              {players.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.position || 'CM'}) — OVR {p.overall || 55}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Overview Header Cards */}
        {player1 && player2 && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-2xl border border-cyan-500/20 bg-slate-900/80 p-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-cyan-400 bg-slate-800">
                {player1.photoURL ? (
                  <img src={player1.photoURL} alt={player1.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center font-bold text-slate-400">{player1.name?.[0]}</div>
                )}
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-white">{player1.name}</h3>
                <p className="text-xs text-cyan-400">{player1.position} • #{player1.jersey || '00'}</p>
                <div className="mt-1.5 inline-flex items-center rounded-md bg-cyan-400/20 px-2 py-0.5 text-xs font-bold text-cyan-300">
                  OVR {player1.overall || 55}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-teal-500/20 bg-slate-900/80 p-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-teal-400 bg-slate-800">
                {player2.photoURL ? (
                  <img src={player2.photoURL} alt={player2.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center font-bold text-slate-400">{player2.name?.[0]}</div>
                )}
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-white">{player2.name}</h3>
                <p className="text-xs text-teal-400">{player2.position} • #{player2.jersey || '00'}</p>
                <div className="mt-1.5 inline-flex items-center rounded-md bg-teal-400/20 px-2 py-0.5 text-xs font-bold text-teal-300">
                  OVR {player2.overall || 55}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attribute Comparison Bars */}
        {player1 && player2 && (
          <div className="mt-6 space-y-4 rounded-2xl border border-white/[0.06] bg-slate-900/60 p-6">
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-slate-300">Attribute Comparison</h4>
            {statsList.map(({ key, label }) => {
              const val1 = player1[key] || 55;
              const val2 = player2[key] || 55;
              const p1Wins = val1 > val2;
              const p2Wins = val2 > val1;

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className={`flex items-center gap-1 ${p1Wins ? 'text-cyan-400' : 'text-slate-400'}`}>
                      {p1Wins && <FiCheck size={12} />} {val1}
                    </span>
                    <span className="text-slate-300 uppercase tracking-wider">{label}</span>
                    <span className={`flex items-center gap-1 ${p2Wins ? 'text-teal-400' : 'text-slate-400'}`}>
                      {val2} {p2Wins && <FiCheck size={12} />}
                    </span>
                  </div>

                  {/* Dual Bar */}
                  <div className="flex h-3.5 gap-1 overflow-hidden rounded-full bg-slate-950 p-0.5">
                    {/* Left Bar (P1) */}
                    <div className="flex-1 flex justify-end">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          p1Wins ? 'bg-gradient-to-r from-cyan-500 to-cyan-400' : 'bg-slate-700'
                        }`}
                        style={{ width: `${(val1 / 99) * 100}%` }}
                      />
                    </div>
                    {/* Divider */}
                    <div className="w-0.5 bg-slate-800" />
                    {/* Right Bar (P2) */}
                    <div className="flex-1 flex justify-start">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          p2Wins ? 'bg-gradient-to-r from-teal-400 to-teal-500' : 'bg-slate-700'
                        }`}
                        style={{ width: `${(val2 / 99) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerComparisonModal;
