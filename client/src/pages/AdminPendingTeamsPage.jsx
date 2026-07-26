import { useEffect, useState } from 'react';
import api from '../services/api';
import Loading from '../components/Loading';
import { useToast } from '../components/ToastContainer';
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiUser,
  FiMail,
  FiGlobe,
  FiShield,
  FiMessageSquare,
} from 'react-icons/fi';

const AdminPendingTeamsPage = () => {
  const toast = useToast();
  const [pendingTeams, setPendingTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [leagues, setLeagues] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState('');

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const [pendingRes, leaguesRes] = await Promise.all([
        api.get('/teams/pending-requests'),
        api.get('/leagues'),
      ]);
      setPendingTeams(pendingRes.data);
      setLeagues(leaguesRes.data);
      if (leaguesRes.data.length > 0) {
        setSelectedLeagueId(leaguesRes.data[0]._id);
      }
    } catch (error) {
      console.error(error);
      toast?.addToast('Failed to load pending team requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const handleApprove = async (team) => {
    setActionLoading(true);
    try {
      await api.patch(`/teams/${team._id}/approve`, { leagueId: selectedLeagueId });
      toast?.addToast(`Team "${team.name}" approved and linked to league!`, 'success');
      setPendingTeams((prev) => prev.filter((item) => item._id !== team._id));
    } catch (err) {
      toast?.addToast(err.formattedMessage || err.response?.data?.message || 'Failed to approve team', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeam) return;

    setActionLoading(true);
    try {
      await api.patch(`/teams/${selectedTeam._id}/reject`, { reason: rejectionReason });
      toast?.addToast(`Team "${selectedTeam.name}" request rejected.`, 'info');
      setPendingTeams((prev) => prev.filter((item) => item._id !== selectedTeam._id));
      setSelectedTeam(null);
      setRejectionReason('');
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Failed to reject team', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loading message="Loading pending team applications..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-amber-500/20">
        <div>
          <span className="section-label">Admin Approval Center</span>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-white">Pending Team Requests</h1>
          <p className="text-xs text-slate-400">Review, approve, or reject new manager team registrations.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {leagues.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-bold shrink-0">Assign to League:</label>
              <select
                value={selectedLeagueId}
                onChange={(e) => setSelectedLeagueId(e.target.value)}
                className="select-dark py-1.5 px-3 text-xs font-semibold text-cyan-300"
              >
                {leagues.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name} ({l.season || 'Season'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2 text-amber-400 border border-amber-500/20 text-xs font-bold w-fit">
            <FiClock size={16} />
            <span>{pendingTeams.length} Pending Review</span>
          </div>
        </div>
      </div>

      {/* Requests List Grid */}
      {pendingTeams.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <FiCheckCircle size={40} className="mx-auto text-emerald-400 opacity-60" />
          <h3 className="font-display text-lg font-bold text-white">No Pending Team Applications</h3>
          <p className="text-xs text-slate-400">All manager team registrations have been processed.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {pendingTeams.map((team) => (
            <div
              key={team._id}
              className="glass-card space-y-5 border-l-4 transition-all duration-200 hover:border-cyan-500/40"
              style={{ borderLeftColor: team.color || '#00d2ff' }}
            >
              {/* Team Branding Header */}
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-3.5">
                  {team.logo ? (
                    <img
                      src={team.logo}
                      alt={team.name}
                      className="h-14 w-14 object-contain rounded-xl bg-slate-900 p-2 border border-white/10"
                    />
                  ) : (
                    <div
                      className="h-14 w-14 rounded-xl flex items-center justify-center font-display font-black text-xl text-slate-950 shadow-md"
                      style={{ backgroundColor: team.color }}
                    >
                      {team.name.charAt(0)}
                    </div>
                  )}

                  <div>
                    <h3 className="font-display text-lg font-bold text-white">{team.name}</h3>
                    {team.country && (
                      <p className="flex items-center gap-1 text-xs text-slate-400">
                        <FiGlobe size={12} /> {team.country}
                      </p>
                    )}
                  </div>
                </div>

                {/* Color Swatch */}
                <div className="flex items-center gap-2 rounded-xl bg-slate-900/80 px-3 py-1.5 border border-white/10">
                  <div
                    className="h-5 w-5 rounded-full border border-white/30"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="font-mono text-xs font-bold text-slate-300">{team.color}</span>
                </div>
              </div>

              {/* Manager Information */}
              <div className="grid gap-3 rounded-xl bg-slate-950/60 p-4 border border-white/5 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <FiUser className="text-cyan-400" size={14} />
                  <span className="text-slate-500">Manager:</span>
                  <span className="font-bold text-white">{team.managerName}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-300">
                  <FiMail className="text-cyan-400" size={14} />
                  <span className="text-slate-500">Email:</span>
                  <span className="font-bold text-slate-200">{team.managerEmail}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <FiClock size={12} />
                  <span>Submitted: {new Date(team.createdAt).toLocaleString()}</span>
                </div>

                {team.description && (
                  <div className="border-t border-white/5 pt-2 mt-1">
                    <span className="text-slate-500 text-[11px]">Description:</span>
                    <p className="text-slate-300 italic">{team.description}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleApprove(team)}
                  disabled={actionLoading}
                  className="flex-1 btn-success text-xs py-2.5 gap-1.5"
                >
                  <FiCheckCircle size={16} /> Approve Team
                </button>

                <button
                  onClick={() => setSelectedTeam(team)}
                  disabled={actionLoading}
                  className="flex-1 btn-danger text-xs py-2.5 gap-1.5"
                >
                  <FiXCircle size={16} /> Reject...
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-card max-w-md w-full space-y-5 border-rose-500/30 p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <FiMessageSquare size={18} />
                <span>Reject Application</span>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-300">
                Rejecting <strong className="text-white">{selectedTeam.name}</strong> (Manager:{' '}
                {selectedTeam.managerName}).
              </p>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="label-dark">Rejection Reason (Optional)</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="input-dark"
                  placeholder="State reason for rejection (e.g. invalid logo URL, duplicate team name...)"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTeam(null)}
                  className="flex-1 btn-secondary text-xs py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 btn-danger text-xs py-2.5 font-bold"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPendingTeamsPage;
