'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getTemplate, buildTheme } from '@/lib/templates';

function getYouTubeId(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}
function getLoomId(url) {
  const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}
function getDriveId(url) {
  const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
function isDirectVideo(url) {
  return /\.(mp4|mov|webm|ogg)(\?|$)/i.test(url);
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function IgIcon()  { return <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>; }
function TtIcon()  { return <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>; }
function YtIcon()  { return <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>; }
function CvIcon()  { return <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.5 16.5c-.828 0-1.5-.672-1.5-1.5V9h-6v6c0 .828-.672 1.5-1.5 1.5S6 15.828 6 15V9c0-.828.672-1.5 1.5-1.5h9c.828 0 1.5.672 1.5 1.5v6c0 .828-.672 1.5-1.5 1.5z"/></svg>; }
function EmIcon()  { return <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>; }

// ── Socials ───────────────────────────────────────────────────────────────────
// variant: 'pills' (dark bg), 'icons' (small circles, centered), 'stacked' (sidebar text list)
function Socials({ socials, variant = 'pills', primary }) {
  if (!socials) return null;
  const { instagram: ig, tiktok: tt, youtube: yt, canva: cv, email: em } = socials;
  if (!ig && !tt && !yt && !cv && !em) return null;

  const igHref = ig ? `https://instagram.com/${ig.replace('@', '')}` : null;
  const ttHref = tt ? `https://tiktok.com/@${tt.replace('@', '')}` : null;
  const ytHref = yt ? `https://youtube.com/@${yt.replace('@', '')}` : null;
  const cvHref = cv ? (cv.startsWith('http') ? cv : `https://${cv}`) : null;

  if (variant === 'icons') {
    const items = [
      ig && { href: igHref, bg: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', icon: <IgIcon /> },
      tt && { href: ttHref, bg: '#010101', icon: <TtIcon /> },
      yt && { href: ytHref, bg: '#FF0000', icon: <YtIcon /> },
      cv && { href: cvHref, bg: '#7D2AE8', icon: <CvIcon /> },
      em && { href: `mailto:${em}`, bg: `${primary}30`, icon: <EmIcon />, color: primary },
    ].filter(Boolean);
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        {items.map((item, i) => (
          <a key={i} href={item.href} target={item.href?.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer"
            className="transition hover:scale-110"
            style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.bg, color: item.color ?? '#fff', flexShrink: 0 }}>
            {item.icon}
          </a>
        ))}
      </div>
    );
  }

  if (variant === 'stacked') {
    const items = [
      ig && { href: igHref, label: ig, bg: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', icon: <IgIcon /> },
      tt && { href: ttHref, label: tt, bg: '#010101', icon: <TtIcon /> },
      yt && { href: ytHref, label: yt, bg: '#FF0000', icon: <YtIcon /> },
      cv && { href: cvHref, label: 'Canva Portfolio', bg: '#7D2AE8', icon: <CvIcon /> },
      em && { href: `mailto:${em}`, label: em, bg: `${primary}25`, icon: <EmIcon />, color: primary },
    ].filter(Boolean);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, i) => (
          <a key={i} href={item.href} target={item.href?.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer"
            className="hover:opacity-70 transition"
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'inherit', textDecoration: 'none', overflow: 'hidden' }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.bg, color: item.color ?? '#fff', flexShrink: 0 }}>
              {item.icon}
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
          </a>
        ))}
      </div>
    );
  }

  // pills — for dark/primary hero backgrounds
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
      {ig && <a href={igHref} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 12, background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}><IgIcon />{ig}</a>}
      {tt && <a href={ttHref} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 12, backgroundColor: '#010101', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}><TtIcon />{tt}</a>}
      {yt && <a href={ytHref} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 12, backgroundColor: '#FF0000', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}><YtIcon />{yt}</a>}
      {cv && <a href={cvHref} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 12, backgroundColor: '#7D2AE8', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}><CvIcon />Canva Portfolio</a>}
      {em && <a href={`mailto:${em}`} className="hover:scale-105 transition" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}><EmIcon />{em}</a>}
    </div>
  );
}

