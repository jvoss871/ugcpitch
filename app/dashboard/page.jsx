'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { storage, utils } from '@/lib/storage';

const DEFAULT_FOLDERS = [
  { id: 'all', name: 'All Pitches' },
  { id: 'sent', name: 'Sent' },
  { id: 'accepted', name: 'Accepted' },
  { id: 'archived', name: 'Archived' },
];

function timeAgo(iso) {
  if (!iso) return null;
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function rowBorderColor(pitch) {
  if (pitch.folderId === 'accepted') return '#0d9488';
  if (pitch.opens?.length > 0) return '#22c55e';
  if (pitch.folderId === 'sent') return '#f59e0b';
  return '#e5e7eb';
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [pitches, setPitches] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState('all');
  const [selected, setSelected] = useState([]);
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  const [planStatus, setPlanStatus] = useState(null);
  const [profile, setProfile] = useState(null);
  const [brand, setBrand] = useState(null);
  const [contentCount, setContentCount] = useState(null);
  const [bannerUpgrading, setBannerUpgrading] = useState(false);
  const newFolderInputRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    setFolders(storage.getFolders(user.username));

    const sorted = ps => [...ps].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    fetch(`/api/pitches?username=${encodeURIComponent(user.username)}`)
      .then(r => r.json())
      .then(async serverPitches => {
        if (serverPitches.length === 0) {
          const local = storage.getPitches(user.username);
          if (local.length > 0) {
            const migrated = await Promise.all(local.map(p =>
              fetch('/api/pitches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...p, username: user.username }),
              }).then(r => r.json())
            ));
            storage.savePitches(user.username, []);
            setPitches(sorted(migrated.filter(p => !p.error)));
            return;
          }
        }
        setPitches(sorted(serverPitches));
      })
      .catch(() => setPitches(sorted(storage.getPitches(user.username))));

    fetch(`/api/plan?username=${encodeURIComponent(user.username)}`)
      .then(r => r.json())
      .then(setPlanStatus)
      .catch(() => {});

    fetch(`/api/profile?username=${encodeURIComponent(user.username)}`)
      .then(r => r.json())
      .then(p => setProfile(p?.name ? p : storage.getProfile(user.username)))
      .catch(() => setProfile(storage.getProfile(user.username)));

    fetch(`/api/brand?username=${encodeURIComponent(user.username)}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(setBrand)
      .catch(() => setBrand(storage.getBrand(user.username)));

    fetch(`/api/content?username=${encodeURIComponent(user.username)}`)
      .then(r => r.json())
      .then(c => setContentCount(Array.isArray(c) ? c.length : 0))
      .catch(() => setContentCount(storage.getContent(user.username).length));
  }, [user]);

  useEffect(() => {
    if (newFolderMode) newFolderInputRef.current?.focus();
  }, [newFolderMode]);

  // ── Filtered pitches ──────────────────────────────────────────────────
  const visiblePitches = pitches.filter(p => {
    if (activeFolder === 'all') return !p.folderId;
    return p.folderId === activeFolder;
  });

  // ── Selection ─────────────────────────────────────────────────────────
  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const toggleSelectAll = () => {
    setSelected(s => s.length === visiblePitches.length ? [] : visiblePitches.map(p => p.id));
  };

  // ── Move ──────────────────────────────────────────────────────────────
  const moveTo = (folderId) => {
    const target = folderId === 'all' ? null : folderId;
    fetch('/api/pitches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selected, folderId: target }),
    });
    setPitches(ps => ps.map(p => selected.includes(p.id) ? { ...p, folderId: target } : p));
    setSelected([]);
    setMoveMenuOpen(false);
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const deleteSelected = () => {
    if (!window.confirm(`Delete ${selected.length} pitch${selected.length !== 1 ? 'es' : ''}?`)) return;
    fetch('/api/pitches', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selected }),
    });
    setPitches(ps => ps.filter(p => !selected.includes(p.id)));
    setSelected([]);
  };

  const deleteSingle = (e, pitchId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this pitch?')) return;
    fetch(`/api/pitches/${pitchId}`, { method: 'DELETE' });
    setPitches(prev => prev.filter(p => p.id !== pitchId));
    setSelected(prev => prev.filter(id => id !== pitchId));
  };

  // ── Folders ───────────────────────────────────────────────────────────
  const handleAddFolder = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const folder = storage.addFolder(user.username, newFolderName.trim());
    setFolders(f => [...f, folder]);
    setNewFolderName('');
    setNewFolderMode(false);
  };

  const handleDeleteFolder = (folderId) => {
    storage.deleteFolder(user.username, folderId);
    setFolders(f => f.filter(x => x.id !== folderId));
    if (activeFolder === folderId) setActiveFolder('all');
    // Move pitches out of deleted folder server-side
    const affected = pitches.filter(p => p.folderId === folderId).map(p => p.id);
    if (affected.length > 0) {
      fetch('/api/pitches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: affected, folderId: null }),
      });
    }
    setPitches(ps => ps.map(p => p.folderId === folderId ? { ...p, folderId: null } : p));
  };

  // ── Drag & drop ───────────────────────────────────────────────────────
  const handleDragStart = (e, pitchId) => {
    const ids = selected.includes(pitchId) ? selected : [pitchId];
    e.dataTransfer.setData('pitchIds', JSON.stringify(ids));
  };

  const handleDrop = (e, folderId) => {
    e.preventDefault();
    const ids = JSON.parse(e.dataTransfer.getData('pitchIds'));
    const target = folderId === 'all' ? null : folderId;
    fetch('/api/pitches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, folderId: target }),
    });
    setPitches(ps => ps.map(p => ids.includes(p.id) ? { ...p, folderId: target } : p));
    setSelected([]);
    setDragOverFolder(null);
  };

  const folderCount = (folderId) => {
    if (folderId === 'all') return pitches.filter(p => !p.folderId).length;
    return pitches.filter(p => p.folderId === folderId).length;
  };

  const allFolders = [
    ...DEFAULT_FOLDERS,
    ...folders,
  ];

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!user) return null;

  const startCheckout = async (plan) => {
    setBannerUpgrading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, plan }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setBannerUpgrading(false);
    }
  };

  return (
    <div className="flex flex-col -mx-6 -my-12 min-h-[calc(100vh-80px)]">


      <div className="flex flex-1 gap-0">

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
      <aside className="w-52 flex-shrink-0 border-r border-gray-200 bg-white px-3 py-6 flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-2 mb-3">Folders</p>

        {allFolders.map(folder => (
          <div
            key={folder.id}
            onDragOver={e => { e.preventDefault(); setDragOverFolder(folder.id); }}
            onDragLeave={() => setDragOverFolder(null)}
            onDrop={e => handleDrop(e, folder.id)}
            className="group relative"
          >
            <button
              onClick={() => { setActiveFolder(folder.id); setSelected([]); }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-all"
              style={{
                backgroundColor: dragOverFolder === folder.id ? '#f0fdfa' :
                  activeFolder === folder.id ? '#f0fdfa' : 'transparent',
                color: activeFolder === folder.id ? '#0d9488' : '#374151',
                fontWeight: activeFolder === folder.id ? 600 : 400,
                outline: dragOverFolder === folder.id ? '2px dashed #0d9488' : 'none',
              }}
            >
              <span className="truncate">{folder.name}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">{folderCount(folder.id) || ''}</span>
            </button>

            {/* Delete custom folder */}
            {!['all', 'sent', 'accepted', 'archived'].includes(folder.id) && (
              <button
                onClick={() => handleDeleteFolder(folder.id)}
                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-500 transition"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {/* New folder */}
        <div className="mt-2">
          {newFolderMode ? (
            <form onSubmit={handleAddFolder} className="px-2">
              <input
                ref={newFolderInputRef}
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onBlur={() => { setNewFolderMode(false); setNewFolderName(''); }}
                placeholder="Folder name"
                className="w-full text-sm px-2 py-1.5 border border-teal-400 rounded-lg outline-none focus:ring-2 focus:ring-teal-200"
              />
            </form>
          ) : (
            <button
              onClick={() => setNewFolderMode(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-teal-600 hover:bg-gray-50 transition"
            >
              <span>+</span> New folder
            </button>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div className="flex-1 px-8 py-6 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {allFolders.find(f => f.id === activeFolder)?.name ?? 'Pitches'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{visiblePitches.length} pitch{visiblePitches.length !== 1 ? 'es' : ''}</p>
          </div>
          <Link href="/create"
            className="text-sm font-medium text-white bg-teal-600 px-4 py-2 rounded-lg hover:bg-teal-700 transition">
            + Create Pitch
          </Link>
        </div>

        {/* Usage bar */}
        {planStatus && planStatus.status !== 'pro' && (
          (() => {
            const used = planStatus.monthlyPitchCount ?? 0;
            const limit = planStatus.pitchLimit ?? 10;
            const pct = Math.min((used / limit) * 100, 100);
            const nearLimit = pct >= 80;
            return (
              <div className="flex items-center gap-3 mb-5 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-500">Pitches this month</span>
                    <span className={`text-xs font-bold ${nearLimit ? 'text-amber-600' : 'text-gray-700'}`}>{used} / {limit}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: nearLimit ? '#f59e0b' : '#0d9488' }}
                    />
                  </div>
                </div>
                {nearLimit && (
                  <Link href="/upgrade" className="text-xs font-bold text-amber-600 hover:text-amber-700 whitespace-nowrap">
                    Upgrade →
                  </Link>
                )}
              </div>
            );
          })()
        )}


        {/* Multi-select action bar */}
        {selected.length > 0 && (
          <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-teal-600 text-white rounded-xl shadow-lg">
            <span className="text-sm font-medium">{selected.length} selected</span>
            <div className="relative">
              <button
                onClick={() => setMoveMenuOpen(o => !o)}
                className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
              >
                Move to ▾
              </button>
              {moveMenuOpen && (
                <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50">
                  {allFolders.map(f => (
                    <button key={f.id} onClick={() => moveTo(f.id)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <span>{f.icon}</span>{f.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={deleteSelected} className="text-sm bg-red-500/80 hover:bg-red-500 px-3 py-1.5 rounded-lg transition">
              Delete
            </button>
            <button onClick={() => setSelected([])} className="ml-auto text-sm text-white/70 hover:text-white transition">
              Cancel
            </button>
          </div>
        )}

        {/* Pitch list */}
        {(() => {
          const step1Done = !!(profile?.name?.trim());
          const step2Done = !!brand?.configured;
          const step3Done = (contentCount ?? 0) > 0;
          const allDone = step1Done && step2Done && step3Done;
          const doneCount = [step1Done, step2Done, step3Done].filter(Boolean).length;

          // Show onboarding checklist when setup is incomplete and no pitches exist yet
          if (visiblePitches.length === 0 && !allDone && activeFolder === 'all') {
            const steps = [
              {
                done: step1Done,
                title: 'Complete your profile',
                desc: 'Add your name, bio, niche tags, and social links.',
                href: '/profile',
                cta: 'Go to Profile',
              },
              {
                done: step2Done,
                title: 'Set your brand',
                desc: 'Choose your colors, font, and pitch page template.',
                href: '/brand',
                cta: 'Go to Brand',
              },
              {
                done: step3Done,
                title: 'Add content to your library',
                desc: 'Upload videos and images — the AI uses these to match you to brands.',
                href: '/content',
                cta: 'Add Content',
              },
            ];
            return (
              <div className="max-w-lg mx-auto py-12">
                <div className="mb-6">
                  <h2 className="text-xl font-black text-gray-900 mb-1">Get set up in 3 steps</h2>
                  <p className="text-sm text-gray-500">{doneCount} of 3 complete</p>
                  <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-teal-500 transition-all duration-500"
                      style={{ width: `${(doneCount / 3) * 100}%` }} />
                  </div>
                </div>
                <div className="space-y-3">
                  {steps.map((step, i) => (
                    <div key={i}
                      className="flex items-start gap-4 p-5 rounded-2xl border transition-all"
                      style={{
                        backgroundColor: step.done ? '#f0fdf4' : '#ffffff',
                        borderColor: step.done ? '#bbf7d0' : '#e5e7eb',
                      }}>
                      <div className="flex-shrink-0 mt-0.5">
                        {step.done ? (
                          <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-400">{i + 1}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${step.done ? 'text-teal-800 line-through decoration-teal-400' : 'text-gray-900'}`}>
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                      </div>
                      {!step.done && (
                        <Link href={step.href}
                          className="flex-shrink-0 text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition whitespace-nowrap">
                          {step.cta} →
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          // Folder empty state
          if (visiblePitches.length === 0 && activeFolder !== 'all') {
            return (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-gray-400 text-sm">Nothing here yet. Drag pitches from All Pitches to organize them.</p>
              </div>
            );
          }

          // Main pitch list view (setup complete or pitches exist)
          return (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Column headers */}
              <div className="grid grid-cols-[24px_1fr_90px_110px_52px] gap-4 items-center pl-5 pr-4 py-2 border-b border-gray-100 bg-gray-50">
                <input type="checkbox"
                  checked={selected.length === visiblePitches.length && visiblePitches.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-teal-600 cursor-pointer" />
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Title</span>
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 text-right">Views</span>
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 text-right">Activity</span>
                <span />
              </div>

              {visiblePitches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-gray-400 text-sm mb-4">No pitches yet. Create your first one to get started.</p>
                  <Link href="/create"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 px-5 py-2.5 rounded-xl transition">
                    Create your first pitch
                  </Link>
                </div>
              ) : (
                visiblePitches.map((pitch) => {
                  const isSelected = selected.includes(pitch.id);
                  const folder = allFolders.find(f => f.id === pitch.folderId);
                  const hasViews = pitch.opens?.length > 0;
                  const lastOpen = hasViews ? pitch.opens[pitch.opens.length - 1]?.timestamp : null;

                  return (
                    <div
                      key={pitch.id}
                      draggable
                      onDragStart={e => handleDragStart(e, pitch.id)}
                      onClick={() => router.push(`/pitch/${pitch.id}`)}
                      className="group grid grid-cols-[24px_1fr_90px_110px_52px] gap-4 items-center pr-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-0 pl-4"
                      style={{
                        backgroundColor: isSelected ? '#f0fdfa' : undefined,
                        borderLeft: `3px solid ${rowBorderColor(pitch)}`,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => toggleSelect(pitch.id, e)}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-300 text-teal-600 cursor-pointer"
                      />

                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {pitch.title || 'Untitled Pitch'}
                        </span>
                        {folder && activeFolder === 'all' && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">
                            {folder.name}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-end">
                        {hasViews ? (
                          <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {pitch.opens.length} view{pitch.opens.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">No views</span>
                        )}
                      </div>

                      <div className="text-right">
                        {lastOpen ? (
                          <span className="text-xs text-green-600 font-medium">Last seen {timeAgo(lastOpen)}</span>
                        ) : (
                          <span className="text-xs text-gray-400">{utils.formatDate(pitch.created_at)}</span>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={e => { e.stopPropagation(); router.push(`/pitch/${pitch.id}#analytics`); }}
                          title="View analytics"
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 18h2v-6H3v6zm4 0h2V9H7v9zm4 0h2V5h-2v13zm4 0h2v-3h-2v3zm4 0h2v-9h-2v9z" />
                          </svg>
                        </button>
                        <button
                          onClick={e => deleteSingle(e, pitch.id)}
                          title="Delete pitch"
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition text-base leading-none"
                        >×</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })()}
      </div>
      </div>
    </div>
  );
}
