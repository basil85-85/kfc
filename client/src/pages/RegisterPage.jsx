import { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { FiUser, FiMail, FiLock, FiPhone, FiHash, FiImage, FiArrowRight, FiVideo } from 'react-icons/fi';
import VerifyEmailPage from './VerifyEmailPage';

const parseVideoEmbed = (url) => {
  if (!url || !url.trim()) return { isValid: true, error: '' };
  const clean = url.trim();
  const ytMatch = clean.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) return { isValid: true, error: '' };
  const vimeoMatch = clean.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) return { isValid: true, error: '' };
  return { isValid: false, error: 'Invalid video URL. Please use a YouTube or Vimeo video link.' };
};

const RegisterPage = () => {
  const { user, register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    position: 'CM',
    jersey: '',
    photoURL: '',
    highlightVideoUrl: '',
    aboutMe: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [videoError, setVideoError] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [devOtp, setDevOtp] = useState('');

  useEffect(() => {
    if (user && user.isVerified !== false) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));

    if (name === 'highlightVideoUrl') {
      const res = parseVideoEmbed(value);
      setVideoError(res.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (videoError) {
      setError('Please provide a valid video link before registering.');
      return;
    }

    if (form.aboutMe.length > 300) {
      setError('Bio text cannot exceed 300 characters.');
      return;
    }

    setError('');
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.formattedMessage || err.response?.data?.message || 'Unable to register account');
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };




  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="glass-card border-cyan-500/20 shadow-glow-cyan p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl font-black text-white">Join KFC — Registration</h1>
          <p className="text-xs text-slate-400">Create your official KFC player profile to join the squad.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-dark">Full Name *</label>
              <div className="relative">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={`input-dark pl-10 ${fieldErrors.name ? 'border-rose-500' : ''}`}
                  placeholder="Lionel Messi"
                  required
                />
                <FiUser className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              </div>
              {fieldErrors.name && <p className="mt-1 text-[11px] text-rose-400">{fieldErrors.name}</p>}
            </div>

            <div>
              <label className="label-dark">Email Address *</label>
              <div className="relative">
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`input-dark pl-10 ${fieldErrors.email ? 'border-rose-500' : ''}`}
                  type="email"
                  placeholder="player@kfc.com"
                  required
                />
                <FiMail className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              </div>
              {fieldErrors.email && <p className="mt-1 text-[11px] text-rose-400">{fieldErrors.email}</p>}
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
                  className={`input-dark pl-10 ${fieldErrors.password ? 'border-rose-500' : ''}`}
                  type="password"
                  placeholder="••••••••"
                  required
                />
                <FiLock className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              </div>
              {fieldErrors.password && <p className="mt-1 text-[11px] text-rose-400">{fieldErrors.password}</p>}
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
                <FiPhone className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-dark">Pitch Position</label>
              <select name="position" value={form.position} onChange={handleChange} className="select-dark">
                <option>GK</option>
                <option>CB</option>
                <option>LB</option>
                <option>RB</option>
                <option>CDM</option>
                <option>CM</option>
                <option>CAM</option>
                <option>LW</option>
                <option>RW</option>
                <option>ST</option>
              </select>
            </div>

            <div>
              <label className="label-dark">Jersey Number</label>
              <div className="relative">
                <input
                  name="jersey"
                  value={form.jersey}
                  onChange={handleChange}
                  className="input-dark pl-10"
                  type="number"
                  min="1"
                  max="99"
                  placeholder="10"
                />
                <FiHash className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              </div>
            </div>
          </div>

          <div>
            <label className="label-dark">Photo URL (Optional)</label>
            <div className="relative">
              <input
                name="photoURL"
                value={form.photoURL}
                onChange={handleChange}
                className="input-dark pl-10"
                placeholder="https://example.com/avatar.jpg"
              />
              <FiImage className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
            </div>
          </div>

          {/* Highlight Reel Video URL */}
          <div>
            <label className="label-dark">Highlight Reel Video URL (Optional YouTube / Vimeo)</label>
            <div className="relative">
              <input
                name="highlightVideoUrl"
                value={form.highlightVideoUrl}
                onChange={handleChange}
                className={`input-dark pl-10 ${videoError ? 'border-rose-500 focus:border-rose-500' : ''}`}
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              />
              <FiVideo className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
            </div>
            {videoError && <p className="mt-1 text-[11px] font-semibold text-rose-400">{videoError}</p>}
          </div>

          {/* About Me Bio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label-dark mb-0">About Me / Bio (Optional)</label>
              <span className={`text-xs font-mono font-bold ${form.aboutMe.length > 300 ? 'text-rose-400' : 'text-slate-400'}`}>
                {form.aboutMe.length} / 300
              </span>
            </div>
            <textarea
              name="aboutMe"
              value={form.aboutMe}
              onChange={handleChange}
              maxLength={300}
              rows={2}
              className="input-dark"
              placeholder="Tell the club about your career, style, or achievements..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !!videoError}
            className="w-full btn-primary py-3 text-sm font-bold gap-2 mt-2"
          >
            <span>{isSubmitting ? 'Creating Profile...' : 'Complete Player Registration'}</span>
            <FiArrowRight size={16} />
          </button>
        </form>

        <div className="border-t border-white/[0.06] pt-4 text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-cyan-300 hover:underline">
            Login Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
