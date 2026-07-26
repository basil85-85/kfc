import { useContext } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { ChatContext } from '../contexts/ChatContext';
import {
  FiGrid,
  FiSliders,
  FiUsers,
  FiAward,
  FiCalendar,
  FiShield,
  FiLayout,
  FiCreditCard,
  FiBell,
  FiImage,
  FiMessageSquare,
} from 'react-icons/fi';

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: FiGrid },
  { label: 'Theme', path: '/admin/theme', icon: FiSliders },
  { label: 'Players', path: '/admin/players', icon: FiUsers },
  { label: 'Ratings', path: '/admin/ratings', icon: FiAward },
  { label: 'Sessions', path: '/admin/sessions', icon: FiCalendar },
  { label: 'Teams', path: '/admin/teams', icon: FiShield },
  { label: 'Team Requests', path: '/admin/team-requests', icon: FiShield },
  { label: 'Leagues', path: '/admin/leagues', icon: FiAward },
  { label: 'Fixtures', path: '/admin/fixtures', icon: FiLayout },
  { label: 'Lineup', path: '/admin/lineup', icon: FiLayout },
  { label: 'Payments', path: '/admin/payments', icon: FiCreditCard },
  { label: 'Notifications', path: '/admin/notifications', icon: FiBell },
  { label: 'Gallery', path: '/admin/gallery', icon: FiImage },
];

const AdminLayout = () => {
  const { toggleChat, totalUnread } = useContext(ChatContext);

  return (
    <div
      className="min-h-screen text-slate-100 bg-mesh transition-colors duration-300"
      style={{ backgroundColor: 'var(--color-background, #060B14)' }}
    >
      <Navbar admin />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Mobile Nav Scrollable Pill Strip */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden no-scrollbar">
          <button
            onClick={toggleChat}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/20 px-3.5 py-2 text-xs font-bold text-cyan-300"
          >
            <FiMessageSquare size={14} />
            <span>Chat ({totalUnread})</span>
          </button>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                      : 'border border-white/10 bg-slate-900/80 text-slate-300 hover:bg-slate-800'
                  }`
                }
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="flex gap-6">
          {/* Desktop Sidebar Navigation */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="glass-card sticky top-24 space-y-4">
              <div className="border-b border-white/[0.06] pb-3">
                <span className="section-label">Club Operations</span>
                <h2 className="font-display text-base font-bold text-white">Admin Control Center</h2>
              </div>
              <nav className="space-y-1">
                <button
                  onClick={toggleChat}
                  className="flex w-full items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20 shadow-glow-cyan"
                >
                  <div className="flex items-center gap-3">
                    <FiMessageSquare size={16} />
                    <span>Club Chat Drawer</span>
                  </div>
                  {totalUnread > 0 && (
                    <span className="rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                      {totalUnread}
                    </span>
                  )}
                </button>

                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/admin'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/10 border border-cyan-500/30 text-cyan-300 shadow-glow-cyan'
                            : 'text-slate-400 hover:bg-slate-900/80 hover:text-white'
                        }`
                      }
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Admin Content View */}
          <section className="flex-1 min-w-0">
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
