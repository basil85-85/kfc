import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import FifaCard from '../components/FifaCard';
import Loading from '../components/Loading';
import PlayerComparisonModal from '../components/PlayerComparisonModal';
import {
  FiUsers,
  FiFilter,
  FiBarChart2,
  FiStar,
  FiSearch,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiSliders,
  FiCheck,
} from 'react-icons/fi';
import { getPlayerTier, TIERS } from '../utils/playerTier';
import { usePlayerList } from '../hooks/usePlayerList';

// Tier filter options in display order
const TIER_FILTERS = [
  { value: 'All', label: 'All Tiers', icon: null },
  { value: TIERS.ICONIC,   label: 'Iconic',   icon: '⭐' },
  { value: TIERS.GOLD,     label: 'Gold',     icon: '🥇' },
  { value: TIERS.PLATINUM, label: 'Platinum', icon: '🥈' },
  { value: TIERS.BRONZE,   label: 'Bronze',   icon: '🥉' },
];

const POSITION_FILTERS = [
  { value: 'All', label: 'All Positions', icon: null },
  { value: 'GK',  label: 'GK',  icon: '🧤' },
  { value: 'CB',  label: 'CB',  icon: '🛡️' },
  { value: 'LB',  label: 'LB',  icon: '🛡️' },
  { value: 'RB',  label: 'RB',  icon: '🛡️' },
  { value: 'CDM', label: 'CDM', icon: '⚓' },
  { value: 'CM',  label: 'CM',  icon: '⚙️' },
  { value: 'CAM', label: 'CAM', icon: '🪄' },
  { value: 'LW',  label: 'LW',  icon: '⚡' },
  { value: 'RW',  label: 'RW',  icon: '⚡' },
  { value: 'ST',  label: 'ST',  icon: '🎯' },
];

