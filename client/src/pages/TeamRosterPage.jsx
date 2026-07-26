import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import { FiAward, FiArrowLeft, FiCalendar, FiShield, FiUsers } from 'react-icons/fi';
import { getPlayerTier } from '../utils/playerTier';

const positionGroups = [
  { key: 'GK', label: 'Goalkeepers' },
  { key: 'DEF', label: 'Defenders' },
  { key: 'MID', label: 'Midfielders' },
  { key: 'FWD', label: 'Forwards' },
];

const TeamRosterPage = () => {
  const { teamId } = useParams();
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/teams/${teamId}/roster`);
        setTeamData(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [teamId]);

  const topScorer = teamData?.topScorer;
  const topAssister = teamData?.topAssister;

  const currentTeamStyle = useMemo(() => {
    if (!teamData?.team?.color) return {};
    return {
      borderColor: `${teamData.team.color}55`,
      boxShadow: `0 0 0 1px ${teamData.team.color}22, 0 14px 40px ${teamData.team.color}18`,
    };
  }, [teamData]);

  if (loading) return <Loading message="Loading team roster and team stats..." />;

  if (!teamData) {
    return (
      <div className="glass-card p-12 text-center text-slate-400">
        <p className="font-display text-xl font-bold text-white">Team not found</p>
        <p className="mt-2 text-xs">The selected club couldn’t be loaded right now.</p>
        <Link to="/standings" className="btn-secondary mt-4 gap-2">
          <FiArrowLeft size={14} />
          <span>Back to Standings</span>
        </Link>
      </div>
    );
  }

  const { team, squadByPosition, startingXI, substitutes, lastFive, standings, league, currentPosition } = teamData;

  return (
    <div className="space-y-8">
      <header className="glass-card" style={currentTeamStyle}>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {team.logo ? (
                <img src={team.logo} alt={`${team.name} logo`} className="h-16 w-16 rounded-2xl object-cover" />
              ) : (
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl font-display text-xl font-black text-slate-950"
                  style={{ backgroundColor: team.color || '#22d3ee' }}
                >
                  {team.name?.slice(0, 2).toUpperCase() || 'KFC'}
                </div>
              )}

              <div>
                <span className="section-label">{league?.name || 'Club Profile'}</span>
                <h1 className="font-display text-3xl font-black text-white sm:text-4xl">{team.name}</h1>
                <p className="text-xs text-slate-300">Captain: {team.captain?.name || 'Unassigned'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="badge-cyan">#{currentPosition || '-'} in table</span>
              <span className="badge-gold">{standings.points || 0} pts</span>
              <span className="badge-teal">{league?.stage || 'LEAGUE'}</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.06] bg-slate-900/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Form</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lastFive.map((result) => (
                  <span
                    key={`${result.fixtureId}-${result.result}`}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                      result.result === 'W'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : result.result === 'D'
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-rose-500/15 text-rose-300'
                    }`}
                  >
                    {result.result}
                  </span>
                ))}
                {lastFive.length === 0 && <span className="text-xs text-slate-500">No completed results yet</span>}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-slate-900/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Top Scorer / Assister</p>
              <div className="mt-3 space-y-2 text-xs text-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{topScorer?.player?.name || 'No scorer data'}</span>
                  <span className="badge-gold">{topScorer?.goals || 0} goals</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{topAssister?.player?.name || 'No assist data'}</span>
                  <span className="badge-teal">{topAssister?.assists || 0} assists</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <span className="section-label">Squad Structure</span>
              <h2 className="section-title">Starting XI & Bench</h2>
            </div>
            <FiUsers className="text-cyan-400" size={20} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.05] bg-slate-900/60 p-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Starting XI</span>
              <div className="mt-3 space-y-2">
                {startingXI.map((player) => {
                    const t = getPlayerTier(player.overall || 0);
                    return (
                      <div key={player._id} className="flex items-center justify-between rounded-xl bg-slate-950/80 px-3 py-2 text-xs">
                        <span className="font-bold text-white">#{player.jersey || '-'} {player.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${t.chipBg}`}>
                            {t.icon} {t.name}
                          </span>
                          <span className="text-cyan-300">{player.position}</span>
                        </div>
                      </div>
                    );
                  })}
                {startingXI.length === 0 && <p className="text-xs text-slate-500">No starting XI saved yet.</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.05] bg-slate-900/60 p-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">Substitutes</span>
              <div className="mt-3 space-y-2">
                {substitutes.map((player) => {
                    const t = getPlayerTier(player.overall || 0);
                    return (
                      <div key={player._id} className="flex items-center justify-between rounded-xl bg-slate-950/80 px-3 py-2 text-xs">
                        <span className="font-bold text-white">#{player.jersey || '-'} {player.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${t.chipBg}`}>
                            {t.icon} {t.name}
                          </span>
                          <span className="text-teal-300">{player.position}</span>
                        </div>
                      </div>
                    );
                  })}
                {substitutes.length === 0 && <p className="text-xs text-slate-500">No substitutes saved yet.</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <span className="section-label">Team Stats</span>
              <h2 className="section-title">League Snapshot</h2>
            </div>
            <FiShield className="text-amber-400" size={20} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Played', standings.played],
              ['Won', standings.won],
              ['Drawn', standings.drawn],
              ['Lost', standings.lost],
              ['Goals For', standings.gf],
              ['Goals Against', standings.ga],
              ['Goal Difference', standings.gd],
              ['Points', standings.points],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/[0.05] bg-slate-900/60 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                <p className="mt-2 font-display text-xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-card space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div>
            <span className="section-label">Roster Breakdown</span>
            <h2 className="section-title">Grouped by Position</h2>
          </div>
          <FiAward className="text-amber-400" size={20} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {positionGroups.map((group) => (
            <div key={group.key} className="rounded-2xl border border-white/[0.05] bg-slate-900/60 p-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">{group.label}</span>
              <div className="mt-3 space-y-2">
                {(squadByPosition[group.key] || []).map((player) => {
                    const t = getPlayerTier(player.overall || 0);
                    return (
                      <div key={player._id} className="flex items-center justify-between rounded-xl bg-slate-950/80 px-3 py-2 text-xs">
                        <span className="font-bold text-white">#{player.jersey || '-'} {player.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${t.chipBg}`}>
                            {t.icon} {t.name}
                          </span>
                          <span className="text-slate-400">{player.position}</span>
                        </div>
                      </div>
                    );
                  })}
                {(squadByPosition[group.key] || []).length === 0 && (
                  <p className="text-xs text-slate-500">No players assigned to this group yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link to="/standings" className="btn-secondary gap-2">
          <FiArrowLeft size={14} />
          <span>Back to Standings</span>
        </Link>
        <Link to="/fixtures" className="btn-primary gap-2">
          <FiCalendar size={14} />
          <span>View Fixtures</span>
        </Link>
      </div>
    </div>
  );
};

export default TeamRosterPage;
