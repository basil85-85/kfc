import { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { FiMail, FiLock, FiShield, FiArrowRight } from 'react-icons/fi';

const LoginPage = () => {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="glass-card border-cyan-500/20 shadow-glow-cyan p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan">
            <FiShield size={24} />
          </div>
          <h1 className="font-display text-2xl font-black text-white">Player Login</h1>
          <p className="text-xs text-slate-400">Access your KFC player portal, sessions, and match stats.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-300 animate-slide-up">
            {error}
          </div>
        )}



        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-dark">Email Address</label>
            <div className="relative">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-dark pl-10"
                type="email"
                placeholder="player@kfc.com"
                required
              />
              <FiMail className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
            </div>
          </div>

          <div>
            <label className="label-dark">Password</label>
            <div className="relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-dark pl-10"
                type="password"
                placeholder="••••••••"
                required
              />
              <FiLock className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary py-3 text-sm font-bold gap-2 mt-2"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Login to Dashboard'}</span>
            <FiArrowRight size={16} />
          </button>
        </form>

        <div className="border-t border-white/[0.06] pt-4 text-center text-xs text-slate-400 space-y-2">
          <p>
            Don't have a player account?{' '}
            <Link to="/register" className="font-bold text-cyan-300 hover:underline">
              Register Here
            </Link>
          </p>
          <p>
            Club Admin?{' '}
            <Link to="/admin/login" className="font-bold text-slate-300 hover:text-white">
              Admin Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
