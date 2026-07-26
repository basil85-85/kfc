import { useEffect, useState } from 'react';
import api from '../services/api';
import Loading from '../components/Loading';
import { useToast } from '../components/ToastContainer';
import { FiCalendar, FiPlus, FiMapPin, FiUsers, FiEdit2, FiTrash2, FiAlertTriangle, FiX } from 'react-icons/fi';

const AdminSessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({
    name: '',
    date: '',
    venue: '',
    fee: 0,
    maxPlayers: 22,
    type: 'Training',
  });
  const [editingSession, setEditingSession] = useState(null);
  const [deletingSession, setDeletingSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const loadSessions = async () => {
    try {
      const { data } = await api.get('/sessions');
      setSessions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingSession) {
        await api.put(`/sessions/${editingSession._id}`, form);
        toast?.addToast('Session updated successfully!', 'success');
        setEditingSession(null);
      } else {
        await api.post('/sessions', form);
        toast?.addToast('Session created successfully!', 'success');
      }
      setForm({ name: '', date: '', venue: '', fee: 0, maxPlayers: 22, type: 'Training' });
      loadSessions();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Could not save session', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (session) => {
    setEditingSession(session);
    setForm({
      name: session.name || '',
      date: session.date ? new Date(session.date).toISOString().slice(0, 16) : '',
      venue: session.venue || '',
      fee: session.fee || 0,
      maxPlayers: session.maxPlayers || 22,
      type: session.type || 'Training',
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSession) return;
    try {
      await api.delete(`/sessions/${deletingSession._id}`);
      toast?.addToast('Session deleted successfully', 'success');
      setDeletingSession(null);
      loadSessions();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Could not delete session', 'error');
    }
  };

  if (loading) return <Loading message="Loading sessions..." />;

  return (
    <div className="space-y-8">
      <header className="glass-card">
        <span className="section-label">Club Training & Events</span>
        <h1 className="font-display text-3xl font-black text-white">Session Management</h1>
        <p className="text-xs text-slate-300">Schedule training sessions, friendly games, and track player registrations.</p>
      </header>

      {/* Create / Edit Session Form */}
      <form onSubmit={handleSubmit} className="glass-card space-y-4 border-cyan-500/30">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <FiPlus className="text-cyan-400" />
            <span>{editingSession ? `Editing Session: ${editingSession.name}` : 'Create New Session'}</span>
          </h2>
          {editingSession && (
            <button
              type="button"
              onClick={() => {
                setEditingSession(null);
                setForm({ name: '', date: '', venue: '', fee: 0, maxPlayers: 22, type: 'Training' });
              }}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1"
            >
              <FiX size={14} /> Cancel Editing
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-dark">Session Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input-dark"
              placeholder="Midweek Tactical Training"
              required
            />
          </div>

          <div>
            <label className="label-dark">Date & Time</label>
            <input
              type="datetime-local"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="input-dark"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label-dark">Venue</label>
            <input
              name="venue"
              value={form.venue}
              onChange={handleChange}
              className="input-dark"
              placeholder="Main Pitch Ground"
              required
            />
          </div>

          <div>
            <label className="label-dark">Session Fee (₹)</label>
            <input
              type="number"
              name="fee"
              value={form.fee}
              onChange={handleChange}
              className="input-dark"
              min="0"
            />
          </div>

          <div>
            <label className="label-dark">Type</label>
            <select name="type" value={form.type} onChange={handleChange} className="select-dark">
              <option value="Training">Training</option>
              <option value="Friendly">Friendly Match</option>
              <option value="Tournament">Tournament</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="btn-primary py-2.5 px-5 text-xs font-bold gap-1.5">
            <FiPlus size={14} />
            <span>{isSubmitting ? 'Saving...' : editingSession ? 'Update Session' : 'Create Session'}</span>
          </button>
        </div>
      </form>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.map((s) => (
          <div key={s._id} className="glass-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:border-cyan-500/30 transition">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="badge-teal">{s.type || 'Training'}</span>
                <span className="text-xs font-bold text-cyan-400">
                  {new Date(s.date).toLocaleString()}
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-white">{s.name}</h3>
              <p className="text-xs text-slate-400">
                <FiMapPin className="inline mr-1" /> {s.venue} • Fee: ₹{s.fee}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="badge-slate">
                <FiUsers size={12} /> {s.registrations?.length || 0} Registered
              </span>

              <button
                onClick={() => handleEditClick(s)}
                className="rounded-xl border border-white/10 bg-slate-900 p-2 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition"
                title="Edit Session"
              >
                <FiEdit2 size={16} />
              </button>

              <button
                onClick={() => setDeletingSession(s)}
                className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20 transition"
                title="Delete Session"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal with Registered Players Warning */}
      {deletingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="glass-card w-full max-w-md border-rose-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 border-b border-rose-500/20 pb-3">
              <FiAlertTriangle size={24} className="shrink-0" />
              <h3 className="font-display text-lg font-bold text-white">Delete Session Confirmation</h3>
            </div>

            <p className="text-sm text-slate-300">
              Are you sure you want to delete session <strong className="text-white">"{deletingSession.name}"</strong> scheduled for{' '}
              <span className="text-cyan-300">{new Date(deletingSession.date).toLocaleString()}</span>?
            </p>

            {deletingSession.registrations?.length > 0 && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/50 p-3 text-xs text-rose-300 font-semibold space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-rose-400">
                  <FiAlertTriangle size={14} /> Warning: Registered Players Impacted
                </p>
                <p>
                  <strong>{deletingSession.registrations.length} players</strong> are currently registered for this session. Deleting will erase their registration records.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setDeletingSession(null)} className="btn-secondary text-xs py-2 px-4">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} className="btn-danger text-xs py-2 px-4 font-bold">
                Yes, Delete Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSessionsPage;
