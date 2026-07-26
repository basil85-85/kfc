import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../services/api';
import Loading from '../components/Loading';
import PlayerComparisonModal from '../components/PlayerComparisonModal';
import { FiAward, FiBarChart2, FiTrendingUp } from 'react-icons/fi';
import { getPlayerTier } from '../utils/playerTier';

const LeaderboardPage = () => {
  const [fixtures, setFixtures] = useState([]);
  const [players, setPlayers] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [view, setView] = useState('season');
  const [loading, setLoading] = useState(true);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [fixturesRes, playersRes, ratingsRes] = await Promise.all([
          api.get('/fixtures'),
          api.get('/users?all=true'),
          api.get('/ratings'),
        ]);
        setFixtures(fixturesRes.data);
        const playerList = Array.isArray(playersRes.data)
          ? playersRes.data
          : playersRes.data?.players || [];
        setPlayers(playerList.filter((p) => p.role === 'player'));
        setRatings(ratingsRes.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const ratingMap = useMemo(() => {
    const map = {};
    ratings.forEach((r) => {
      const pid = r.player?._id?.toString() || r.player?.toString();
      if (pid) map[pid] = r.overall || 0;
    });
    return map;
  }, [ratings]);

  const stats = useMemo(() => {
    const totals = {};

    const ensure = (playerId, name, teamId, teamName) => {
      if (!totals[playerId]) {
        totals[playerId] = { goals: 0, assists: 0, appearances: 0, name, teamId: teamId || '', teamName: teamName || '' };
      }
    };

    fixtures.forEach((fixture) => {
      const appearedInMatch = new Set();

      // ── Correct aggregation from goalEvents (primary source) ──────────────
      (fixture.goalEvents || []).forEach((g) => {
        const playerId  = g.player?._id?.toString() || g.player?.toString();
        const playerName = g.player?.name || 'Unknown';
        const teamId    = g.team?._id?.toString() || g.team?.toString() || '';
        const teamName  = g.team?.name || '';

        if (!playerId) return;

        ensure(playerId, playerName, teamId, teamName);
        appearedInMatch.add(playerId);

        // Own goals do NOT count as goals for the scorer (per spec)
        if (g.type !== 'own_goal') {
          totals[playerId].goals += 1;
        }

        // Count assists (assistedBy field)
        if (g.assistedBy) {
          const assistId   = g.assistedBy?._id?.toString() || g.assistedBy?.toString();
          const assistName = g.assistedBy?.name || 'Unknown';
          if (assistId) {
            ensure(assistId, assistName, teamId, teamName);
            totals[assistId].assists += 1;
            appearedInMatch.add(assistId);
          }
        }
      });

      // ── Fallback: legacy scorers/assists arrays for old fixtures ──────────
      if (!fixture.goalEvents || fixture.goalEvents.length === 0) {
        (fixture.scorers || []).forEach((score) => {
          const playerId = score.player?._id?.toString() || score.player?.toString();
          if (!playerId) return;
          ensure(playerId, score.player?.name || 'Unknown', score.team?._id?.toString() || score.team?.toString() || '', score.team?.name || '');
          totals[playerId].goals += 1;
          appearedInMatch.add(playerId);
        });
        (fixture.assists || []).forEach((assist) => {
          const playerId = assist.player?._id?.toString() || assist.player?.toString();
          if (!playerId) return;
          ensure(playerId, assist.player?.name || 'Unknown', '', '');
          totals[playerId].assists += 1;
          appearedInMatch.add(playerId);
        });
      }

      // Count distinct appearances per match
      appearedInMatch.forEach((id) => {
        if (totals[id]) totals[id].appearances += 1;
      });
    });

    return Object.entries(totals).map(([id, s]) => ({
      id,
      ...s,
      overallRating: ratingMap[id] || 0,
    }));
  }, [fixtures, ratingMap]);

  const topGoals = useMemo(() => [...stats].sort((a, b) => b.goals - a.goals).slice(0, 5), [stats]);
  const topAssists = useMemo(() => [...stats].sort((a, b) => b.assists - a.assists).slice(0, 5), [stats]);
  const topAppearances = useMemo(
    () => [...stats].sort((a, b) => b.appearances - a.appearances).slice(0, 5),
    [stats]
  );

  const chartData = useMemo(
    () => topGoals.map((item) => ({ name: item.name, goals: item.goals })),
    [topGoals]
  );

  const mappedPlayersForCompare = useMemo(() => {
    return players.map((player) => {
      const rating = ratings.find((r) => String(r.player?._id || r.player) === String(player._id));
      return {
        ...player,
        pace: rating?.pace || 55,
        shooting: rating?.shooting || 55,
        passing: rating?.passing || 55,
        dribbling: rating?.dribbling || 55,
        defending: rating?.defending || 55,
        physical: rating?.physical || 55,
        overall: rating?.overall || 0,
      };
    });
  }, [players, ratings]);

  if (loading) return <Loading message="Calculating player statistics & leaderboard..." />;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <header className="glass-card flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <span className="section-label">Performance Rankings</span>
          <h1 className="font-display text-3xl font-black text-white sm:text-4xl">Club Leaderboard</h1>
          <p className="text-sm text-slate-300">
            Celebrating top goalscorers, playmakers, and most dependable players.
          </p>
        </div>

        <button onClick={() => setIsCompareOpen(true)} className="btn-primary gap-2 self-start lg:self-auto">
          <FiBarChart2 size={16} />
          <span>Head-to-Head Comparison</span>
        </button>
      </header>

      {/* Podium Top 3 Scorers */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="glass-card space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <span className="section-label">Goal Leaders</span>
            <span className="badge-cyan">Top Scorers</span>
          </div>

          <div className="space-y-2.5">
            {topGoals.map((item, idx) => {
              const tier = getPlayerTier(item.overallRating || 0);
              return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-slate-900/60 p-3.5 transition hover:border-cyan-500/30"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950 shadow-glow-gold'
                        : idx === 1
                        ? 'bg-cyan-400 text-slate-950 shadow-glow-cyan'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-white text-sm">{item.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${tier.chipBg}`}>
                        {tier.icon} {tier.name}
                      </span>
                    </div>
                    {item.teamId && (
                      <Link to={`/teams/${item.teamId}`} className="text-[10px] text-slate-400 transition hover:text-cyan-300">
                        {item.teamName || 'Club'}
                      </Link>
                    )}
                  </div>
                </div>
                <span className="badge-gold">{item.goals} Goals</span>
              </div>
              );
            })}
            {topGoals.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-500">No match goals recorded yet.</p>
            )}
          </div>
        </section>

        {/* Recharts Bar Chart */}
        <section className="glass-card space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <span className="section-label">Goal Distribution</span>
            <FiTrendingUp className="text-cyan-400" />
          </div>

          <div className="h-[250px] w-full pt-2">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      color: '#f8fafc',
                    }}
                  />
                  <Bar dataKey="goals" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-16 text-center text-xs text-slate-500">Scoring chart will render when goals exist.</p>
            )}
          </div>
        </section>
      </div>

      {/* Playmakers & Appearances Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Top Assists */}
        <section className="glass-card space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <span className="section-label">Playmakers</span>
            <span className="badge-teal">Assists</span>
          </div>

          <div className="space-y-2">
            {topAssists.map((item, idx) => {
              const tier = getPlayerTier(item.overallRating || 0);
              return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-slate-900/60 p-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">#{idx + 1} {item.name}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${tier.chipBg}`}>
                    {tier.icon} {tier.name}
                  </span>
                </div>
                <span className="badge-teal">{item.assists} Assists</span>
              </div>
              );
            })}
            {topAssists.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-500">No assists logged yet.</p>
            )}
          </div>
        </section>

        {/* Most Appearances */}
        <section className="glass-card space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <span className="section-label">Most Dependable</span>
            <span className="badge-slate">Appearances</span>
          </div>

          <div className="space-y-2">
            {topAppearances.map((item, idx) => {
              const tier = getPlayerTier(item.overallRating || 0);
              return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-slate-900/60 p-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">#{idx + 1} {item.name}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${tier.chipBg}`}>
                    {tier.icon} {tier.name}
                  </span>
                </div>
                <span className="badge-slate">{item.appearances} Apps</span>
              </div>
              );
            })}
            {topAppearances.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-500">No appearances logged yet.</p>
            )}
          </div>
        </section>
      </div>

      <PlayerComparisonModal
        players={mappedPlayersForCompare}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
      />
    </div>
  );
};

export default LeaderboardPage;