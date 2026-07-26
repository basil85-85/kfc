import { useEffect, useState } from 'react';
import api from '../services/api';
import Loading from '../components/Loading';
import { useToast } from '../components/ToastContainer';
import {
  FiAward, FiPlus, FiCalendar, FiTrash2,
  FiCheckCircle, FiXCircle, FiClock, FiUsers, FiRefreshCw,
} from 'react-icons/fi';

const AdminLeaguesPage = () => {
  const [leagues,             setLeagues]             = useState([]);
  const [joinRequests,        setJoinRequests]        = useState([]);
  const [form,                setForm]                = useState({ name: '', season: '', startDate: '', endDate: '' });
  const [loading,             setLoading]             = useState(true);
  const [isSubmitting,        setIsSubmitting]        = useState(false);
  const [finalizingLeagueId,  setFinalizingLeagueId]  = useState(null);
  const [rejectingReqId,      setRejectingReqId]      = useState(null);
  const [rejectReason,        setRejectReason]        = useState('');
  const [processingReqId,     setProcessingReqId]     = useState(null);
  const toast = useToast();

  const loadLeagues = async () => {
    try {
      const { data } = await api.get('/leagues');
      setLeagues(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadJoinRequests = async () => {
    try {
      const { data } = await api.get('/leagues/join-requests');
      setJoinRequests(data);
    } catch (err) {
      console.error('Could not load join requests:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadLeagues(), loadJoinRequests()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/leagues', form);
      toast?.addToast('League season created!', 'success');
      setForm({ name: '', season: '', startDate: '', endDate: '' });
      loadLeagues();
    } catch (err) {
      toast?.addToast(err.formattedMessage || err.response?.data?.message || 'Could not create league', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalizeLeaguePhase = async (leagueId) => {
    setFinalizingLeagueId(leagueId);
    try {
      const { data } = await api.post(`/leagues/${leagueId}/finalize-phase`);
      toast?.addToast(data.message || 'League phase finalized!', 'success');
      loadLeagues();
    } catch (err) {
      toast?.addToast(err.formattedMessage || err.response?.data?.message || 'Could not finalize league phase', 'error');
    } finally {
      setFinalizingLeagueId(null);
    }
  };

  const handleDeleteLeague = async (league) => {
    if (!window.confirm(`Delete league "${league.name}" (${league.season})? This will delete all associated fixtures and unlink teams.`)) return;
    setLoading(true);
    try {
      const { data } = await api.delete(`/leagues/${league._id}`);
      toast?.addToast(data.message || `League "${league.name}" deleted!`, 'success');
      await loadLeagues();
    } catch (err) {
      toast?.addToast(err.formattedMessage || err.response?.data?.message || 'Failed to delete league', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllLeagues = async () => {
    if (!window.confirm(`⚠️ CAUTION: Are you sure you want to delete ALL ${leagues.length} leagues and all associated fixtures? This action is permanent!`)) return;
    setLoading(true);
    try {
      const { data } = await api.delete('/leagues/all');
      toast?.addToast(data.message || 'All leagues deleted successfully!', 'success');
      await loadLeagues();
    } catch (err) {
      toast?.addToast(err.formattedMessage || err.response?.data?.message || 'Failed to delete leagues', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reqId) => {
    setProcessingReqId(reqId);
    try {
      const { data } = await api.put(`/leagues/join-requests/${reqId}/approve`);
      toast?.addToast(data.message || 'Request approved!', 'success');
      await Promise.all([loadJoinRequests(), loadLeagues()]);
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Approval failed', 'error');
    } finally {
      setProcessingReqId(null);
    }
  };

  const handleRejectSubmit = async (reqId) => {
    setProcessingReqId(reqId);
    try {
      const { data } = await api.put(`/leagues/join-requests/${reqId}/reject`, {
        rejectionReason: rejectReason,
      });
      toast?.addToast(data.message || 'Request rejected.', 'success');
      setRejectingReqId(null);
      setRejectReason('');
      await loadJoinRequests();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Rejection failed', 'error');
    } finally {
      setProcessingReqId(null);
    }
  };

  const pendingCount = joinRequests.filter((r) => r.status === 'pending').length;

  if (loading) return <Loading message="Loading leagues..." />;

  return (
    <div className="space-y-8">

      {/* Header */}
      <header className="glass-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="section-label">Competition Setup</span>
          <h1 className="font-display text-3xl font-black text-white">League Management</h1>
          <p className="text-xs text-slate-300">Create league competitions, define season dates, and manage active tournaments.</p>
        </div>
        {leagues.length > 0 && (
          <button
            type="button"
            onClick={handleDeleteAllLeagues}
            className="btn-secondary text-xs py-2 px-4 font-bold text-rose-400 border-rose-500/40 hover:bg-rose-500/10 gap-1.5 w-fit shrink-0"
          >
            <FiTrash2 size={14} /> Delete All Leagues
          </button>
        )}
      </header>

      {/* Create League Form */}
      <form onSubmit={handleSubmit} className="glass-card space-y-4">
        <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
          <FiPlus className="text-cyan-400" /> Create League Competition
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-dark">League Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="input-dark" placeholder="KFC Premier League" required />
          </div>
          <div>
            <label className="label-dark">Season Identifier</label>
            <input name="season" value={form.season} onChange={handleChange} className="input-dark" placeholder="2025-26" required />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-dark">Start Date</label>
            <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="input-dark" required />
          </div>
          <div>
            <label className="label-dark">End Date</label>
            <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className="input-dark" required />
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary py-2.5 px-5 text-xs font-bold gap-1.5">
          <FiPlus size={14} />
          <span>{isSubmitting ? 'Creating...' : 'Create Competition'}</span>
        </button>
      </form>

      {/* ─── League Join Requests ─────────────────────────────── */}
      <div className="glass-card space-y-4 border-violet-500/20">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-3">
            <FiUsers className="text-violet-400" size={18} />
            <h2 className="font-display text-lg font-bold text-white">League Join Requests</h2>
            {pendingCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-500 px-1.5 text-[10px] font-black text-white">
                {pendingCount}
              </span>
            )}
          </div>
          <button
            onClick={loadJoinRequests}
            className="btn-secondary p-2 text-slate-400"
            title="Refresh"
          >
            <FiRefreshCw size={14} />
          </button>
        </div>

        {joinRequests.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">No join requests yet</div>
        ) : (
          <div className="space-y-3">
            {joinRequests.map((req) => (
              <div
                key={req._id}
                className={`rounded-2xl border p-4 text-xs space-y-3 transition-all
                  ${req.status === 'pending'
                    ? 'border-amber-500/25 bg-amber-500/5'
                    : req.status === 'approved'
                      ? 'border-emerald-500/15 bg-emerald-500/5 opacity-70'
                      : 'border-rose-500/15 bg-rose-500/5 opacity-60'
                  }`}
              >
                {/* Request header row */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    {/* Team logo / color */}
                    {req.team?.logo ? (
                      <img src={req.team.logo} alt="" className="h-9 w-9 rounded-xl object-contain bg-slate-950 p-1 border border-white/10" />
                    ) : (
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center font-display font-black text-slate-950"
                        style={{ backgroundColor: req.team?.color || '#00d2ff' }}
                      >
                        {req.team?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-white">{req.team?.name || 'Unknown Team'}</div>
                      <div className="text-slate-500">
                        Requesting: <span className="text-cyan-300 font-semibold">{req.league?.name} ({req.league?.season})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status badge */}
                    {req.status === 'pending' && (
                      <span className="flex items-center gap-1 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 font-bold text-amber-300">
                        <FiClock size={10} /> Pending
                      </span>
                    )}
                    {req.status === 'approved' && (
                      <span className="flex items-center gap-1 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-300">
                        <FiCheckCircle size={10} /> Approved
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="flex items-center gap-1 rounded-lg border border-rose-500/25 bg-rose-500/10 px-2 py-0.5 font-bold text-rose-300">
                        <FiXCircle size={10} /> Rejected
                      </span>
                    )}

                    {/* Action buttons — pending only */}
                    {req.status === 'pending' && rejectingReqId !== req._id && (
                      <>
                        <button
                          onClick={() => handleApprove(req._id)}
                          disabled={processingReqId === req._id}
                          className="btn-primary flex items-center gap-1.5 py-1.5 px-3 text-[11px] font-bold bg-emerald-600 border-emerald-500 hover:bg-emerald-500"
                        >
                          <FiCheckCircle size={11} />
                          {processingReqId === req._id ? 'Approving…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => { setRejectingReqId(req._id); setRejectReason(''); }}
                          className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-[11px] font-bold text-rose-300 border-rose-500/30 hover:bg-rose-500/10"
                        >
                          <FiXCircle size={11} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-4 text-slate-500">
                  <span>Manager: <span className="text-slate-300">{req.requestedBy?.name || req.team?.managerEmail || '—'}</span></span>
                  <span>Requested: <span className="text-slate-300">{new Date(req.requestedAt).toLocaleDateString()}</span></span>
                  {req.respondedAt && (
                    <span>
                      Responded: <span className="text-slate-300">{new Date(req.respondedAt).toLocaleDateString()}</span>
                      {req.respondedBy?.name && <span className="text-slate-400"> by {req.respondedBy.name}</span>}
                    </span>
                  )}
                  {req.rejectionReason && (
                    <span className="text-rose-400">Reason: "{req.rejectionReason}"</span>
                  )}
                </div>

                {/* Inline rejection reason form */}
                {rejectingReqId === req._id && (
                  <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-3 space-y-2">
                    <label className="text-[11px] font-bold text-rose-300">Rejection reason (optional)</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={2}
                      placeholder="e.g. League is full, season has already started…"
                      className="input-dark w-full text-xs resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRejectSubmit(req._id)}
                        disabled={processingReqId === req._id}
                        className="btn-primary flex items-center gap-1.5 py-1.5 px-3 text-[11px] font-bold bg-rose-600 border-rose-500 hover:bg-rose-500"
                      >
                        <FiXCircle size={11} />
                        {processingReqId === req._id ? 'Rejecting…' : 'Confirm Reject'}
                      </button>
                      <button
                        onClick={() => { setRejectingReqId(null); setRejectReason(''); }}
                        className="btn-secondary py-1.5 px-3 text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leagues List */}
      <div className="grid gap-4 sm:grid-cols-2">
        {leagues.map((league) => (
          <div key={league._id} className="glass-card space-y-3 border-amber-500/20">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <FiAward className="text-amber-400" size={18} />
                <h3 className="font-display text-lg font-bold text-white">{league.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge-gold">{league.season}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteLeague(league)}
                  className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/20 transition border border-rose-500/30"
                  title="Delete League"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <FiCalendar className="text-cyan-400" size={12} />
                {new Date(league.startDate).toLocaleDateString()} — {new Date(league.endDate).toLocaleDateString()}
              </span>
              <span className="badge-emerald">{league.active ? 'Active' : 'Ended'}</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3 text-[11px]">
              <div className="flex flex-wrap gap-2">
                <span className="badge-cyan">Stage: {league.stage || 'LEAGUE'}</span>
                <span className="badge-slate">Qualified: {league.qualifiedTeams?.length || 0}</span>
              </div>

              {league.stage === 'LEAGUE' && (
                <button
                  onClick={() => handleFinalizeLeaguePhase(league._id)}
                  disabled={finalizingLeagueId === league._id}
                  className="btn-primary py-2 px-3 text-[10px] font-bold"
                >
                  {finalizingLeagueId === league._id ? 'Finalizing...' : 'Finalize League Phase & Generate Semifinals'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default AdminLeaguesPage;
