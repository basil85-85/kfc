import { useEffect, useState } from 'react';
import api from '../services/api';
import Loading from '../components/Loading';
import { useToast } from '../components/ToastContainer';
import { FiUsers, FiEdit2, FiCheck, FiX, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { usePlayerList } from '../hooks/usePlayerList';

const AdminPlayersPage = () => {
  const {
    players,
    totalCount,
    totalPages,
    currentPage,
    limit,
    setPage,
    searchInput,
    setSearchInput,
    clearSearch,
    loading,
    isFetching,
    refresh,
  } = usePlayerList({ defaultLimit: 20 });

  const [teams, setTeams] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const toast = useToast();

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teamsRes = await api.get('/teams');
        setTeams(teamsRes.data);
      } catch (error) {
        console.error(error);
      }
    };
    loadTeams();
  }, []);

  const handleEditClick = (player) => {
    setEditingId(player._id);
    setEditForm({
      name: player.name,
      phone: player.phone || '',
      position: player.position || 'CM',
      jersey: player.jersey || '',
      photoURL: player.photoURL || '',
      team: player.team?._id || player.team || '',
      active: player.active ?? true,
    });
  };

  const handleSave = async (playerId) => {
    try {
      await api.put(`/users/${playerId}`, editForm);
      toast?.addToast('Player profile updated successfully!', 'success');
      setEditingId(null);
      refresh();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Could not update player', 'error');
    }
  };

  if (loading) return <Loading message="Loading player directory..." />;

  const startCount = totalCount > 0 ? (currentPage - 1) * limit + 1 : 0;
  const endCount = Math.min(currentPage * limit, totalCount);

  return (
    <div className="space-y-8">
      <header className="glass-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="section-label">Roster Operations</span>
          <h1 className="font-display text-3xl font-black text-white">Player Directory</h1>
          <p className="text-xs text-slate-300">View and edit registered players, assign team rosters, and manage player status.</p>
        </div>

        {/* Debounced Search Bar */}
        <div className="relative min-w-[260px]">
          <FiSearch className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, player code (KFC-...), email..."
            className="input-dark pl-10 pr-9 py-2 text-xs"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-2.5 rounded-full bg-slate-800 p-0.5 text-slate-400 hover:text-white"
              title="Clear search"
            >
              <FiX size={12} />
            </button>
          )}
        </div>
      </header>

      {/* Directory Table */}
      <div className="glass-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="table-dark">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400">
                <th>Player</th>
                <th>Position</th>
                <th>Jersey</th>
                <th>Team</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="py-4 text-center text-xs text-slate-500">
                      Loading player page data...
                    </td>
                  </tr>
                ))
              ) : players.length > 0 ? (
                players.map((player) => {
                  const isEditing = editingId === player._id;

                  return (
                    <tr key={player._id}>
                      {/* Player Name */}
                      <td>
                        {isEditing ? (
                          <input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="input-dark py-1 px-2 text-xs"
                          />
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 shrink-0">
                              {player.photoURL ? (
                                <img src={player.photoURL} alt={player.name} className="h-full w-full object-cover" />
                              ) : (
                                player.name?.[0]
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-white block">{player.name}</span>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                {player.playerCode && (
                                  <span className="font-mono text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                                    {player.playerCode}
                                  </span>
                                )}
                                {player.email && <span>{player.email}</span>}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>


                      {/* Position */}
                      <td>
                        {isEditing ? (
                          <select
                            value={editForm.position}
                            onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                            className="select-dark py-1 px-2 text-xs"
                          >
                            <option>GK</option><option>CB</option><option>LB</option><option>RB</option>
                            <option>CDM</option><option>CM</option><option>CAM</option><option>LW</option>
                            <option>RW</option><option>ST</option>
                          </select>
                        ) : (
                          <span className="badge-cyan">{player.position || 'CM'}</span>
                        )}
                      </td>

                      {/* Jersey */}
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.jersey}
                            onChange={(e) => setEditForm({ ...editForm, jersey: e.target.value })}
                            className="input-dark py-1 px-2 text-xs w-16"
                          />
                        ) : (
                          <span className="font-bold text-slate-300">#{player.jersey || '—'}</span>
                        )}
                      </td>

                      {/* Team */}
                      <td>
                        {isEditing ? (
                          <select
                            value={editForm.team}
                            onChange={(e) => setEditForm({ ...editForm, team: e.target.value })}
                            className="select-dark py-1 px-2 text-xs"
                          >
                            <option value="">No Team</option>
                            {teams.map((t) => (
                              <option key={t._id} value={t._id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-slate-300">{player.team?.name || 'Unassigned'}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        {isEditing ? (
                          <select
                            value={editForm.active ? 'true' : 'false'}
                            onChange={(e) => setEditForm({ ...editForm, active: e.target.value === 'true' })}
                            className="select-dark py-1 px-2 text-xs"
                          >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        ) : (
                          <span className={player.active ? 'badge-emerald' : 'badge-crimson'}>
                            {player.active ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleSave(player._id)}
                              className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-400 hover:bg-emerald-500/30"
                            >
                              <FiCheck size={16} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:bg-slate-700"
                            >
                              <FiX size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditClick(player)}
                            className="btn-secondary text-xs py-1 px-2.5 gap-1"
                          >
                            <FiEdit2 size={12} /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    {searchInput ? `No players found for '${searchInput}'` : 'No players found in database.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-white/[0.06] bg-slate-900/40 px-6 py-4">
            <p className="text-xs text-slate-400">
              Showing <span className="font-bold text-white">{startCount}</span>-
              <span className="font-bold text-white">{endCount}</span> of{' '}
              <span className="font-bold text-white">{totalCount}</span> players
            </p>

            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn-secondary py-1 px-2.5 text-xs gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FiChevronLeft size={14} /> Prev
              </button>

              <div className="flex items-center gap-1 px-1">
                {[...Array(totalPages)].map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition ${
                        currentPage === pNum
                          ? 'bg-cyan-500 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
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
                className="btn-secondary py-1 px-2.5 text-xs gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPlayersPage;
