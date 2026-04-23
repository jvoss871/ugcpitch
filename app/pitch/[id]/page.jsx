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
    if (authUser && pitchId) {
      const loadedPitch = storage.getPitch(authUser.username, pitchId);
      const loadedProfile = storage.getProfile(authUser.username);
      const loadedContent = storage.getContent(authUser.username);
      const loadedBrand = storage.getBrand(authUser.username);
      if (loadedPitch) {
        setCustomContent(loadedPitch.customContent ?? null);
        setPitch(loadedPitch);
        setProfile({
          socials: { instagram: '', tiktok: '', youtube: '', canva: '', email: '' },
          languages: [],
          location: '',
          why_work_with_me: '',
          ...loadedProfile,
          brand: loadedBrand,
        });
        setAllContent(loadedContent);
        setEditedTitle(loadedPitch.title);
        setEditedIntro(loadedPitch.intro);
        setEditedOutreach(loadedPitch.outreach);
        setSelectedContentIds((loadedPitch.selectedContent || []).map(c => c.id));
      }
    }
  }, [authUser, pitchId]);

  const handleSaveEdits = () => {
    const updatedContent = allContent.filter(c => selectedContentIds.includes(c.id));
    // Clear shareId so the next copy regenerates with updated content
    storage.updatePitch(authUser.username, pitchId, {
      title: editedTitle,
      intro: editedIntro,
      outreach: editedOutreach,
      selectedContent: updatedContent,
      shareId: null,
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

    // Reuse existing shareId — only create a new one the first time
    if (pitch.shareId) {
      navigator.clipboard.writeText(buildUrl(pitch.shareId));
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      return;
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
      storage.updatePitch(authUser.username, pitchId, { shareId: id });
      setPitch(p => ({ ...p, shareId: id }));
      navigator.clipboard.writeText(buildUrl(id));
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Share link error:', err);
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
      // Update opens in localStorage so dashboard badge stays current
      const opens = Array.from({ length: data.views }, (_, i) => ({ timestamp: i === 0 ? (data.lastViewed ?? new Date().toISOString()) : new Date().toISOString() }));
      storage.updatePitch(authUser.username, pitchId, { opens });
    } catch { setAnalytics(null); }
    setShowAnalytics(true);
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!authUser || !pitch || !profile) return null;

  // Build theme for preview
  const brand = profile.brand ?? { colors: ['#0d9488', '#0f1117', '#f5f4f0'], font: 'Inter', templateId: 'modern' };
  const [primary, dark, bg] = brand.colors;
  const fontStack = `"${brand.font}", sans-serif`;
  const tmpl = getTemplate(brand.templateId ?? 'modern');
  const T = buildTheme(tmpl, primary, dark, bg);
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
              <p className="text-sm text-gray-400">No views yet.</p>
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

      <div style={{ backgroundColor: T.bodyBg }}>

        {/* Hero — pitched for banner */}
        <div style={{ backgroundColor: T.heroBg, color: T.heroText }}>
          <div style={{ borderBottom: `1px solid ${T.heroBannerBorder}`, backgroundColor: T.heroBannerBg }}>
            <div className="max-w-5xl mx-auto px-8 py-5 flex items-baseline gap-4">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: primary }}>Pitched for</p>
              <h2 className="text-3xl font-black tracking-tight" style={{ fontFamily: fontStack, color: T.heroText }}>
                {pitch.title}
              </h2>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-8 pt-14 pb-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-8">
              <div className="w-40 h-40 overflow-hidden flex-shrink-0 shadow-2xl"
                style={{ borderRadius: T.avatarRadius, backgroundColor: primary }}>
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl font-black text-white">{initial}</div>
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

              {/* Socials */}
              {profile.socials && Object.values(profile.socials).some(Boolean) && (
                <div className="flex flex-col gap-2 flex-shrink-0 sm:items-end">
                  {profile.socials.instagram && (
                    <a href={`https://instagram.com/${profile.socials.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition hover:scale-105"
                      style={{ background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', color: '#fff' }}>
                      {profile.socials.instagram}
                    </a>
                  )}
                  {profile.socials.tiktok && (
                    <a href={`https://tiktok.com/@${profile.socials.tiktok.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition hover:scale-105"
                      style={{ backgroundColor: '#010101', color: '#fff' }}>
                      {profile.socials.tiktok}
                    </a>
                  )}
                  {profile.socials.youtube && (
                    <a href={`https://youtube.com/@${profile.socials.youtube.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition hover:scale-105"
                      style={{ backgroundColor: '#FF0000', color: '#fff' }}>
                      {profile.socials.youtube}
                    </a>
                  )}
                  {profile.socials.canva && (
                    <a href={profile.socials.canva.startsWith('http') ? profile.socials.canva : `https://${profile.socials.canva}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition hover:scale-105"
                      style={{ backgroundColor: '#7D2AE8', color: '#fff' }}>
                      Canva Portfolio
                    </a>
                  )}
                  {profile.socials.email && (
                    <a href={`mailto:${profile.socials.email}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition hover:scale-105"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
                      {profile.socials.email}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="h-px" style={{ background: `linear-gradient(to right, transparent, ${T.heroBorder}, transparent)` }} />
        </div>

        {/* Body */}
        <div className="max-w-5xl mx-auto px-8 py-16 space-y-12">

          {/* About + Why Work With Me */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 p-8"
              style={{ backgroundColor: T.cardBg, borderRadius: T.cardRadius, boxShadow: T.cardShadow, border: T.cardBorder }}>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">About</p>
              <p className="text-gray-800 text-lg leading-relaxed">{profile.bio}</p>
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

          {/* Intro */}
          <div className="p-8"
            style={{ backgroundColor: T.cardBg, borderRadius: T.cardRadius, boxShadow: T.cardShadow, borderLeft: T.accentBar, border: T.cardBorder }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Why I&rsquo;m the right fit for {pitch.title}
              </p>
              {editMode && <span className="text-xs text-teal-600 font-semibold">Editing</span>}
            </div>
            {editMode ? (
              <textarea value={editedIntro} onChange={e => setEditedIntro(e.target.value)} rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
            ) : (
              <p className="text-gray-800 text-lg leading-relaxed">{pitch.intro}</p>
            )}
          </div>

          {/* Custom content — display only, set at creation */}
          {customContent?.url && (
            <div className="p-8 relative overflow-hidden"
              style={{ backgroundColor: T.whyBg, borderRadius: T.cardRadius }}>
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5 pointer-events-none"
                style={{ backgroundColor: primary, transform: 'translate(30%,-30%)' }} />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span style={{ color: primary }} className="text-lg">✦</span>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: primary }}>Made for {pitch.title}</p>
                </div>
                {customContent.label && <p className="text-white text-2xl font-bold mb-6">{customContent.label}</p>}
                <CustomContentEmbed url={customContent.url} primary={primary} />
              </div>
            </div>
          )}

          {/* Content examples */}
          {(editMode ? pitchContent.length > 0 || allContent.length > 0 : pitchContent.length > 0) && (
            <div>
              <div className="flex items-baseline justify-between mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Content Examples</p>
                {editMode && <span className="text-xs text-teal-600 font-semibold">Select pieces to include</span>}
              </div>
              {editMode ? (
                <div className="space-y-2">
                  {allContent.map(item => (
                    <label key={item.id}
                      className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer hover:bg-gray-50 transition"
                      style={selectedContentIds.includes(item.id) ? { borderColor: '#0d9488', backgroundColor: '#f0fdfa' } : { borderColor: '#e5e7eb' }}>
                      <input type="checkbox" checked={selectedContentIds.includes(item.id)}
                        onChange={e => setSelectedContentIds(s => e.target.checked ? [...s, item.id] : s.filter(id => id !== item.id))}
                        className="w-4 h-4 mt-1 rounded border-gray-300 text-teal-600" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                        {item.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.tags.map(tag => (
                              <span key={tag} className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded capitalize">{tag}</span>
                            ))}
                          </div>
                        )}
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
          )}
        </div>

        <div className="py-8" style={{ borderTop: '1px solid #e5e7eb' }}>
          <p className="text-center text-xs text-gray-300 tracking-widest uppercase">Made with UGC Pitch</p>
        </div>
      </div>
    </div>
  );
}
