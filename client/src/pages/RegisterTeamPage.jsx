import { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext, applyTeamAccent } from '../contexts/AuthContext';
import api from '../services/api';
import Loading from '../components/Loading';
import { useToast } from '../components/ToastContainer';
import {
  FiShield,
  FiMail,
  FiUser,
  FiGlobe,
  FiImage,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiArrowRight,
  FiRefreshCw,
} from 'react-icons/fi';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegisterTeamPage = () => {
  const { user, refreshMe } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();

  const [myTeam, setMyTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  const [form, setForm] = useState({
    name: '',
    color: '#00d2ff',
    logo: '',
    country: '',
    managerName: user?.name || '',
    managerEmail: user?.email || '',
    description: '',
  });

  const loadMyTeam = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/teams/my-team');
      setMyTeam(data);
      if (data && data.color) {
        applyTeamAccent(data.color);
      }
    } catch (error) {
      console.error('Error fetching team status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'manager') {
      loadMyTeam();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'color') {
      applyTeamAccent(value);
    }

    if (name === 'managerEmail') {
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
    const cleanEmail = form.managerEmail.trim().toLowerCase();

    if (!emailRegex.test(cleanEmail)) {
      setEmailError('Please enter a valid email address format.');
      toast?.addToast('Invalid manager email format', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        managerEmail: cleanEmail,
      };
      const { data } = await api.post('/teams/register', payload);
      setMyTeam(data);
      await refreshMe();
      if (data.color) {
        applyTeamAccent(data.color);
      }
      toast?.addToast('Team registration submitted! Confirmation email sent.', 'success');
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Failed to submit team registration', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading message="Loading team registration status..." />;

  if (user?.role !== 'manager') {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <div className="glass-card border-rose-500/20 shadow-glow-rose p-8 space-y-6">
          <div className="text-center space-y-3">
            <h1 className="font-display text-3xl font-black text-white">Team Management Is Manager-Only</h1>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto">
              Team registration is only available through a manager account. If you already have a player account, create a separate manager account at the team registration page below.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 text-sm text-slate-300 space-y-4">
            <p>The player account you are signed in with cannot create a team.</p>
            <p className="text-slate-400">
              Use a separate manager email and account to register your team and submit it for approval.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Link to="/register/team" className="btn-primary w-full text-center py-3 text-sm font-bold">
              Register Manager Account
            </Link>
            <Link to="/dashboard" className="btn-secondary w-full text-center py-3 text-sm font-bold">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // PENDING APPROVAL SCREEN
  // ═══════════════════════════════════════════
  if (myTeam && myTeam.status === 'pending') {
    return (
      <div className="mx-auto max-w-3xl space-y-8 py-6">
        <div
          className="glass-card p-8 space-y-6 border-2 transition-colors duration-300"
          style={{ borderColor: myTeam.color || '#00d2ff', boxShadow: `0 0 30px ${myTeam.color}33` }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-6">
            <div className="flex items-center gap-4">
              {myTeam.logo ? (
                <img
                  src={myTeam.logo}
                  alt={myTeam.name}
                  className="h-16 w-16 object-contain rounded-xl bg-slate-900/80 p-2 border border-white/10"
                />
              ) : (
                <div
                  className="h-16 w-16 rounded-xl flex items-center justify-center font-display font-black text-2xl text-slate-950 shadow-lg"
                  style={{ backgroundColor: myTeam.color }}
                >
                  {myTeam.name.charAt(0)}
                </div>
              )}
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <FiClock className="animate-spin" size={14} /> Pending Approval
                </span>
                <h1 className="font-display text-3xl font-black text-white mt-1">{myTeam.name}</h1>
                {myTeam.country && <p className="text-xs text-slate-400">Country: {myTeam.country}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-full border-2 border-white/20 shadow-md"
                style={{ backgroundColor: myTeam.color }}
                title="Chosen Accent Color"
              />
              <span className="text-xs font-mono font-bold text-slate-300">{myTeam.color}</span>
            </div>
          </div>

          <div className="space-y-4 rounded-xl bg-slate-950/60 p-5 border border-white/5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Application Overview</h3>
            <div className="grid gap-3 text-xs sm:grid-cols-2">
              <div>
                <span className="text-slate-500">Manager Name:</span>
                <p className="font-bold text-white">{myTeam.managerName}</p>
              </div>
              <div>
                <span className="text-slate-500">Manager Email:</span>
                <p className="font-bold text-white">{myTeam.managerEmail}</p>
              </div>
              <div>
                <span className="text-slate-500">Submitted Date:</span>
                <p className="font-bold text-white">{new Date(myTeam.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-slate-500">Status:</span>
                <p className="font-bold text-amber-400 uppercase">Under Review</p>
              </div>
            </div>
            {myTeam.description && (
              <div className="border-t border-white/5 pt-3">
                <span className="text-slate-500 text-xs">Description:</span>
                <p className="text-xs text-slate-300 mt-1 italic">"{myTeam.description}"</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-xs text-cyan-200 flex items-start gap-3">
            <FiShield size={20} className="shrink-0 text-cyan-400 mt-0.5" />
            <div>
              <p className="font-bold text-white">Live Color Accent Preview Active!</p>
              <p className="mt-1 text-slate-300 leading-relaxed">
                Your chosen team theme accent (<span style={{ color: myTeam.color }}>{myTeam.color}</span>) is live for your personal preview screen. Pending teams are hidden from all public squad lists, standings, fixtures, and leaderboards until an administrator approves your request.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button onClick={loadMyTeam} className="btn-secondary text-xs py-2 px-4 gap-2">
              <FiRefreshCw size={14} /> Refresh Status
            </button>
            <Link to="/dashboard" className="btn-primary text-xs py-2 px-4 gap-1.5">
              Return to Dashboard <FiArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // APPROVED SCREEN
  // ═══════════════════════════════════════════
  if (myTeam && myTeam.status === 'approved') {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="glass-card p-8 space-y-6 text-center border-emerald-500/30 shadow-glow-teal">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FiCheckCircle size={36} />
          </div>
          <div>
            <span className="badge-emerald mb-2">Active & Public</span>
            <h1 className="font-display text-3xl font-black text-white">{myTeam.name} is Approved!</h1>
            <p className="text-xs text-slate-400 mt-2">
              Your team is live across all public standings, fixtures, and squad pages.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <Link to={`/teams/${myTeam._id}`} className="btn-primary text-xs py-2.5 px-5">
              View Team Roster Page
            </Link>
            <Link to="/dashboard" className="btn-secondary text-xs py-2.5 px-5">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // REJECTED SCREEN
  // ═══════════════════════════════════════════
  if (myTeam && myTeam.status === 'rejected') {
    return (
      <div className="mx-auto max-w-2xl py-8 space-y-6">
        <div className="glass-card p-8 space-y-6 border-rose-500/30">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <FiAlertTriangle className="text-rose-400" size={28} />
            <div>
              <h1 className="font-display text-2xl font-black text-white">Team Application Not Approved</h1>
              <p className="text-xs text-slate-400">Team: {myTeam.name}</p>
            </div>
          </div>

          {myTeam.rejectionReason && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs">
              <span className="font-bold text-rose-300 uppercase tracking-wider block mb-1">Reason Provided by Admin:</span>
              <p className="text-rose-200">{myTeam.rejectionReason}</p>
            </div>
          )}

          <p className="text-xs text-slate-300 leading-relaxed">
            You can re-submit a team registration request with updated details below.
          </p>

          <button onClick={() => setMyTeam(null)} className="btn-primary w-full py-3 text-xs font-bold gap-2">
            Submit New Team Registration
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // TEAM REGISTRATION FORM
  // ═══════════════════════════════════════════
  return (
    <div className="mx-auto max-w-3xl py-6">
      <div className="glass-card p-8 space-y-6 border-cyan-500/20 shadow-glow-cyan">
        <div className="border-b border-white/[0.08] pb-4">
          <span className="section-label">Club Management</span>
          <h1 className="font-display text-3xl font-black text-white">Register Your Team</h1>
          <p className="text-xs text-slate-400">
            Submit your club details for official league entry. Approved teams gain live public rosters, custom color branding, and standings placement.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Team Name & Accent Color Picker */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-dark">Team Name *</label>
              <div className="relative">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="input-dark pl-10"
                  placeholder="e.g., Red Star Kolothum"
                  required
                />
                <FiShield className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              </div>
            </div>

            <div>
              <label className="label-dark">Team Accent Color *</label>
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
                  required
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">This becomes your team's live theme accent color across the app.</p>
            </div>
          </div>

          {/* Logo URL & Country/Flag */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-dark">Logo Image URL</label>
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
              <label className="label-dark">Country / Flag (Optional)</label>
              <div className="relative">
                <input
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className="input-dark pl-10"
                  placeholder="e.g. India / Kerala"
                />
                <FiGlobe className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              </div>
            </div>
          </div>

          {/* Manager Name (Auto-filled) & Manager Contact Email */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-dark">Manager Name (Auto-Filled) *</label>
              <div className="relative">
                <input
                  name="managerName"
                  value={form.managerName}
                  onChange={handleChange}
                  className="input-dark pl-10"
                  placeholder="Manager Full Name"
                  required
                />
                <FiUser className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              </div>
            </div>

            <div>
              <label className="label-dark">Manager Contact Email *</label>
              <div className="relative">
                <input
                  name="managerEmail"
                  value={form.managerEmail}
                  onChange={handleChange}
                  className={`input-dark pl-10 ${emailError ? 'border-rose-500 focus:border-rose-500' : ''}`}
                  placeholder="manager@club.com"
                  required
                />
                <FiMail className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              </div>
              {emailError && <p className="mt-1 text-[11px] font-semibold text-rose-400">{emailError}</p>}
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="label-dark">Short Description / Bio</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="input-dark"
              placeholder="Briefly describe your team's background, home pitch, or squad story..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !!emailError}
            className="w-full btn-primary py-3.5 text-sm font-bold gap-2 mt-4"
          >
            <span>{submitting ? 'Submitting Registration...' : 'Submit Team For League Approval'}</span>
            <FiArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterTeamPage;
