import { useContext, useState } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useToast } from '../components/ToastContainer';
import { FiSave, FiEye, FiShield, FiArrowRight, FiLogIn } from 'react-icons/fi';

const AdminThemePage = () => {
  const { theme, updateTheme } = useContext(ThemeContext);
  const toast = useToast();
  const [form, setForm] = useState(theme);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateTheme(form);
      toast?.addToast('Brand theme updated successfully!', 'success');
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Could not update theme', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="glass-card">
        <span className="section-label">Brand Identity</span>
        <h1 className="font-display text-3xl font-black text-white">Club Theme Customizer</h1>
        <p className="text-xs text-slate-300">Customize primary brand colors, sports typography style, hero text, and club crest.</p>
      </header>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_1fr]">
        {/* Customization Form */}
        <form onSubmit={handleSubmit} className="glass-card space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label-dark">Base Background</label>
              <input
                type="color"
                name="backgroundColor"
                value={form.backgroundColor || '#060B14'}
                onChange={handleChange}
                className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-slate-900 p-1"
              />
              <span className="text-[10px] font-mono text-slate-400 mt-1 block">{form.backgroundColor || '#060B14'}</span>
            </div>

            <div>
              <label className="label-dark">Primary Color</label>
              <input
                type="color"
                name="primaryColor"
                value={form.primaryColor || '#060B14'}
                onChange={handleChange}
                className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-slate-900 p-1"
              />
              <span className="text-[10px] font-mono text-slate-400 mt-1 block">{form.primaryColor || '#060B14'}</span>
            </div>

            <div>
              <label className="label-dark">Secondary Card Layer</label>
              <input
                type="color"
                name="secondaryColor"
                value={form.secondaryColor || '#0F1A2E'}
                onChange={handleChange}
                className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-slate-900 p-1"
              />
              <span className="text-[10px] font-mono text-slate-400 mt-1 block">{form.secondaryColor || '#0F1A2E'}</span>
            </div>

            <div>
              <label className="label-dark">Vivid Accent Color</label>
              <input
                type="color"
                name="accentColor"
                value={form.accentColor || '#FF6B1A'}
                onChange={handleChange}
                className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-slate-900 p-1"
              />
              <span className="text-[10px] font-mono text-slate-400 mt-1 block">{form.accentColor || '#FF6B1A'}</span>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="label-dark">Sports Typography Style</label>
              <select name="fontStyle" value={form.fontStyle || 'Modern'} onChange={handleChange} className="select-dark">
                <option value="Modern">Modern (Outfit Clean)</option>
                <option value="Classic">Classic (Inter Clean)</option>
                <option value="Bold">Bold Athletic (Outfit Heavy)</option>
              </select>
            </div>

            <div>
              <label className="label-dark">Hero Banner Title</label>
              <input
                name="heroText"
                value={form.heroText || ''}
                onChange={handleChange}
                className="input-dark"
                placeholder="Kolothum Kadhavu FC"
              />
            </div>
          </div>

          <div>
            <label className="label-dark">Club Slogan / Tagline</label>
            <input
              name="tagline"
              value={form.tagline || ''}
              onChange={handleChange}
              className="input-dark"
              placeholder="Every Click. Every Goal. Every Spot Earned."
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="label-dark">Club Crest / Logo URL</label>
              <input
                name="logoURL"
                value={form.logoURL || ''}
                onChange={handleChange}
                className="input-dark"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <label className="label-dark">Banner Background Image URL</label>
              <input
                name="bannerURL"
                value={form.bannerURL || ''}
                onChange={handleChange}
                className="input-dark"
                placeholder="https://example.com/banner.jpg"
              />
            </div>
          </div>

          <button type="submit" disabled={isSaving} className="btn-primary py-3 px-6 gap-2 text-sm font-bold">
            <FiSave size={16} />
            <span>{isSaving ? 'Applying Theme...' : 'Save Theme Configuration'}</span>
          </button>
        </form>

        {/* Live Interactive Hero Preview Panel */}
        <div className="glass-card space-y-4 border-cyan-500/30">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="section-label flex items-center gap-1.5 text-cyan-300">
              <FiEye size={14} />
              <span>Real-Time Hero Preview</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Live Render</span>
          </div>

          {/* Live Preview Box */}
          <div
            className="relative overflow-hidden rounded-2xl p-6 space-y-4 shadow-2xl transition-all"
            style={{
              backgroundColor: form.backgroundColor || '#060B14',
            }}
          >
            {/* Ambient Radial Floodlight Glow */}
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full blur-3xl opacity-30"
              style={{ backgroundColor: form.accentColor || '#FF6B1A' }}
            />

            {/* Club Logo Pill */}
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider relative z-10"
              style={{
                borderColor: `color-mix(in srgb, ${form.accentColor || '#FF6B1A'} 40%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${form.accentColor || '#FF6B1A'} 15%, transparent)`,
                color: form.accentColor || '#FF6B1A',
              }}
            >
              {form.logoURL ? (
                <img src={form.logoURL} alt="" className="h-4 w-4 rounded-full object-contain" />
              ) : (
                <FiShield size={14} />
              )}
              <span>{form.heroText || 'Kolothum Kadhavu FC'}</span>
            </div>

            {/* Headline */}
            <div className="space-y-2 relative z-10">
              <h3 className="font-display text-2xl font-black text-white leading-tight">
                {form.tagline || 'Every Click. Every Goal. Every Spot Earned.'}
              </h3>
              <div
                className="h-1 rounded-full w-full"
                style={{
                  background: `linear-gradient(to right, ${form.accentColor || '#FF6B1A'}, ${form.secondaryColor || '#0F1A2E'})`,
                }}
              />
            </div>

            {/* Buttons Preview */}
            <div className="flex flex-wrap items-center gap-3 relative z-10 pt-2">
              <button
                type="button"
                className="rounded-xl px-4 py-2 text-xs font-black text-slate-950 flex items-center gap-1.5 shadow-md"
                style={{
                  backgroundColor: form.accentColor || '#FF6B1A',
                  boxShadow: `0 0 15px color-mix(in srgb, ${form.accentColor || '#FF6B1A'} 50%, transparent)`,
                }}
              >
                <FiLogIn size={14} />
                <span>Login</span>
              </button>
              <button
                type="button"
                className="rounded-xl border px-4 py-2 text-xs font-bold text-white flex items-center gap-1.5"
                style={{
                  borderColor: 'rgba(255,255,255,0.2)',
                  backgroundColor: form.secondaryColor || '#0F1A2E',
                }}
              >
                <span>Explore Squad</span>
                <FiArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminThemePage;

