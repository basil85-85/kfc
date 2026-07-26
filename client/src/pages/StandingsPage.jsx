import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import { FiAward, FiGrid } from 'react-icons/fi';

const SingleStandingsTable = ({ title, rows = [] }) => (
  <div className="glass-card overflow-hidden p-0 space-y-0 border-cyan-500/20 shadow-glow-cyan">
    {title && (
      <div className="bg-slate-900/90 px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
          <FiGrid className="text-cyan-400" size={16} />
          {title}
        </h3>
        <span className="badge-cyan text-[10px]">Top 2 Qualify for Semifinals</span>
      </div>
    )}
    <div className="overflow-x-auto">
      <table className="table-dark">
        <thead>
          <tr className="bg-slate-900/90 text-slate-400">
            <th className="w-12 text-center">Pos</th>
            <th>Team</th>
            <th className="text-center">MP</th>
            <th className="text-center">W</th>
            <th className="text-center">D</th>
            <th className="text-center">L</th>
            <th className="text-center">GF</th>
            <th className="text-center">GA</th>
            <th className="text-center">GD</th>
            <th className="text-center font-black text-cyan-400">PTS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isChampion = row.position === 1;
            const isQualified = row.qualified || row.position <= (title ? 2 : 4);

            return (
              <tr
                key={row.position}
                className={`transition-colors ${
                  isChampion
                    ? 'bg-gradient-to-r from-amber-500/10 to-transparent font-semibold'
                    : isQualified
                    ? 'bg-cyan-500/5'
                    : ''
                }`}
              >
                <td className="text-center">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                      isChampion
                        ? 'bg-amber-400 text-slate-950 shadow-glow-gold'
                        : isQualified
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    #{row.position}
                  </span>
                </td>
                <td className="font-display font-bold text-white flex items-center gap-2">
                  {isChampion && <FiAward className="text-amber-400 shrink-0" size={16} />}
                  <Link to={`/teams/${row.teamId}`} className="flex items-center gap-2 transition hover:text-cyan-300">
                    <span>{row.team}</span>
                    {isQualified && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
                        Qualified
                      </span>
                    )}
                  </Link>
                </td>
                <td className="text-center text-slate-400">{row.played}</td>
                <td className="text-center text-emerald-400 font-semibold">{row.won}</td>
                <td className="text-center text-slate-400">{row.drawn}</td>
                <td className="text-center text-rose-400">{row.lost}</td>
                <td className="text-center text-slate-300">{row.gf}</td>
                <td className="text-center text-slate-400">{row.ga}</td>
                <td className="text-center font-bold text-slate-300">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                <td className="text-center font-display text-base font-black text-cyan-300">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    {rows.length === 0 && (
      <p className="py-8 text-center text-xs text-slate-500">No standings calculated yet.</p>
    )}
  </div>
);

const StandingsPage = () => {
  const [leagues, setLeagues] = useState([]);
  const [standingsData, setStandingsData] = useState({ isGrouped: false, standings: [], groups: [] });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/leagues');
        setLeagues(data);
        if (data?.length) {
          setSelected(data[0]._id);
          const standingsResponse = await api.get(`/leagues/${data[0]._id}/standings`);
          setStandingsData(standingsResponse.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const changeLeague = async (leagueId) => {
    setSelected(leagueId);
    setLoading(true);
    try {
      const { data } = await api.get(`/leagues/${leagueId}/standings`);
      setStandingsData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Calculating league table standings..." />;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <header className="glass-card flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <span className="section-label">Season Table</span>
          <h1 className="font-display text-3xl font-black text-white sm:text-4xl">League Standings</h1>
          <p className="text-sm text-slate-300">
            Points get you close. Goals decide the rest. Settling tie-breakers with goal difference and goals scored.
          </p>
        </div>

        {/* Season Selector */}
        <div className="flex flex-wrap gap-2">
          {leagues.map((league) => (
            <button
              key={league._id}
              onClick={() => changeLeague(league._id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                selected === league._id
                  ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                  : 'border border-white/10 bg-slate-900/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {league.name} ({league.season})
            </button>
          ))}
        </div>
      </header>

      {/* Grouped or Single Table Standings */}
      {standingsData.isGrouped && standingsData.groups?.length > 0 ? (
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <span className="section-label">Group Stage Tables</span>
            <span className="badge-cyan">{standingsData.groups.length} Groups Stage</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {standingsData.groups.map((grp) => (
              <SingleStandingsTable key={grp.groupName} title={grp.groupName} rows={grp.standings} />
            ))}
          </div>
        </div>
      ) : (
        <SingleStandingsTable rows={standingsData.standings || []} />
      )}
    </div>
  );
};

export default StandingsPage;
