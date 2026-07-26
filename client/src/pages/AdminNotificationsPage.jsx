import { useEffect, useState } from 'react';
import api from '../services/api';
import Loading from '../components/Loading';
import { useToast } from '../components/ToastContainer';
import { FiBell, FiSend, FiTrash2 } from 'react-icons/fi';

const AdminNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', audience: 'all', type: 'info' });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  const loadNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.body) return;
    setIsSubmitting(true);
    try {
      await api.post('/notifications', form);
      toast?.addToast('Notification broadcast sent!', 'success');
      setForm({ title: '', body: '', audience: 'all', type: 'info' });
      loadNotifications();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Could not send notification', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNotification = async (id, title) => {
    if (!window.confirm(`Delete notification "${title}"?`)) return;
    try {
      await api.delete(`/notifications/${id}`);
      toast?.addToast('Notification deleted', 'info');
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Failed to delete notification', 'error');
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (!window.confirm(`⚠️ Permanently delete ALL ${notifications.length} notification broadcasts? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      const { data } = await api.delete('/notifications/delete-all');
      toast?.addToast(data.message || 'All notifications deleted', 'success');
      setNotifications([]);
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Failed to delete notifications', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <Loading message="Loading notifications..." />;

  return (
    <div className="space-y-8">
      <header className="glass-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-cyan-500/20 shadow-glow-cyan">
        <div>
          <span className="section-label">Broadcast Center</span>
          <h1 className="font-display text-3xl font-black text-white flex items-center gap-2">
            <FiBell className="text-cyan-400" /> Club Notifications
          </h1>
          <p className="text-xs text-slate-300">Broadcast match alerts, session updates, and club announcements to players.</p>
        </div>

        {notifications.length > 0 && (
          <button
            type="button"
            onClick={handleDeleteAllNotifications}
            disabled={isDeleting}
            className="btn-secondary text-xs py-2 px-4 font-bold text-rose-400 border-rose-500/40 hover:bg-rose-500/10 gap-1.5 shrink-0"
          >
            <FiTrash2 size={14} />
            <span>{isDeleting ? 'Deleting...' : 'Delete All Notifications'}</span>
          </button>
        )}
      </header>

      {/* Broadcast Form */}
      <form onSubmit={handleSubmit} className="glass-card space-y-4">
        <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
          <FiSend className="text-cyan-400" /> Send Broadcast Message
        </h2>

        <div>
          <label className="label-dark">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="input-dark"
            placeholder="Matchday Squad Announcement"
            required
          />
        </div>

        <div>
          <label className="label-dark">Message Body</label>
          <textarea
            name="body"
            value={form.body}
            onChange={handleChange}
            className="input-dark min-h-[100px]"
            placeholder="Squad lineup is finalized for tomorrow's 4:00 PM kickoff..."
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-dark">Audience Target</label>
            <select name="audience" value={form.audience} onChange={handleChange} className="select-dark">
              <option value="all">All Members</option>
              <option value="players">Players Only</option>
            </select>
          </div>

          <div>
            <label className="label-dark">Notification Type</label>
            <select name="type" value={form.type} onChange={handleChange} className="select-dark">
              <option value="info">General Info</option>
              <option value="alert">Important Alert</option>
              <option value="match">Match Update</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary py-2.5 px-5 text-xs font-bold gap-1.5">
          <FiSend size={14} />
          <span>{isSubmitting ? 'Broadcasting...' : 'Send Broadcast'}</span>
        </button>
      </form>

      {/* Broadcast History */}
      <div className="space-y-3">
        <h2 className="font-display text-base font-bold text-white">Broadcast History ({notifications.length})</h2>
        {notifications.length === 0 ? (
          <div className="glass-card text-center py-8 text-xs text-slate-500">
            No notification broadcasts sent yet.
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n._id} className="glass-card space-y-2 relative group border-white/10 hover:border-cyan-500/30 transition">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 pr-8">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-bold text-white">{n.title}</h3>
                    <span className="badge-cyan text-[10px]">{n.type || 'info'}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{n.body}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteNotification(n._id, n.title)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
                  title="Delete Notification"
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
              <p className="text-[10px] text-slate-500">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
