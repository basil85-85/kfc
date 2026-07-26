import { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import Loading from '../components/Loading';
import { useToast } from '../components/ToastContainer';
import { useBulkSelect } from '../hooks/useBulkSelect';
import BulkDeleteActionBar from '../components/BulkDeleteActionBar';
import {
  FiCreditCard,
  FiPlus,
  FiCheckCircle,
  FiSearch,
  FiFilter,
  FiDownload,
  FiUsers,
  FiDollarSign,
  FiClock,
  FiAlertTriangle,
  FiCheckSquare,
  FiSquare,
} from 'react-icons/fi';

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [players, setPlayers] = useState([]);
  // Bug C fix: fetch teams directly from /teams API so names are always
  // populated correctly, regardless of whether player.team is populated.
  const [teams, setTeams] = useState([]);
  const [summary, setSummary] = useState({
    totalCollected: 0,
    totalPending: 0,
    totalOverdue: 0,
    countPaid: 0,
    countPending: 0,
    countOverdue: 0,
    totalRecords: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [form, setForm] = useState({
    team: '',
    player: '',
    amount: '',
    type: 'monthly_fee',
    dueDate: '',
    description: '',
  });

  const [selectedPlayersForInvoice, setSelectedPlayersForInvoice] = useState([]);
  const [isBulkInvoiceMode, setIsBulkInvoiceMode] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const toast = useToast();

  const loadSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (form.team) params.append('team', form.team);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      const { data } = await api.get(`/payments/summary?${params.toString()}`);
      setSummary(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    try {
      const [paymentsRes, usersRes, teamsRes] = await Promise.all([
        api.get('/payments'),
        api.get('/users?all=true'),
        api.get('/teams?includeAll=true'),
      ]);
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
      const playerList = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.players || [];
      setPlayers(playerList.filter((u) => u.role === 'player'));
      const teamsList = Array.isArray(teamsRes.data) ? teamsRes.data : teamsRes.data?.teams || [];
      // Only show approved teams in the filter dropdown
      setTeams(teamsList.filter((t) => t.status === 'approved'));
      await loadSummary();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadSummary();
    }
  }, [searchQuery, statusFilter, form.team]);

  // Filter payments by search query & status (visible rows only)
  const visiblePayments = useMemo(() => {
    return payments.filter((p) => {
      const playerName = p.player?.name || '';
      const desc = p.description || '';
      const matchesSearch =
        playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        desc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

      if (form.team) {
        const pTeamId = p.player?.team?._id || p.player?.team;
        if (String(pTeamId) !== String(form.team)) return false;
      }

      return matchesSearch && matchesStatus;
    });
  }, [payments, searchQuery, statusFilter, form.team]);

  // Bulk Selection Hook for visible rows only
  const {
    selectedIds,
    isAllSelected,
    isSomeSelected,
    toggleSelectAll,
    toggleSelectItem,
    isSelected,
    clearSelection,
    selectedCount,
  } = useBulkSelect(visiblePayments);

  // teams is now fetched directly from /teams API — see loadData above.

  const availablePlayers = useMemo(() => {
    if (!form.team) return players;
    return players.filter((player) => {
      const teamId = typeof player.team === 'string' ? player.team : player.team?._id;
      return String(teamId) === String(form.team);
    });
  }, [form.team, players]);

  const handleToggleSelectAllPlayers = () => {
    if (selectedPlayersForInvoice.length === availablePlayers.length) {
      setSelectedPlayersForInvoice([]);
      setIsBulkInvoiceMode(false);
    } else {
      setSelectedPlayersForInvoice(availablePlayers.map((p) => p._id));
      setIsBulkInvoiceMode(true);
    }
  };

  const handleTogglePlayerChoice = (playerId) => {
    setSelectedPlayersForInvoice((prev) => {
      const exists = prev.includes(playerId);
      const updated = exists ? prev.filter((id) => id !== playerId) : [...prev, playerId];
      setIsBulkInvoiceMode(updated.length > 0);
      return updated;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'team') {
      setForm((prev) => ({ ...prev, team: value, player: '' }));
      setSelectedPlayersForInvoice([]);
      setIsBulkInvoiceMode(false);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount) return;

    setIsSubmitting(true);
    try {
      if (isBulkInvoiceMode || selectedPlayersForInvoice.length > 0) {
        const targetPlayerIds = selectedPlayersForInvoice.length > 0 ? selectedPlayersForInvoice : availablePlayers.map((p) => p._id);
        if (targetPlayerIds.length === 0) {
          toast?.addToast('No players available to issue invoices', 'error');
          setIsSubmitting(false);
          return;
        }

        const { data } = await api.post('/payments/bulk-create', {
          playerIds: targetPlayerIds,
          amount: form.amount,
          type: form.type,
          dueDate: form.dueDate,
          description: form.description,
        });

        toast?.addToast(data.message || `Issued invoices to ${targetPlayerIds.length} players!`, 'success');
        setSelectedPlayersForInvoice([]);
        setIsBulkInvoiceMode(false);
      } else {
        if (!form.player) {
          toast?.addToast('Please select a player or click Select All Players', 'error');
          setIsSubmitting(false);
          return;
        }
        await api.post('/payments', form);
        toast?.addToast('Payment invoice generated successfully!', 'success');
      }

      setForm({ team: '', player: '', amount: '', type: 'monthly_fee', dueDate: '', description: '' });
      await loadData();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Could not create payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const markPaid = async (paymentId) => {
    try {
      await api.patch(`/payments/${paymentId}/mark-paid`);
      toast?.addToast('Payment status updated to Paid!', 'success');
      await loadData();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Failed to update payment status', 'error');
    }
  };

  const handleExportPdf = async () => {
    setIsPdfExporting(true);
    try {
      const params = new URLSearchParams();
      if (form.team) params.append('team', form.team);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const response = await api.get(`/payments/export-pdf?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `KFC_Payment_Ledger_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast?.addToast('Downloaded PDF payment ledger successfully!', 'success');
    } catch (err) {
      toast?.addToast('Failed to generate PDF export', 'error');
    } finally {
      setIsPdfExporting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      let count = 0;
      const payload = { paymentIds: selectedIds };

      try {
        const res = await api.delete('/payments/bulk', { data: payload });
        count = res.data?.deletedCount || selectedIds.length;
      } catch (err1) {
        if (err1.response?.status === 404) {
          const results = await Promise.allSettled(
            selectedIds.map((id) => api.delete(`/payments/${id}`))
          );
          count = results.filter((r) => r.status === 'fulfilled').length;
        } else {
          throw err1;
        }
      }

      toast?.addToast(`${count} payment record${count > 1 ? 's' : ''} deleted`, 'success');
      clearSelection();
      await loadData();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Failed to delete selected payment records', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <Loading message="Loading payment ledger..." />;

  const isAllPlayersSelected =
    availablePlayers.length > 0 && selectedPlayersForInvoice.length === availablePlayers.length;

  return (
    <div className="space-y-8 relative pb-20">
      {/* Header */}
      <header className="glass-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-cyan-500/20 shadow-glow-cyan">
        <div>
          <span className="section-label">Club Financials</span>
          <h1 className="font-display text-3xl font-black text-white flex items-center gap-2">
            <FiCreditCard className="text-cyan-400" /> Payment Ledger
          </h1>
          <p className="text-xs text-slate-300">
            Generate player invoices, track monthly fees, mark payments as paid, and bulk export ledger reports.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportPdf}
          disabled={isPdfExporting}
          className="btn-primary text-xs py-2.5 px-4 font-bold gap-2 shrink-0 border-cyan-400/30"
        >
          <FiDownload size={14} className={isPdfExporting ? 'animate-bounce' : ''} />
          <span>{isPdfExporting ? 'Generating PDF...' : 'Download PDF Report'}</span>
        </button>
      </header>

      {/* Financial Summary Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Collected */}
        <div className="glass-card space-y-2 border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-400">
            <span>Total Collected</span>
            <FiCheckCircle size={16} />
          </div>
          <p className="font-display text-2xl font-black text-emerald-300">
            ₹{summary.totalCollected.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-400">
            {summary.countPaid} Paid Record{summary.countPaid === 1 ? '' : 's'}
          </p>
        </div>

        {/* Total Pending */}
        <div className="glass-card space-y-2 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-400">
            <span>Total Pending</span>
            <FiClock size={16} />
          </div>
          <p className="font-display text-2xl font-black text-amber-300">
            ₹{summary.totalPending.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-400">
            {summary.countPending} Pending Record{summary.countPending === 1 ? '' : 's'}
          </p>
        </div>

        {/* Overdue Invoices */}
        <div className="glass-card space-y-2 border-rose-500/30 bg-rose-500/5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rose-400">
            <span>Overdue Invoices</span>
            <FiAlertTriangle size={16} />
          </div>
          <p className="font-display text-2xl font-black text-rose-400">
            ₹{summary.totalOverdue.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-rose-300/80 font-semibold">
            {summary.countOverdue} Overdue Record{summary.countOverdue === 1 ? '' : 's'}
          </p>
        </div>

        {/* Total Records */}
        <div className="glass-card space-y-2 border-cyan-500/30 bg-cyan-500/5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-cyan-400">
            <span>Matching Records</span>
            <FiUsers size={16} />
          </div>
          <p className="font-display text-2xl font-black text-cyan-300">{summary.totalRecords}</p>
          <p className="text-xs text-slate-400">Total Filtered Invoices</p>
        </div>
      </div>

      {/* Issue Invoice Form */}
      <form onSubmit={handleSubmit} className="glass-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.06] pb-3">
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <FiPlus className="text-cyan-400" /> Issue Player Invoice
          </h2>

          {/* Bulk Selection Controls for Invoice Creation */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSelectAllPlayers}
              className={`btn-secondary text-xs py-1.5 px-3 gap-1.5 font-bold ${
                isAllPlayersSelected ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10' : ''
              }`}
            >
              {isAllPlayersSelected ? <FiCheckSquare className="text-cyan-400" /> : <FiSquare />}
              <span>
                {isAllPlayersSelected
                  ? 'Deselect All'
                  : `Select All Players ${form.team ? 'in Team' : 'in Club'} (${availablePlayers.length})`}
              </span>
            </button>
          </div>
        </div>

        {/* Selected Players Count Badge */}
        {selectedPlayersForInvoice.length > 0 && (
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 flex items-center justify-between text-xs">
            <span className="font-bold text-cyan-300 flex items-center gap-2">
              <FiUsers /> Creating bulk invoice for {selectedPlayersForInvoice.length} player(s)
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedPlayersForInvoice([]);
                setIsBulkInvoiceMode(false);
              }}
              className="text-slate-400 hover:text-white font-semibold underline text-[11px]"
            >
              Clear Bulk Selection
            </button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label-dark">Select Team Filter</label>
            <select name="team" value={form.team} onChange={handleChange} className="select-dark">
              <option value="">All Teams ({players.length} Players)</option>
              {teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-dark">
              Select Player {selectedPlayersForInvoice.length > 0 ? `(${selectedPlayersForInvoice.length} Selected)` : ''}
            </label>
            <select
              name="player"
              value={isBulkInvoiceMode ? 'ALL_PLAYERS' : form.player}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'ALL_PLAYERS') {
                  setSelectedPlayersForInvoice(availablePlayers.map((p) => p._id));
                  setIsBulkInvoiceMode(true);
                  setForm((prev) => ({ ...prev, player: 'ALL_PLAYERS' }));
                } else {
                  setSelectedPlayersForInvoice([]);
                  setIsBulkInvoiceMode(false);
                  setForm((prev) => ({ ...prev, player: val }));
                }
              }}
              className="select-dark font-semibold"
              required
            >
              <option value="">Choose Player</option>
              {availablePlayers.length > 0 && (
                <option value="ALL_PLAYERS" className="font-bold text-cyan-400 bg-slate-900">
                  ⚡ All Players {form.team ? 'in Team' : 'in Club'} ({availablePlayers.length} Players)
                </option>
              )}
              {availablePlayers.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.position || 'Player'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-dark">Amount (₹)</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="input-dark"
              placeholder="500"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label-dark">Payment Type</label>
            <select name="type" value={form.type} onChange={handleChange} className="select-dark">
              <option value="monthly_fee">Monthly Fee</option>
              <option value="session_fee">Session Fee</option>
              <option value="rent">Turf Rent</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="label-dark">Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              className="input-dark"
              required
            />
          </div>

          <div>
            <label className="label-dark">Description</label>
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              className="input-dark"
              placeholder="July Monthly Fee"
            />
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary py-2.5 px-5 text-xs font-bold gap-1.5">
          <FiPlus size={14} />
          <span>
            {isSubmitting
              ? 'Issuing...'
              : selectedPlayersForInvoice.length > 0
              ? `Issue Bulk Invoice (${selectedPlayersForInvoice.length} Players)`
              : 'Issue Invoice'}
          </span>
        </button>
      </form>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search by player or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-dark pl-9 text-xs py-2"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <FiFilter className="text-slate-400" size={14} />
          {['all', 'pending', 'paid'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                statusFilter === st
                  ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                  : 'border border-white/10 bg-slate-900/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Table */}
      <div className="glass-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="table-dark">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400">
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isSomeSelected;
                    }}
                    onChange={toggleSelectAll}
                    disabled={visiblePayments.length === 0}
                    className="h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-500 focus:ring-cyan-500/50 cursor-pointer"
                    title={isAllSelected ? 'Deselect all visible' : 'Select all visible'}
                  />
                </th>
                <th>Player</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visiblePayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                    No payment records found matching the active filters.
                  </td>
                </tr>
              ) : (
                visiblePayments.map((p) => {
                  const selected = isSelected(p._id);
                  const isOverdue = p.status === 'pending' && p.dueDate && new Date(p.dueDate) < new Date();

                  return (
                    <tr
                      key={p._id}
                      className={selected ? 'bg-cyan-500/10 border-cyan-500/30' : undefined}
                    >
                      <td className="w-10 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelectItem(p._id)}
                          className="h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-500 focus:ring-cyan-500/50 cursor-pointer"
                        />
                      </td>
                      <td className="font-bold text-white">
                        {p.player?.name || 'Player'}
                        {p.player?.team?.name && (
                          <span className="block text-[11px] font-normal text-slate-400">
                            {p.player.team.name}
                          </span>
                        )}
                      </td>
                      <td className="capitalize text-slate-300">{(p.type || 'fee').replace('_', ' ')}</td>
                      <td className="font-display font-bold text-cyan-300">₹{p.amount}</td>
                      <td className="text-xs text-slate-400">
                        {p.dueDate ? (
                          <span className={isOverdue ? 'text-rose-400 font-bold flex items-center gap-1' : ''}>
                            {isOverdue && <FiAlertTriangle size={12} />}
                            {new Date(p.dueDate).toLocaleDateString()}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <span className={p.status === 'paid' ? 'badge-emerald' : isOverdue ? 'badge-crimson' : 'badge-amber'}>
                          {p.status} {isOverdue ? '(Overdue)' : ''}
                        </span>
                      </td>
                      <td className="text-right">
                        {p.status !== 'paid' && (
                          <button
                            onClick={() => markPaid(p._id)}
                            className="btn-success text-xs py-1 px-2.5 gap-1"
                          >
                            <FiCheckCircle size={12} /> Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action Bar & Bulk Deletion Confirmation Modal */}
      <BulkDeleteActionBar
        selectedCount={selectedCount}
        onClearSelection={clearSelection}
        onConfirmDelete={handleBulkDelete}
        itemLabel="payment record"
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default AdminPaymentsPage;
