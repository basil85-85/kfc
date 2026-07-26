import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { FiShield, FiMail, FiLock, FiArrowRight } from 'react-icons/fi';

const AdminLoginPage = () => {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="glass-card border-amber-500/30 shadow-glow-gold p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-glow-gold">
            <FiShield size={24} />
          </div>
          <h1 className="font-display text-2xl font-black text-white">Admin Control Center</h1>
          <p className="text-xs text-slate-400">Authenticating access for KFC club administrators.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-dark">Admin Email</label>
            <div className="relative">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-dark pl-10"
                type="email"
                placeholder="admin@kfc.com"
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
            className="w-full btn-primary bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black py-3 text-sm gap-2 mt-2"
          >
            <span>{isSubmitting ? 'Verifying...' : 'Access Admin Panel'}</span>
            <FiArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
