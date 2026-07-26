import { useContext, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { getTeamTintStyle } from '../utils/teamTheme';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatDrawer from './ChatDrawer';
import AiAssistantWidget from './AiAssistantWidget';
import ErrorBoundary from './ErrorBoundary';
import GlobalCallOverlay from './GlobalCallOverlay';

const Layout = () => {
  const { user } = useContext(AuthContext);

  const teamColor = user?.team?.color || user?.teamColor || null;
  const teamTheme = getTeamTintStyle(teamColor);

  useEffect(() => {
    if (teamTheme?.accentColor) {
      document.documentElement.style.setProperty('--team-accent', teamTheme.accentColor);
    } else {
      document.documentElement.style.setProperty('--team-accent', '#00d2ff');
    }
  }, [teamTheme?.accentColor]);

  return (
    <div
      className="relative min-h-screen text-slate-100 bg-mesh selection:bg-cyan-500 selection:text-slate-950 transition-colors duration-300"
      style={{ backgroundColor: 'var(--color-background, #060B14)' }}
    >
      {/* Top Mesh Ambient Glow dynamically tinted by team color when available */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[32rem] transition-all duration-700 ease-out"
        style={{ background: teamTheme.background }}
      />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-80 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(14,165,233,0.12),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(245,158,11,0.08),_transparent_50%)]" />

      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 page-enter">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      <Footer />

      {/* Global Call Banner Overlay (Incoming & Outgoing Calls) */}
      <GlobalCallOverlay />

      {/* Global Real-Time Chat Drawer */}
      <ChatDrawer />

      {/* KickBot AI Assistant Floating Widget */}
      <AiAssistantWidget />

      {/* Mobile Fixed Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] px-4 py-2 backdrop-blur-xl md:hidden"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-background, #060B14) 90%, transparent)' }}
      >
        <div className="mx-auto flex max-w-md items-center justify-around">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
                isActive ? 'text-cyan-300' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <FiHome size={18} />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/squad"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
                isActive ? 'text-cyan-300' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <FiUsers size={18} />
            <span>Squad</span>
          </NavLink>

          <NavLink
            to="/fixtures"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
                isActive ? 'text-cyan-300' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <FiCalendar size={18} />
            <span>Fixtures</span>
          </NavLink>

          {user ? (
            <NavLink
              to={user.role === 'admin' ? '/admin' : '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
                  isActive ? 'text-cyan-300' : 'text-slate-400 hover:text-white'
                }`
              }
            >
              {user.role === 'admin' ? <FiGrid size={18} /> : <FiUser size={18} />}
              <span>{user.role === 'admin' ? 'Admin' : 'Dashboard'}</span>
            </NavLink>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
                  isActive ? 'text-cyan-300' : 'text-slate-400 hover:text-white'
                }`
              }
            >
              <FiUser size={18} />
              <span>Login</span>
            </NavLink>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
