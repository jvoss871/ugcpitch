'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { storage } from '@/lib/storage';
import { TEMPLATES, getTemplate, buildTheme } from '@/lib/templates';

const FONTS = [
  { name: 'Inter',              stack: 'Inter, sans-serif' },
  { name: 'Playfair Display',   stack: '"Playfair Display", serif' },
  { name: 'Space Grotesk',      stack: '"Space Grotesk", sans-serif' },
  { name: 'DM Serif Display',   stack: '"DM Serif Display", serif' },
  { name: 'Syne',               stack: 'Syne, sans-serif' },
  { name: 'Bebas Neue',         stack: '"Bebas Neue", sans-serif' },
  { name: 'Plus Jakarta Sans',  stack: '"Plus Jakarta Sans", sans-serif' },
  { name: 'Cormorant Garamond', stack: '"Cormorant Garamond", serif' },
];

function loadGoogleFont(name) {
  const id = `gfont-${name.replace(/\s/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;600;700;900&display=swap`;
  document.head.appendChild(link);
}

export default function BrandSetup() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [brand, setBrand] = useState(null);
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState(false);
  const [planStatus, setPlanStatus] = useState(null);
  const [handle, setHandle] = useState('');
  const [handleStatus, setHandleStatus] = useState(null);
  const [handleMsg, setHandleMsg] = useState('');
  const colorRefs = useRef([]);
  const handleTimer = useRef(null);

  useEffect(() => {
    if (!authUser) { router.push('/'); return; }
    FONTS.forEach(f => loadGoogleFont(f.name));
    fetch(`/api/plan?username=${encodeURIComponent(authUser.username)}`)
      .then(r => r.json())
      .then(d => { setPlanStatus(d); if (d.handle) setHandle(d.handle); })
      .catch(() => {});
    const defaults = { colors: ['#0d9488', '#0f1117', '#f5f4f0', '#111111'], font: 'Inter', templateId: 'modern' };
    fetch(`/api/brand?username=${encodeURIComponent(authUser.username)}`)
      .then(r => r.json())
      .then(serverBrand => setBrand({ ...defaults, ...serverBrand }))
      .catch(() => setBrand({ ...defaults, ...storage.getBrand(authUser.username) }));
    fetch(`/api/profile?username=${encodeURIComponent(authUser.username)}`)
      .then(r => r.json())
      .then(serverProfile => setProfile(serverProfile?.name ? serverProfile : storage.getProfile(authUser.username)))
      .catch(() => setProfile(storage.getProfile(authUser.username)));
  }, [authUser]);

  const validateHandle = (val) => {
    clearTimeout(handleTimer.current);
    const clean = val.toLowerCase().trim();
    if (!clean) { setHandleStatus(null); setHandleMsg(''); return; }
    if (!/^[a-z0-9-]+$/.test(clean) || clean.length < 2 || clean.length > 30) {
      setHandleStatus('invalid');
      setHandleMsg('Letters, numbers, and hyphens only, 2–30 characters');
      return;
    }
    setHandleStatus('checking');
    handleTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/validate-handle?handle=${encodeURIComponent(clean)}&username=${encodeURIComponent(authUser.username)}`);
      const { available, error } = await res.json();
      setHandleStatus(available ? 'available' : 'taken');
      setHandleMsg(error || (available ? `ugc-edge.com/${clean}/your-pitch` : 'This handle is already taken'));
    }, 400);
  };

  useEffect(() => {
    if (brand?.font) loadGoogleFont(brand.font);
  }, [brand?.font]);

  const handleSave = async () => {
    await fetch('/api/brand', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: authUser.username, ...brand, configured: true }),
    }).catch(() => {});
    if (planStatus?.features?.custom_url && handle.trim() && handleStatus === 'available') {
      await fetch('/api/handle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUser.username, handle: handle.trim() }),
      }).catch(() => {});
    }
    router.refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const setColor = (index, value) => {
    setBrand(b => {
      const colors = [...b.colors];
      colors[index] = value;
      return { ...b, colors };
    });
  };

  if (!authUser || !brand) return (
    <div className="max-w-2xl mx-auto animate-pulse space-y-6 py-4">
      <div className="h-9 w-36 bg-gray-100 rounded-lg" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="h-4 w-28 bg-gray-100 rounded" />
          <div className="h-12 bg-gray-100 rounded-lg" />
          <div className="h-12 bg-gray-100 rounded-lg" />
        </div>
      ))}
    </div>
  );

  const fontObj = FONTS.find(f => f.name === brand.font) ?? FONTS[0];
  const [primary, dark, bg, textColor = '#111111'] = brand.colors;
  const tmplPreview = getTemplate(brand.templateId ?? 'modern');
  const T = buildTheme(tmplPreview, primary, dark, bg, textColor);

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-1 font-display">Brand Setup</h1>
        <p className="text-gray-500 text-sm">Colors and font used on your shareable pitch pages.</p>
      </div>

      <div className="space-y-6">

        {/* Colors */}
        <div className="card space-y-5">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Brand Colors</p>
            <p className="text-xs text-gray-400">4 colors used across your pitch pages.</p>
          </div>
          <div className="flex gap-6">
            {brand.colors.map((color, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => colorRefs.current[i]?.click()}
                  className="w-16 h-16 rounded-2xl border-4 border-white shadow-md hover:scale-105 transition-transform relative"
                  style={{ backgroundColor: color }}
                >
                  <span className="absolute bottom-1 right-1 text-[10px]">✏️</span>
                </button>
                <input ref={el => colorRefs.current[i] = el} type="color" value={color}
                  onChange={e => setColor(i, e.target.value)} className="sr-only" />
                <span className="text-xs font-mono text-gray-400">{color}</span>
                <span className="text-xs text-gray-400">{i === 0 ? 'Primary' : i === 1 ? 'Dark' : i === 2 ? 'Background' : 'Text'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Font */}
        <div className="card space-y-5">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Heading Font</p>
            <p className="text-xs text-gray-400">Used for your name and headings on pitch pages.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {FONTS.map(font => (
              <button key={font.name} onClick={() => setBrand(b => ({ ...b, font: font.name }))}
                className="px-4 py-3 rounded-xl border-2 text-left transition-all hover:border-teal-400"
                style={{
                  borderColor: brand.font === font.name ? '#0d9488' : '#e5e7eb',
                  backgroundColor: brand.font === font.name ? '#f0fdfa' : '#fff',
                }}>
                <p className="text-xs text-gray-400 mb-1">
                  {brand.font === font.name && <span className="text-teal-500 mr-1">✓</span>}
                  {font.name}
                </p>
                <p className="text-xl text-gray-900 truncate" style={{ fontFamily: font.stack }}>
                  Your Name
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Template picker */}
        <div className="card space-y-5">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Page Template</p>
            <p className="text-xs text-gray-400">Controls the layout and style of your public pitch page.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {TEMPLATES.map(tmpl => {
              const isActive = (brand.templateId ?? 'modern') === tmpl.id;
              const heroBg =
                tmpl.hero === 'dark'    ? dark :
                tmpl.hero === 'primary' ? primary :
                '#ffffff';
              const heroText = tmpl.hero === 'white' ? '#111' : '#fff';
              const bodyBg = tmpl.bodyBg === 'white' ? '#fff' : tmpl.bodyBg === 'cream' ? '#faf9f6' : bg;
              const avatarR = tmpl.avatarShape === 'circle' ? '9999px' : '8px';
              const cardB = tmpl.cardStyle === 'border' ? '1px solid #e5e7eb' : 'none';
              const cardS = tmpl.cardStyle === 'border' ? 'none' : '0 1px 4px rgba(0,0,0,0.08)';

              return (
                <button
                  key={tmpl.id}
                  onClick={() => setBrand(b => ({ ...b, templateId: tmpl.id }))}
                  className="text-left rounded-2xl transition-all"
                  style={{
                    boxShadow: isActive
                      ? '0 0 0 3px #0d9488'
                      : '0 0 0 1px #e5e7eb',
                  }}
                >
                  {/* Mini preview */}
                  <div className="w-full overflow-hidden rounded-xl" style={{ backgroundColor: bodyBg, height: 140 }}>

                    {/* STACK (Modern) */}
                    {tmpl.layout === 'stack' && <>
                      <div style={{ backgroundColor: heroBg, padding: '10px 12px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 28, height: 28, borderRadius: avatarR, backgroundColor: primary, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ height: 4, width: 60, borderRadius: 2, backgroundColor: heroText, opacity: 0.9, marginBottom: 4 }} />
                            <div style={{ height: 3, width: 40, borderRadius: 2, backgroundColor: heroText, opacity: 0.4 }} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <div style={{ height: 6, width: 30, borderRadius: 3, backgroundColor: 'rgba(131,58,180,0.6)' }} />
                            <div style={{ height: 6, width: 30, borderRadius: 3, backgroundColor: '#010101', opacity: 0.5 }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: '8px 10px', display: 'flex', gap: 6 }}>
                        <div style={{ flex: 2, borderRadius: 6, backgroundColor: '#fff', border: cardB, boxShadow: cardS, padding: '7px 8px' }}>
                          <div style={{ height: 3, width: '80%', borderRadius: 2, backgroundColor: '#d1d5db', marginBottom: 4 }} />
                          <div style={{ height: 3, width: '60%', borderRadius: 2, backgroundColor: '#e5e7eb' }} />
                        </div>
                        <div style={{ flex: 1, borderRadius: 6, backgroundColor: dark, border: cardB, boxShadow: cardS, padding: '7px 8px', display: 'flex', alignItems: 'flex-end' }}>
                          <div style={{ height: 3, width: '90%', borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' }} />
                        </div>
                      </div>
                      <div style={{ padding: '0 10px' }}>
                        <div style={{ borderRadius: 6, backgroundColor: '#fff', border: cardB, boxShadow: cardS, padding: '7px 8px', borderLeft: `3px solid ${primary}` }}>
                          <div style={{ height: 3, width: '70%', borderRadius: 2, backgroundColor: '#d1d5db' }} />
                        </div>
                      </div>
                    </>}

                    {/* CENTERED (Minimal) */}
                    {tmpl.layout === 'centered' && <>
                      <div style={{ backgroundColor: heroBg, padding: '14px 12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: primary }} />
                        <div style={{ height: 4, width: 55, borderRadius: 2, backgroundColor: heroText, opacity: 0.85 }} />
                        <div style={{ height: 3, width: 38, borderRadius: 2, backgroundColor: heroText, opacity: 0.35 }} />
                        <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                          {['#833ab4','#010101','#FF0000'].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c }} />)}
                        </div>
                      </div>
                      <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 4, backgroundColor: bodyBg }}>
                        <div style={{ height: 3, width: '88%', borderRadius: 2, backgroundColor: '#d1d5db' }} />
                        <div style={{ height: 3, width: '70%', borderRadius: 2, backgroundColor: '#e5e7eb' }} />
                        <div style={{ height: 1, backgroundColor: `${primary}40`, margin: '4px 0' }} />
                        <div style={{ height: 4, width: '65%', borderRadius: 2, backgroundColor: `${primary}60`, alignSelf: 'center' }} />
                        <div style={{ height: 3, width: '50%', borderRadius: 2, backgroundColor: `${primary}40`, alignSelf: 'center' }} />
                      </div>
                    </>}

                    {/* COVER (Bold) */}
                    {tmpl.layout === 'cover' && <>
                      <div style={{ backgroundColor: primary, padding: '12px 12px 18px' }}>
                        <div style={{ height: 3, width: 35, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)', marginBottom: 4 }} />
                        <div style={{ height: 5, width: 60, borderRadius: 2, backgroundColor: '#fff', marginBottom: 8 }} />
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
                          <div style={{ width: 28, height: 28, borderRadius: avatarR, backgroundColor: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.5)', flexShrink: 0 }} />
                          <div>
                            <div style={{ height: 4, width: 48, borderRadius: 2, backgroundColor: '#fff', marginBottom: 3 }} />
                            <div style={{ height: 3, width: 30, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.45)' }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ backgroundColor: bodyBg, borderRadius: '10px 10px 0 0', marginTop: -8, padding: '8px 10px', display: 'flex', gap: 5 }}>
                        <div style={{ flex: 1, borderRadius: 5, backgroundColor: '#fff', border: cardB, boxShadow: cardS, padding: '6px 7px' }}>
                          <div style={{ height: 3, width: '80%', borderRadius: 2, backgroundColor: '#d1d5db', marginBottom: 3 }} />
                          <div style={{ height: 3, width: '55%', borderRadius: 2, backgroundColor: '#e5e7eb' }} />
                        </div>
                        <div style={{ flex: 1, borderRadius: 5, backgroundColor: '#fff', border: cardB, boxShadow: cardS, padding: '6px 7px' }}>
                          <div style={{ height: 3, width: '80%', borderRadius: 2, backgroundColor: '#d1d5db', marginBottom: 3 }} />
                          <div style={{ height: 3, width: '55%', borderRadius: 2, backgroundColor: '#e5e7eb' }} />
                        </div>
                      </div>
                    </>}

                    {/* SIDEBAR (Editorial) */}
                    {tmpl.layout === 'sidebar' && <>
                      <div style={{ height: 18, backgroundColor: heroBg, borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px' }}>
                        <div style={{ height: 2, width: 28, borderRadius: 1, backgroundColor: primary }} />
                        <div style={{ height: 3, width: 45, borderRadius: 1, backgroundColor: heroText, opacity: 0.7 }} />
                      </div>
                      <div style={{ display: 'flex', height: 122 }}>
                        <div style={{ width: 42, backgroundColor: heroBg, borderRight: '1px solid rgba(255,255,255,0.1)', padding: '8px 6px', flexShrink: 0 }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: primary, marginBottom: 5 }} />
                          <div style={{ height: 3, width: '85%', borderRadius: 2, backgroundColor: heroText, opacity: 0.7, marginBottom: 3 }} />
                          <div style={{ height: 2, width: '60%', borderRadius: 2, backgroundColor: heroText, opacity: 0.35, marginBottom: 8 }} />
                          {[0.25,0.25,0.25].map((o,i) => <div key={i} style={{ height: 2, width: '70%', borderRadius: 2, backgroundColor: heroText, opacity: o, marginBottom: 4 }} />)}
                        </div>
                        <div style={{ flex: 1, backgroundColor: bodyBg, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ height: 3, width: '90%', borderRadius: 2, backgroundColor: '#d1d5db' }} />
                          <div style={{ height: 3, width: '70%', borderRadius: 2, backgroundColor: '#e5e7eb' }} />
                          <div style={{ height: 3, width: '80%', borderRadius: 2, backgroundColor: '#e5e7eb' }} />
                          <div style={{ height: 16, borderLeft: `3px solid ${primary}`, paddingLeft: 5, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3, marginTop: 4 }}>
                            <div style={{ height: 3, width: '75%', borderRadius: 2, backgroundColor: '#d1d5db' }} />
                            <div style={{ height: 3, width: '55%', borderRadius: 2, backgroundColor: '#e5e7eb' }} />
                          </div>
                        </div>
                      </div>
                    </>}

                  </div>

                  {/* Label */}
                  <div className="px-2 pt-2 pb-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-900">{tmpl.name}</p>
                    </div>
                    <p className="text-xs text-gray-400">{tmpl.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subdomain */}
        {(() => {
          const canUse = planStatus?.features?.custom_url;
          return (
            <div className={`card relative ${!canUse ? 'opacity-75' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-gray-700">Subdomain</label>
                {canUse
                  ? <span className="text-xs bg-teal-100 text-teal-700 font-bold px-2 py-0.5 rounded-full">Pro</span>
                  : <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      Pro only
                    </span>
                }
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Share pitches as <span className="font-mono">ugc-edge.com/your-handle/pitch-id</span>
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 flex-shrink-0">ugc-edge.com/</span>
                <input
                  type="text"
                  value={handle}
                  onChange={e => { if (canUse) { setHandle(e.target.value); validateHandle(e.target.value); } }}
                  placeholder="sarah-creates"
                  disabled={!canUse}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              {canUse && handleStatus === 'checking' && (
                <p className="text-xs text-gray-400 mt-2">Checking availability…</p>
              )}
              {canUse && handleMsg && handleStatus !== 'checking' && (
                <p className={`text-xs mt-2 ${handleStatus === 'available' ? 'text-teal-600' : 'text-red-500'}`}>
                  {handleMsg}
                </p>
              )}
              {canUse && !handleMsg && handle && handleStatus === null && (
                <p className="text-xs text-gray-400 mt-2">
                  Current: <span className="font-mono font-semibold">ugc-edge.com/{handle}</span>
                </p>
              )}
              {!canUse && (
                <p className="text-xs text-gray-400 mt-2">
                  <a href="/upgrade" className="text-teal-600 font-semibold hover:underline">Upgrade to Pro</a> to set a custom URL.
                </p>
              )}
            </div>
          );
        })()}

        {/* Preview */}
        <div key={`preview-${brand.templateId}-${brand.colors.join('-')}-${brand.font}`} className="card overflow-hidden p-0">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Live Preview</p>
            <p className="text-xs text-gray-400">{tmplPreview.name} template · {brand.font}</p>
          </div>
          <div className="p-6" style={{ backgroundColor: T.bodyBg === '#ffffff' ? '#f3f4f6' : T.bodyBg }}>
            <div className="rounded-2xl overflow-hidden shadow-lg border border-black/5">

              {/* ── Centered layout (Minimal) ── */}
              {T.layout === 'centered' && (
                <>
                  <div style={{ backgroundColor: T.heroBannerBg, borderBottom: `1px solid ${T.heroBannerBorder}` }}
                    className="px-5 py-2 flex items-baseline gap-3">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: primary }}>Pitched for</p>
                    <p className="text-sm font-black" style={{ fontFamily: fontObj.stack, color: T.heroText }}>Brand Name</p>
                  </div>
                  <div className="px-5 py-5 flex flex-col items-center text-center"
                    style={{ backgroundColor: T.heroBg, borderBottom: '1px solid #e5e7eb' }}>
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center font-black text-lg mb-2"
                      style={{ backgroundColor: primary, borderRadius: T.avatarRadius, color: '#fff' }}>
                      {authUser.username?.[0]?.toUpperCase()}
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: T.heroText, opacity: 0.6 }}>UGC Creator</p>
                    {profile?.name && (
                      <p className="font-black text-xl leading-none" style={{ fontFamily: fontObj.stack, color: T.heroText }}>
                        {profile.name}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full" style={{ backgroundColor: `${primary}22`, border: `1px solid ${primary}44` }} />
                      ))}
                    </div>
                  </div>
                  <div className="px-5 py-4" style={{ backgroundColor: T.bodyBg }}>
                    <div className="px-4 py-3"
                      style={{ backgroundColor: T.cardBg, borderRadius: T.cardRadius, border: T.cardBorder, boxShadow: T.cardShadow ?? '0 1px 3px rgba(0,0,0,0.08)' }}>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">About</p>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {profile?.bio || 'Your bio will appear here.'}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* ── Cover layout (Bold) ── */}
              {T.layout === 'cover' && (
                <>
                  <div style={{ backgroundColor: T.heroBg, paddingBottom: '2rem' }}
                    className="px-5 pt-4">
                    <div className="flex items-baseline gap-2 mb-4">
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: T.heroText, opacity: 0.6 }}>Pitched for</p>
                      <p className="text-sm font-black" style={{ fontFamily: fontObj.stack, color: T.heroText }}>Brand Name</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center font-black text-lg"
                        style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: T.avatarRadius, color: T.heroText }}>
                        {authUser.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: T.heroText, opacity: 0.65 }}>UGC Creator</p>
                        {profile?.name && (
                          <p className="font-black text-xl leading-none" style={{ fontFamily: fontObj.stack, color: T.heroText }}>
                            {profile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-4 -mt-4"
                    style={{ backgroundColor: T.bodyBg, borderRadius: '1.5rem 1.5rem 0 0' }}>
                    <div className="px-4 py-3"
                      style={{ backgroundColor: T.cardBg, borderRadius: T.cardRadius, border: T.cardBorder, boxShadow: T.cardShadow ?? '0 1px 3px rgba(0,0,0,0.08)' }}>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">About</p>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {profile?.bio || 'Your bio will appear here.'}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* ── Sidebar layout (Editorial) ── */}
              {T.layout === 'sidebar' && (
                <div className="flex" style={{ minHeight: '130px' }}>
                  <div className="flex-shrink-0 px-3 py-4 flex flex-col gap-2" style={{ width: '80px', backgroundColor: T.heroBg }}>
                    <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center font-black text-sm"
                      style={{ backgroundColor: primary, borderRadius: T.avatarRadius, color: '#fff' }}>
                      {authUser.username?.[0]?.toUpperCase()}
                    </div>
                    {profile?.name && (
                      <p className="text-[9px] font-black leading-tight" style={{ fontFamily: fontObj.stack, color: T.heroText }}>
                        {profile.name}
                      </p>
                    )}
                    <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: primary }}>Creator</p>
                    <div className="mt-auto flex flex-col gap-1">
                      {[1,2,3].map(i => (
                        <div key={i} className="text-[8px] font-semibold" style={{ color: T.heroText, opacity: 0.5 }}>— IG</div>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 px-3 py-4" style={{ backgroundColor: T.bodyBg }}>
                    <div className="px-2 py-2 mb-2 text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-baseline gap-2">
                      <span style={{ color: primary }}>Pitched for</span>
                      <span className="font-black text-gray-700" style={{ fontFamily: fontObj.stack }}>Brand Name</span>
                    </div>
                    <div className="px-3 py-2.5"
                      style={{ backgroundColor: T.cardBg, borderRadius: T.cardRadius, border: T.cardBorder, boxShadow: T.cardShadow ?? '0 1px 3px rgba(0,0,0,0.08)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">About</p>
                      <p className="text-[10px] text-gray-600 leading-relaxed line-clamp-3">
                        {profile?.bio || 'Your bio will appear here.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Stack layout (Modern, default) ── */}
              {(T.layout === 'stack' || !T.layout) && (
                <>
                  <div style={{ backgroundColor: T.heroBannerBg, borderBottom: `1px solid ${T.heroBannerBorder}` }}
                    className="px-5 py-2.5 flex items-baseline gap-3">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: primary }}>Pitched for</p>
                    <p className="text-sm font-black" style={{ fontFamily: fontObj.stack, color: T.heroText }}>Brand Name</p>
                  </div>
                  <div className="px-5 py-5 flex items-center gap-4"
                    style={{ backgroundColor: T.heroBg, borderBottom: T.heroBg === '#ffffff' ? '1px solid #e5e7eb' : 'none' }}>
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center font-black text-lg"
                      style={{ backgroundColor: primary, borderRadius: T.avatarRadius, color: '#fff' }}>
                      {authUser.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: primary }}>UGC Creator</p>
                      {profile?.name && (
                        <p className="font-black text-xl leading-none" style={{ fontFamily: fontObj.stack, color: T.heroText }}>
                          {profile.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="px-5 py-4 flex gap-3" style={{ backgroundColor: T.bodyBg }}>
                    <div className="flex-1 px-4 py-3"
                      style={{ backgroundColor: T.cardBg, borderRadius: T.cardRadius, border: T.cardBorder, boxShadow: T.cardShadow ?? '0 1px 3px rgba(0,0,0,0.08)' }}>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">About</p>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {profile?.bio || 'Your bio will appear here.'}
                      </p>
                    </div>
                    {(profile?.why_work_with_me || profile?.positioning_statement) && (
                      <div className="w-28 px-3 py-3 flex-shrink-0"
                        style={{ backgroundColor: T.whyBg, borderRadius: T.cardRadius }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: primary }}>Why Me</p>
                        <p className="text-[10px] leading-relaxed line-clamp-3 italic" style={{ color: T.whyText }}>
                          &ldquo;{profile.why_work_with_me || profile.positioning_statement}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

            </div>
          </div>
        </div>

      </div>

      <button onClick={handleSave} className="btn-primary mt-6 w-full">
        {saved ? '✓ Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}
