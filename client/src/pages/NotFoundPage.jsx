import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const NotFoundPage = () => {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="glass-card border-cyan-500/20 shadow-glow-cyan p-12 space-y-6">
        <h1 className="font-display text-7xl font-black text-gradient-cyan">404</h1>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold text-white">Out of Bounds!</h2>
          <p className="text-xs text-slate-400">
            The page or tactic you were looking for doesn't exist on the pitch.
          </p>
        </div>
        <Link to="/" className="btn-primary inline-flex gap-2 py-3 px-6 text-xs font-bold">
          <FiArrowLeft size={16} />
          <span>Back to Home Ground</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
