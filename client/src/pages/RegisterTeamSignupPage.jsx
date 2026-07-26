import { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { FiShield, FiMail, FiUser, FiGlobe, FiImage, FiArrowRight, FiUsers } from 'react-icons/fi';
import { useToast } from '../components/ToastContainer';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegisterTeamSignupPage = () => {
  const { user, registerManager } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    teamName: '',
    color: '#00d2ff',
    logo: '',
    country: '',
    description: '',
  });
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.role === 'manager') {
      navigate('/dashboard/register-team', { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'email') {
      const clean = value.trim().toLowerCase();
      if (!clean) {
        setEmailError('Manager email is required');
      } else if (!emailRegex.test(clean)) {
        setEmailError('Please enter a valid email address (e.g. manager@club.com)');
      } else {
        setEmailError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = form.email.trim().toLowerCase();

    if (!emailRegex.test(cleanEmail)) {
      setEmailError('Please enter a valid email address format.');
      toast?.addToast('Invalid manager email format', 'error');
      return;
    }

    if (!form.teamName.trim()) {
      toast?.addToast('Team name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerManager({
        ...form,
        email: cleanEmail,
        teamName: form.teamName.trim(),
      });
      toast?.addToast('Manager account created. Your team is pending approval.', 'success');
      navigate('/dashboard/register-team');
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Failed to register manager', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl py-10">
      <div className="glass-card border-amber-500/20 shadow-glow-amber p-8 space-y-6">
        <div className="text-center space-y-3">
          <h1 className="font-display text-3xl font-black text-white">Register a Team Manager Account</h1>
          <p className="text-sm text-slate-400">
            Create a manager account and submit your team for league approval. A manager account is separate from a player account and is required for team management.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-dark">Manager Full Name *</label>
              <div className="relative">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="input-dark pl-10"
                  placeholder="Alex Ferguson"
                  required
                />
                <FiUser className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              </div>
            </div>
            <div>
              <label className="label-dark">Manager Email *</label>
              <div className="relative">
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`input-dark pl-10 ${emailError ? 'border-rose-500 focus:border-rose-500' : ''}`}
                  type="email"
                  placeholder="manager@club.com"
                  required
                />
                <FiMail className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              </div>
              {emailError && <p className="mt-1 text-[11px] font-semibold text-rose-400">{emailError}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-dark">Password *</label>
              <div className="relative">
                <input
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input-dark pl-10"
                  type="password"
                  placeholder="••••••••"
                  required
                />
                <FiShield className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              </div>
            </div>
            <div>
              <label className="label-dark">Phone Number</label>
              <div className="relative">
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="input-dark pl-10"
                  placeholder="+91 98765 43210"
                />
                <FiGlobe className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-dark">Team Name *</label>
              <div className="relative">
                <input
                  name="teamName"
                  value={form.teamName}
                  onChange={handleChange}
                  className="input-dark pl-10"
                  placeholder="Red Star Kolothum"
                  required
                />
                <FiUsers className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              </div>
            </div>
            <div>
              <label className="label-dark">Team Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  className="h-11 w-16 cursor-pointer rounded-xl border border-white/10 bg-slate-900 p-1"
                />
                <input
                  type="text"
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  className="input-dark font-mono text-xs uppercase"
                  placeholder="#00D2FF"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-dark">Logo URL</label>
              <div className="relative">
                <input
                  name="logo"
                  value={form.logo}
                  onChange={handleChange}
                  className="input-dark pl-10"
                  placeholder="https://example.com/logo.png"
                />
                <FiImage className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              </div>
            </div>
            <div>
              <label className="label-dark">Country / Region</label>
              <div className="relative">
                <input
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className="input-dark pl-10"
                  placeholder="India / Kerala"
                />
                <FiGlobe className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              </div>
            </div>
          </div>

          <div>
            <label className="label-dark">Team Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="input-dark"
              placeholder="Describe your team vision, values, or home ground..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !!emailError}
            className="w-full btn-primary py-3 text-sm font-bold gap-2 mt-2"
          >
            <span>{isSubmitting ? 'Creating Manager Account...' : 'Register Team & Manager Account'}</span>
            <FiArrowRight size={16} />
          </button>
        </form>

        <div className="border-t border-white/[0.06] pt-4 text-center text-xs text-slate-400">
          Already have a player account?{' '}
          <Link to="/register/player" className="font-bold text-cyan-300 hover:underline">
            Register as Player
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterTeamSignupPage;
