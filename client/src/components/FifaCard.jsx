import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiVideo, FiUser } from 'react-icons/fi';
import PlayerDetailModal from './PlayerDetailModal';
import { getPlayerTier } from '../utils/playerTier';

const FifaCard = ({ player }) => {
  const [imageError, setImageError] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const initials =
    player.name
      ?.split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'FC';

  const stats = [
    { label: 'PAC', value: player.pace     || 0 },
    { label: 'SHO', value: player.shooting  || 0 },
    { label: 'PAS', value: player.passing   || 0 },
    { label: 'DRI', value: player.dribbling || 0 },
    { label: 'DEF', value: player.defending || 0 },
    { label: 'PHY', value: player.physical  || 0 },
  ];

  const tier = getPlayerTier(player.overall);
  const hasPhoto = player.photoURL && !imageError;
  const hasVideo = Boolean(player.highlightVideoEmbed || player.highlightVideoUrl);

  return (
    <>
      {/* ─── Card wrapper (Fixed uniform 470px height) ────────────────── */}
      <article
        onClick={() => setShowDetailModal(true)}
        className={`
          crt-card group cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]
          h-[470px] min-h-[470px] max-h-[470px] w-full flex flex-col justify-between select-none relative overflow-hidden rounded-3xl border box-border shrink-0
          ${tier.iconicBorder ? 'tier-iconic-border' : tier.border}
          ${tier.glow}
        `}
        style={tier.cardBgStyle}
      >
        {/* Top & Middle Content Container */}
        <div>
          {/* ── Subtle noise/texture overlay ───────────────────────────── */}
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
            }}
          />

          {/* ── Top strip: OVR + Position + Tier label ─────────────────── */}
          <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
            {/* Left: Big OVR + position pill stacked */}
            <div className="flex flex-col items-center leading-none">
              <span className={`font-display text-4xl font-black leading-none tracking-tight ${tier.ovrColor}`}>
                {player.overall || '—'}
              </span>
              <span
                className={`mt-1 rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border ${tier.posBg}`}
              >
                {player.position || 'CM'}
              </span>
            </div>

            {/* Right: Tier label + team logo */}
            <div className="flex flex-col items-end gap-1.5">
              {/* Tier badge */}
              <span
                className={`
                  inline-flex items-center gap-1 rounded-full px-2.5 py-1
                  text-[10px] font-black uppercase tracking-widest shadow-md
                  ${tier.tierBadgeBg} ${tier.tierBadgeShadow}
                  ${tier.name === 'Iconic' ? 'animate-pulse' : ''}
                `}
              >
                <span className="text-[12px]">{tier.icon}</span>
                {tier.label}
              </span>

              {/* Team logo if available */}
              {player.team?.logo ? (
                <img
                  src={player.team.logo}
                  alt={player.team?.name}
                  className="h-7 w-7 rounded-full object-contain opacity-80"
                />
              ) : (
                <span className={`text-[10px] font-semibold ${tier.teamColor} max-w-[80px] truncate text-right`}>
                  {player.team?.name || 'Free Agent'}
                </span>
              )}
            </div>
          </div>

          {/* ── Divider ────────────────────────────────────────────────── */}
          <div className={`relative z-10 mx-4 border-t ${tier.dividerColor}`} />

          {/* ── Player photo ───────────────────────────────────────────── */}
          <div className="relative z-10 flex justify-center px-4 pt-4">
            <div
              className={`
                relative h-32 w-32 overflow-hidden rounded-full
                ring-4 ${tier.ringColor} shadow-2xl
                transition-transform duration-300 group-hover:scale-105
              `}
            >
              {hasPhoto ? (
                <img
                  src={player.photoURL}
                  alt={player.name}
                  className="h-full w-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-2xl font-black uppercase tracking-widest"
                  style={{ background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.5)' }}
                >
                  {initials}
                </div>
              )}

              {/* Jersey number badge */}
              {player.jersey && (
                <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-slate-950 text-[11px] font-black text-cyan-300 shadow-lg">
                  {player.jersey}
                </span>
              )}
            </div>
          </div>

          {/* ── Player name + team ─────────────────────────────────────── */}
          <div className="relative z-10 px-5 pt-3 pb-1 text-center">
            <h3
              className={`
                truncate font-display text-xl font-black tracking-wide
                transition-colors duration-200 group-hover:brightness-125
                ${tier.nameColor}
              `}
            >
              {player.name}
            </h3>

            <Link
              to={player.team?._id ? `/teams/${player.team._id}` : '/squad'}
              onClick={(e) => e.stopPropagation()}
              className={`inline-flex items-center gap-1.5 text-xs font-medium transition hover:brightness-150 ${tier.teamColor}`}
            >
              {player.team?.logo && (
                <img src={player.team.logo} alt="" className="h-3 w-3 rounded-full object-contain" />
              )}
              <span>{player.team?.name || 'Free Agent'}</span>
            </Link>
          </div>

          {/* ── Divider ────────────────────────────────────────────────── */}
          <div className={`relative z-10 mx-4 mt-2 border-t ${tier.dividerColor}`} />

          {/* ── Stats row with mini visual pips ──────────────────────────── */}
          <div className="relative z-10 grid grid-cols-3 gap-2 px-4 py-3">
            {stats.map((stat) => {
              const pct = Math.min(100, Math.max(0, stat.value));
              const barColor =
                stat.value >= 85
                  ? '#f59e0b'
                  : stat.value >= 70
                  ? '#eab308'
                  : stat.value >= 50
                  ? '#38bdf8'
                  : '#94a3b8';

              return (
                <div
                  key={stat.label}
                  className="relative flex flex-col items-center justify-center rounded-xl bg-black/30 border border-white/5 py-1.5 overflow-hidden group/stat"
                >
                  {/* Mini stat height pip bar */}
                  <div
                    className="absolute bottom-0 left-0 right-0 opacity-25 transition-all duration-500"
                    style={{
                      height: `${pct}%`,
                      backgroundColor: barColor,
                    }}
                  />
                  <span className={`relative z-10 font-display text-lg font-black leading-none ${tier.statColor}`}>
                    {stat.value}
                  </span>
                  <span className={`relative z-10 mt-1 text-[9px] font-bold uppercase tracking-widest ${tier.statLabelColor}`}>
                    {stat.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Fixed uniform height card action button (identical on all cards) ────── */}
        <div className="relative z-10 px-4 pb-4 pt-1">
          <div
            onClick={(e) => {
              e.stopPropagation();
              setShowDetailModal(true);
            }}
            className={`
              flex h-9 w-full items-center justify-center gap-2
              rounded-xl border text-[11px] font-bold cursor-pointer transition
              ${tier.dividerColor} hover:bg-white/10
              ${tier.statColor}
            `}
          >
            {hasVideo ? (
              <>
                <FiVideo size={13} className="text-cyan-400" />
                <span>Highlight Reel</span>
              </>
            ) : (
              <>
                <FiUser size={13} className="opacity-70" />
                <span>View Player Profile</span>
              </>
            )}
          </div>
        </div>

        {/* ── Ambient corner glow for Iconic ─────────────────────────── */}
        {tier.name === 'Iconic' && (
          <>
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />
            <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-yellow-400/10 blur-2xl" />
          </>
        )}
      </article>

      {/* ─── Detail modal ─────────────────────────────────────────────── */}
      <PlayerDetailModal
        player={player}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </>
  );
};

export default FifaCard;
