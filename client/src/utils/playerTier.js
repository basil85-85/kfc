/**
 * playerTier.js — Single source of truth for player rating tier logic.
 *
 * Tier mapping (Option B, confirmed):
 *   < 50   → Bronze
 *   50–69  → Platinum
 *   70–84  → Gold
 *   85+    → Iconic
 *
 * NEVER store the tier — always derive it from overallRating so it can't
 * drift out of sync when a rating is updated.
 */

export const TIERS = {
  ICONIC:   'Iconic',
  GOLD:     'Gold',
  PLATINUM: 'Platinum',
  BRONZE:   'Bronze',
};

/**
 * Returns the tier name string for a given overall rating.
 * @param {number} overallRating
 * @returns {'Iconic'|'Gold'|'Platinum'|'Bronze'}
 */
export function getPlayerTierName(overallRating = 0) {
  if (overallRating >= 85) return TIERS.ICONIC;
  if (overallRating >= 70) return TIERS.GOLD;
  if (overallRating >= 50) return TIERS.PLATINUM;
  return TIERS.BRONZE;
}

/**
 * Returns the full tier config object (styling metadata + name).
 * Used by FifaCard, PlayerDetailModal, SquadPage, TeamRosterPage, LeaderboardPage.
 * @param {number} overallRating
 */
