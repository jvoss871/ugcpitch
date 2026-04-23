export const TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Dark hero, clean white sections',
    hero: 'dark',
    avatarShape: 'rounded',
    cardStyle: 'shadow',
    bodyBg: 'brand',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'All white, editorial, airy',
    hero: 'white',
    avatarShape: 'circle',
    cardStyle: 'border',
    bodyBg: 'white',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Full primary color, high impact',
    hero: 'primary',
    avatarShape: 'circle',
    cardStyle: 'shadow',
    bodyBg: 'brand',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Magazine-style, refined, elegant',
    hero: 'dark',
    avatarShape: 'circle',
    cardStyle: 'border',
    bodyBg: 'cream',
  },
];

export function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id) ?? TEMPLATES[0];
}

// Derives all style values needed by the view page from template + brand colors
export function buildTheme(template, primary, dark, bg, textColor = '#111111') {
  const t = template;

  const heroBg =
    t.hero === 'dark'    ? dark :
    t.hero === 'primary' ? primary :
    '#ffffff';

  const heroText    = t.hero === 'white' ? '#111827' : '#ffffff';
  const heroSubtext = t.hero === 'white' ? '#6b7280' : 'rgba(255,255,255,0.55)';
  const heroBorder  = t.hero === 'white' ? '#e5e7eb' : 'rgba(255,255,255,0.1)';
  const heroBannerBg =
    t.hero === 'primary' ? 'rgba(255,255,255,0.15)' :
    t.hero === 'white'   ? `${primary}12` :
    `${primary}18`;
  const heroBannerBorder =
    t.hero === 'white' ? `${primary}30` : heroBorder;

  const avatarRadius = t.avatarShape === 'circle' ? '9999px' : '1.5rem';

  const bodyBg =
    t.bodyBg === 'white' ? '#ffffff' :
    t.bodyBg === 'cream' ? '#faf9f6' :
    bg;

  const cardBg      = t.bodyBg === 'cream' ? '#ffffff' : '#ffffff';
  const cardShadow  = t.cardStyle === 'border' ? 'none' : '0 1px 4px rgba(0,0,0,0.08)';
  const cardBorder  = t.cardStyle === 'border' ? '1px solid #e5e7eb' : 'none';
  const cardRadius  = t.cardStyle === 'border' ? '1rem' : '1.5rem';

  const whyBg =
    t.hero === 'white' ? dark :
    t.hero === 'primary' ? dark :
    dark;

  const tagBorder   = t.hero === 'white' ? `${primary}40` : 'rgba(255,255,255,0.2)';
  const tagText     = t.hero === 'white' ? primary : 'rgba(255,255,255,0.7)';

  const socialBg    = t.cardStyle === 'border' ? '#f9fafb' : dark;
  const socialText  = t.cardStyle === 'border' ? '#374151' : '#ffffff';

  const accentBar   = t.cardStyle === 'border' ? `2px solid ${primary}` : `4px solid ${primary}`;

  return {
    heroBg, heroText, heroSubtext, heroBorder,
    heroBannerBg, heroBannerBorder,
    avatarRadius,
    bodyBg, cardBg, cardShadow, cardBorder, cardRadius,
    whyBg, tagBorder, tagText,
    socialBg, socialText,
    accentBar,
    primaryColor: primary,
    darkColor: dark,
    textColor,
  };
}
