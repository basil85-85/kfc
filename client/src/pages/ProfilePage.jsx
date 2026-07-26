import { useMemo } from 'react';
import { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { useToast } from '../components/ToastContainer';
import { FiUser, FiPhone, FiHash, FiImage, FiSave, FiVideo, FiFileText } from 'react-icons/fi';
import { getTeamTintStyle } from '../utils/teamTheme';

const parseVideoEmbed = (url) => {
  if (!url || !url.trim()) return { isValid: true, embedUrl: '', error: '' };
  const clean = url.trim();
  const ytMatch = clean.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return { isValid: true, embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`, error: '' };
  }
  const vimeoMatch = clean.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return { isValid: true, embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`, error: '' };
  }
  return { isValid: false, embedUrl: '', error: 'Invalid video URL. Must be a valid YouTube or Vimeo link.' };
};

const ProfilePage = () => {
  const { user, refreshMe } = useContext(AuthContext);
  const toast = useToast();

  const teamColor = user?.team?.color;
  const tintStyle = useMemo(() => getTeamTintStyle(teamColor), [teamColor]);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    position: user?.position || 'CM',
    jersey: user?.jersey || '',
    photoURL: user?.photoURL || '',
    highlightVideoUrl: user?.highlightVideoUrl || '',
    aboutMe: user?.aboutMe || '',
    smsNotificationsEnabled: user?.smsNotificationsEnabled ?? true,
  });

  const [videoState, setVideoState] = useState(() => parseVideoEmbed(user?.highlightVideoUrl));
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'highlightVideoUrl') {
      setVideoState(parseVideoEmbed(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!videoState.isValid) {
      toast?.addToast('Please fix the video URL before saving.', 'error');
      return;
    }

    if (form.aboutMe.length > 300) {
      toast?.addToast('Bio text cannot exceed 300 characters.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await api.put('/users/me', form);
      await refreshMe();
      toast?.addToast('Profile updated successfully!', 'success');
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-6 p-4 rounded-3xl transition-all duration-300" style={tintStyle}>
      <div className="glass-card border-cyan-500/20 shadow-glow-cyan p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/[0.06] pb-4">
          <div>
            <span className="section-label">Account Settings</span>
            <h1 className="font-display text-2xl font-black text-white">Player Profile</h1>
            <p className="text-xs text-slate-400">Update your contact information, position, highlight video reel, and bio.</p>
          </div>
          {user?.playerCode && (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-right">
              <span className="text-[9px] font-black uppercase text-cyan-400 block tracking-wider">Player Code</span>
              <span className="font-mono text-sm font-black text-white tracking-wider">{user.playerCode}</span>
            </div>
          )}
        </div>


        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-dark">Player Name</label>
              <div className="relative">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="input-dark pl-10"
                  required
                />
                <FiUser className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
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
                />
                <FiHash className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              </div>
            </div>
          </div>

          <div>
            <label className="label-dark">Photo URL</label>
            <div className="relative">
              <input
                name="photoURL"
                value={form.photoURL}
                onChange={handleChange}
                className="input-dark pl-10"
                placeholder="https://example.com/photo.jpg"
              />
              <FiImage className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
            </div>
          </div>

          {/* Highlight Video URL */}
          <div>
            <label className="label-dark">Highlight Reel Video URL (YouTube / Vimeo)</label>
            <div className="relative">
              <input
                name="highlightVideoUrl"
                value={form.highlightVideoUrl}
                onChange={handleChange}
                className={`input-dark pl-10 ${!videoState.isValid ? 'border-rose-500 focus:border-rose-500' : ''}`}
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://vimeo.com/123456"
              />
              <FiVideo className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
            </div>
            {!videoState.isValid && (
              <p className="mt-1 text-[11px] font-semibold text-rose-400">{videoState.error}</p>
            )}

            {/* Video Player Preview */}
            {videoState.isValid && videoState.embedUrl && (
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-slate-950">
                <p className="p-2 text-[10px] font-bold uppercase tracking-wider text-cyan-400 border-b border-white/5">
                  Highlight Video Preview:
                </p>
                <div className="aspect-video w-full">
                  <iframe
                    src={videoState.embedUrl}
                    title="Highlight Reel Preview"
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          {/* About Me Bio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label-dark mb-0">About Me (Player Bio)</label>
              <span className={`text-xs font-mono font-bold ${form.aboutMe.length > 300 ? 'text-rose-400' : 'text-slate-400'}`}>
                {form.aboutMe.length} / 300
              </span>
            </div>
            <div className="relative">
              <textarea
                name="aboutMe"
                value={form.aboutMe}
                onChange={handleChange}
                maxLength={300}
                rows={3}
                className="input-dark pt-3"
                placeholder="Share a short bio, playing style, favorite position, or footballing achievements..."
              />
            </div>
          </div>

          {/* SMS Notification Preference Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 p-3.5">
            <div>
              <p className="text-xs font-bold text-slate-200">SMS Chat Notifications</p>
              <p className="text-[11px] text-slate-400">Receive SMS pings for new messages when you are offline.</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, smsNotificationsEnabled: !prev.smsNotificationsEnabled }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                form.smsNotificationsEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                  form.smsNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <button
            type="submit"
            disabled={isSaving || !videoState.isValid}
            className="btn-primary w-full py-3 gap-2 text-sm font-bold mt-2"
          >
            <FiSave size={16} />
            <span>{isSaving ? 'Saving Updates...' : 'Save Profile Changes'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
