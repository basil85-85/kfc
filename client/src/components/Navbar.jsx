import { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { NotificationContext } from '../contexts/NotificationContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { ChatContext } from '../contexts/ChatContext';
import { FiBell, FiMenu, FiX, FiUser, FiLogOut, FiShield, FiPlusCircle, FiMessageSquare } from 'react-icons/fi';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Squad', to: '/squad' },
  { label: 'Fixtures', to: '/fixtures' },
  { label: 'Standings', to: '/standings' },
  { label: 'Leaderboard', to: '/leaderboard' },
  { label: 'Gallery', to: '/gallery' },
];

const Navbar = ({ admin }) => {
  const { user, logout } = useContext(AuthContext);
  const { unreadCount, notifications } = useContext(NotificationContext);
  const { theme } = useContext(ThemeContext);
  const { totalUnread: chatUnread, toggleChat } = useContext(ChatContext);
  const [open, setOpen] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-slate-950/80 shadow-2xl backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-4 group py-1 shrink-0">
          {theme.logoURL ? (
            <img
              src={theme.logoURL}
              alt="KFC Logo"
              className="h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 shrink-0 object-contain filter drop-shadow-[0_0_15px_var(--color-accent,#FF6B1A)] transition-all duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl font-display font-black text-slate-950 text-sm sm:text-xl lg:text-2xl transition-all duration-300 group-hover:scale-105 shadow-xl"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent, #FF6B1A), #FF9E00)',
                boxShadow: '0 0 20px color-mix(in srgb, var(--color-accent, #FF6B1A) 50%, transparent)',
              }}
            >
              KFC
            </div>
          )}
          <div className="flex flex-col justify-center">
            <span className="font-display text-base sm:text-2xl lg:text-3xl font-black tracking-tight text-white group-hover:text-[var(--color-accent,#FF6B1A)] transition-colors leading-tight">
              {theme.heroText || 'KFC'}
            </span>
            <span className="text-[var(--color-accent,#FF6B1A)] font-extrabold text-[9px] sm:text-xs lg:text-sm tracking-wider uppercase leading-none mt-0.5">
              Kolothum Kadhavu FC
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden items-center gap-1 md:flex">
          {!admin &&
            navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-glow-cyan'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

          {/* User Team Status Link */}
          {user && !admin && (
            <NavLink
              to={user.role === 'manager' ? '/dashboard/register-team' : '/register/team'}
              className={({ isActive }) =>
                `relative rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-glow-gold'
                    : 'text-amber-400 hover:bg-slate-900 hover:text-amber-300'
                }`
              }
            >
              <FiPlusCircle size={14} />
              <span>{user.team ? 'My Team' : 'Register Team'}</span>
            </NavLink>
          )}

            {/* User Auth Buttons */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(user.role === 'admin' ? '/admin' : '/dashboard')}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:border-cyan-500/40 hover:bg-slate-800"
                    style={{
                      borderColor: user.team?.color ? `${user.team.color}40` : undefined,
                    }}
                  >
                    {/* Approved Team Badge */}
                    {user.team && user.team.logo ? (
                      <img
                        src={user.team.logo}
                        alt={user.team.name}
                        className="h-5 w-5 object-contain rounded-full bg-slate-950 p-0.5 border border-white/20"
                        title={`Team: ${user.team.name}`}
                      />
                    ) : user.team && user.team.color ? (
                      <div
                        className="h-4 w-4 rounded-full border border-white/30 shrink-0"
                        style={{ backgroundColor: user.team.color }}
                        title={`Team Accent Color: ${user.team.name || 'Team'}`}
                      />
                    ) : user.role === 'admin' ? (
                      <FiShield className="text-amber-400" />
                    ) : (
                      <FiUser className="text-cyan-400" />
                    )}
                    <span>{user.name}</span>
                  </button>
                  <button
                    onClick={logout}
                    className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400 transition hover:bg-rose-500/20"
                    title="Logout"
                  >
                    <FiLogOut size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {!admin && (
                    <Link to="/login" className="btn-secondary text-xs py-2 px-4">
                      Log in
                    </Link>
                  )}
                  {!admin && (
                    <Link to="/register" className="btn-primary text-xs py-2 px-4">
                      Register
                    </Link>
                  )}
                  {admin && (
                    <Link to="/admin/login" className="btn-secondary text-xs py-2 px-4">
                      Admin login
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Header Actions (Chat & Notification Bell - Always Visible on Mobile & Desktop) */}
          <div className="flex items-center gap-2">
            {/* Real-Time Chat Drawer Toggle Button */}
            {user && (
              <button
                onClick={toggleChat}
                className="relative rounded-xl border border-white/10 bg-slate-900 p-2 text-slate-300 transition hover:border-cyan-500/40 hover:bg-slate-800"
                title="Club Real-Time Chat"
              >
                <FiMessageSquare size={18} />
                {chatUnread > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-slate-950 shadow-glow-cyan animate-pulse">
                    {chatUnread}
                  </span>
                )}
              </button>
            )}

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown((prev) => !prev)}
                className="relative rounded-xl border border-white/10 bg-slate-900 p-2 text-slate-300 transition hover:border-cyan-500/40 hover:bg-slate-800"
                title="Notifications"
              >
                <FiBell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-glow-crimson animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Quick Preview Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl animate-slide-up z-50">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Notifications</span>
                    <span className="text-[10px] font-bold text-cyan-400">{unreadCount} unread</span>
                  </div>
                  <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                    {notifications.slice(0, 3).map((n) => (
                      <div
                        key={n._id}
                        className={`rounded-xl border p-2.5 text-xs transition ${
                          n.type === 'alert'
                            ? 'border-rose-500/50 bg-rose-950/50 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                            : 'border-white/[0.06] bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <p className={`font-bold ${n.type === 'alert' ? 'text-rose-300 flex items-center gap-1.5' : 'text-white'}`}>
                            {n.type === 'alert' && <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping shrink-0" />}
                            <span>{n.title}</span>
                          </p>
                          {n.type === 'alert' && (
                            <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">ALERT</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-slate-300 line-clamp-2">{n.body}</p>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <p className="py-4 text-center text-xs text-slate-500">No new notifications</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowNotifDropdown(false);
                      navigate(user?.role === 'admin' ? '/admin/notifications' : '/dashboard/notifications');
                    }}
                    className="mt-3 w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2 text-center text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition shadow-glow-cyan"
                  >
                    View All Notifications
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              className="inline-flex items-center rounded-xl border border-white/10 bg-slate-900 p-2.5 text-slate-300 transition hover:bg-slate-800 md:hidden"
              onClick={() => setOpen((prev) => !prev)}
            >
              {open ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="border-t border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur-2xl md:hidden animate-slide-up">
          {!admin && (
            <div className="space-y-1.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      isActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-300 hover:bg-slate-900'
                    }`
                  }
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}

              {user && (
                <NavLink
                  to={user.role === 'manager' ? '/dashboard/register-team' : '/register/team'}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-2.5 text-sm font-semibold transition flex items-center gap-2 ${
                      isActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-amber-400 hover:bg-slate-900'
                    }`
                  }
                  onClick={() => setOpen(false)}
                >
                  <FiPlusCircle size={16} />
                  <span>{user.team ? 'My Team' : 'Register Team'}</span>
                </NavLink>
              )}
            </div>
          )}

          <div className="mt-4 border-t border-white/10 pt-4">
            {user ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate(user.role === 'admin' ? '/admin' : '/dashboard');
                  }}
                  className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
                >
                  {user.team?.logo && (
                    <img src={user.team.logo} alt="" className="h-4 w-4 object-contain rounded-full" />
                  )}
                  {user.role === 'admin' ? 'Admin Control Center' : 'Player Dashboard'}
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    toggleChat();
                  }}
                  className="w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-center text-xs font-bold text-cyan-300 flex items-center justify-center gap-2 shadow-glow-cyan"
                >
                  <FiMessageSquare size={16} />
                  <span>Real-Time Club Chat {chatUnread > 0 ? `(${chatUnread} unread)` : ''}</span>
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate(user.role === 'admin' ? '/admin/notifications' : '/dashboard/notifications');
                  }}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 py-2.5 text-center text-xs font-bold text-slate-200 flex items-center justify-center gap-2"
                >
                  <FiBell size={16} />
                  <span>Notifications {unreadCount > 0 ? `(${unreadCount} unread)` : ''}</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="w-full btn-danger text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {!admin && (
                  <Link to="/login" onClick={() => setOpen(false)} className="block w-full btn-secondary text-center text-sm">
                    Log in
                  </Link>
                )}
                {!admin && (
                  <Link to="/register" onClick={() => setOpen(false)} className="block w-full btn-primary text-center text-sm">
                    Register
                  </Link>
                )}
                {admin && (
                  <Link to="/admin/login" onClick={() => setOpen(false)} className="block w-full btn-secondary text-center text-sm">
                    Admin login
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
