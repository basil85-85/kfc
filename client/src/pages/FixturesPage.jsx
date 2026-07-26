import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import FixtureDetailModal from '../components/FixtureDetailModal';
import { FiCalendar, FiMapPin, FiChevronDown, FiChevronUp, FiAward, FiClock, FiShare2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const FixturesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialStatus = searchParams.get('status') || 'upcoming';

  const [fixtures, setFixtures] = useState([]);
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [expandedFixture, setExpandedFixture] = useState(null);
  const [detailFixtureId, setDetailFixtureId] = useState(null);
  const [shareToast, setShareToast] = useState(null);
  const [allFixturesForScorers, setAllFixturesForScorers] = useState([]);

  // Sync URL search params when page or status changes
  useEffect(() => {
    const params = {};
    if (page > 1) params.page = page;
    if (status !== 'upcoming') params.status = status;
    setSearchParams(params, { replace: true });
  }, [page, status, setSearchParams]);

  // Load paginated fixtures
  const loadFixtures = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/fixtures', {
        params: {
          page,
          limit: 10,
          status,
        },
      });

      if (data && Array.isArray(data.fixtures)) {
        setFixtures(data.fixtures);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      } else if (Array.isArray(data)) {
        setFixtures(data);
        setTotalPages(1);
        setTotalCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching fixtures:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFixtures();
  }, [page, status]);

  // Load unpaginated list for Top Goalscorer widget
  useEffect(() => {
    const fetchTopScorers = async () => {
      try {
        const { data } = await api.get('/fixtures', { params: { all: 'true' } });
        if (Array.isArray(data)) setAllFixturesForScorers(data);
      } catch (err) {
        console.error('Error fetching top scorers:', err);
      }
    };
    fetchTopScorers();
  }, []);

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  const topScorers = useMemo(() => {
    const totals = {};
    allFixturesForScorers.forEach((fixture) => {
      (fixture.goalEvents || []).forEach((g) => {
        if (g.type === 'own_goal') return;
        const playerId = g.player?._id?.toString() || g.player?.toString();
        if (!playerId) return;
        if (!totals[playerId]) totals[playerId] = { goals: 0, name: g.player?.name || 'Unknown', team: g.team?.name || '' };
        totals[playerId].goals += 1;
      });
      if (!fixture.goalEvents || fixture.goalEvents.length === 0) {
        (fixture.scorers || []).forEach((scorer) => {
          const playerId = scorer.player?._id?.toString() || scorer.player?.toString();
          if (!playerId) return;
          if (!totals[playerId]) totals[playerId] = { goals: 0, name: scorer.player?.name || 'Unknown', team: scorer.team?.name || '' };
          totals[playerId].goals += 1;
        });
      }
    });
    return Object.values(totals).sort((a, b) => b.goals - a.goals);
  }, [allFixturesForScorers]);

  const handleShare = (fixture) => {
    const homeScore = fixture.homeScore ?? 0;
    const awayScore = fixture.awayScore ?? 0;
    const scorerLines = (fixture.goalEvents || [])
      .filter((g) => g.type !== 'own_goal')
      .map((g) => `  ⚽ ${g.player?.name || 'Unknown'} ${g.minute}'${g.assistedBy ? ` (assist: ${g.assistedBy?.name || '?'})` : ''}`)
      .join('\n');
    const ownGoals = (fixture.goalEvents || []).filter((g) => g.type === 'own_goal').map((g) => `  🔄 ${g.player?.name} (OG) ${g.minute}'`).join('\n');
    const text = [
      `🏟️ MATCH RESULT`,
      `${fixture.homeTeam?.name} ${homeScore} – ${awayScore} ${fixture.awayTeam?.name}`,
      `📍 ${fixture.venue}  |  ${new Date(fixture.date).toLocaleDateString()}`,
      scorerLines ? `\nGoals:\n${scorerLines}` : '',
      ownGoals ? `\nOwn Goals:\n${ownGoals}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setShareToast(fixture._id);
      setTimeout(() => setShareToast(null), 2500);
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Banner & Top Scorer Box */}
      <header className="glass-card">
        <div className="grid gap-8 xl:grid-cols-[1.5fr_0.9fr] xl:items-center">
          <div className="space-y-3">
            <span className="section-label">Club Matchday Schedule</span>
            <h1 className="font-display text-3xl font-black text-white sm:text-4xl">
              Fixtures & Match Results
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-300">
              Track upcoming fixtures, inspect post-match scores, and analyze goal timelines for every game across seasons.
            </p>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 pt-4">
              {['upcoming', 'completed', 'all'].map((option) => (
                <button
                  key={option}
                  onClick={() => handleStatusChange(option)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                    status === option
                      ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                      : 'border border-white/10 bg-slate-900/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Top Scorer Widget */}
          <div className="rounded-2xl border border-amber-500/20 bg-slate-900/80 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2.5">
              <FiAward className="text-amber-400" size={18} />
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300">Top Goalscorer</span>
            </div>

            {topScorers.length > 0 ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold text-white">{topScorers[0].name}</span>
                  <span className="badge-gold">{topScorers[0].goals} Goals</span>
                </div>
                {topScorers[0].team && <p className="text-xs text-slate-400">{topScorers[0].team}</p>}
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-400">No goal scorers recorded yet for active fixtures.</p>
            )}
          </div>
        </div>
      </header>

      {/* Match Cards List */}
      {loading ? (
        <Loading message="Loading match calendar..." />
      ) : (
        <div className="space-y-4">
          {fixtures.map((fixture) => {
            const isCompleted = fixture.status === 'completed';
            const isExpanded = expandedFixture === fixture._id;

            return (
              <div
                key={fixture._id}
                className="glass-card !rounded-2xl p-6 transition-all duration-300 hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] group relative overflow-hidden"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Match Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 text-xs font-bold text-cyan-400">
                      <span className="flex items-center gap-1">
                        <FiCalendar size={13} />
                        {new Date(fixture.date).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <FiMapPin size={13} />
                        {fixture.venue}
                      </span>
                      <span className="badge-teal text-[10px] uppercase font-extrabold tracking-wider">
                        {fixture.matchFormat || '11s'}
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                      <Link to={`/teams/${fixture.homeTeam?._id}`} className="hover:text-cyan-300 transition-colors">
                        {fixture.homeTeam?.name || 'Home'}
                      </Link>{' '}
                      <span className="text-cyan-400 font-normal">vs</span>{' '}
                      <Link to={`/teams/${fixture.awayTeam?._id}`} className="hover:text-cyan-300 transition-colors">
                        {fixture.awayTeam?.name || 'Away'}
                      </Link>
                    </h3>
                  </div>

                  {/* Score & Expand Controls */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {isCompleted ? (
                      <div className="flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-lg font-black text-cyan-300 shadow-glow-cyan">
                        <span>{fixture.homeScore ?? 0}</span>
                        <span className="text-xs text-slate-500">–</span>
                        <span>{fixture.awayScore ?? 0}</span>
                      </div>
                    ) : (
                      <span className="badge-teal">
                        <FiClock size={12} /> Scheduled
                      </span>
                    )}

                    <button
                      onClick={() => setExpandedFixture(isExpanded ? null : fixture._id)}
                      className="btn-secondary text-xs py-2 px-3 gap-1"
                    >
                      <span>{isExpanded ? 'Hide' : 'Timeline'}</span>
                      {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                    </button>

                    {isCompleted && (
                      <button
                        onClick={() => handleShare(fixture)}
                        className="relative btn-secondary text-xs py-2 px-3 gap-1"
                        title="Copy match result to clipboard"
                      >
                        <FiShare2 size={13} />
                        {shareToast === fixture._id && (
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg animate-fade-in">
                            Copied!
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Match Timeline / Details Dropdown */}
                {isExpanded && (
                  <div className="mt-6 border-t border-white/[0.06] pt-4 animate-fade-in space-y-4">
                    {isCompleted ? (
                      <>
                        <div className="rounded-2xl border border-white/[0.04] bg-slate-900/60 p-4 space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Match Events Timeline</span>
                          {(fixture.goalEvents || []).length > 0 ? (
                            [...(fixture.goalEvents || [])]
                              .sort((a, b) => (a.minute || 0) - (b.minute || 0))
                              .map((g, idx) => {
                                const isOG   = g.type === 'own_goal';
                                const homeId = String(fixture.homeTeam?._id || fixture.homeTeam);
                                const teamId = String(g.team?._id || g.team);
                                const side   = teamId === homeId ? fixture.homeTeam?.name : fixture.awayTeam?.name;
                                return (
                                  <div key={idx} className="flex items-center gap-3 text-xs py-1 border-b border-white/[0.04] last:border-0">
                                    <span className="font-mono font-bold text-amber-400 w-8 shrink-0">{g.minute}'</span>
                                    <span>{isOG ? '🔄' : '⚽'}</span>
                                    <span className="font-semibold text-white">{g.player?.name || 'Unknown'}</span>
                                    {isOG && <span className="text-rose-400 text-[10px] font-bold">(OG)</span>}
                                    {g.assistedBy && !isOG && (
                                      <span className="text-slate-400">(assist: <strong className="text-cyan-300">{g.assistedBy?.name || '?'}</strong>)</span>
                                    )}
                                    <span className="ml-auto text-[10px] text-slate-500">{side}</span>
                                  </div>
                                );
                              })
                          ) : (
                            <p className="text-xs text-slate-500">No goal events recorded for this match.</p>
                          )}
                        </div>

                        <button
                          onClick={() => setDetailFixtureId(fixture._id)}
                          className="btn-secondary text-xs py-1.5 px-4 gap-1.5"
                        >
                          View Lineups & Full Match Detail
                        </button>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Match scheduled for {new Date(fixture.date).toLocaleDateString()} at {fixture.venue}. Check back post-match for the full timeline.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {fixtures.length === 0 && (
            <div className="glass-card text-center py-12 space-y-2">
              <p className="text-base font-bold text-white">No fixtures found</p>
              <p className="text-xs text-slate-400">There are no {status} fixtures matching your selection.</p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
              <span className="text-xs text-slate-400">
                Showing <strong className="text-white">{(page - 1) * 10 + 1}</strong> – <strong className="text-white">{Math.min(page * 10, totalCount)}</strong> of <strong className="text-white">{totalCount}</strong> fixtures
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="rounded-xl border border-white/10 bg-slate-900 p-2 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Previous Page"
                >
                  <FiChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-9 min-w-9 rounded-xl text-xs font-bold transition ${
                      page === p
                        ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                        : 'border border-white/10 bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="rounded-xl border border-white/10 bg-slate-900 p-2 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Next Page"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fixture Detail Modal (lineups + full match detail) */}
      <FixtureDetailModal
        fixtureId={detailFixtureId}
        isOpen={!!detailFixtureId}
        onClose={() => setDetailFixtureId(null)}
      />
    </div>
  );
};

export default FixturesPage;