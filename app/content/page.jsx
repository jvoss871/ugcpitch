'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { storage } from '@/lib/storage';

const AVAILABLE_TAGS = [
  'beauty', 'tech', 'fitness', 'food', 'fashion', 'lifestyle',
  'saas', 'gaming', 'education', 'finance', 'health', 'travel', 'home', 'pet',
];

function getYouTubeId(url) {
  const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function compressImage(file, maxDimension = 900, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Thumbnail({ item }) {
  const ytId = item.type === 'video' ? getYouTubeId(item.url) : null;
  if (item.type === 'video') {
    if (ytId) return (
      <div className="relative w-full h-full">
        <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </div>
    );
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
        <svg className="w-8 h-8 opacity-50" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </div>
    );
  }
  return <img src={item.url} alt={item.title} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />;
}

const EMPTY_FORM = { title: '', url: '', description: '', tags: [], type: 'image', featured: false };

export default function Content() {
  const { user: authUser, loading } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [inputMode, setInputMode] = useState('upload');
  const [preview, setPreview] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [activeType, setActiveType] = useState('all');
  const [activeTags, setActiveTags] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!loading && !authUser) router.push('/');
  }, [authUser, loading, router]);

  useEffect(() => {
    if (!authUser) return;
    fetch(`/api/content?username=${encodeURIComponent(authUser.username)}`)
      .then(r => r.json())
      .then(async serverContent => {
        if (serverContent.length === 0) {
          const local = storage.getContent(authUser.username);
          if (local.length > 0) {
            await Promise.all(local.map(item =>
              fetch('/api/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: authUser.username, ...item }),
              })
            ));
            storage.saveContent(authUser.username, []);
            setContent(local);
            return;
          }
        }
        setContent(serverContent);
      })
      .catch(() => setContent(storage.getContent(authUser.username)));
  }, [authUser]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      setPreview(compressed);
      setFormData(f => ({ ...f, url: compressed }));
    } catch {
      alert('Could not process image.');
    } finally {
      setCompressing(false);
    }
  };

  const handleTypeChange = (type) => {
    setFormData(f => ({ ...f, type, url: '' }));
    setPreview(null);
    setInputMode(type === 'video' ? 'url' : 'upload');
  };

  const handleAddContent = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.url.trim()) {
      alert('Please fill in title and add an image or URL');
      return;
    }
    const res = await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: authUser.username, ...formData }),
    });
    const newItem = await res.json();
    setContent(c => [...c, newItem]);
    setFormData(EMPTY_FORM);
    setPreview(null);
    setInputMode('upload');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowPanel(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this content?')) return;
    await fetch(`/api/content/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: authUser.username }),
    });
    setContent(c => c.filter(x => x.id !== id));
  };

  const handleToggleFeatured = async (id) => {
    const item = content.find(c => c.id === id);
    const featured = !item.featured;
    await fetch(`/api/content/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: authUser.username, featured }),
    });
    setContent(c => c.map(x => x.id === id ? { ...x, featured } : x));
  };

  const usedTags = [...new Set(content.flatMap(c => c.tags || []))].sort();
  const filtered = content.filter(c => {
    if (activeType === 'image' && c.type !== 'image') return false;
    if (activeType === 'video' && c.type !== 'video') return false;
    if (activeType === 'featured' && !c.featured) return false;
    if (activeTags.length > 0 && !activeTags.some(t => (c.tags || []).includes(t))) return false;
    return true;
  });

  if (loading) return (
    <div className="animate-pulse space-y-6 py-4">
      <div className="flex items-center justify-between">
        <div className="h-9 w-44 bg-gray-100 rounded-lg" />
        <div className="h-9 w-28 bg-gray-100 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {[...Array(10)].map((_, i) => <div key={i} className="aspect-square bg-gray-100 rounded-xl" />)}
      </div>
    </div>
  );
  if (!authUser) return null;

  return (
    <div className="animate-fade-in-up">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 font-display">Content Library</h1>
          <p className="text-sm text-gray-500 mt-1">{content.length} piece{content.length !== 1 ? 's' : ''} · AI matches these to your pitches</p>
        </div>
        <button onClick={() => setShowPanel(true)} className="btn-primary">+ Add Content</button>
      </div>

      {/* Filter bar */}
      {content.length > 0 && (
        <div className="mb-6 space-y-2">
          {/* Type row */}
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: `All (${content.length})` },
              { id: 'image', label: `🖼 Images (${content.filter(c => c.type === 'image').length})` },
              { id: 'video', label: `Videos (${content.filter(c => c.type === 'video').length})` },
              { id: 'featured', label: `⭐ Featured` },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => setActiveType(id)}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition"
                style={activeType === id
                  ? { backgroundColor: '#0f1117', color: '#fff' }
                  : { backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Tag row */}
          {usedTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {usedTags.map(tag => {
                const active = activeTags.includes(tag);
                return (
                  <button key={tag} onClick={() => setActiveTags(ts => active ? ts.filter(t => t !== tag) : [...ts, tag])}
                    className="text-xs px-3 py-1.5 rounded-full font-medium transition capitalize"
                    style={active
                      ? { backgroundColor: '#0d9488', color: '#fff' }
                      : { backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                    {tag}
                  </button>
                );
              })}
              {activeTags.length > 0 && (
                <button onClick={() => setActiveTags([])} className="text-xs text-gray-400 hover:text-gray-600 transition ml-1">
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          {content.length === 0 ? (
            <>
              <p className="text-4xl mb-3 opacity-20">—</p>
              <p className="text-sm mb-4">Nothing here yet. Add your best work — the AI matches it to brands automatically.</p>
              <button onClick={() => setShowPanel(true)} className="btn-primary">+ Add your first piece</button>
            </>
          ) : (
            <p className="text-sm mb-3">No content matches the selected filters.</p>
            <button onClick={() => { setActiveType('all'); setActiveTags([]); }}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(item => (
            <div key={item.id} className="group relative rounded-xl overflow-hidden bg-gray-100 aspect-square cursor-pointer">
              <Thumbnail item={item} />

              {/* Type badge */}
              <div className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${item.type === 'video' ? 'bg-red-600 text-white' : 'bg-black/50 text-white'}`}>
                {item.type === 'video' ? 'VIDEO' : 'IMG'}
              </div>

              {item.featured && (
                <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  ⭐
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => handleToggleFeatured(item.id)}
                    title={item.featured ? 'Unfeature' : 'Feature'}
                    className="w-7 h-7 rounded-full bg-white/20 hover:bg-yellow-400 hover:text-yellow-900 text-white text-xs flex items-center justify-center transition">
                    ⭐
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="w-7 h-7 rounded-full bg-white/20 hover:bg-red-500 text-white text-xs flex items-center justify-center transition">
                    ✕
                  </button>
                </div>
                <div>
                  <p className="text-white text-xs font-semibold truncate">{item.title}</p>
                  {item.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded capitalize">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add content slide-in panel */}
      {showPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPanel(false)} />
          <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Add Content</h2>
              <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-gray-600 text-xl transition">×</button>
            </div>

            <form onSubmit={handleAddContent} className="flex-1 px-6 py-5 space-y-5">

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <div className="flex gap-2">
                  {['image', 'video'].map(t => (
                    <label key={t}
                      className="flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border-2 flex-1 justify-center transition"
                      style={formData.type === t ? { borderColor: '#0d9488', backgroundColor: '#f0fdfa' } : { borderColor: '#e5e7eb' }}>
                      <input type="radio" name="type" value={t} checked={formData.type === t}
                        onChange={() => handleTypeChange(t)} className="sr-only" />
                      <span className="text-sm font-medium">{t === 'image' ? 'Image' : 'Video'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Image input */}
              {formData.type === 'image' && (
                <div>
                  <div className="flex gap-1 mb-3 bg-gray-100 rounded-lg p-1 w-fit">
                    {['upload', 'url'].map(mode => (
                      <button key={mode} type="button"
                        onClick={() => { setInputMode(mode); setFormData(f => ({ ...f, url: '' })); setPreview(null); }}
                        className="px-3 py-1.5 rounded-md text-sm font-medium transition"
                        style={inputMode === mode ? { backgroundColor: '#fff', color: '#0d9488', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: '#6b7280' }}>
                        {mode === 'upload' ? 'Upload' : 'URL'}
                      </button>
                    ))}
                  </div>
                  {inputMode === 'upload' ? (
                    <>
                      <div onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition">
                        {compressing ? <p className="text-sm text-gray-500">Compressing…</p>
                          : preview ? <img src={preview} alt="preview" className="max-h-32 mx-auto rounded-lg object-contain" />
                          : <><p className="text-2xl mb-1">📷</p><p className="text-sm text-gray-600">Click to upload</p><p className="text-xs text-gray-400 mt-1">Compressed automatically</p></>}
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      {preview && (
                        <button type="button" onClick={() => { setPreview(null); setFormData(f => ({ ...f, url: '' })); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                          className="text-xs text-gray-400 hover:text-red-500 mt-1 transition">✕ Remove</button>
                      )}
                    </>
                  ) : (
                    <input type="text" placeholder="Paste image URL"
                      value={formData.url} onChange={e => setFormData(f => ({ ...f, url: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  )}
                </div>
              )}

              {/* Video URL */}
              {formData.type === 'video' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Video URL</label>
                  <input type="text" placeholder="YouTube, TikTok, Vimeo…"
                    value={formData.url} onChange={e => setFormData(f => ({ ...f, url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input type="text" placeholder='e.g. "SaaS walkthrough – screen record"'
                  value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-xs font-normal text-gray-400">— helps AI match this to the right pitch</span>
                </label>
                <textarea
                  placeholder='e.g. "30-sec skincare demo showing morning routine for dry skin, filmed in natural light"'
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map(tag => {
                    const active = formData.tags.includes(tag);
                    return (
                      <button key={tag} type="button" onClick={() =>
                        setFormData(f => ({ ...f, tags: active ? f.tags.filter(t => t !== tag) : [...f.tags, tag] }))}
                        className="text-xs px-2.5 py-1 rounded-full border transition capitalize"
                        style={active ? { backgroundColor: '#0d9488', borderColor: '#0d9488', color: '#fff' }
                          : { backgroundColor: '#f9fafb', borderColor: '#d1d5db', color: '#374151' }}>
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Featured */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.featured}
                  onChange={e => setFormData(f => ({ ...f, featured: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-teal-600" />
                <span className="text-sm text-gray-700">Mark as featured</span>
              </label>

              <button type="submit" disabled={compressing} className="w-full btn-primary">
                Add to Library
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
