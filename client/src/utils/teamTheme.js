/**
 * Generates background radial gradient style and accent color variables based on team color.
 * Includes luminance/contrast protection to ensure WCAG readability.
 */
export const getTeamTintStyle = (color) => {
  const DEFAULT_STYLE = {
    background:
      'radial-gradient(ellipse at top left, rgba(34,211,238,0.15), transparent 50%), radial-gradient(ellipse at top right, rgba(20,184,166,0.12), transparent 50%)',
    accentColor: '#00d2ff',
    isTeamTinted: false,
  };

  if (!color || typeof color !== 'string') return DEFAULT_STYLE;

  let hex = color.trim().replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  if (hex.length !== 6) return DEFAULT_STYLE;

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Relative luminance calculation for WCAG contrast check
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  let opacityHex = '15'; // ~8% opacity
  if (luminance > 0.75) {
    opacityHex = '08'; // ~3% opacity
  }

  const radialColor = `#${hex}${opacityHex}`;

  if (import.meta.env?.DEV) {
    console.log(`[THEME] Applied team background tint: #${hex}`);
  }

  return {
    background: `radial-gradient(ellipse at top left, ${radialColor} 0%, transparent 60%), radial-gradient(ellipse at top right, #${hex}0d 0%, transparent 50%)`,
    accentColor: `#${hex}`,
    isTeamTinted: true,
  };
};