const SquadPage = () => {
  const {
    players,
    totalCount,
    totalPages,
    currentPage,
    setPage,
    searchInput,
    setSearchInput,
    clearSearch,
    positionFilter,
    setPositionFilter,
    teamFilter,
    setTeamFilter,
    tierFilter,
    setTierFilter,
    loading,
    isFetching,
  } = usePlayerList({ defaultLimit: 12 });

  const [ratings, setRatings] = useState([]);
  const [teams, setTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [allPlayersForCompare, setAllPlayersForCompare] = useState([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 640);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [ratingsRes, teamsRes, fixturesRes, allPlayersRes] = await Promise.all([
          api.get('/ratings'),
          api.get('/teams?includeAll=true'),
          api.get('/fixtures'),
          api.get('/users?all=true'),
        ]);
        const ratingsData = Array.isArray(ratingsRes.data) ? ratingsRes.data : [];
        setRatings(ratingsData);
        setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : teamsRes.data?.teams || []);
        setFixtures(Array.isArray(fixturesRes.data) ? fixturesRes.data : []);
        
        const allPlayersList = Array.isArray(allPlayersRes.data)
          ? allPlayersRes.data
          : allPlayersRes.data?.players || allPlayersRes.data?.users || [];
        
        const ratedPlayersList = allPlayersList
          .filter((p) => p.role === 'player' && p.active)
          .map((player) => {
            const rating = ratingsData.find((item) => String(item.player?._id || item.player) === String(player._id));
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

        setAllPlayersForCompare(ratedPlayersList);
      } catch (error) {
        console.error(error);
      } finally {
        setMetaLoading(false);
      }
    };
    loadMeta();
  }, []);

  const teamMap = useMemo(
    () => teams.reduce((acc, team) => {
      if (team?._id) acc[String(team._id)] = team;
      return acc;
    }, {}),
    [teams]
  );

  const fixturesByTeam = useMemo(() => {
    const map = {};
    const upcoming = fixtures
      .filter((fixture) => fixture && fixture.status !== 'completed' && new Date(fixture.date) > new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    upcoming.forEach((fixture) => {
      [fixture.homeTeam, fixture.awayTeam].forEach((teamRef) => {
        const teamId = String(teamRef?._id || teamRef);
        if (teamId && !map[teamId]) {
          map[teamId] = fixture;
        }
      });
    });

    return map;
  }, [fixtures]);

  const mappedPlayers = useMemo(() => {
    return players.map((player) => {
      const rating = ratings.find((item) => String(item.player?._id) === String(player._id));
      const teamId = String(player.team?._id || player.team || '');
      const team = teamMap[teamId] || player.team;
      const nextFixture = team ? fixturesByTeam[teamId] : null;
      const nextMatchLabel = nextFixture
        ? `${new Date(nextFixture.date).toLocaleDateString()} vs ${String(nextFixture.homeTeam?._id || nextFixture.homeTeam) === teamId ? nextFixture.awayTeam?.name : nextFixture.homeTeam?.name}`
        : 'No upcoming match';
      const managerName = team?.managerName || team?.managerEmail || '';

      return {
        ...player,
        pace: rating?.pace || 55,
        shooting: rating?.shooting || 55,
        passing: rating?.passing || 55,
        dribbling: rating?.dribbling || 55,
        defending: rating?.defending || 55,
        physical: rating?.physical || 55,
        overall: rating?.overall || 0,
        managerName,
        teamName: team?.name,
        nextMatchLabel,
      };
    });
  }, [players, ratings, teamMap, fixturesByTeam]);

  const hasActiveFilters = searchInput || positionFilter !== 'All' || teamFilter !== 'All' || tierFilter !== 'All';

  const resetAllFilters = () => {
    clearSearch();
    setPositionFilter('All');
    setTeamFilter('All');
    setTierFilter('All');
  };

  if (loading || metaLoading) return <Loading message="Loading squad roster and player attributes..." />;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <header className="glass-card flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-cyan-500/20 shadow-glow-cyan">
        <div className="max-w-2xl space-y-2">
          <span className="section-label">Club Roster</span>
          <h1 className="font-display text-3xl font-black text-white sm:text-4xl">Meet Your Squad</h1>
          <p className="text-sm text-slate-300">
            Browse player attributes, ratings, tactical positions, and compare stats head-to-head.
          </p>
        </div>

        <button onClick={() => setIsCompareOpen(true)} className="btn-primary gap-2 self-start lg:self-auto">
          <FiBarChart2 size={16} />
          <span>Compare Players</span>
        </button>
      </header>

      {/* Unified Search + Collapsible Filter Panel */}
      <div className="glass-card p-4 space-y-3 border-cyan-500/20 shadow-glow-cyan">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-3 text-slate-400" size={18} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search player by name or jersey number..."
              className="input-dark pl-11 pr-10 py-2 text-sm w-full"
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-2.5 rounded-full bg-slate-800 p-1 text-slate-400 hover:text-white transition"
                title="Clear search"
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`btn-secondary text-xs py-2 px-4 font-bold gap-2 shrink-0 self-start sm:self-auto ${
              isFilterOpen || hasActiveFilters ? 'border-cyan-500/50 text-cyan-300 bg-cyan-500/10' : ''
            }`}
          >
            <FiSliders size={14} className="text-cyan-400" />
            <span>{isFilterOpen ? 'Hide Filters' : 'Filter Squad'}</span>
            {hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            )}
            {isFilterOpen ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </button>
        </div>

        {/* Active Filter Chips Row (Always visible) */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Active:</span>

              {tierFilter !== 'All' && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-300 shadow-sm">
                  <span>Tier: {tierFilter}</span>
                  <button onClick={() => setTierFilter('All')} className="hover:text-white"><FiX size={12} /></button>
                </span>
              )}

              {positionFilter !== 'All' && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-300 shadow-sm">
                  <span>Pos: {positionFilter}</span>
                  <button onClick={() => setPositionFilter('All')} className="hover:text-white"><FiX size={12} /></button>
                </span>
              )}

              {teamFilter !== 'All' && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/40 bg-teal-500/10 px-2.5 py-0.5 text-xs font-bold text-teal-300 shadow-sm">
                  <span>Team: {teamMap[teamFilter]?.name || 'Selected'}</span>
                  <button onClick={() => setTeamFilter('All')} className="hover:text-white"><FiX size={12} /></button>
                </span>
              )}

              {searchInput && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-300 shadow-sm">
                  <span>"{searchInput}"</span>
                  <button onClick={clearSearch} className="hover:text-white"><FiX size={12} /></button>
                </span>
              )}
            </div>

            <button
              onClick={resetAllFilters}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 underline underline-offset-4 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Collapsible Filters Body (Tier, Position, Team inside ONE panel) */}
        {isFilterOpen && (
          <div className="pt-3 border-t border-white/[0.08] space-y-4 animate-slide-down">
            {/* Tier Row */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <FiStar className="text-amber-400" size={13} />
                <span>Tier Rating</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TIER_FILTERS.map(({ value, label, icon }) => {
                  const tier = value !== 'All' ? getPlayerTier(value === TIERS.ICONIC ? 85 : value === TIERS.GOLD ? 70 : value === TIERS.PLATINUM ? 50 : 0) : null;
                  const isActive = tierFilter === value;

                  return (
                    <button
                      key={value}
                      onClick={() => setTierFilter(value)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                        isActive
                          ? value === 'All'
                            ? 'bg-slate-600 text-white shadow-inner ring-1 ring-white/30'
                            : `${tier?.filterActiveBg} shadow-inner`
                          : value === 'All'
                          ? 'border border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                          : tier?.filterInactiveBg
                      }`}
                    >
                      {icon && <span>{icon}</span>}
                      <span>{label}</span>
                      {isActive && <FiCheck size={12} className="ml-0.5 opacity-80" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Position Row */}
            <div className="pt-2 border-t border-white/[0.04] space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <FiFilter className="text-cyan-400" size={13} />
                <span>Tactical Position</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POSITION_FILTERS.map(({ value, label, icon }) => {
                  const isActive = positionFilter === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setPositionFilter(value)}
                      className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan font-black'
                          : 'border border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {icon && <span className="text-xs">{icon}</span>}
                      <span>{label}</span>
                      {isActive && <FiCheck size={12} className="ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team Row */}
            {teams.length > 0 && (
              <div className="pt-2 border-t border-white/[0.04] space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <FiUsers className="text-teal-400" size={13} />
                  <span>Club / Team</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setTeamFilter('All')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                      teamFilter === 'All'
                        ? 'bg-teal-400 text-slate-950 shadow-glow-teal font-black'
                        : 'border border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    All Squads
                  </button>
                  {teams.map((team) => (
                    <button
                      key={team._id}
                      onClick={() => setTeamFilter(team._id)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                        String(teamFilter) === String(team._id)
                          ? 'bg-teal-400 text-slate-950 shadow-glow-teal font-black'
                          : 'border border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {team.logo && <img src={team.logo} alt="" className="h-3.5 w-3.5 rounded-full object-contain" />}
                      <span>{team.name}</span>
                      {String(teamFilter) === String(team._id) && <FiCheck size={12} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Players Cards Grid with Skeleton Loader & Stagger Fade-in Animation */}
      {isFetching ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-96 rounded-3xl bg-slate-900/60 border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
          {mappedPlayers.map((player, idx) => (
            <div
              key={player._id}
              className="page-enter transition-all duration-300 h-[470px]"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <FifaCard player={player} />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isFetching && mappedPlayers.length === 0 && (
        <div className="glass-card p-12 text-center text-slate-400 space-y-3">
          <p className="font-display text-lg font-bold text-white">
            {searchInput ? `No players found for '${searchInput}'` : 'No players match these filters.'}
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query, position, team, or tier selections.
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="btn-primary text-xs py-2 px-4 gap-1.5 font-bold"
            >
              <FiX size={14} /> Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="glass-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-white/10">
          <p className="text-xs text-slate-400 font-semibold">
            Showing Page <span className="text-white font-bold">{currentPage}</span> of{' '}
            <span className="text-white font-bold">{totalPages}</span> ({totalCount} total players)
          </p>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn-secondary py-1.5 px-3 text-xs gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiChevronLeft size={16} /> Previous
            </button>

            <div className="flex items-center gap-1 px-2">
              {[...Array(totalPages)].map((_, idx) => {
                const pNum = idx + 1;
                return (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`h-8 w-8 rounded-xl text-xs font-black transition ${
                      currentPage === pNum
                        ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                        : 'border border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary py-1.5 px-3 text-xs gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Player Comparison Modal */}
      <PlayerComparisonModal
        players={allPlayersForCompare}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
      />
    </div>
  );
};

export default SquadPage;
