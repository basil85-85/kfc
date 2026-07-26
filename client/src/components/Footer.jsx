import { Link } from 'react-router-dom';
import { FiInstagram, FiYoutube, FiSend, FiShield, FiHeart } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="relative z-10 border-t border-white/[0.06] bg-slate-950/90 pt-12 pb-20 md:pb-12 text-slate-400 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Brand & Motto */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 font-display font-black text-slate-950 shadow-glow-cyan">
                KFC
              </div>
              <span className="font-display text-xl font-black tracking-tight text-white">
                Kolothum Kadhavu <span className="text-cyan-400">FC</span>
              </span>
            </div>
            <p className="max-w-md text-sm text-slate-400 leading-relaxed">
              Build the legacy. Own the pitch. The premier football club platform for players, coaches, and fans in India.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/10 bg-slate-900 p-2.5 text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300"
              >
                <FiInstagram size={18} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/10 bg-slate-900 p-2.5 text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300"
              >
                <FiYoutube size={18} />
              </a>
              <a
                href="https://telegram.org"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/10 bg-slate-900 p-2.5 text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300"
              >
                <FiSend size={18} />
              </a>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-widest text-cyan-400">Navigation</h4>
            <ul className="mt-4 space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/squad" className="transition hover:text-white">
                  Squad & Roster
                </Link>
              </li>
              <li>
                <Link to="/fixtures" className="transition hover:text-white">
                  Match Schedule
                </Link>
              </li>
              <li>
                <Link to="/standings" className="transition hover:text-white">
                  League Standings
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="transition hover:text-white">
                  Leaderboard & Stats
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="transition hover:text-white">
                  Club Gallery
                </Link>
              </li>
            </ul>
          </div>

          {/* Portal Links */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-widest text-cyan-400">Portal</h4>
            <ul className="mt-4 space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/login" className="transition hover:text-white">
                  Player Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="transition hover:text-white">
                  Join as Player
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="transition hover:text-white">
                  Admin Control Center
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-10 border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} KFC — Kolothum Kadhavu FC. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center gap-1">
            Crafted for football lovers <FiHeart className="text-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
