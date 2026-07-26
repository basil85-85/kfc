import { useContext } from 'react';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  FiBell,
  FiCheck,
  FiAlertTriangle,
  FiCalendar,
  FiCreditCard,
  FiInfo,
  FiActivity,
  FiCheckCircle,
} from 'react-icons/fi';

const getTypeIcon = (type) => {
  switch (type) {
    case 'alert':
      return <FiAlertTriangle className="text-rose-400" size={16} />;
    case 'match':
      return <FiCalendar className="text-cyan-400" size={16} />;
    case 'payment':
      return <FiCreditCard className="text-emerald-400" size={16} />;
    case 'session':
      return <FiActivity className="text-amber-400" size={16} />;
    default:
      return <FiInfo className="text-purple-400" size={16} />;
  }
};

const getTypeBadgeClass = (type) => {
  switch (type) {
    case 'alert':
      return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
    case 'match':
      return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';
    case 'payment':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
    case 'session':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
    default:
      return 'border-purple-500/30 bg-purple-500/10 text-purple-300';
  }
};

const NotificationsPage = () => {
  const { notifications, unreadCount, markRead } = useContext(NotificationContext);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <header className="glass-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-cyan-500/20 shadow-glow-cyan">
        <div>
          <span className="section-label">Club Broadcasts</span>
          <h1 className="font-display text-3xl font-black text-white flex items-center gap-2">
            <FiBell className="text-cyan-400 animate-pulse" /> Notifications
          </h1>
          <p className="text-xs text-slate-300">All announcements, match alerts, and club notifications in one place.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 ? (
            <span className="rounded-xl border border-cyan-400/40 bg-cyan-500/20 px-3.5 py-1.5 text-xs font-bold text-cyan-300 shadow-glow-cyan flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              {unreadCount} Unread Message{unreadCount === 1 ? '' : 's'}
            </span>
          ) : (
            <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <FiCheckCircle size={14} /> All Caught Up
            </span>
          )}
        </div>
      </header>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((n) => {
          const isUnread = !n.isRead;
          const isImportantAlert = n.type === 'alert';

          return (
            <div
              key={n._id}
              className={`glass-card-hover p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 transition-all duration-300 border ${
                isImportantAlert
                  ? 'border-rose-500/60 bg-rose-950/40 shadow-[0_0_25px_rgba(244,63,94,0.25)]'
                  : isUnread
                  ? 'border-cyan-500/40 bg-slate-900/90 shadow-glow-cyan'
                  : 'border-white/[0.08] bg-slate-950/60 opacity-90'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`rounded-2xl p-3 border shrink-0 mt-0.5 shadow-md ${
                    isImportantAlert
                      ? 'bg-rose-900/40 border-rose-500/50 animate-pulse'
                      : 'bg-slate-900 border-white/10'
                  }`}
                >
                  {getTypeIcon(n.type)}
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`font-display text-base font-bold ${
                        isImportantAlert ? 'text-rose-200' : 'text-white'
                      }`}
                    >
                      {n.title}
                    </h3>
                    {isUnread && (
                      <span
                        className={`h-2 w-2 rounded-full animate-pulse ${
                          isImportantAlert
                            ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]'
                            : 'bg-cyan-400 shadow-glow-cyan'
                        }`}
                      />
                    )}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getTypeBadgeClass(
                        n.type
                      )}`}
                    >
                      {isImportantAlert ? '🔴 IMPORTANT ALERT' : n.type || 'info'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-normal">{n.body}</p>

                  <p className="text-[11px] font-mono text-slate-500 pt-1">
                    {new Date(n.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {' at '}
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {isUnread && (
                <button
                  onClick={() => markRead(n._id)}
                  className={`btn-secondary text-xs py-1.5 px-3.5 font-bold gap-1.5 self-start sm:self-center shrink-0 ${
                    isImportantAlert
                      ? 'border-rose-500/50 text-rose-300 hover:bg-rose-500/20'
                      : 'border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10'
                  }`}
                >
                  <FiCheck size={14} /> Mark Read
                </button>
              )}
            </div>
          );
        })}

        {notifications.length === 0 && (
          <div className="glass-card p-12 text-center space-y-3">
            <div className="h-16 w-16 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center mx-auto text-slate-500 shadow-lg">
              <FiBell size={28} className="text-cyan-400" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">No Notifications Available</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You're completely up to date. Match announcements and club notices will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
