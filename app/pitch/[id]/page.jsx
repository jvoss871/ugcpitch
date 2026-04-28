'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { storage, utils } from '@/lib/storage';
import { getTemplate, buildTheme } from '@/lib/templates';

function getYouTubeId(url) {
  const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function getLoomId(url) {
  const match = url?.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

function getDriveId(url) {
  const match = url?.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function IgIcon() { return <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>; }
function TtIcon() { return <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>; }
function YtIcon() { return <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>; }
function CvIcon() { return <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.5 16.5c-.828 0-1.5-.672-1.5-1.5V9h-6v6c0 .828-.672 1.5-1.5 1.5S6 15.828 6 15V9c0-.828.672-1.5 1.5-1.5h9c.828 0 1.5.672 1.5 1.5v6c0 .828-.672 1.5-1.5 1.5z"/></svg>; }
function EmIcon() { return <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>; }

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

function CustomContentEmbed({ url, primary }) {
  const ytId = getYouTubeId(url);
  const loomId = getLoomId(url);
  const driveId = getDriveId(url);
  const isDirectVideo = /\.(mp4|mov|webm|ogg)(\?|$)/i.test(url);

  if (ytId) return (
    <div className="w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
      <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
    </div>
  );

  if (loomId) return (
    <div className="w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
      <iframe src={`https://www.loom.com/embed/${loomId}`} className="w-full h-full" allowFullScreen />
    </div>
  );

  if (driveId) return (
    <div className="w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
      <iframe src={`https://drive.google.com/file/d/${driveId}/preview`} className="w-full h-full" allow="autoplay" allowFullScreen />
    </div>
  );

  if (isDirectVideo) return (
    <video src={url} controls className="w-full rounded-xl" style={{ maxHeight: '480px' }} />
  );

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl font-semibold text-sm transition hover:scale-105"
      style={{ backgroundColor: primary, color: '#fff' }}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
      </svg>
      View Content
    </a>
  );
}

function MediaCard({ item }) {
  const ytId = item.type === 'video' ? getYouTubeId(item.url) : null;
  const inner = item.type === 'video' ? (
    ytId ? (
      <>
        <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl">
            <svg className="w-4 h-4 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </>
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </div>
    )
  ) : (
    <img src={item.url} alt={item.title} className="w-full h-full object-cover"
      onError={e => { e.target.style.display = 'none'; }} />
  );
  const Wrapper = item.type === 'video' ? 'a' : 'div';
  const wrapperProps = item.type === 'video' ? { href: item.url, target: '_blank', rel: 'noopener noreferrer' } : {};
  return (
    <Wrapper {...wrapperProps} className="group block rounded-2xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="aspect-[4/5] relative overflow-hidden">
        {inner}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-white text-xs font-medium truncate">{item.title}</p>
        </div>
      </div>
    </Wrapper>
  );
}

function RatesSection({ pitch, T, primary }) {
  const [open, setOpen] = useState(false);
  if (!pitch.rates?.length) return null;
  return (
    <div style={{ backgroundColor: T.cardBg, borderRadius: T.cardRadius, boxShadow: T.cardShadow, border: T.cardBorder, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-8 py-5 text-left"
        style={{ background: 'none', cursor: 'pointer' }}>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Rates</p>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold" style={{ color: T.textColor }}>{pitch.rates.length} package{pitch.rates.length !== 1 ? 's' : ''}</span>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </button>
      {open && (
        <div className="px-8 pb-6 border-t" style={{ borderColor: '#e5e7eb' }}>
          {pitch.rates.map((rate, i) => {
            const label = rate.lines?.length
              ? rate.lines.map(l => `${l.qty} ${l.item}`).join(' + ')
              : (rate.label || '');
            return (
              <div key={i} className="flex items-baseline justify-between py-4 border-b last:border-0" style={{ borderColor: '#f3f4f6' }}>
                <div>
                  <p className="font-semibold text-sm" style={{ color: T.textColor }}>{label}</p>
                  {rate.notes && <p className="text-xs text-gray-400 mt-0.5">{rate.notes}</p>}
                </div>
                <p className="font-black text-lg ml-6 flex-shrink-0" style={{ color: primary }}>{rate.price}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PitchPage() {
  const { user: authUser, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const pitchId = params.id;

  const [pitch, setPitch] = useState(null);
  const [profile, setProfile] = useState(null);
  const [allContent, setAllContent] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedIntro, setEditedIntro] = useState('');
  const [editedOutreach, setEditedOutreach] = useState('');
  const [selectedContentIds, setSelectedContentIds] = useState([]);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [customContent, setCustomContent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [planStatus, setPlanStatus] = useState(null);

  useEffect(() => {
    if (!loading && !authUser) router.push('/');
  }, [authUser, loading, router]);

  useEffect(() => {
    if (authUser) {
      fetch(`/api/plan?username=${encodeURIComponent(authUser.username)}`)
        .then(r => r.json())
        .then(setPlanStatus)
        .catch(() => {});
    }
  }, [authUser]);

  useEffect(() => {
    if (!authUser || !pitchId) return;
    const profileDefaults = { socials: { instagram: '', tiktok: '', youtube: '', canva: '', email: '' }, languages: [], location: '', why_work_with_me: '' };
    Promise.all([
      fetch(`/api/pitches/${pitchId}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/profile?username=${encodeURIComponent(authUser.username)}`).then(r => r.json()).catch(() => storage.getProfile(authUser.username)),
      fetch(`/api/content?username=${encodeURIComponent(authUser.username)}`).then(r => r.json()).catch(() => storage.getContent(authUser.username)),
      fetch(`/api/brand?username=${encodeURIComponent(authUser.username)}`).then(r => r.json()).catch(() => storage.getBrand(authUser.username)),
    ]).then(([loadedPitch, serverProfile, serverContent, serverBrand]) => {
      if (!loadedPitch) return;
      const loadedProfile = serverProfile?.name ? serverProfile : storage.getProfile(authUser.username);
      const loadedContent = serverContent?.length > 0 ? serverContent : storage.getContent(authUser.username);
      const loadedBrand = serverBrand ?? storage.getBrand(authUser.username);
      setCustomContent(loadedPitch.customContent ?? null);
      setPitch(loadedPitch);
      setProfile({ ...profileDefaults, ...loadedProfile, brand: loadedBrand });
      setAllContent(loadedContent);
      setEditedTitle(loadedPitch.title);
      setEditedIntro(loadedPitch.intro);
      setEditedOutreach(loadedPitch.outreach);
      setSelectedContentIds((loadedPitch.selectedContent || []).map(c => c.id));
    });
  }, [authUser, pitchId]);

  const handleSaveEdits = () => {
    const updatedContent = allContent.filter(c => selectedContentIds.includes(c.id));
    // Clear shareId so the next copy regenerates with updated content
    fetch(`/api/pitches/${pitchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editedTitle, intro: editedIntro, outreach: editedOutreach, selectedContent: updatedContent, shareId: null }),
    });
    setPitch({ ...pitch, title: editedTitle, intro: editedIntro, outreach: editedOutreach, selectedContent: updatedContent, shareId: null });
    setEditMode(false);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(editedOutreach);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  const handleCopyShareLink = async () => {
    const proHandle = planStatus?.handle ?? null;

    const buildUrl = (id) => proHandle
      ? `${window.location.origin}/${proHandle}/${id}`
      : `${window.location.origin}/pitch/view?id=${id}`;

    // Reuse existing shareId if no rates; if rates exist, patch them in (awaited) before copying
    if (pitch.shareId) {
      if (pitch.rates?.length > 0) {
        try {
          const patchRes = await fetch('/api/share-pitch', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: pitch.shareId, rates: pitch.rates }),
          });
          if (patchRes.ok) {
            navigator.clipboard.writeText(buildUrl(pitch.shareId));
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
            return;
          }
          // PATCH failed (e.g. stale shareId not in DB) — fall through to regenerate
          setPitch(p => ({ ...p, shareId: null }));
        } catch {
          setPitch(p => ({ ...p, shareId: null }));
        }
      } else {
        navigator.clipboard.writeText(buildUrl(pitch.shareId));
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        return;
      }
    }

    const shareData = {
      profile: {
        username: profile.username,
        name: profile.name ?? '',
        bio: profile.bio,
        positioning_statement: profile.positioning_statement,
        niche_tags: profile.niche_tags,
        avatar: profile.avatar ?? null,
        brand: profile.brand ?? null,
        templateId: profile.brand?.templateId ?? 'modern',
        location: profile.location ?? '',
        languages: profile.languages ?? [],
        socials: profile.socials ?? {},
        why_work_with_me: profile.why_work_with_me ?? '',
      },
      pitch: {
        title: pitch.title,
        intro: pitch.intro,
        messageType: pitch.messageType,
        selectedContent: pitch.selectedContent || [],
        customContent: pitch.customContent ?? null,
        removeBranding: planStatus?.features?.remove_branding ?? false,
        rates: pitch.rates ?? null,
      },
    };
    try {
      const res = await fetch('/api/share-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shareData),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const { id } = await res.json();
      if (!id) throw new Error('No id returned');
      fetch(`/api/pitches/${pitchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareId: id }),
      });
      setPitch(p => ({ ...p, shareId: id }));
      navigator.clipboard.writeText(buildUrl(id));
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      alert(`Failed to generate share link: ${err.message}`);
    }
  };

  const fetchAnalytics = async () => {
    const shareId = pitch?.shareId;
    if (!shareId) { setShowAnalytics(true); return; }
    try {
      const res = await fetch(`/api/analytics?shareId=${shareId}`);
      const data = await res.json();
      setAnalytics(data);
      // Sync opens to server so dashboard badge stays current
      const opens = Array.from({ length: data.views ?? 0 }, (_, i) => ({ timestamp: i === 0 ? (data.lastViewed ?? new Date().toISOString()) : new Date().toISOString() }));
      fetch(`/api/pitches/${pitchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opens }),
      });
    } catch { setAnalytics(null); }
    setShowAnalytics(true);
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!authUser || !pitch || !profile) return null;

  // Build theme for preview
  const brand = profile.brand ?? { colors: ['#0d9488', '#0f1117', '#f5f4f0'], font: 'Inter', templateId: 'modern' };
  const [primary, dark, bg, textColor = '#111111'] = brand.colors;
  const fontStack = `"${brand.font}", sans-serif`;
  const tmpl = getTemplate(brand.templateId ?? 'modern');
  const T = buildTheme(tmpl, primary, dark, bg, textColor);
  const initial = profile.username?.[0]?.toUpperCase() ?? '?';
  const pitchContent = editMode
    ? allContent.filter(c => selectedContentIds.includes(c.id))
    : pitch.selectedContent || [];

  return (
    <div className="-mx-6 -my-12">

      {/* ── CREATOR TOOLBAR ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-500 hover:text-gray-800 transition flex items-center gap-1">
              ← Dashboard
            </button>
            <span className="text-gray-200">|</span>
            {editMode ? (
              <input
                value={editedTitle}
                onChange={e => setEditedTitle(e.target.value)}
                className="text-sm font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500 w-48"
              />
            ) : (
              <span className="text-sm font-semibold text-gray-900 truncate max-w-xs">{pitch.title}</span>
            )}
            <span className="text-xs text-gray-400">{utils.formatDate(pitch.created_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <button onClick={() => setEditMode(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleSaveEdits}
                  className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition">
                  Save
                </button>
              </>
            ) : (
              <>
                <button onClick={fetchAnalytics}
                  title="View analytics"
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg transition hover:bg-gray-50"
                  style={{ color: pitch?.opens?.length > 0 || pitch?.shareId ? '#22c55e' : '#9ca3af' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 18h2v-6H3v6zm4 0h2V9H7v9zm4 0h2V5h-2v13zm4 0h2v-3h-2v3zm4 0h2v-9h-2v9z" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button onClick={() => setEditMode(true)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                  ✎ Edit
                </button>
                <button onClick={handleCopyShareLink}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition ${copiedLink ? 'bg-green-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'}`}>
                  {copiedLink ? '✓ Link Copied!' : 'Copy Share Link'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── ANALYTICS PANEL ─────────────────────────────────────────────── */}
      {showAnalytics && (
        <div className="bg-gray-950 text-white px-6 py-5 border-b border-gray-800">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Analytics</p>
              <button onClick={() => setShowAnalytics(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            {!pitch?.shareId ? (
              <p className="text-sm text-gray-400">Copy the share link first — analytics will appear once someone views it.</p>
            ) : !analytics ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">No views yet — share your link to start tracking.</p>
                <button
                  onClick={handleCopyShareLink}
                  className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition whitespace-nowrap ml-4">
                  {copiedLink ? '✓ Copied!' : 'Copy link →'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-900 rounded-xl px-4 py-3">
                  <p className="text-2xl font-black text-white">{analytics.views ?? 0}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Unique views</p>
                </div>
                <div className="bg-gray-900 rounded-xl px-4 py-3">
                  <p className="text-2xl font-black text-white">
                    {analytics.avgDuration != null ? `${analytics.avgDuration}s` : '—'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Avg time on page</p>
                </div>
                <div className="bg-gray-900 rounded-xl px-4 py-3">
                  <p className="text-2xl font-black text-white">
                    {analytics.lastViewed ? new Date(analytics.lastViewed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Last viewed</p>
                </div>
                <div className="bg-gray-900 rounded-xl px-4 py-3">
                  <p className="text-2xl font-black text-white">{analytics.contentClicks?.reduce((s, c) => s + c.clicks, 0) ?? 0}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Content clicks</p>
                </div>
                {analytics.contentClicks?.length > 0 && (
                  <div className="col-span-2 sm:col-span-4 bg-gray-900 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-widest">Clicked content</p>
                    <div className="flex flex-wrap gap-2">
                      {analytics.contentClicks.map(c => (
                        <span key={c.title} className="text-xs bg-gray-800 text-gray-200 px-3 py-1 rounded-full">
                          {c.title} <span className="text-green-400 font-bold ml-1">×{c.clicks}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── OUTREACH MESSAGE ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-teal-600">Your Outreach Message</p>
              <p className="text-xs text-gray-400 mt-0.5">Copy and paste this into the thread, DM, or email — then share your pitch link.</p>
            </div>
            <button onClick={handleCopyMessage}
              className={`text-sm px-4 py-2 rounded-lg font-semibold transition flex-shrink-0 ${copiedMsg ? 'bg-green-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'}`}>
              {copiedMsg ? '✓ Copied!' : 'Copy Message'}
            </button>
          </div>
          {editMode ? (
            <textarea
              value={editedOutreach}
              onChange={e => setEditedOutreach(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-800 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{pitch.outreach}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── PITCH PAGE PREVIEW ───────────────────────────────────────────── */}
      <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">↓ Pitch Page Preview — this is what the brand sees</p>
        </div>
      </div>

      {/* ── PITCH PAGE PREVIEW — layout-aware ──────────────────────────── */}
      {(() => {
        const AvatarEl = ({ size }) => profile.avatar
          ? <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center font-black text-white" style={{ fontSize: size * 0.38 }}>{initial}</div>;

        const NicheTags = ({ borderColor, color }) => profile.niche_tags?.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.niche_tags.map(t => (
              <span key={t} className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
                style={{ border: `1px solid ${borderColor}`, color }}>{t}</span>
            ))}
          </div>
        ) : null;

        const IntroBlock = ({ className = '' }) => (
          <div className={className}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Why I&rsquo;m the right fit for {pitch.title}</p>
              {editMode && <span className="text-xs text-teal-600 font-semibold">Editing</span>}
            </div>
            {editMode
              ? <textarea value={editedIntro} onChange={e => setEditedIntro(e.target.value)} rows={5} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
              : <p className="text-lg leading-relaxed" style={{ color: T.textColor }}>{pitch.intro}</p>}
          </div>
        );

        const CustomCard = () => customContent?.url ? (
          <div className="p-8 relative overflow-hidden" style={{ backgroundColor: T.darkColor, borderRadius: T.cardRadius }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5 pointer-events-none" style={{ backgroundColor: primary, transform: 'translate(30%,-30%)' }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span style={{ color: primary }} className="text-lg">✦</span>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: primary }}>Made for {pitch.title}</p>
              </div>
              {customContent.label && <p className="text-2xl font-bold mb-6" style={{ color: T.whyText }}>{customContent.label}</p>}
              <CustomContentEmbed url={customContent.url} primary={primary} />
            </div>
          </div>
        ) : null;

        const ContentExamples = () => (editMode ? pitchContent.length > 0 || allContent.length > 0 : pitchContent.length > 0) ? (
          <div>
            <div className="flex items-baseline justify-between mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Past Work</p>
              {editMode && <span className="text-xs text-teal-600 font-semibold">Select pieces to include</span>}
            </div>
            {editMode ? (
              <div className="space-y-2">
                {allContent.map(item => (
                  <label key={item.id} className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer hover:bg-gray-50 transition"
                    style={selectedContentIds.includes(item.id) ? { borderColor: '#0d9488', backgroundColor: '#f0fdfa' } : { borderColor: '#e5e7eb' }}>
                    <input type="checkbox" checked={selectedContentIds.includes(item.id)}
                      onChange={e => setSelectedContentIds(s => e.target.checked ? [...s, item.id] : s.filter(id => id !== item.id))}
                      className="w-4 h-4 mt-1 rounded border-gray-300 text-teal-600" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                      {item.tags?.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{item.tags.map(tag => <span key={tag} className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded capitalize">{tag}</span>)}</div>}
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {pitchContent.map((item, i) => <MediaCard key={item.id ?? i} item={item} />)}
              </div>
            )}
          </div>
        ) : null;

        const hasWhy = !!(profile.why_work_with_me || profile.positioning_statement);
        const whyText = profile.why_work_with_me || profile.positioning_statement;

        // ── CENTERED ────────────────────────────────────────────────────────
        if (T.layout === 'centered') return (
          <div style={{ backgroundColor: T.bodyBg }}>
            <div style={{ backgroundColor: T.heroBg, borderBottom: `1px solid ${T.heroBorder}` }}>
              <div className="max-w-3xl mx-auto px-8 py-14 text-center">
                <div className="mx-auto mb-5 overflow-hidden shadow-xl" style={{ width: 96, height: 96, borderRadius: T.avatarRadius, backgroundColor: primary }}>
                  <AvatarEl size={96} />
                </div>
                {profile.name && <h1 className="text-5xl font-black tracking-tight mb-4" style={{ fontFamily: fontStack, color: T.heroText }}>{profile.name}</h1>}
                <div className="flex flex-wrap gap-2 justify-center mb-2">
                  {profile.niche_tags?.map(t => <span key={t} className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full" style={{ border: `1px solid ${T.tagBorder}`, color: T.tagText }}>{t}</span>)}
                </div>
                <Socials socials={profile.socials} variant="icons" primary={primary} />
              </div>
            </div>
            <div style={{ borderBottom: `1px solid #e5e7eb`, backgroundColor: T.heroBannerBg }}>
              <div className="max-w-3xl mx-auto px-8 py-4 flex items-baseline gap-3 justify-center">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: primary }}>Created for</p>
                <h2 className="text-2xl font-black" style={{ fontFamily: fontStack, color: T.heroText }}>{pitch.title}</h2>
              </div>
            </div>
            <div className="max-w-3xl mx-auto px-8 py-14 space-y-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: primary }}>About</p>
                <p className="text-xl leading-relaxed" style={{ color: T.textColor }}>{profile.bio}</p>
              </div>
              {hasWhy && (
                <div className="py-10 border-t border-b text-center" style={{ borderColor: '#e5e7eb' }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-6 text-gray-400">Why Work With Me</p>
                  <blockquote className="text-2xl font-semibold italic leading-relaxed" style={{ color: primary }}>&ldquo;{whyText}&rdquo;</blockquote>
                </div>
              )}
              <IntroBlock />
              <CustomCard />
              <ContentExamples />
              <RatesSection pitch={pitch} T={T} primary={primary} />
            </div>
            <div className="py-8 text-center"><p className="text-xs text-gray-300 tracking-widest uppercase">Made with UGC Edge</p></div>
          </div>
        );

        // ── COVER ────────────────────────────────────────────────────────────
        if (T.layout === 'cover') return (
          <div style={{ backgroundColor: T.bodyBg }}>
            <div style={{ backgroundColor: primary, paddingTop: '3.5rem', paddingBottom: '5rem' }}>
              <div className="max-w-5xl mx-auto px-8">
                <p className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Created for</p>
                <h2 className="text-4xl font-black tracking-tight mb-10" style={{ fontFamily: fontStack, color: '#fff' }}>{pitch.title}</h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-8">
                  <div className="w-44 h-44 flex-shrink-0 overflow-hidden shadow-2xl" style={{ borderRadius: T.avatarRadius, backgroundColor: 'rgba(255,255,255,0.15)', border: '4px solid rgba(255,255,255,0.3)' }}>
                    <AvatarEl size={176} />
                  </div>
                  <div className="flex-1 sm:pb-2">
                    {profile.name && <h1 className="text-5xl font-black tracking-tight leading-none mb-4" style={{ fontFamily: fontStack, color: '#fff' }}>{profile.name}</h1>}
                    <NicheTags borderColor="rgba(255,255,255,0.3)" color="rgba(255,255,255,0.8)" />
                    <div className="mt-4">
                      <Socials socials={profile.socials} variant="pills" primary={primary} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ backgroundColor: T.bodyBg, borderRadius: '2.5rem 2.5rem 0 0', marginTop: '-2rem', paddingTop: '4rem', paddingBottom: '4rem' }}>
              <div className="max-w-5xl mx-auto px-8 space-y-8">
                {hasWhy && (
                  <div className="p-8 relative overflow-hidden" style={{ backgroundColor: T.darkColor, borderRadius: T.cardRadius }}>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ color: primary, opacity: 0.05, fontSize: '16rem', lineHeight: 1, fontFamily: 'Georgia, serif' }}>&ldquo;</div>
                    <p className="text-xs font-bold uppercase tracking-widest relative z-10 mb-4" style={{ color: primary }}>Why Work With Me</p>
                    <blockquote className="text-2xl font-semibold leading-relaxed relative z-10" style={{ color: T.whyText }}>&ldquo;{whyText}&rdquo;</blockquote>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-8" style={{ backgroundColor: T.cardBg, borderRadius: T.cardRadius, boxShadow: T.cardShadow, border: T.cardBorder }}>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">About</p>
                    <p className="text-lg leading-relaxed" style={{ color: T.textColor }}>{profile.bio}</p>
                  </div>
                  <div className="p-8" style={{ backgroundColor: T.cardBg, borderRadius: T.cardRadius, boxShadow: T.cardShadow, borderLeft: T.accentBar, border: T.cardBorder }}>
                    <IntroBlock />
                  </div>
                </div>
                <CustomCard />
                <ContentExamples />
                <RatesSection pitch={pitch} T={T} primary={primary} />
              </div>
            </div>
            <div className="py-8 text-center"><p className="text-xs text-gray-300 tracking-widest uppercase">Made with UGC Edge</p></div>
          </div>
        );

        // ── SIDEBAR ──────────────────────────────────────────────────────────
        if (T.layout === 'sidebar') return (
          <div style={{ backgroundColor: T.bodyBg, minHeight: '100vh' }}>
            <div style={{ backgroundColor: T.heroBannerBg, borderBottom: `1px solid ${T.heroBannerBorder}` }}>
              <div className="px-8 py-4 flex items-baseline gap-3">
                <p className="text-xs font-bold uppercase tracking-widest flex-shrink-0" style={{ color: primary }}>Created for</p>
                <h2 className="text-2xl font-black truncate" style={{ fontFamily: fontStack, color: T.heroText }}>{pitch.title}</h2>
              </div>
            </div>
            <div style={{ display: 'flex' }}>
              <div className="hidden lg:flex flex-col flex-shrink-0"
                style={{ width: 272, backgroundColor: T.heroBg, borderRight: `1px solid ${T.heroBorder}`, padding: '3rem 1.75rem', color: T.heroText }}>
                <div className="overflow-hidden mb-4" style={{ width: 68, height: 68, borderRadius: T.avatarRadius, backgroundColor: primary }}>
                  <AvatarEl size={68} />
                </div>
                {profile.name && <h1 className="text-2xl font-black leading-tight mb-5" style={{ fontFamily: fontStack }}>{profile.name}</h1>}
                {profile.niche_tags?.length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: T.heroSubtext }}>Niches</p>
                    <div className="flex flex-wrap gap-1.5">{profile.niche_tags.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${primary}20`, color: primary }}>{t}</span>)}</div>
                  </div>
                )}
                {(profile.location || profile.languages?.length > 0) && (
                  <div className="mb-5 space-y-1">
                    {profile.location && <p className="text-xs" style={{ color: T.heroSubtext }}>{profile.location}</p>}
                    {profile.languages?.length > 0 && <p className="text-xs" style={{ color: T.heroSubtext }}>{profile.languages.join(', ')}</p>}
                  </div>
                )}
                <Socials socials={profile.socials} variant="stacked" primary={primary} />
              </div>
              <div className="flex-1 min-w-0" style={{ padding: '3rem 3.5rem' }}>
                <div className="max-w-2xl space-y-10">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3 text-gray-400">About</p>
                    <p className="text-xl leading-relaxed" style={{ color: T.textColor }}>{profile.bio}</p>
                  </div>
                  {hasWhy && (
                    <div className="pl-6 py-1" style={{ borderLeft: `4px solid ${primary}` }}>
                      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: primary }}>Why Work With Me</p>
                      <blockquote className="text-xl font-semibold italic leading-relaxed" style={{ color: T.textColor }}>&ldquo;{whyText}&rdquo;</blockquote>
                    </div>
                  )}
                  <IntroBlock />
                  <CustomCard />
                  <ContentExamples />
                  <RatesSection pitch={pitch} T={T} primary={primary} />
                </div>
              </div>
            </div>
            <div className="py-8 text-center"><p className="text-xs text-gray-300 tracking-widest uppercase">Made with UGC Edge</p></div>
          </div>
        );

        // ── STACK (default) ──────────────────────────────────────────────────
        return (
          <div style={{ backgroundColor: T.bodyBg }}>
            <div style={{ backgroundColor: T.heroBg, color: T.heroText }}>
              <div style={{ borderBottom: `1px solid ${T.heroBannerBorder}`, backgroundColor: T.heroBannerBg }}>
                <div className="max-w-5xl mx-auto px-8 py-5 flex items-baseline gap-4">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: primary }}>Created for</p>
                  <h2 className="text-3xl font-black tracking-tight" style={{ fontFamily: fontStack, color: T.heroText }}>{pitch.title}</h2>
                </div>
              </div>
              <div className="max-w-5xl mx-auto px-8 pt-14 pb-16">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-8">
                  <div className="w-40 h-40 overflow-hidden flex-shrink-0 shadow-2xl" style={{ borderRadius: T.avatarRadius, backgroundColor: primary }}>
                    <AvatarEl size={160} />
                  </div>
                  <div className="flex-1">
                    {profile.name && <h1 className="text-5xl font-black tracking-tight leading-none mb-4" style={{ fontFamily: fontStack, color: T.heroText }}>{profile.name}</h1>}
                    <NicheTags borderColor={T.tagBorder} color={T.tagText} />
                    <div className="flex flex-wrap gap-3 mt-3">
                      {profile.location && <span className="text-xs" style={{ color: T.heroSubtext }}>{profile.location}</span>}
                      {profile.languages?.length > 0 && <span className="text-xs" style={{ color: T.heroSubtext }}>{profile.languages.join(', ')}</span>}
                    </div>
                  </div>
                  {profile.socials && Object.values(profile.socials).some(Boolean) && (
                    <div className="flex-shrink-0">
                      <Socials socials={profile.socials} variant="pills" primary={primary} />
                    </div>
                  )}
                </div>
              </div>
              <div className="h-px" style={{ background: `linear-gradient(to right, transparent, ${T.heroBorder}, transparent)` }} />
            </div>
            <div className="max-w-5xl mx-auto px-8 py-16 space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 p-8" style={{ backgroundColor: T.cardBg, borderRadius: T.cardRadius, boxShadow: T.cardShadow, border: T.cardBorder }}>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">About</p>
                  <p className="text-lg leading-relaxed" style={{ color: T.textColor }}>{profile.bio}</p>
                </div>
                {hasWhy && (
                  <div className="lg:col-span-2 p-8 flex flex-col justify-between relative overflow-hidden" style={{ backgroundColor: T.whyBg, borderRadius: T.cardRadius }}>
                    <p className="text-xs font-bold uppercase tracking-widest relative z-10" style={{ color: primary }}>Why Work With Me</p>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ color: primary, opacity: 0.07, fontSize: '18rem', lineHeight: 1, fontFamily: 'Georgia, serif' }}>&ldquo;</div>
                    <blockquote className="text-xl font-semibold leading-relaxed relative z-10 mt-6" style={{ color: T.whyText }}>&ldquo;{whyText}&rdquo;</blockquote>
                  </div>
                )}
              </div>
              <div className="p-8" style={{ backgroundColor: T.cardBg, borderRadius: T.cardRadius, boxShadow: T.cardShadow, borderLeft: T.accentBar, border: T.cardBorder }}>
                <IntroBlock />
              </div>
              <CustomCard />
              <ContentExamples />
              <RatesSection pitch={pitch} T={T} primary={primary} />
            </div>
            <div className="py-8 text-center"><p className="text-xs text-gray-300 tracking-widest uppercase">Made with UGC Edge</p></div>
          </div>
        );
      })()}
    </div>
  );
}
