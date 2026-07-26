import { useContext, useEffect, useState } from 'react';
import api from '../services/api';
import Loading from '../components/Loading';
import { AuthContext } from '../contexts/AuthContext';
import { useToast } from '../components/ToastContainer';
import { FiCalendar, FiMapPin, FiCheckCircle, FiPlusCircle } from 'react-icons/fi';

const SessionsPage = () => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const registerSession = async (sessionId) => {
    try {
      await api.post(`/sessions/${sessionId}/register`);
      toast?.addToast('Registered for session successfully!', 'success');
      loadSessions();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Could not register for session', 'error');
    }
  };

  if (loading) return <Loading message="Loading club sessions..." />;

  return (
    <div className="space-y-8">
      <header className="glass-card">
        <span className="section-label">Training & Events</span>
        <h1 className="font-display text-3xl font-black text-white">Club Sessions</h1>
        <p className="text-xs text-slate-300">
          View upcoming training sessions, friendly games, and register your attendance.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => {
          const isRegistered = session.registrations?.some((id) => String(id) === String(user?._id));

          return (
            <div key={session._id} className="glass-card-hover space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                  <span className="badge-cyan">{session.type || 'Training'}</span>
                  <span className="text-xs font-bold text-slate-400">
                    Fee: {session.fee ? `₹${session.fee}` : 'Free'}
                  </span>
                </div>

                <h3 className="font-display text-lg font-bold text-white">{session.name}</h3>

                <div className="space-y-1 text-xs text-slate-300">
                  <p className="flex items-center gap-1.5">
                    <FiCalendar className="text-cyan-400" />
                    {new Date(session.date).toLocaleString()}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <FiMapPin className="text-teal-400" />
                    {session.venue}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                {isRegistered ? (
                  <div className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-300">
                    <FiCheckCircle size={14} />
                    <span>Registered</span>
                  </div>
                ) : (
                  <button
                    onClick={() => registerSession(session._id)}
                    className="w-full btn-primary py-2.5 text-xs font-bold gap-1.5"
                  >
                    <FiPlusCircle size={14} />
                    <span>Register for Session</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {sessions.length === 0 && (
          <div className="glass-card p-12 text-center text-slate-500 col-span-3">
            <p className="font-display text-base font-bold text-white">No active sessions scheduled.</p>
            <p className="mt-1 text-xs">Check back soon for new training schedules!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsPage;