export function getPlayerTier(overallRating = 0) {
  const name = getPlayerTierName(overallRating);

  switch (name) {
    case TIERS.ICONIC:
      return {
        name,
        label: 'ICONIC',
        icon: '⭐',
        // Card material — the full card bg gradient
        cardBg: 'from-[#1a0f00] via-[#2d1a00] to-[#1a0f00]',
        cardBgStyle: {
          background: 'linear-gradient(160deg, #2d1800 0%, #1a0f00 40%, #251200 70%, #3d2200 100%)',
        },
        // Animated shimmer border (applied as CSS class)
        iconicBorder: true,
        border: 'border-transparent',
        // Outer glow
        glow: 'shadow-[0_0_50px_rgba(251,191,36,0.45),0_20px_60px_rgba(0,0,0,0.6)] hover:shadow-[0_0_70px_rgba(251,191,36,0.65),0_20px_80px_rgba(0,0,0,0.7)]',
        // Inner card header (above photo)
        cardHeaderBg: 'from-amber-900/60 via-amber-950/40 to-transparent',
        // Avatar ring
        ringColor: 'ring-amber-400',
        // OVR number color
        ovrColor: 'text-amber-300',
        // Position pill
        posBg: 'bg-amber-900/60 text-amber-200 border-amber-700/50',
        // Player name color
        nameColor: 'text-amber-100',
        // Stat value color
        statColor: 'text-amber-200',
        statLabelColor: 'text-amber-500/80',
        // Divider color
        dividerColor: 'border-amber-700/30',
        // Banner strip (top strip behind OVR/position)
        bannerBg: 'from-amber-500/30 to-transparent',
        // Team name color
        teamColor: 'text-amber-400/70',
        // OVR badge (small chips on other pages)
        badgeBg: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/40',
        // Tier name badge (small chips on other pages)
        tierBadgeBg: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950',
        tierBadgeShadow: 'shadow-amber-500/50',
        // Leaderboard/roster row chip
        chipBg: 'bg-amber-400/15 text-amber-300 border border-amber-400/30',
        // Squad page filter buttons
        filterActiveBg: 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.5)]',
        filterInactiveBg: 'border border-amber-500/30 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40',
      };

    case TIERS.GOLD:
      return {
        name,
        label: 'GOLD',
        icon: '🥇',
        cardBg: 'from-[#1a1400] via-[#2a1f00] to-[#1a1400]',
        cardBgStyle: {
          background: 'linear-gradient(160deg, #221900 0%, #1a1200 40%, #231a00 70%, #2d2100 100%)',
        },
        iconicBorder: false,
        border: 'border-yellow-600/70 hover:border-yellow-400',
        glow: 'shadow-[0_0_30px_rgba(234,179,8,0.25),0_16px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_0_48px_rgba(234,179,8,0.45),0_20px_60px_rgba(0,0,0,0.6)]',
        cardHeaderBg: 'from-yellow-900/50 via-yellow-950/30 to-transparent',
        ringColor: 'ring-yellow-500',
        ovrColor: 'text-yellow-300',
        posBg: 'bg-yellow-900/60 text-yellow-200 border-yellow-700/50',
        nameColor: 'text-yellow-50',
        statColor: 'text-yellow-200',
        statLabelColor: 'text-yellow-600/80',
        dividerColor: 'border-yellow-700/30',
        bannerBg: 'from-yellow-500/25 to-transparent',
        teamColor: 'text-yellow-400/70',
        badgeBg: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25',
        tierBadgeBg: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950',
        tierBadgeShadow: 'shadow-yellow-500/30',
        chipBg: 'bg-yellow-400/15 text-yellow-300 border border-yellow-400/30',
        filterActiveBg: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-[0_0_12px_rgba(234,179,8,0.4)]',
        filterInactiveBg: 'border border-yellow-500/30 bg-yellow-950/30 text-yellow-300 hover:bg-yellow-900/40',
      };

    case TIERS.PLATINUM:
      return {
        name,
        label: 'PLATINUM',
        icon: '🥈',
        cardBg: 'from-[#07131a] via-[#0d1e2a] to-[#07131a]',
        cardBgStyle: {
          background: 'linear-gradient(160deg, #0a1824 0%, #071220 40%, #0c1c28 70%, #101e2c 100%)',
        },
        iconicBorder: false,
        border: 'border-sky-500/60 hover:border-sky-300',
        glow: 'shadow-[0_0_28px_rgba(56,189,248,0.2),0_16px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_0_44px_rgba(56,189,248,0.38),0_20px_60px_rgba(0,0,0,0.6)]',
        cardHeaderBg: 'from-sky-900/40 via-sky-950/20 to-transparent',
        ringColor: 'ring-sky-400',
        ovrColor: 'text-sky-200',
        posBg: 'bg-sky-900/60 text-sky-200 border-sky-700/50',
        nameColor: 'text-sky-50',
        statColor: 'text-sky-200',
        statLabelColor: 'text-sky-500/80',
        dividerColor: 'border-sky-700/30',
        bannerBg: 'from-sky-400/20 to-transparent',
        teamColor: 'text-sky-400/70',
        badgeBg: 'bg-gradient-to-r from-sky-300 via-slate-200 to-sky-400 text-slate-900 font-bold shadow-md shadow-sky-400/20',
        tierBadgeBg: 'bg-gradient-to-r from-sky-300 via-slate-200 to-sky-400 text-slate-900',
        tierBadgeShadow: 'shadow-sky-400/25',
        chipBg: 'bg-sky-400/15 text-sky-300 border border-sky-400/30',
        filterActiveBg: 'bg-gradient-to-r from-sky-300 to-sky-400 text-slate-950 shadow-[0_0_12px_rgba(56,189,248,0.35)]',
        filterInactiveBg: 'border border-sky-500/30 bg-sky-950/30 text-sky-300 hover:bg-sky-900/40',
      };

    default: // BRONZE
      return {
        name: TIERS.BRONZE,
        label: 'BRONZE',
        icon: '🥉',
        cardBg: 'from-[#140a00] via-[#1e1008] to-[#140a00]',
        cardBgStyle: {
          background: 'linear-gradient(160deg, #1a0e04 0%, #120800 40%, #1c1006 70%, #221408 100%)',
        },
        iconicBorder: false,
        border: 'border-amber-900/60 hover:border-amber-700/80',
        glow: 'shadow-[0_0_20px_rgba(120,53,15,0.2),0_12px_40px_rgba(0,0,0,0.5)] hover:shadow-[0_0_35px_rgba(120,53,15,0.35),0_16px_50px_rgba(0,0,0,0.6)]',
        cardHeaderBg: 'from-amber-950/40 via-amber-950/20 to-transparent',
        ringColor: 'ring-amber-900',
        ovrColor: 'text-amber-600',
        posBg: 'bg-amber-950/80 text-amber-500 border-amber-800/50',
        nameColor: 'text-amber-100',
        statColor: 'text-amber-500',
        statLabelColor: 'text-amber-800/80',
        dividerColor: 'border-amber-900/40',
        bannerBg: 'from-amber-900/20 to-transparent',
        teamColor: 'text-amber-700/70',
        badgeBg: 'bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 text-amber-100 font-semibold',
        tierBadgeBg: 'bg-gradient-to-r from-amber-800 to-amber-700 text-amber-100',
        tierBadgeShadow: 'shadow-amber-900/40',
        chipBg: 'bg-amber-900/30 text-amber-600 border border-amber-800/40',
        filterActiveBg: 'bg-gradient-to-r from-amber-800 to-amber-700 text-amber-100 shadow-[0_0_10px_rgba(120,72,36,0.4)]',
        filterInactiveBg: 'border border-amber-800/30 bg-amber-950/30 text-amber-600 hover:bg-amber-900/30',
      };
  }
}
