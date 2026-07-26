import { useNavigate, useLocation } from 'react-router-dom';
import { FiMessageSquare, FiLock, FiShield, FiArrowRight, FiUserPlus } from 'react-icons/fi';

export default function UnauthenticatedPromptCard({
  title = "Log in to join the conversation",
  subtitle = "Chat with your teammates, join match rooms, and stay connected with KFC.",
  icon = "chat", // "chat" | "lock" | "shield"
  compact = false,
  onClose
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = () => {
    if (onClose) onClose();
    navigate('/login', { state: { from: location } });
  };

  const handleRegister = () => {
    if (onClose) onClose();
    navigate('/register', { state: { from: location } });
  };

  const renderIcon = () => {
    switch (icon) {
      case 'lock':
        return <FiLock className="h-6 w-6 sm:h-7 sm:w-7 text-cyan-400" />;
      case 'shield':
        return <FiShield className="h-6 w-6 sm:h-7 sm:w-7 text-cyan-400" />;
      default:
        return <FiMessageSquare className="h-6 w-6 sm:h-7 sm:w-7 text-cyan-400" />;
    }
  };

  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 my-auto">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
          {renderIcon()}
        </div>
        <div className="space-y-1.5 max-w-xs">
          <h3 className="font-display text-lg font-bold text-white leading-snug">{title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{subtitle}</p>
        </div>
        <div className="flex flex-col w-full gap-2.5 pt-2 max-w-xs">
          <button
            onClick={handleLogin}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-500/25 transition hover:brightness-110 active:scale-98"
          >
            <span>Log In</span>
            <FiArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={handleRegister}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-900/60 px-5 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-800 hover:text-white active:scale-98"
          >
            <FiUserPlus className="h-4 w-4" />
            <span>Register</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-cyan-500/20 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-all duration-300">
        <div className="flex flex-col items-center text-center space-y-5">
          {/* Badge Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
            {renderIcon()}
          </div>

          {/* Heading & Subtext */}
          <div className="space-y-2">
            <h2 className="font-display text-xl sm:text-2xl font-black tracking-tight text-white">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              {subtitle}
            </p>
          </div>

          {/* CTA Buttons - Vertical Stack on Mobile (375px), Horizontal on sm (640px+) */}
          <div className="flex flex-col sm:flex-row w-full gap-3 pt-3">
            <button
              onClick={handleLogin}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:brightness-110 active:scale-98"
            >
              <span>Log In</span>
              <FiArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={handleRegister}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-800/80 px-6 py-3 text-sm font-bold text-slate-200 transition hover:bg-slate-700 hover:text-white active:scale-98"
            >
              <FiUserPlus className="h-4 w-4" />
              <span>Register</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
