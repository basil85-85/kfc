import { useEffect, useState } from 'react';
import api from '../services/api';
import Loading from '../components/Loading';
import { useToast } from '../components/ToastContainer';
import { FiAward, FiSave } from 'react-icons/fi';

const AdminRatingsPage = () => {
  const [players, setPlayers] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [form, setForm] = useState({
    pace: 60,
    shooting: 60,
    passing: 60,
    dribbling: 60,
    defending: 60,
    physical: 60,
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const loadData = async () => {
    try {
      const [usersRes, ratingsRes] = await Promise.all([api.get('/users?all=true'), api.get('/ratings')]);
      const usersList = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.players || usersRes.data?.users || [];
      const activePlayers = usersList.filter((u) => u.role === 'player' && u.active);
      setPlayers(activePlayers);
      setRatings(Array.isArray(ratingsRes.data) ? ratingsRes.data : []);

      if (activePlayers.length > 0) {
        setSelectedPlayer(activePlayers[0]._id);
        populateRatingForm(activePlayers[0]._id, ratingsRes.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const populateRatingForm = (playerId, currentRatings) => {
    const existing = currentRatings.find((r) => String(r.player?._id || r.player) === String(playerId));
    if (existing) {
      setForm({
        pace: existing.pace,
        shooting: existing.shooting,
        passing: existing.passing,
        dribbling: existing.dribbling,
        defending: existing.defending,
        physical: existing.physical,
      });
    } else {
      setForm({ pace: 60, shooting: 60, passing: 60, dribbling: 60, defending: 60, physical: 60 });
    }
  };

  const handlePlayerSelect = (playerId) => {
    setSelectedPlayer(playerId);
    populateRatingForm(playerId, ratings);
  };

  const handleSliderChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: parseInt(e.target.value, 10) }));
  };

  const calculateOverall = () => {
    return Math.round(
      form.pace * 0.15 +
        form.shooting * 0.2 +
        form.passing * 0.2 +
        form.dribbling * 0.15 +
        form.defending * 0.15 +
        form.physical * 0.15
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlayer) return;
    setIsSaving(true);
    try {
      await api.put(`/ratings/${selectedPlayer}`, form);
      toast?.addToast('Player FIFA attributes saved!', 'success');
      loadData();
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Failed to save rating', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <Loading message="Loading player ratings..." />;

  const stats = [
    { name: 'pace', label: 'Pace (PAC)' },
    { name: 'shooting', label: 'Shooting (SHO)' },
    { name: 'passing', label: 'Passing (PAS)' },
    { name: 'dribbling', label: 'Dribbling (DRI)' },
    { name: 'defending', label: 'Defending (DEF)' },
    { name: 'physical', label: 'Physical (PHY)' },
  ];

  return (
    <div className="space-y-8">
      <header className="glass-card">
        <span className="section-label">Performance Evaluation</span>
        <h1 className="font-display text-3xl font-black text-white">Player Attribute Ratings</h1>
        <p className="text-xs text-slate-300">Rate player skills across six core attributes to calculate FUT overall OVR.</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* Rating Form */}
        <form onSubmit={handleSubmit} className="glass-card space-y-6">
          <div>
            <label className="label-dark">Select Player to Rate</label>
            <select
              value={selectedPlayer}
              onChange={(e) => handlePlayerSelect(e.target.value)}
              className="select-dark text-cyan-300 font-bold"
            >
              {players.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.position || 'CM'}) — #{p.jersey || '00'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {stats.map((stat) => (
              <div key={stat.name} className="rounded-xl border border-white/[0.04] bg-slate-900/60 p-4 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">{stat.label}</span>
                  <span className="text-cyan-400 font-mono text-base">{form[stat.name]}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="99"
                  name={stat.name}
                  value={form[stat.name]}
                  onChange={handleSliderChange}
                  className="w-full cursor-pointer accent-cyan-400"
                />
              </div>
            ))}
          </div>

          <button type="submit" disabled={isSaving} className="btn-primary w-full py-3 text-sm font-bold gap-2">
            <FiSave size={16} />
            <span>{isSaving ? 'Saving Ratings...' : 'Save Player Rating Card'}</span>
          </button>
        </form>

        {/* Live OVR Preview Card */}
        <div className="glass-card border-amber-500/30 shadow-glow-gold flex flex-col justify-between items-center text-center p-8 space-y-6">
          <div className="space-y-2">
            <span className="badge-gold">Calculated Rating</span>
            <p className="font-display text-7xl font-black text-amber-300">{calculateOverall()}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">OVERALL (OVR)</p>
          </div>

          <div className="w-full border-t border-white/[0.06] pt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-300">
            {stats.map((s) => (
              <div key={s.name} className="flex justify-between rounded-lg bg-slate-900 p-2">
                <span className="text-slate-500">{s.name.toUpperCase()}</span>
                <span className="text-cyan-400">{form[s.name]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRatingsPage;