// ── Embeds ────────────────────────────────────────────────────────────────────
function CustomContentEmbed({ url, label, T }) {
  const ytId = getYouTubeId(url);
  const loomId = getLoomId(url);
  const driveId = getDriveId(url);
  const directVideo = isDirectVideo(url);
  if (ytId) return <div className="w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}><iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>;
  if (loomId) return <div className="w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}><iframe src={`https://www.loom.com/embed/${loomId}`} className="w-full h-full" allowFullScreen /></div>;
  if (driveId) return <div className="w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}><iframe src={`https://drive.google.com/file/d/${driveId}/preview`} className="w-full h-full" allow="autoplay" allowFullScreen /></div>;
  if (directVideo) return <video src={url} controls className="w-full rounded-xl" style={{ maxHeight: '480px' }} />;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl font-semibold text-sm transition hover:scale-105"
      style={{ backgroundColor: T.primaryColor, color: '#fff' }}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
      View Content
    </a>
  );
}

function MediaCard({ item, T, onTrackClick }) {
  const ytId = item.type === 'video' ? getYouTubeId(item.url) : null;
  const inner = item.type === 'video' ? (
    ytId ? (
      <>
        <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-xl">
            <svg className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
      </>
    ) : (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white gap-2">
        <div className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        </div>
        <span className="text-xs opacity-60">Watch</span>
      </div>
    )
  ) : (
    <img src={item.url} alt={item.title} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
  );
  const Wrapper = item.type === 'video' ? 'a' : 'div';
  const wrapperProps = item.type === 'video' ? { href: item.url, target: '_blank', rel: 'noopener noreferrer' } : {};
  return (
    <Wrapper {...wrapperProps} onClick={() => onTrackClick?.(item.title)}
      className="group block overflow-hidden bg-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-[1.03]"
      style={{ borderRadius: T.cardRadius, boxShadow: T.cardShadow, border: T.cardBorder }}>
      <div className="aspect-[4/5] relative overflow-hidden">
        {inner}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between gap-2">
            <p className="text-white text-xs font-medium truncate">{item.title}</p>
            <span className="text-white text-xs font-bold flex-shrink-0">View →</span>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}

// ── PitchView ─────────────────────────────────────────────────────────────────
function PitchView({ pitchId: propId }) {
  const searchParams = useSearchParams();
  const resolvedId = propId ?? searchParams.get('id');
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = resolvedId;
    if (!id) { setError(true); return; }
    fetch(`/api/share-pitch?id=${id}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(d => {
        setData(d);
      })
      .catch(() => setError(true));
  }, [resolvedId]);

  useEffect(() => {
    const shareId = resolvedId;
    if (!shareId || !data) return;
    const sessionId = sessionStorage.getItem('ugcp_sid') || (() => {
      const id = Math.random().toString(36).slice(2);
      sessionStorage.setItem('ugcp_sid', id);
      return id;
    })();
    const startTime = Date.now();
    fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shareId, type: 'view', sessionId, timestamp: new Date().toISOString() }) }).catch(() => {});
    const sendDuration = () => { const s = Math.round((Date.now() - startTime) / 1000); if (s < 2) return; navigator.sendBeacon('/api/analytics', JSON.stringify({ shareId, type: 'duration', sessionId, seconds: s })); };
    const onVisibility = () => { if (document.visibilityState === 'hidden') sendDuration(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', sendDuration);
    return () => { document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('beforeunload', sendDuration); };
  }, [data, resolvedId]);

  useEffect(() => {
    if (!data) return;
    const els = document.querySelectorAll('[data-reveal]');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.08 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [data]);

  const fontName = data?.profile?.brand?.font ?? 'Inter';
  useEffect(() => {
    const id = `gfont-${fontName.replace(/\s/g, '-')}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;600;700;900&display=swap`;
    document.head.appendChild(link);
  }, [fontName]);

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-6">UGC Edge</p>
      <h1 className="text-6xl font-black text-white mb-4">404</h1>
      <p className="text-lg font-semibold text-gray-300 mb-2">This pitch link is invalid or expired.</p>
      <p className="text-sm text-gray-600 mb-10 max-w-xs">
        The creator may have deleted it, or the link may be incorrect.
      </p>
      <a href="/"
        className="text-sm font-bold text-teal-400 hover:text-teal-300 transition underline underline-offset-4">
        Go to UGC Edge
      </a>
    </div>
  );
  if (!data) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;

  const { profile, pitch } = data;
  const shareId = resolvedId;
  const trackClick = (contentTitle) => {
    const sessionId = sessionStorage.getItem('ugcp_sid') || 'unknown';
    fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shareId, type: 'content_click', sessionId, contentTitle, timestamp: new Date().toISOString() }) }).catch(() => {});
  };

  const initial = profile.username?.[0]?.toUpperCase() ?? '?';
  const brand = profile.brand ?? { colors: ['#0d9488', '#0f1117', '#f5f4f0', '#111111'], font: 'Inter', templateId: 'modern' };
  const [primary, dark, bg, textColor = '#111111'] = brand.colors;
  const fontStack = `"${brand.font}", sans-serif`;
  const tmpl = getTemplate(profile.templateId ?? brand.templateId ?? 'modern');
  const T = buildTheme(tmpl, primary, dark, bg, textColor);
  const niche_tags = profile.niche_tags ?? [];
  const hasWhy = !!(profile.why_work_with_me || profile.positioning_statement);
  const whyText = profile.why_work_with_me || profile.positioning_statement;

  const AvatarImg = ({ size }) => profile.avatar
    ? <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
    : <div className="w-full h-full flex items-center justify-center font-black text-white" style={{ fontSize: size * 0.38 }}>{initial}</div>;

  const NicheTags = ({ borderColor, textColorVal }) => niche_tags.length > 0 ? (
    <div className="flex flex-wrap gap-2">
      {niche_tags.map(t => (
        <span key={t} className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
          style={{ border: `1px solid ${borderColor}`, color: textColorVal }}>{t}</span>
      ))}
    </div>
  ) : null;

  const CustomCard = ({ className = '' }) => pitch.customContent?.url ? (
    <div className={`p-8 relative overflow-hidden ${className}`} onClick={() => trackClick(pitch.customContent.label || 'Custom Content')}
      style={{ backgroundColor: T.darkColor, borderRadius: T.cardRadius }}>
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5 pointer-events-none" style={{ backgroundColor: T.primaryColor, transform: 'translate(30%,-30%)' }} />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <span style={{ color: T.primaryColor }} className="text-lg">✦</span>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: T.primaryColor }}>Made for {pitch.title}</p>
        </div>
        {pitch.customContent.label && <p className="text-2xl font-bold mb-6" style={{ color: T.whyText }}>{pitch.customContent.label}</p>}
        <CustomContentEmbed url={pitch.customContent.url} label={pitch.customContent.label} T={T} />
      </div>
    </div>
  ) : null;

  const ContentGrid = ({ cols = 4 }) => pitch.selectedContent?.length > 0 ? (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Past Work</p>
        <p className="text-xs text-gray-400">{pitch.selectedContent.length} piece{pitch.selectedContent.length !== 1 ? 's' : ''}</p>
      </div>
      <div className={`grid gap-4 grid-cols-2 sm:grid-cols-${Math.min(cols, 3)} md:grid-cols-${cols}`}>
        {pitch.selectedContent.map((item, i) => <MediaCard key={item.id ?? i} item={item} T={T} onTrackClick={trackClick} />)}
      </div>
    </div>
  ) : null;

  const CtaSection = () => {
    const { instagram: ig, tiktok: tt, youtube: yt, email: em } = profile.socials ?? {};
    const igHref = ig ? `https://instagram.com/${ig.replace('@', '')}` : null;
    const ttHref = tt ? `https://tiktok.com/@${tt.replace('@', '')}` : null;
    const ytHref = yt ? `https://youtube.com/@${yt.replace('@', '')}` : null;
    const contacts = [
      em && { href: `mailto:${em}`, label: 'Send an Email', icon: <EmIcon /> },
      ig && { href: igHref, label: 'DM on Instagram', icon: <IgIcon /> },
      tt && { href: ttHref, label: 'Message on TikTok', icon: <TtIcon /> },
      yt && { href: ytHref, label: 'YouTube', icon: <YtIcon /> },
    ].filter(Boolean);
    if (contacts.length === 0) return null;
    return (
      <div className="p-10 relative overflow-hidden" style={{ backgroundColor: T.darkColor, borderRadius: T.cardRadius }}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-5 pointer-events-none" style={{ backgroundColor: T.primaryColor, transform: 'translate(35%,-35%)' }} />
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.primaryColor }}>Let's work together</p>
          <p className="text-2xl font-bold mb-8" style={{ color: T.whyText }}>
            {profile.name ? `Ready to work with ${profile.name}?` : 'Interested? Let\'s connect.'}
          </p>
          <div className="flex flex-wrap gap-3">
            {contacts.map((c, i) => (
              <a key={i} href={c.href} target={c.href.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm transition hover:opacity-80"
                style={i === 0
                  ? { backgroundColor: T.primaryColor, color: '#fff' }
                  : { backgroundColor: 'rgba(255,255,255,0.08)', color: T.whyText, border: '1px solid rgba(255,255,255,0.12)' }}>
                {c.icon}{c.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const RatesSection = () => {
    const [open, setOpen] = useState(false);
    if (!pitch.rates?.length) return null;
    return (
      <div style={{ backgroundColor: T.cardBg, borderRadius: T.cardRadius, boxShadow: T.cardShadow, border: T.cardBorder, overflow: 'hidden' }}>
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-8 py-5 text-left transition hover:opacity-80"
        >
          <div className="flex items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Rates</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${T.primaryColor}15`, color: T.primaryColor }}>
              {pitch.rates.length} package{pitch.rates.length !== 1 ? 's' : ''}
            </span>
          </div>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="px-8 pb-6 border-t" style={{ borderColor: T.cardBorder?.replace('1px solid ', '') || '#e5e7eb' }}>
            <div className="pt-5 space-y-3">
              {pitch.rates.map((rate, i) => {
                const label = rate.lines?.length
                  ? rate.lines.map(l => `${l.qty} ${l.item}`).join(' + ')
                  : (rate.label || '');
                return (
                  <div key={i} className="flex items-baseline justify-between gap-4 py-3 border-b last:border-0" style={{ borderColor: T.cardBorder?.replace('1px solid ', '') || '#f3f4f6' }}>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: T.textColor }}>{label}</p>
                      {rate.notes && <p className="text-xs text-gray-400 mt-0.5">{rate.notes}</p>}
                    </div>
                    <p className="text-base font-black flex-shrink-0" style={{ color: T.primaryColor }}>{rate.price}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const Footer = () => !pitch.removeBranding ? (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      backgroundColor: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(13,148,136,0.25)',
      padding: '10px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Pitch created with</span>
      <a href="https://ugc-edge.com" target="_blank" rel="noopener noreferrer"
        style={{ color: '#0d9488', fontSize: 13, fontWeight: 900, letterSpacing: '-0.02em', textDecoration: 'none' }}>
        UGC Edge
      </a>
      <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
      <a href="https://ugc-edge.com" target="_blank" rel="noopener noreferrer"
        style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Create yours free →
      </a>
    </div>
  ) : null;

  // ── CENTERED (Minimal) ─────────────────────────────────────────────────────
  if (T.layout === 'centered') {
    return (
      <div className="min-h-screen font-sans animate-fade-in-up" style={{ backgroundColor: T.bodyBg, paddingBottom: pitch.removeBranding ? 0 : 52 }}>
        <div style={{ backgroundColor: T.heroBg, borderBottom: `1px solid ${T.heroBorder}` }}>
          <div className="max-w-3xl mx-auto px-8 py-16 text-center">
            <div className="mx-auto mb-5 overflow-hidden shadow-xl"
              style={{ width: 104, height: 104, borderRadius: T.avatarRadius, backgroundColor: primary, outline: `3px solid ${primary}`, outlineOffset: '3px' }}>
              <AvatarImg size={104} />
            </div>
            {profile.name && <h1 className="text-5xl font-black tracking-tight mb-4" style={{ fontFamily: fontStack, color: T.heroText }}>{profile.name}</h1>}
            <div className="flex flex-wrap gap-2 justify-center mb-3">
              {niche_tags.map(t => <span key={t} className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full" style={{ border: `1px solid ${T.tagBorder}`, color: T.tagText }}>{t}</span>)}
            </div>
            {(profile.location || profile.languages?.length > 0) && (
              <p className="text-sm" style={{ color: T.heroSubtext }}>{[profile.location, profile.languages?.join(', ')].filter(Boolean).join(' · ')}</p>
            )}
            <Socials socials={profile.socials} variant="icons" primary={primary} />
          </div>
        </div>

        <div style={{ borderBottom: `1px solid ${T.cardBorder || '#e5e7eb'}`, backgroundColor: T.heroBannerBg }}>
          <div className="max-w-3xl mx-auto px-8 py-6 flex items-baseline gap-3 justify-center">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: primary }}>Created for</p>
            <h2 className="text-4xl font-black tracking-tight" style={{ fontFamily: fontStack, color: T.heroText }}>{pitch.title}</h2>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-8 py-16 space-y-12">
          <div data-reveal className="reveal">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: primary }}>About Me</p>
            <p className="text-xl leading-relaxed" style={{ color: T.textColor }}>{profile.bio}</p>
          </div>
          {hasWhy && (
            <div data-reveal className="reveal py-10 border-t border-b text-center" style={{ borderColor: T.cardBorder || '#e5e7eb' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-6 text-gray-400">Why Work With Me</p>
              <p className="text-2xl leading-relaxed" style={{ color: primary, fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}>{whyText}</p>
            </div>
          )}
          <div data-reveal className="reveal">
            <p className="text-xs font-bold uppercase tracking-widest mb-4 text-gray-400">Why {pitch.title}</p>
            <p className="text-xl leading-relaxed" style={{ color: T.textColor }}>{pitch.intro}</p>
          </div>
          {pitch.customContent?.url && <div data-reveal className="reveal"><CustomCard /></div>}
          {pitch.selectedContent?.length > 0 && <div data-reveal className="reveal"><ContentGrid cols={3} /></div>}
          {!!pitch.rates?.length && <div data-reveal className="reveal"><RatesSection /></div>}
          {Object.values(profile.socials ?? {}).some(Boolean) && <div data-reveal className="reveal"><CtaSection /></div>}
        </div>
        <Footer />
      </div>
    );
  }

  // ── COVER (Bold) ───────────────────────────────────────────────────────────
  if (T.layout === 'cover') {
    return (
      <div className="min-h-screen font-sans animate-fade-in-up" style={{ backgroundColor: T.bodyBg, paddingBottom: pitch.removeBranding ? 0 : 52 }}>
        <div style={{ backgroundColor: primary, paddingTop: '3.5rem', paddingBottom: '5rem' }}>
          <div className="max-w-5xl mx-auto px-8">
            <p className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Created for</p>
            <h2 className="text-4xl font-black tracking-tight mb-10" style={{ fontFamily: fontStack, color: '#fff' }}>{pitch.title}</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-8">
              <div className="w-44 h-44 flex-shrink-0 overflow-hidden shadow-2xl"
                style={{ borderRadius: T.avatarRadius, backgroundColor: 'rgba(255,255,255,0.15)', outline: '3px solid rgba(255,255,255,0.5)', outlineOffset: '3px' }}>
                <AvatarImg size={176} />
              </div>
              <div className="flex-1 sm:pb-2">
                {profile.name && <h1 className="text-5xl font-black tracking-tight leading-none mb-4" style={{ fontFamily: fontStack, color: '#fff' }}>{profile.name}</h1>}
                <NicheTags borderColor="rgba(255,255,255,0.3)" textColorVal="rgba(255,255,255,0.8)" />
                {(profile.location || profile.languages?.length > 0) && (
                  <p className="text-sm mt-3 mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>{[profile.location, profile.languages?.join(', ')].filter(Boolean).join(' · ')}</p>
                )}
                <div className="mt-4"><Socials socials={profile.socials} variant="pills" primary={primary} /></div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: T.bodyBg, borderRadius: '2.5rem 2.5rem 0 0', marginTop: '-2rem', paddingTop: '4rem', paddingBottom: '4rem' }}>
          <div className="max-w-5xl mx-auto px-8 space-y-8">
            {hasWhy && (
              <div data-reveal className="reveal p-8" style={{ backgroundColor: T.darkColor, borderRadius: T.cardRadius, borderLeft: `4px solid ${primary}` }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: primary }}>Why Work With Me</p>
                <p className="text-2xl leading-relaxed" style={{ color: T.whyText, fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}>{whyText}</p>
              </div>
            )}
            <div data-reveal className="reveal grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-8" style={{ backgroundColor: T.cardBg, borderRadius: T.cardRadius, boxShadow: T.cardShadow, border: T.cardBorder }}>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">About Me</p>
                <p className="text-lg leading-relaxed" style={{ color: T.textColor }}>{profile.bio}</p>
              </div>
              <div className="p-8" style={{ backgroundColor: T.cardBg, borderRadius: T.cardRadius, boxShadow: T.cardShadow, borderLeft: T.accentBar, border: T.cardBorder }}>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Why {pitch.title}</p>
                <p className="text-lg leading-relaxed" style={{ color: T.textColor }}>{pitch.intro}</p>
              </div>
            </div>
            {pitch.customContent?.url && <div data-reveal className="reveal"><CustomCard /></div>}
            {pitch.selectedContent?.length > 0 && <div data-reveal className="reveal"><ContentGrid cols={4} /></div>}
            {!!pitch.rates?.length && <div data-reveal className="reveal"><RatesSection /></div>}
            {Object.values(profile.socials ?? {}).some(Boolean) && <div data-reveal className="reveal"><CtaSection /></div>}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── SIDEBAR (Editorial) ────────────────────────────────────────────────────
  if (T.layout === 'sidebar') {
    return (
      <div className="min-h-screen font-sans animate-fade-in-up" style={{ backgroundColor: T.bodyBg, paddingBottom: pitch.removeBranding ? 0 : 52 }}>
        <div style={{ backgroundColor: T.heroBannerBg, borderBottom: `1px solid ${T.heroBannerBorder}` }}>
          <div className="px-8 py-5 flex items-baseline gap-3">
            <p className="text-xs font-bold uppercase tracking-widest flex-shrink-0" style={{ color: primary }}>Created for</p>
            <h2 className="text-3xl font-black tracking-tight truncate" style={{ fontFamily: fontStack, color: T.heroText }}>{pitch.title}</h2>
          </div>
        </div>

        <div style={{ display: 'flex', minHeight: 'calc(100vh - 53px)' }}>
          {/* Sticky sidebar — desktop only */}
          <div className="hidden lg:flex flex-col flex-shrink-0"
            style={{ width: 272, backgroundColor: T.heroBg, borderRight: `1px solid ${T.heroBorder}`, padding: '3rem 1.75rem', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', color: T.heroText }}>
            <div className="overflow-hidden mb-4 flex-shrink-0"
              style={{ width: 68, height: 68, borderRadius: T.avatarRadius, backgroundColor: primary, outline: `3px solid ${primary}`, outlineOffset: '3px' }}>
              <AvatarImg size={68} />
            </div>
            {profile.name && <h1 className="text-2xl font-black leading-tight mb-6" style={{ fontFamily: fontStack }}>{profile.name}</h1>}

            {niche_tags.length > 0 && (
              <div className="mb-5">
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: T.heroSubtext }}>Niches</p>
                <div className="flex flex-wrap gap-1.5">
                  {niche_tags.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${primary}20`, color: primary }}>{t}</span>)}
                </div>
              </div>
            )}
            {(profile.location || profile.languages?.length > 0) && (
              <div className="mb-5 space-y-1">
                {profile.location && <p className="text-xs" style={{ color: T.heroSubtext }}>{profile.location}</p>}
                {profile.languages?.length > 0 && <p className="text-xs" style={{ color: T.heroSubtext }}>{profile.languages.join(', ')}</p>}
              </div>
            )}
            <div className="border-t mb-5" style={{ borderColor: T.heroBorder }} />
            <Socials socials={profile.socials} variant="stacked" primary={primary} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0" style={{ padding: '3rem 3.5rem' }}>
            {/* Mobile identity */}
            <div className="flex items-center gap-4 mb-10 lg:hidden">
              <div className="w-16 h-16 flex-shrink-0 overflow-hidden" style={{ borderRadius: T.avatarRadius, backgroundColor: primary }}>
                <AvatarImg size={64} />
              </div>
              <div>
                {profile.name && <h1 className="text-2xl font-black" style={{ fontFamily: fontStack, color: T.textColor }}>{profile.name}</h1>}
                <Socials socials={profile.socials} variant="icons" primary={primary} />
              </div>
            </div>

            <div className="max-w-2xl space-y-10">
              <div data-reveal className="reveal">
                <p className="text-xs font-bold uppercase tracking-widest mb-3 text-gray-400">About Me</p>
                <p className="text-xl leading-relaxed" style={{ color: T.textColor }}>{profile.bio}</p>
              </div>
              {hasWhy && (
                <div data-reveal className="reveal pl-6 py-1" style={{ borderLeft: `4px solid ${primary}` }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: primary }}>Why Work With Me</p>
                  <p className="text-xl leading-relaxed" style={{ color: T.textColor, fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}>{whyText}</p>
                </div>
              )}
              <div data-reveal className="reveal">
                <p className="text-xs font-bold uppercase tracking-widest mb-3 text-gray-400">Why {pitch.title}</p>
                <p className="text-xl leading-relaxed" style={{ color: T.textColor }}>{pitch.intro}</p>
              </div>
              {pitch.customContent?.url && <div data-reveal className="reveal"><CustomCard /></div>}
              {pitch.selectedContent?.length > 0 && <div data-reveal className="reveal"><ContentGrid cols={3} /></div>}
              {!!pitch.rates?.length && <div data-reveal className="reveal"><RatesSection /></div>}
              {Object.values(profile.socials ?? {}).some(Boolean) && <div data-reveal className="reveal"><CtaSection /></div>}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── STACK (Modern) — default ───────────────────────────────────────────────
  return (
    <div className="min-h-screen font-sans animate-fade-in-up" style={{ backgroundColor: T.bodyBg, paddingBottom: pitch.removeBranding ? 0 : 52 }}>
      <div style={{ backgroundColor: T.heroBg, color: T.heroText }}>
        <div style={{ borderBottom: `1px solid ${T.heroBannerBorder}`, backgroundColor: T.heroBannerBg }}>
          <div className="max-w-5xl mx-auto px-8 py-6 flex items-baseline gap-4">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: primary }}>Created for</p>
            <h2 className="text-4xl font-black tracking-tight" style={{ fontFamily: fontStack, color: T.heroText }}>{pitch.title}</h2>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-8 pt-14 pb-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-8">
            <div className="w-40 h-40 overflow-hidden flex-shrink-0 shadow-2xl" style={{ borderRadius: T.avatarRadius, backgroundColor: primary, outline: `3px solid ${primary}`, outlineOffset: '4px' }}>
              <AvatarImg size={160} />
            </div>
            <div className="flex-1">
              {profile.name && <h1 className="text-5xl font-black tracking-tight leading-none mb-4" style={{ fontFamily: fontStack, color: T.heroText }}>{profile.name}</h1>}
              <NicheTags borderColor={T.tagBorder} textColorVal={T.tagText} />
              <div className="flex flex-wrap gap-3 mt-3">
                {profile.location && <span className="text-xs" style={{ color: T.heroSubtext }}>{profile.location}</span>}
                {profile.languages?.length > 0 && <span className="text-xs" style={{ color: T.heroSubtext }}>{profile.languages.join(', ')}</span>}
              </div>
            </div>
            {Object.values(profile.socials ?? {}).some(Boolean) && (
              <div className="flex-shrink-0">
                <Socials socials={profile.socials} variant="pills" primary={primary} />
              </div>
            )}
          </div>
        </div>
        <div className="h-px" style={{ background: `linear-gradient(to right, transparent, ${T.heroBorder}, transparent)` }} />
      </div>

      <div className="max-w-5xl mx-auto px-8 py-16 space-y-12">
        <div data-reveal className="reveal grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 p-8" style={{ backgroundColor: T.cardBg, borderRadius: T.cardRadius, boxShadow: T.cardShadow, border: T.cardBorder }}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">About Me</p>
            <p className="text-lg leading-relaxed" style={{ color: T.textColor }}>{profile.bio}</p>
          </div>
          {hasWhy && (
            <div className="lg:col-span-2 p-8 flex flex-col gap-6" style={{ backgroundColor: T.whyBg, borderRadius: T.cardRadius, borderLeft: `4px solid ${primary}` }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: primary }}>Why Work With Me</p>
              <p className="text-xl leading-relaxed" style={{ color: T.whyText, fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}>{whyText}</p>
            </div>
          )}
        </div>
        <div data-reveal className="reveal p-8" style={{ backgroundColor: T.cardBg, borderRadius: T.cardRadius, boxShadow: T.cardShadow, borderLeft: T.accentBar, border: T.cardBorder }}>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Why {pitch.title}</p>
          <p className="text-lg leading-relaxed" style={{ color: T.textColor }}>{pitch.intro}</p>
        </div>
        {pitch.customContent?.url && <div data-reveal className="reveal"><CustomCard /></div>}
        {pitch.selectedContent?.length > 0 && <div data-reveal className="reveal"><ContentGrid cols={4} /></div>}
        {!!pitch.rates?.length && <div data-reveal className="reveal"><RatesSection /></div>}
        {Object.values(profile.socials ?? {}).some(Boolean) && <div data-reveal className="reveal"><CtaSection /></div>}
      </div>
      <Footer />
    </div>
  );
}

export default function PitchViewClient({ pitchId } = {}) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <PitchView pitchId={pitchId} />
    </Suspense>
  );
}
