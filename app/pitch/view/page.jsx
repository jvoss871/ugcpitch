'use client';

import { useEffect, useState, Suspense } from 'react';
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

function CustomContentEmbed({ url, label, T }) {
  const ytId = getYouTubeId(url);
  const loomId = getLoomId(url);
  const driveId = getDriveId(url);
  const directVideo = isDirectVideo(url);

  if (ytId) {
    return (
      <div className="w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <iframe
          src={`https://www.youtube.com/embed/${ytId}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (loomId) {
    return (
      <div className="w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <iframe
          src={`https://www.loom.com/embed/${loomId}`}
          className="w-full h-full"
          allowFullScreen
        />
      </div>
    );
  }

  if (driveId) {
    return (
      <div className="w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <iframe
          src={`https://drive.google.com/file/d/${driveId}/preview`}
          className="w-full h-full"
          allow="autoplay"
          allowFullScreen
        />
      </div>
    );
  }

  if (directVideo) {
    return (
      <video
        src={url}
        controls
        className="w-full rounded-xl"
        style={{ maxHeight: '480px' }}
      />
    );
  }

  // Fallback: link button
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl font-semibold text-sm transition hover:scale-105"
      style={{ backgroundColor: T.primaryColor, color: '#fff' }}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
      View Content
    </a>
  );
}

