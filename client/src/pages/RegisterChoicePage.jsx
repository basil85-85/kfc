import { Link } from 'react-router-dom';
import { FiUser, FiUsers, FiArrowRight } from 'react-icons/fi';

const RegisterChoicePage = () => {
  return (
    <div className="mx-auto max-w-4xl py-10">
      <div className="glass-card border-cyan-500/20 shadow-glow-cyan p-8">
        <div className="text-center space-y-3 mb-8">
          <h1 className="font-display text-4xl font-black text-white">Create your KFC account</h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Choose the account type that matches your role in the league. Players create personal profiles and join teams, while managers register a team and submit it for approval.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Link
            to="/register/player"
            className="group rounded-3xl border border-white/10 bg-slate-950/80 p-8 text-left transition hover:border-cyan-500/30 hover:bg-slate-900"
          >
            <div className="flex items-center gap-3 mb-4 text-cyan-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/20">
                <FiUser size={22} />
              </div>
              <div>
                <h2 className="font-display text-2xl font-black text-white">Register as Player</h2>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Player Profile</p>
              </div>
            </div>
            <p className="text-sm leading-7 text-slate-300 mb-6">
              Join a team, track your stats, build your profile, and get rated by the league. Perfect for footballers who want to compete and connect with the club.
            </p>
            <div className="flex items-center justify-between gap-3 text-sm font-bold text-cyan-200">
              <span>Continue to player registration</span>
              <FiArrowRight />
            </div>
          </Link>

          <Link
            to="/register/team"
            className="group rounded-3xl border border-white/10 bg-slate-950/80 p-8 text-left transition hover:border-amber-500/30 hover:bg-slate-900"
          >
            <div className="flex items-center gap-3 mb-4 text-amber-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20">
                <FiUsers size={22} />
              </div>
              <div>
                <h2 className="font-display text-2xl font-black text-white">Register a Team</h2>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Manager Account</p>
              </div>
            </div>
            <p className="text-sm leading-7 text-slate-300 mb-6">
              Become a manager, build your squad, plan lineups, and enter the league with a separate manager account. Team registration requires approval before going live.
            </p>
            <div className="flex items-center justify-between gap-3 text-sm font-bold text-amber-200">
              <span>Continue to team registration</span>
              <FiArrowRight />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterChoicePage;
