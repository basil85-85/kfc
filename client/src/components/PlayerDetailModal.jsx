import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { FiX, FiVideo, FiShield, FiFileText, FiMapPin, FiCompass } from 'react-icons/fi';
import api from '../services/api';
import { getPlayerTier } from '../utils/playerTier';

const getStatColor = (value = 0) => {
  if (value >= 75) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (value >= 65) return 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20';
  if (value >= 50) return 'text-amber-300 bg-amber-500/10 border-amber-500/20';
  return 'text-slate-400 bg-slate-800/50 border-slate-700/50';
};

const getDefaultPosCoords = (position) => {
  const pos = (position || 'CM').toUpperCase();
  switch (pos) {
    case 'GK':
      return { x: 50, y: 88 };
    case 'CB':
    case 'LCB':
    case 'RCB':
    case 'DEF':
      return { x: 50, y: 74 };
    case 'LB':
      return { x: 16, y: 70 };
    case 'RB':
      return { x: 84, y: 70 };
    case 'LWB':
      return { x: 12, y: 56 };
    case 'RWB':
      return { x: 88, y: 56 };
    case 'CDM':
      return { x: 50, y: 62 };
    case 'CM':
    case 'LCM':
    case 'RCM':
    case 'MID':
      return { x: 50, y: 50 };
    case 'CAM':
    case 'LAM':
    case 'RAM':
      return { x: 50, y: 38 };
    case 'LM':
      return { x: 16, y: 48 };
    case 'RM':
      return { x: 84, y: 48 };
    case 'LW':
      return { x: 18, y: 26 };
    case 'RW':
      return { x: 82, y: 26 };
    case 'ST':
    case 'FWD':
    default:
      return { x: 50, y: 22 };
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENT: MiniPitchPlayground
   Compact pitch visual displaying primary position or recent lineup spot
   ═══════════════════════════════════════════════════════════════════════════ */
const MiniPitchPlayground = ({ player, coords, isActualFromLineup }) => {
  const pos = player?.position || 'CM';
  const firstName = player?.name ? player.name.split(' ')[0] : 'Player';

  return (
    <div className="flex flex-col items-center space-y-2 rounded-2xl border border-emerald-500/20 bg-slate-900/60 p-3.5 backdrop-blur-md">
      <div className="flex items-center justify-between w-full text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span className="flex items-center gap-1 text-emerald-400">
          <FiCompass size={12} /> Position Playground
        </span>
        <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black ${
          isActualFromLineup
            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
            : 'bg-slate-800 text-slate-400'
        }`}>
          {isActualFromLineup ? '★ Actual Spot' : 'Default Spot'}
        </span>
      </div>

      {/* Mini Pitch Surface (Portrait 3:4 aspect ratio) */}
      <div
        className="relative w-full max-w-[200px] overflow-hidden rounded-xl border border-emerald-700/40 shadow-lg select-none"
        style={{
          aspectRatio: '3 / 4',
          background:
            'repeating-linear-gradient(180deg, #065f46 0px, #065f46 22px, #064e3b 22px, #064e3b 44px)',
        }}
      >
        {/* SVG Pitch Markings */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 75 100"
          preserveAspectRatio="none"
          style={{ stroke: 'rgba(255,255,255,0.18)', fill: 'none', strokeWidth: '0.6' }}
        >
          <rect x="2.5" y="2.5" width="70" height="95" />
          <line x1="2.5" y1="50" x2="72.5" y2="50" />
          <circle cx="37.5" cy="50" r="9" />
          <circle cx="37.5" cy="50" r="0.7" fill="rgba(255,255,255,0.3)" stroke="none" />
          <rect x="19" y="2.5" width="37" height="14" />
          <rect x="28" y="2.5" width="19" height="5.5" />
          <rect x="19" y="83.5" width="37" height="14" />
          <rect x="28" y="92" width="19" height="5.5" />
          <path d="M 2.5 8 A 5.5 5.5 0 0 0 8 2.5" />
          <path d="M 67 2.5 A 5.5 5.5 0 0 0 72.5 8" />
          <path d="M 2.5 92 A 5.5 5.5 0 0 1 8 97.5" />
          <path d="M 67 97.5 A 5.5 5.5 0 0 1 72.5 92" />
        </svg>

        {/* Attacking Direction */}
        <div className="pointer-events-none absolute top-1.5 left-1/2 -translate-x-1/2 text-[7px] font-bold uppercase tracking-widest text-white/20 select-none">
          Attacking ↑
        </div>

        {/* Glowing Player Marker */}
        <div
          className="absolute z-10 flex flex-col items-center -translate-x-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-none"
          style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-cyan-300 bg-slate-950 shadow-[0_0_14px_rgba(34,211,238,0.75)] animate-pulse">
            {player?.photoURL ? (
              <img src={player.photoURL} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="text-[9px] font-black text-cyan-300">{pos}</span>
            )}
            {player?.jersey && (
              <span className="absolute -bottom-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full border border-white/20 bg-slate-950 px-0.5 text-[7px] font-black text-cyan-300">
                #{player.jersey}
              </span>
            )}
          </div>
          <span className="mt-0.5 rounded bg-slate-950/90 px-1 py-0.5 text-[8px] font-black text-white border border-white/10 max-w-[65px] truncate shadow-md">
            {firstName} ({pos})
          </span>
        </div>
      </div>
    </div>
  );
};

const PlayerDetailModal = ({ player: initialPlayer, playerId, isOpen, onClose }) => {
  const [player, setPlayer] = useState(initialPlayer || null);
  const [loading, setLoading] = useState(!initialPlayer && !!playerId);
  const [imageError, setImageError] = useState(false);
  const [pitchCoords, setPitchCoords] = useState({ x: 50, y: 50 });
  const [isActualFromLineup, setIsActualFromLineup] = useState(false);

  useEffect(() => {
    if (initialPlayer) {
      setPlayer(initialPlayer);
    } else if (playerId && isOpen) {
      setLoading(true);
      api
        .get(`/users/${playerId}`)
        .then(({ data }) => setPlayer(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [initialPlayer, playerId, isOpen]);

  // Fetch actual recent lineup spot for player if available
  useEffect(() => {
    if (!player) return;

    const pId = String(player._id || playerId);
    const teamId = player.team?._id || player.team;

    const defaultCoords = getDefaultPosCoords(player.position);
    setPitchCoords(defaultCoords);
    setIsActualFromLineup(false);

    if (!teamId) return;

    // Check recent fixtures for player's team to find their actual lineup position
    api
      .get('/fixtures')
      .then(async ({ data: fixtures }) => {
        const teamFixtures = fixtures.filter(
          (f) =>
            String(f.homeTeam?._id || f.homeTeam) === String(teamId) ||
            String(f.awayTeam?._id || f.awayTeam) === String(teamId)
        );

        if (teamFixtures.length === 0) return;

        // Search for the most recent fixture with a saved lineup containing this player
        for (const fixture of teamFixtures) {
          try {
            const { data: lineupRes } = await api.get(`/lineups/${fixture._id}`);
            const myLineup = lineupRes.lineups?.find(
              (l) => String(l.team?._id || l.team) === String(teamId)
            );
            if (myLineup && myLineup.startingXI) {
              const match = myLineup.startingXI.find(
                (item) => String(item.player?._id || item.player) === pId
              );
              if (match && typeof match.x === 'number' && typeof match.y === 'number') {
                setPitchCoords({ x: match.x, y: match.y });
                setIsActualFromLineup(true);
                break;
              }
            }
          } catch {
            /* continue checking */
          }
        }
      })
      .catch((err) => console.error(err));
  }, [player, playerId]);

  if (!isOpen && !playerId) return null;
  if (!player && !loading) return null;

  const stats = [
    { label: 'PAC', value: player?.pace || player?.rating?.pace || 55 },
    { label: 'SHO', value: player?.shooting || player?.rating?.shooting || 55 },
    { label: 'PAS', value: player?.passing || player?.rating?.passing || 55 },
    { label: 'DRI', value: player?.dribbling || player?.rating?.dribbling || 55 },
    { label: 'DEF', value: player?.defending || player?.rating?.defending || 55 },
    { label: 'PHY', value: player?.physical || player?.rating?.physical || 55 },
  ];

  const overall = player?.overall || player?.rating?.overall || 60;
  const initials = player?.name?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'FC';
  const tier = getPlayerTier(overall);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-card relative max-w-3xl w-full space-y-6 border-cyan-500/30 p-6 sm:p-8 overflow-y-auto max-h-[92vh] animate-slide-up shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-white/10 bg-slate-900 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white z-20"
        >
          <FiX size={18} />
        </button>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading player profile...</div>
        ) : (
          <>
            {/* Header: Photo, Name, Position, Jersey, Team */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-white/[0.08] pb-6">
              <div className="relative shrink-0">
                <div className={`h-28 w-28 overflow-hidden rounded-full ring-4 ${tier.ringColor} bg-slate-900 shadow-xl`}>
                  {player?.photoURL && !imageError ? (
                    <img
                      src={player.photoURL}
                      alt={player.name}
                      className="h-full w-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-2xl font-bold uppercase text-slate-300">
                      {initials}
                    </div>
                  )}
                </div>
                {player?.jersey && (
                  <span className="absolute -bottom-1 -right-1 flex h-8 min-w-8 items-center justify-center rounded-full border border-white/20 bg-slate-900 px-2 text-xs font-black text-cyan-300 shadow-lg">
                    #{player.jersey}
                  </span>
                )}
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-extrabold shadow-md uppercase tracking-wide ${tier.badgeBg}`}>
                    {overall} OVR
                  </span>
                  <span className="rounded-md border border-white/10 bg-slate-900 px-2.5 py-1 text-xs font-bold text-slate-300">
                    {player?.position || 'CM'}
                  </span>
                  {player?.playerCode && (
                    <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 font-mono text-xs font-bold text-cyan-300">
                      ID: {player.playerCode}
                    </span>
                  )}
                  {/* Tier Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest shadow-lg
                      ${tier.tierBadgeBg} ${tier.tierBadgeShadow}
                      ${tier.name === 'Iconic' ? 'animate-pulse' : ''}
                    `}
                  >
                    <span>{tier.icon}</span>
                    <span>{tier.name}</span>
                  </span>
                </div>


                <h2 className="font-display text-2xl sm:text-3xl font-black text-white">{player?.name}</h2>

                {/* Team Badge Link */}
                <div className="pt-1">
                  {player?.team ? (
                    <Link
                      to={`/teams/${player.team._id || player.team}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-cyan-500/40 hover:text-cyan-300 transition"
                    >
                      {player.team.logo ? (
                        <img src={player.team.logo} alt={player.team.name} className="h-5 w-5 object-contain rounded-full" />
                      ) : (
                        <FiShield size={14} className="text-cyan-400" />
                      )}
                      <span>{player.team.name || 'Team Roster'}</span>
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Free Agent (No Team Assigned)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Ratings & Mini Pitch Playground Section */}
            <div className="grid gap-6 md:grid-cols-[1fr_210px] items-center">
              {/* 6 Attribute Stats Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Player Ratings</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {stats.map((s) => (
                    <div key={s.label} className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center ${getStatColor(s.value)}`}>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{s.label}</span>
                      <span className="font-display text-xl font-black">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Playground (Pitch Position View) */}
              <MiniPitchPlayground
                player={player}
                coords={pitchCoords}
                isActualFromLineup={isActualFromLineup}
              />
            </div>

            {/* About Me Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <FiFileText className="text-cyan-400" />
                <span>About Player Bio</span>
              </div>
              {player?.aboutMe ? (
                <p className="rounded-xl bg-slate-900/80 p-4 border border-white/5 text-xs text-slate-300 italic leading-relaxed">
                  "{player.aboutMe}"
                </p>
              ) : (
                <div className="rounded-xl bg-slate-900/40 p-4 border border-white/5 text-xs text-slate-500 italic text-center">
                  No bio provided yet.
                </div>
              )}
            </div>

            {/* Responsive Highlight Reel Video Player */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <FiVideo className="text-cyan-400" />
                <span>Highlight Reel</span>
              </div>

              {player?.highlightVideoEmbed || player?.highlightVideoUrl ? (
                <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-950 border border-white/10 shadow-lg">
                  <iframe
                    src={player.highlightVideoEmbed || player.highlightVideoUrl}
                    title={`${player.name} Highlight Video`}
                    className="h-full w-full border-0"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="rounded-xl bg-slate-900/40 p-8 border border-white/5 text-center text-xs text-slate-500 space-y-1">
                  <FiVideo size={24} className="mx-auto opacity-40 text-slate-400" />
                  <p className="font-bold text-slate-400">No highlight reel yet</p>
                  <p className="text-[11px]">This player hasn't added a YouTube/Vimeo highlight reel link.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default PlayerDetailModal;