function MediaCard({ item, T, onTrackClick }) {
  const ytId = item.type === 'video' ? getYouTubeId(item.url) : null;

  const inner = item.type === 'video' ? (
    ytId ? (
      <>
        <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt={item.title}
          className="w-full h-full object-cover" />
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
    <img src={item.url} alt={item.title} className="w-full h-full object-cover"
      onError={e => { e.target.style.display = 'none'; }} />
  );

  const Wrapper = item.type === 'video' ? 'a' : 'div';
  const wrapperProps = item.type === 'video' ? { href: item.url, target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <Wrapper {...wrapperProps}
      onClick={() => onTrackClick?.(item.title)}
      className="group block overflow-hidden bg-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      style={{ borderRadius: T.cardRadius, boxShadow: T.cardShadow, border: T.cardBorder }}>
      <div className="aspect-[4/5] relative overflow-hidden">
        {inner}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-white text-xs font-medium truncate">{item.title}</p>
        </div>
      </div>
    </Wrapper>
  );
}

function PitchView() {
  const searchParams = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = searchParams.get('id');
    if (!id) { setError(true); return; }
    fetch(`/api/share-pitch?id=${id}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(setData)
      .catch(() => setError(true));
  }, [searchParams]);

  // Analytics tracking
  useEffect(() => {
    const shareId = searchParams.get('id');
    if (!shareId || !data) return;

    const sessionId = sessionStorage.getItem('ugcp_sid') || (() => {
      const id = Math.random().toString(36).slice(2);
      sessionStorage.setItem('ugcp_sid', id);
      return id;
    })();
    const startTime = Date.now();

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareId, type: 'view', sessionId, timestamp: new Date().toISOString() }),
    }).catch(() => {});

    const sendDuration = () => {
      const seconds = Math.round((Date.now() - startTime) / 1000);
      if (seconds < 2) return;
      navigator.sendBeacon('/api/analytics', JSON.stringify({ shareId, type: 'duration', sessionId, seconds }));
    };

    const onVisibility = () => { if (document.visibilityState === 'hidden') sendDuration(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', sendDuration);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', sendDuration);
    };
  }, [data, searchParams]);

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">This link is invalid or expired.</p>
    </div>
  );
  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { profile, pitch } = data;
  const shareId = searchParams.get('id');

  const trackClick = (contentTitle) => {
    const sessionId = sessionStorage.getItem('ugcp_sid') || 'unknown';
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareId, type: 'content_click', sessionId, contentTitle, timestamp: new Date().toISOString() }),
    }).catch(() => {});
  };

  const initial = profile.username?.[0]?.toUpperCase() ?? '?';
  const brand = profile.brand ?? { colors: ['#0d9488', '#0f1117', '#f5f4f0'], font: 'Inter', templateId: 'modern' };
  const [primary, dark, bg, textColor = '#111111'] = brand.colors;
  const fontStack = `"${brand.font}", sans-serif`;
  const tmpl = getTemplate(profile.templateId ?? brand.templateId ?? 'modern');
  const T = buildTheme(tmpl, primary, dark, bg, textColor);

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: T.bodyBg }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: T.heroBg, color: T.heroText }}>

        {/* Pitched for banner */}
        <div style={{ borderBottom: `1px solid ${T.heroBannerBorder}`, backgroundColor: T.heroBannerBg }}>
          <div className="max-w-5xl mx-auto px-8 py-5 flex items-baseline gap-4">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: primary }}>Pitched for</p>
            <h2 className="text-3xl font-black tracking-tight" style={{ fontFamily: fontStack, color: T.heroText }}>
              {pitch.title}
            </h2>
          </div>
        </div>

        {/* Creator identity */}
        <div className="max-w-5xl mx-auto px-8 pt-14 pb-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-8">

            {/* Avatar */}
            <div className="w-40 h-40 overflow-hidden flex-shrink-0 shadow-2xl"
              style={{ borderRadius: T.avatarRadius, backgroundColor: primary }}>
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl font-black text-white">
                  {initial}
                </div>
              )}
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold tracking-widest uppercase mb-1" style={{ color: primary }}>UGC Creator</p>
              {profile.name && (
                <h1 className="text-5xl font-black tracking-tight leading-none mb-4" style={{ fontFamily: fontStack, color: T.heroText }}>
                  {profile.name}
                </h1>
              )}
              {profile.niche_tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.niche_tags.map(tag => (
                    <span key={tag} className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
                      style={{ border: `1px solid ${T.tagBorder}`, color: T.tagText }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-3 mt-3">
                {profile.location && (
                  <span className="text-xs" style={{ color: T.heroSubtext }}>{profile.location}</span>
                )}
                {profile.languages?.length > 0 && (
                  <span className="text-xs" style={{ color: T.heroSubtext }}>{profile.languages.join(', ')}</span>
                )}
              </div>
            </div>

            {/* Socials — top right */}
            {profile.socials && Object.values(profile.socials).some(Boolean) && (
              <div className="flex flex-col gap-2 flex-shrink-0 sm:items-end">
                {profile.socials.instagram && (
                  <a href={`https://instagram.com/${profile.socials.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold transition hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)', color: '#fff' }}>
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    {profile.socials.instagram}
                  </a>
                )}
                {profile.socials.tiktok && (
                  <a href={`https://tiktok.com/@${profile.socials.tiktok.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold transition hover:scale-105"
                    style={{ backgroundColor: '#010101', color: '#fff' }}>
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>
                    {profile.socials.tiktok}
                  </a>
                )}
                {profile.socials.youtube && (
                  <a href={`https://youtube.com/@${profile.socials.youtube.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold transition hover:scale-105"
                    style={{ backgroundColor: '#FF0000', color: '#fff' }}>
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    {profile.socials.youtube}
                  </a>
                )}
                {profile.socials.canva && (
                  <a href={profile.socials.canva.startsWith('http') ? profile.socials.canva : `https://${profile.socials.canva}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold transition hover:scale-105"
                    style={{ backgroundColor: '#7D2AE8', color: '#fff' }}>
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.5 16.5c-.828 0-1.5-.672-1.5-1.5V9h-6v6c0 .828-.672 1.5-1.5 1.5S6 15.828 6 15V9c0-.828.672-1.5 1.5-1.5h9c.828 0 1.5.672 1.5 1.5v6c0 .828-.672 1.5-1.5 1.5z"/></svg>
                    Canva Portfolio
                  </a>
                )}
                {profile.socials.email && (
                  <a href={`mailto:${profile.socials.email}`}
                    className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold transition hover:scale-105"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    {profile.socials.email}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="h-px" style={{ background: `linear-gradient(to right, transparent, ${T.heroBorder}, transparent)` }} />
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-8 py-16 space-y-12">

        {/* About + Why Work With Me */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 p-8"
            style={{ backgroundColor: T.cardBg, borderRadius: T.cardRadius, boxShadow: T.cardShadow, border: T.cardBorder }}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">About</p>
            <p className="text-lg leading-relaxed" style={{ color: T.textColor }}>{profile.bio}</p>
          </div>

          {(profile.why_work_with_me || profile.positioning_statement) && (
            <div className="lg:col-span-2 p-8 flex flex-col justify-between relative overflow-hidden"
              style={{ backgroundColor: T.whyBg, borderRadius: T.cardRadius }}>
              <p className="text-xs font-bold uppercase tracking-widest relative z-10" style={{ color: primary }}>Why Work With Me</p>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                style={{ color: primary, opacity: 0.07, fontSize: '18rem', lineHeight: 1, fontFamily: 'Georgia, serif' }}>
                &ldquo;
              </div>
              <blockquote className="text-white text-xl font-semibold leading-relaxed relative z-10 mt-6">
                &ldquo;{profile.why_work_with_me || profile.positioning_statement}&rdquo;
              </blockquote>
            </div>
          )}
        </div>

        {/* Why I'm the right fit */}
        <div className="p-8"
          style={{ backgroundColor: T.cardBg, borderRadius: T.cardRadius, boxShadow: T.cardShadow, borderLeft: T.accentBar, border: T.cardBorder }}>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
            Why I&rsquo;m the right fit for {pitch.title}
          </p>
          <p className="text-lg leading-relaxed" style={{ color: T.textColor }}>{pitch.intro}</p>
        </div>

        {/* Custom content — made for this brand */}
        {pitch.customContent?.url && (
          <div className="p-8 relative overflow-hidden"
            onClick={() => trackClick(pitch.customContent.label || 'Custom Content')}
            style={{ backgroundColor: T.darkColor, borderRadius: T.cardRadius }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5 pointer-events-none"
              style={{ backgroundColor: T.primaryColor, transform: 'translate(30%, -30%)' }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span style={{ color: T.primaryColor }} className="text-lg">✦</span>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: T.primaryColor }}>
                  Made for {pitch.title}
                </p>
              </div>
              {pitch.customContent.label && (
                <p className="text-white text-2xl font-bold mb-6">{pitch.customContent.label}</p>
              )}
              <CustomContentEmbed url={pitch.customContent.url} label={pitch.customContent.label} T={T} />
            </div>
          </div>
        )}

        {/* Content examples */}
        {pitch.selectedContent?.length > 0 && (
          <div>
            <div className="flex items-baseline justify-between mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Content Examples</p>
              <p className="text-xs text-gray-400">{pitch.selectedContent.length} piece{pitch.selectedContent.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {pitch.selectedContent.map((item, i) => (
                <MediaCard key={item.id ?? i} item={item} T={T} onTrackClick={trackClick} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      {!pitch.removeBranding && (
        <div className="py-10 text-center">
          <p className="text-xs" style={{ color: T.bodyBg === '#0f1117' || T.bodyBg === '#111827' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>
            Generated with UGC Pitch — tailored for {pitch.title}
          </p>
        </div>
      )}

    </div>
  );
}

export default function PitchViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PitchView />
    </Suspense>
  );
}
