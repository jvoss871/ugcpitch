'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { storage } from '@/lib/storage';

const NICHE_OPTIONS = [
  'beauty', 'tech', 'fitness', 'food', 'fashion', 'lifestyle',
  'saas', 'gaming', 'education', 'finance', 'health', 'travel', 'home', 'pet', 'other',
];

const LANGUAGE_OPTIONS = [
  'English', 'Spanish', 'French', 'Portuguese', 'German',
  'Italian', 'Japanese', 'Korean', 'Mandarin', 'Arabic', 'Hindi', 'Dutch',
];

const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram', placeholder: '@yourhandle' },
  { key: 'tiktok',    label: 'TikTok',    placeholder: '@yourhandle' },
  { key: 'youtube',   label: 'YouTube',   placeholder: '@yourchannel' },
  { key: 'canva',     label: 'Canva',     placeholder: 'canva.com/your-portfolio' },
  { key: 'email',     label: 'Email',     placeholder: 'you@email.com' },
];

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 400;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState(false);
  const [generatingWhy, setGeneratingWhy] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!authUser) { router.push('/'); return; }
    fetch(`/api/profile?username=${encodeURIComponent(authUser.username)}`)
      .then(r => r.json())
      .then(serverProfile => {
        const base = { socials: { instagram: '', tiktok: '', canva: '', email: '' }, languages: [], location: '' };
        if (!serverProfile.name) {
          const local = storage.getProfile(authUser.username);
          if (local.name) {
            fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: authUser.username, ...local }) }).catch(() => {});
          }
          setProfile({ ...base, ...local });
        } else {
          setProfile({ ...base, ...serverProfile });
        }
      })
      .catch(() => setProfile({ socials: { instagram: '', tiktok: '', canva: '', email: '' }, languages: [], location: '', ...storage.getProfile(authUser.username) }));
  }, [authUser]);


  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setProfile(p => ({ ...p, avatar: compressed }));
  };

  const handleSave = async () => {
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: authUser.username, ...profile }),
    }).catch(() => {});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleGenerateWhy = async () => {
    setGeneratingWhy(true);
    try {
      const res = await fetch('/api/generate-why', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: profile.bio,
          niches: profile.niche_tags,
          positioning_statement: profile.positioning_statement,
        }),
      });
      const { text } = await res.json();
      if (text) setProfile(p => ({ ...p, why_work_with_me: text }));
    } catch {
      // silently fail
    } finally {
      setGeneratingWhy(false);
    }
  };

  const setSocial = (key, val) =>
    setProfile(p => ({ ...p, socials: { ...p.socials, [key]: val } }));

  const toggleLanguage = (lang) =>
    setProfile(p => {
      const langs = p.languages || [];
      return { ...p, languages: langs.includes(lang) ? langs.filter(l => l !== lang) : [...langs, lang] };
    });

  if (!authUser || !profile) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-1 font-display">Profile</h1>
          <p className="text-gray-500 text-sm">This info shapes your pitch pages and AI output.</p>
        </div>
        <button onClick={handleSave} className="btn-primary">
          {saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-4">

        {/* Avatar + handle */}
        <div className="card">
          <div className="flex items-start gap-6">
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input type="text" disabled value={profile.username || ''}
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed text-sm" />
                <p className="text-xs text-gray-400 mt-1">Your login email</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.name || ''}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Alex Rivera"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Shown on your public pitch pages</p>
              </div>
            </div>

            <div className="flex-shrink-0 flex flex-col items-center gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-full overflow-hidden cursor-pointer ring-2 ring-offset-2 ring-teal-400 hover:ring-teal-600 transition"
              >
                {profile.avatar ? (
                  <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-teal-600 flex items-center justify-center text-white text-4xl font-bold">
                    {profile.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                {profile.avatar ? 'Change' : 'Upload Photo'}
              </button>
              {profile.avatar && (
                <button type="button" onClick={() => setProfile(p => ({ ...p, avatar: null }))}
                  className="text-xs text-red-500 hover:text-red-700 transition">
                  Remove
                </button>
              )}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>

        <div className="card">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={profile.location || ''}
                onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
                placeholder="e.g., Los Angeles, CA"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Languages</label>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGE_OPTIONS.map(lang => {
                  const active = (profile.languages || []).includes(lang);
                  return (
                    <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                      className="text-xs px-2.5 py-1 rounded-full border transition"
                      style={active
                        ? { backgroundColor: '#0d9488', borderColor: '#0d9488', color: '#fff' }
                        : { backgroundColor: '#f9fafb', borderColor: '#d1d5db', color: '#374151' }}>
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bio + positioning */}
        <div className="card space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
            <textarea value={profile.bio}
              onChange={e => setProfile({ ...profile, bio: e.target.value })}
              placeholder="e.g., I create engaging product demos and UGC ads for SaaS brands"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Positioning Statement</label>
            <textarea value={profile.positioning_statement}
              onChange={e => setProfile({ ...profile, positioning_statement: e.target.value })}
              placeholder="e.g., I specialize in creating authentic, high-converting UGC ads for B2B SaaS products."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Why Work With Me</label>
                <p className="text-xs text-gray-400 mt-0.5">Shown on your public pitch page. AI drafts it — you refine it.</p>
              </div>
              <button
                type="button"
                onClick={handleGenerateWhy}
                disabled={generatingWhy}
                className="text-xs px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {generatingWhy ? (
                  <><span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin inline-block" /> Generating…</>
                ) : (
                  'Generate'
                )}
              </button>
            </div>
            <textarea
              value={profile.why_work_with_me || ''}
              onChange={e => setProfile(p => ({ ...p, why_work_with_me: e.target.value }))}
              placeholder="Click Generate to create this from your bio and positioning, or write it yourself."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>
        </div>

        {/* Social links */}
        <div className="card space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Social Links</p>
            <p className="text-xs text-gray-400">Displayed on your public pitch page so brands can find you.</p>
          </div>
          {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                <input
                  type={key === 'email' ? 'email' : 'text'}
                  value={profile.socials?.[key] || ''}
                  onChange={e => setSocial(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Rates */}
        <div className="card space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Rates</p>
            <p className="text-xs text-gray-400">Build your packages. Add multiple deliverables to create bundles.</p>
          </div>
          {(profile.rates || []).map((rate, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-2.5">
              {(rate.lines || [{ qty: '1', item: '' }]).map((line, j) => (
                <div key={j} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-bold w-5 text-center flex-shrink-0">
                    {j === 0 ? '' : '+'}
                  </span>
                  <input
                    type="number" min="1" value={line.qty}
                    onChange={e => setProfile(p => {
                      const r = p.rates.map((rt, ri) => ri !== i ? rt : {
                        ...rt, lines: rt.lines.map((l, li) => li !== j ? l : { ...l, qty: e.target.value })
                      });
                      return { ...p, rates: r };
                    })}
                    className="w-14 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="text" value={line.item}
                    onChange={e => setProfile(p => {
                      const r = p.rates.map((rt, ri) => ri !== i ? rt : {
                        ...rt, lines: rt.lines.map((l, li) => li !== j ? l : { ...l, item: e.target.value })
                      });
                      return { ...p, rates: r };
                    })}
                    placeholder="Video, Image, Reel…"
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {(rate.lines || []).length > 1 && (
                    <button type="button"
                      onClick={() => setProfile(p => ({
                        ...p, rates: p.rates.map((rt, ri) => ri !== i ? rt : { ...rt, lines: rt.lines.filter((_, li) => li !== j) })
                      }))}
                      className="text-gray-300 hover:text-red-400 transition text-base leading-none flex-shrink-0">×</button>
                  )}
                </div>
              ))}

              <div className="flex items-center gap-2 pt-1">
                <span className="w-5 flex-shrink-0" />
                <button type="button"
                  onClick={() => setProfile(p => ({
                    ...p, rates: p.rates.map((rt, ri) => ri !== i ? rt : { ...rt, lines: [...(rt.lines || []), { qty: '1', item: '' }] })
                  }))}
                  className="text-xs text-teal-600 hover:text-teal-700 font-semibold transition">
                  + Add deliverable
                </button>
                <div className="flex-1" />
                <input
                  type="text" value={rate.price}
                  onChange={e => setProfile(p => ({ ...p, rates: p.rates.map((rt, ri) => ri !== i ? rt : { ...rt, price: e.target.value }) }))}
                  placeholder="$300"
                  className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="w-5 flex-shrink-0" />
                <input
                  type="text" value={rate.notes || ''}
                  onChange={e => setProfile(p => ({ ...p, rates: p.rates.map((rt, ri) => ri !== i ? rt : { ...rt, notes: e.target.value }) }))}
                  placeholder="Notes (optional)"
                  className="flex-1 px-3 py-1.5 border border-gray-200 bg-gray-50 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button type="button"
                  onClick={() => setProfile(p => ({ ...p, rates: (p.rates||[]).filter((_, ri) => ri !== i) }))}
                  className="text-xs text-gray-400 hover:text-red-500 transition flex-shrink-0">
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setProfile(p => ({ ...p, rates: [...(p.rates||[]), { lines: [{ qty: '1', item: '' }], price: '', notes: '' }] }))}
            className="text-sm text-teal-600 hover:text-teal-700 font-semibold transition"
          >
            + Add package
          </button>
        </div>

        {/* Niches */}
        <div className="card">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Your Niches</label>
          <div className="grid grid-cols-2 gap-2">
            {NICHE_OPTIONS.map(niche => (
              <label key={niche} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox"
                  checked={profile.niche_tags?.includes(niche) || false}
                  onChange={e => {
                    const tags = profile.niche_tags || [];
                    setProfile({ ...profile, niche_tags: e.target.checked ? [...tags, niche] : tags.filter(t => t !== niche) });
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                <span className="text-sm text-gray-700 capitalize">{niche}</span>
              </label>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
