import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FiX, FiCalendar, FiMapPin, FiAward, FiClock, FiActivity, FiUsers } from 'react-icons/fi';

const FixtureDetailModal = ({ fixtureId, isOpen, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fixtureId || !isOpen) return;

    const loadFixtureLineups = async () => {
      setLoading(true);
      try {
        const { data: res } = await api.get(`/lineups/${fixtureId}`);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFixtureLineups();
  }, [fixtureId, isOpen]);

  if (!isOpen) return null;

  const fixture = data?.fixture;
  const homeLineup = data?.homeLineup;
  const awayLineup = data?.awayLineup;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-card relative max-w-4xl w-full space-y-6 border-cyan-500/30 p-6 sm:p-8 overflow-y-auto max-h-[92vh] animate-slide-up shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-white/10 bg-slate-900 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          <FiX size={18} />
        </button>

        {loading ? (
          <div className="py-20 space-y-4 text-center">
            <div className="skeleton h-16 w-3/4 mx-auto rounded-2xl" />
            <div className="skeleton h-64 w-full rounded-2xl" />
            <p className="text-xs text-slate-400">Loading match lineups & events timeline...</p>
          </div>
        ) : !fixture ? (
          <div className="py-12 text-center text-xs text-slate-400">Fixture information not found.</div>
        ) : (
          <>
            {/* Match Header */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-bold text-cyan-400">
                  <FiAward size={14} /> {fixture.league?.name || 'League Match'}
                </span>
                <span className="flex items-center gap-1.5">
                  <FiCalendar size={14} /> {new Date(fixture.date).toLocaleDateString()} • <FiMapPin size={14} /> {fixture.venue}
                  <span className="badge-teal text-[10px] font-extrabold uppercase ml-1">
                    {fixture.matchFormat || '11s'}
                  </span>
                </span>
              </div>

              {/* Teams & Score */}
              <div className="flex items-center justify-between gap-4 py-2">
                {/* Home Team */}
                <div className="flex items-center gap-3 flex-1">
                  {fixture.homeTeam?.logo ? (
                    <img src={fixture.homeTeam.logo} alt="" className="h-14 w-14 object-contain rounded-xl bg-slate-950 p-2 border border-white/10" />
                  ) : (
                    <div
                      className="h-14 w-14 rounded-xl flex items-center justify-center font-display font-black text-xl text-slate-950"
                      style={{ backgroundColor: fixture.homeTeam?.color || '#00d2ff' }}
                    >
                      {fixture.homeTeam?.name?.charAt(0) || 'H'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-display text-xl font-bold text-white">{fixture.homeTeam?.name}</h3>
                    <span className="text-xs text-slate-400">Home Team</span>
                  </div>
                </div>

                {/* Score / Status */}
                <div className="text-center shrink-0 px-4">
                  {fixture.status === 'completed' ? (
                    <div>
                      <div className="font-display text-3xl sm:text-4xl font-black text-cyan-300 tracking-wider">
                        {fixture.homeScore} - {fixture.awayScore}
                      </div>
                      <span className="badge-emerald mt-1">Match Completed</span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-display text-xl font-bold text-amber-400">VS</span>
                      <span className="badge-gold block mt-1">Scheduled</span>
                    </div>
                  )}
                </div>

                {/* Away Team */}
                <div className="flex items-center gap-3 flex-1 justify-end text-right">
                  <div>
                    <h3 className="font-display text-xl font-bold text-white">{fixture.awayTeam?.name}</h3>
                    <span className="text-xs text-slate-400">Away Team</span>
                  </div>
                  {fixture.awayTeam?.logo ? (
                    <img src={fixture.awayTeam.logo} alt="" className="h-14 w-14 object-contain rounded-xl bg-slate-950 p-2 border border-white/10" />
                  ) : (
                    <div
                      className="h-14 w-14 rounded-xl flex items-center justify-center font-display font-black text-xl text-slate-950"
                      style={{ backgroundColor: fixture.awayTeam?.color || '#00d2ff' }}
                    >
                      {fixture.awayTeam?.name?.charAt(0) || 'A'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Match Events Timeline (If Completed) */}
            {fixture.status === 'completed' && fixture.scorers && fixture.scorers.length > 0 && (
              <div className="space-y-3 glass-card border-white/10 p-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2.5 text-xs font-bold uppercase tracking-wider text-cyan-400">
                  <FiActivity size={16} />
                  <span>Match Events Timeline</span>
                </div>

                <div className="space-y-2">
                  {fixture.scorers.map((event, idx) => {
                    const assistObj = fixture.assists?.find((a) => a.minute === event.minute || a.goalIndex === idx);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl bg-slate-900/60 p-2.5 border border-white/5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">{event.minute || "34"}'</span>
                          <span>⚽</span>
                          <span className="font-bold text-white">{event.player?.name || 'Goalscorer'}</span>
                          {assistObj && (
                            <span className="text-slate-400 text-[11px]">
                              (assist: <strong className="text-cyan-300">{assistObj.player?.name || 'Assister'}</strong>)
                            </span>
                          )}
                        </div>
                        <span className="badge-slate uppercase">{event.type || 'Goal'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dual Team Pitch Graphic View */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                <span className="flex items-center gap-2">
                  <FiUsers size={16} /> Tactical Pitch Lineups
                </span>
                <span>
                  {homeLineup?.formation || '4-4-2'} vs {awayLineup?.formation || '4-4-2'}
                </span>
              </div>

              {/* Pitch Visual: Home Team Top Half, Away Team Bottom Half */}
              <div className="relative w-full aspect-[4/5] sm:aspect-[4/3] rounded-2xl bg-gradient-to-b from-emerald-950 via-slate-950 to-emerald-950 border-2 border-emerald-500/30 overflow-hidden shadow-2xl p-4">
                {/* SVG Pitch Markings */}
                <svg className="absolute inset-0 h-full w-full stroke-emerald-400/25 fill-none stroke-[2]" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <rect x="2" y="2" width="96" height="96" rx="2" />
                  <line x1="2" y1="50" x2="98" y2="50" />
                  <circle cx="50" cy="50" r="10" />
                  <rect x="25" y="2" width="50" height="16" />
                  <rect x="25" y="82" width="50" height="16" />
                </svg>

                {/* Home Team Lineup (Top Half 0-45% y) */}
                {homeLineup && homeLineup.startingXI ? (
                  homeLineup.startingXI.map((slot, i) => (
                    <div
                      key={`home-${i}`}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                      style={{ left: `${slot.x}%`, top: `${(slot.y * 0.44)}%` }}
                    >
                      <div
                        className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center border-2 border-cyan-400 bg-slate-900 text-white shadow-lg text-[10px] font-bold"
                        style={{ backgroundColor: fixture.homeTeam?.color || '#00d2ff' }}
                      >
                        {slot.player?.photoURL ? (
                          <img src={slot.player.photoURL} alt="" className="h-full w-full object-cover rounded-full" />
                        ) : (
                          <span>#{slot.player?.jersey || i + 1}</span>
                        )}
                      </div>
                      <span className="mt-0.5 rounded bg-slate-950/90 px-1.5 py-0.5 text-[9px] font-bold text-white max-w-[70px] truncate">
                        {slot.player?.name || 'Player'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900/80 px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-400 z-10">
                    Lineup not yet announced ({fixture.homeTeam?.name})
                  </div>
                )}

                {/* Away Team Lineup (Bottom Half 55-100% y - Mirrored) */}
                {awayLineup && awayLineup.startingXI ? (
                  awayLineup.startingXI.map((slot, i) => (
                    <div
                      key={`away-${i}`}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                      style={{ left: `${100 - slot.x}%`, top: `${100 - (slot.y * 0.44)}%` }}
                    >
                      <div
                        className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center border-2 border-teal-400 bg-slate-900 text-white shadow-lg text-[10px] font-bold"
                        style={{ backgroundColor: fixture.awayTeam?.color || '#14b8a6' }}
                      >
                        {slot.player?.photoURL ? (
                          <img src={slot.player.photoURL} alt="" className="h-full w-full object-cover rounded-full" />
                        ) : (
                          <span>#{slot.player?.jersey || i + 1}</span>
                        )}
                      </div>
                      <span className="mt-0.5 rounded bg-slate-950/90 px-1.5 py-0.5 text-[9px] font-bold text-white max-w-[70px] truncate">
                        {slot.player?.name || 'Player'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 translate-y-1/2 bg-slate-900/80 px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-400 z-10">
                    Lineup not yet announced ({fixture.awayTeam?.name})
                  </div>
                )}
              </div>

              {/* Substitutes Lists Below Pitch */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2 text-xs">
                {/* Home Subs */}
                <div className="glass-card p-3 space-y-2 border-cyan-500/20">
                  <span className="font-bold text-cyan-400 block border-b border-white/10 pb-1">
                    {fixture.homeTeam?.name} Substitutes
                  </span>
                  {homeLineup?.substitutes?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {homeLineup.substitutes.map((sub) => (
                        <span key={sub._id} className="badge-cyan text-[11px]">
                          #{sub.jersey || '—'} {sub.name} ({sub.position})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500 text-[11px] italic">No substitutes listed</span>
                  )}
                </div>

                {/* Away Subs */}
                <div className="glass-card p-3 space-y-2 border-teal-500/20">
                  <span className="font-bold text-teal-400 block border-b border-white/10 pb-1">
                    {fixture.awayTeam?.name} Substitutes
                  </span>
                  {awayLineup?.substitutes?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {awayLineup.substitutes.map((sub) => (
                        <span key={sub._id} className="badge-teal text-[11px]">
                          #{sub.jersey || '—'} {sub.name} ({sub.position})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500 text-[11px] italic">No substitutes listed</span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FixtureDetailModal;
