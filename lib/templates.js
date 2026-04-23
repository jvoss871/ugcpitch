export const TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Dark hero, side-by-side identity, card layout',
    layout: 'stack',
    hero: 'dark',
    avatarShape: 'rounded',
    cardStyle: 'shadow',
    bodyBg: 'brand',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Centered avatar, single-column, airy',
    layout: 'centered',
    hero: 'white',
    avatarShape: 'circle',
    cardStyle: 'border',
    bodyBg: 'white',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Full-color cover, body slides up over hero',
    layout: 'cover',
    hero: 'primary',
    avatarShape: 'circle',
    cardStyle: 'shadow',
    bodyBg: 'brand',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Persistent sidebar identity, magazine layout',
    layout: 'sidebar',
    hero: 'dark',
    avatarShape: 'circle',
    cardStyle: 'border',
    bodyBg: 'cream',
  },
];

export function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id) ?? TEMPLATES[0];
}

// Returns perceptual luminance 0 (black) → 1 (white) for a hex color
function luma(hex) {
  const c = (hex ?? '#000').replace('#', '');
  if (c.length < 6) return 0;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Returns dark text on light bg, light text on dark bg
function contrast(bgHex, darkVal = '#111111', lightVal = '#ffffff') {
  return luma(bgHex) > 0.55 ? darkVal : lightVal;
}

// Derives all style values needed by the view page from template + brand colors
export function buildTheme(template, primary, dark, bg, textColor = '#111111') {
  const t = template;

  const heroBg =
    t.hero === 'dark'    ? dark :
    t.hero === 'primary' ? primary :
    '#ffffff';

  // Auto-detect readable text color based on actual hero background luminance
  const heroText    = contrast(heroBg, '#111827', '#ffffff');
  const heroSubtext = luma(heroBg) > 0.55 ? '#6b7280' : 'rgba(255,255,255,0.55)';
  const heroBorder  = luma(heroBg) > 0.55 ? '#e5e7eb' : 'rgba(255,255,255,0.12)';

  const heroBannerBg =
    t.hero === 'primary' ? (luma(primary) > 0.55 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.15)') :
    t.hero === 'white'   ? `${primary}12` :
    `${primary}18`;
  const heroBannerBorder =
    t.hero === 'white' ? `${primary}30` : heroBorder;

  const avatarRadius = t.avatarShape === 'circle' ? '9999px' : '1.5rem';

  const bodyBg =
    t.bodyBg === 'white' ? '#ffffff' :
    t.bodyBg === 'cream' ? '#faf9f6' :
    bg;

  const cardBg      = '#ffffff';
  const cardShadow  = t.cardStyle === 'border' ? 'none' : '0 1px 4px rgba(0,0,0,0.08)';
  const cardBorder  = t.cardStyle === 'border' ? '1px solid #e5e7eb' : 'none';
  const cardRadius  = t.cardStyle === 'border' ? '1rem' : '1.5rem';

  const whyBg   = dark;
  // Auto-detect readable text color on the dark/why background too
  const whyText = contrast(dark, '#111111', '#ffffff');

  const tagBorder = luma(heroBg) > 0.55 ? `${primary}50` : 'rgba(255,255,255,0.25)';
  const tagText   = luma(heroBg) > 0.55 ? primary : 'rgba(255,255,255,0.85)';

  const socialBg    = t.cardStyle === 'border' ? '#f9fafb' : dark;
  const socialText  = t.cardStyle === 'border' ? '#374151' : contrast(dark, '#111111', '#ffffff');

  const accentBar   = t.cardStyle === 'border' ? `2px solid ${primary}` : `4px solid ${primary}`;

  return {
    heroBg, heroText, heroSubtext, heroBorder,
    heroBannerBg, heroBannerBorder,
    avatarRadius,
    bodyBg, cardBg, cardShadow, cardBorder, cardRadius,
    whyBg, whyText, tagBorder, tagText,
    socialBg, socialText,
    accentBar,
    primaryColor: primary,
    darkColor: dark,
    textColor,
    layout: template.layout ?? 'stack',
  };
}
