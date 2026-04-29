'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { storage, utils } from '@/lib/storage';
import { ConfirmDialog } from '../components/ConfirmDialog';

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
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null });
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const newFolderInputRef = useRef(null);

  const copyPitchLink = (e, pitch) => {
    e.stopPropagation();
    if (!pitch.shareId) { router.push(`/pitch/${pitch.id}`); return; }
    const proHandle = planStatus?.handle ?? null;
    const url = proHandle
      ? `${window.location.origin}/${proHandle}/${pitch.shareId}`
      : `${window.location.origin}/pitch/view?id=${pitch.shareId}`;
    navigator.clipboard.writeText(url);
    setCopiedLinkId(pitch.id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    setFolders(storage.getFolders(user.username));

    const sorted = ps => [...ps].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    fetch(`/api/pitches?username=${encodeURIComponent(user.username)}`, { cache: 'no-store' })
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
    setConfirmDialog({
      open: true,
      message: `Delete ${selected.length} pitch${selected.length !== 1 ? 'es' : ''}? This can't be undone.`,
      onConfirm: () => {
        fetch('/api/pitches', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selected }) });
        setPitches(ps => ps.filter(p => !selected.includes(p.id)));
        setSelected([]);
        setConfirmDialog(d => ({ ...d, open: false }));
      },
    });
  };

  const deleteSingle = (e, pitchId) => {
    e.stopPropagation();
    setConfirmDialog({
      open: true,
      message: 'Delete this pitch? This can\'t be undone.',
      onConfirm: () => {
        fetch(`/api/pitches/${pitchId}`, { method: 'DELETE' });
        setPitches(prev => prev.filter(p => p.id !== pitchId));
        setSelected(prev => prev.filter(id => id !== pitchId));
        setConfirmDialog(d => ({ ...d, open: false }));
      },
    });
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

  if (loading) return (
    <div className="flex flex-col -mx-6 -my-12 min-h-[calc(100vh-80px)] animate-pulse">
      <div className="flex flex-1">
        <aside className="w-52 flex-shrink-0 border-r border-gray-200 bg-white px-3 py-6 space-y-2">
          <div className="h-3 w-16 bg-gray-100 rounded mb-4 mx-2" />
          {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded-lg" />)}
        </aside>
        <div className="flex-1 px-8 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 bg-gray-100 rounded-lg" />
            <div className="h-9 w-24 bg-gray-100 rounded-lg" />
          </div>
          <div className="h-10 bg-gray-100 rounded-xl" />
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="h-10 bg-gray-50 border-b border-gray-100" />
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 border-b border-gray-100 last:border-0 mx-5 my-3 bg-gray-100 rounded-lg" />)}
          </div>
        </div>
      </div>
    </div>
  );
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
      <ConfirmDialog
        open={confirmDialog.open}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(d => ({ ...d, open: false }))}
      />

      <div className="flex flex-1 gap-0">

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
      <aside className="w-52 flex-shrink-0 border-r border-gray-800 bg-gray-950 px-3 py-6 flex flex-col gap-0.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 px-2 mb-3">Folders</p>

        {allFolders.map(folder => {
          const folderIcon = {
            all:      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m8-4h.01"/></svg>,
            sent:     <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>,
            accepted: <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
            archived: <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>,
          }[folder.id] ?? <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>;
          const isActive = activeFolder === folder.id;
          const isDragOver = dragOverFolder === folder.id;
          return (
            <div
              key={folder.id}
              onDragOver={e => { e.preventDefault(); setDragOverFolder(folder.id); }}
              onDragLeave={() => setDragOverFolder(null)}
              onDrop={e => handleDrop(e, folder.id)}
              className="group relative"
            >
              <button
                onClick={() => { setActiveFolder(folder.id); setSelected([]); }}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm transition-all"
                style={{
                  backgroundColor: isDragOver ? 'rgba(13,148,136,0.2)' : isActive ? 'rgba(13,148,136,0.15)' : 'transparent',
                  color: isActive ? '#2dd4bf' : '#9ca3af',
                  fontWeight: isActive ? 600 : 400,
                  outline: isDragOver ? '1.5px dashed #0d9488' : 'none',
                }}
              >
                <span className="flex items-center gap-2.5 min-w-0" style={{ color: isActive ? '#2dd4bf' : '#6b7280' }}>
                  {folderIcon}
                  <span className="truncate" style={{ color: isActive ? '#2dd4bf' : '#9ca3af' }}>{folder.name}</span>
                </span>
                <span className="text-xs flex-shrink-0" style={{ color: isActive ? '#2dd4bf' : '#4b5563' }}>{folderCount(folder.id) || ''}</span>
              </button>

              {!['all', 'sent', 'accepted', 'archived'].includes(folder.id) && (
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-gray-600 hover:text-red-400 transition"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}

        {/* New folder */}
        <div className="mt-3 border-t border-gray-800 pt-3">
          {newFolderMode ? (
            <form onSubmit={handleAddFolder} className="px-1">
              <input
                ref={newFolderInputRef}
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onBlur={() => { setNewFolderMode(false); setNewFolderName(''); }}
                placeholder="Folder name"
                className="w-full text-sm px-2 py-1.5 bg-gray-800 border border-teal-600 rounded-lg outline-none text-white placeholder-gray-600 focus:ring-1 focus:ring-teal-500"
              />
            </form>
          ) : (
            <button
              onClick={() => setNewFolderMode(true)}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-300 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              New folder
            </button>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div className="flex-1 px-8 py-6 overflow-y-auto bg-gray-50">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {allFolders.find(f => f.id === activeFolder)?.name ?? 'Pitches'}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">{visiblePitches.length} pitch{visiblePitches.length !== 1 ? 'es' : ''}</p>
          </div>
          <Link href="/create"
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-teal-600 px-4 py-2.5 rounded-xl hover:bg-teal-700 transition shadow-sm shadow-teal-600/20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            New Pitch
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
          // Wait for brand to load before deciding which view to show.
          // brand is null pre-fetch and an object post-fetch — without this guard,
          // brand.configured reads as false and the onboarding flashes on every refresh.
          if (brand === null) return null;

          const step1Done = !!(profile?.name?.trim());
          const step2Done = !!brand?.configured;
          const step3Done = (contentCount ?? 0) > 0;
          const allDone = step1Done && step2Done && step3Done;
          const doneCount = [step1Done, step2Done, step3Done].filter(Boolean).length;

          // Show onboarding checklist when setup is incomplete and no pitches exist yet
          if (visiblePitches.length === 0 && !allDone && activeFolder === 'all') {
            if (typeof window !== 'undefined' && !sessionStorage.getItem('welcomeSeen')) {
              router.replace('/welcome');
              return null;
            }
            const steps = [
              {
                done: step1Done,
                title: 'Tell brands who you are',
                desc: 'Your name, niche, and story — this is the first thing brands read.',
                href: '/profile',
                cta: 'Set up profile',
              },
              {
                done: step2Done,
                title: 'Make it yours',
                desc: 'A pitch page that looks like you. Colors, font, and layout.',
                href: '/brand',
                cta: 'Set up brand',
              },
              {
                done: step3Done,
                title: 'Show your work',
                desc: 'Your past work does the selling. Add it once, it shows up in every pitch.',
                href: '/content',
                cta: 'Add your work',
              },
            ];
            return (
              <div className="max-w-lg mx-auto py-12">
                <div className="mb-6">
                  <h2 className="text-xl font-black text-gray-900 mb-1">Let's get you ready</h2>
                  <p className="text-sm text-gray-500">{doneCount} of 3 done</p>
                  <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-teal-500 transition-all duration-500"
                      style={{ width: `${(doneCount / 3) * 100}%` }} />
                  </div>
                </div>

                {/* Product demo */}
                <div className="mb-5 rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-teal-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">Watch the 4-min walkthrough</p>
                  </div>
                  <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                    <iframe
                      src="https://www.loom.com/embed/a6485eae6d9240d388f385273d5620e7"
                      className="absolute inset-0 w-full h-full"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                    />
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {visiblePitches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                  </div>
                  <p className="text-gray-500 font-medium mb-1">No pitches yet</p>
                  <p className="text-sm text-gray-400 mb-5">Paste a brand listing and we'll build your first pitch.</p>
                  <Link href="/create"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 px-5 py-2.5 rounded-xl transition shadow-sm">
                    Build your first pitch →
                  </Link>
                </div>
              ) : (
                <>
                  {visiblePitches.map((pitch) => {
                    const isSelected = selected.includes(pitch.id);
                    const folder = allFolders.find(f => f.id === pitch.folderId);
                    const hasViews = pitch.opens?.length > 0;
                    const lastOpen = hasViews ? pitch.opens[pitch.opens.length - 1]?.timestamp : null;

                    const statusPill = (() => {
                      if (pitch.folderId === 'accepted') return { label: 'Accepted', color: '#0d9488', bg: '#f0fdfa' };
                      if (hasViews) return { label: `${pitch.opens.length} view${pitch.opens.length !== 1 ? 's' : ''}`, color: '#059669', bg: '#f0fdf4' };
                      if (pitch.folderId === 'sent') return { label: 'Sent', color: '#d97706', bg: '#fffbeb' };
                      return null;
                    })();

                    return (
                      <div
                        key={pitch.id}
                        draggable
                        onDragStart={e => handleDragStart(e, pitch.id)}
                        onClick={() => router.push(`/pitch/${pitch.id}`)}
                        className="group grid grid-cols-[20px_1fr_auto_100px_78px] gap-4 items-center pr-4 py-4 cursor-pointer transition-colors hover:bg-gray-50 border-b border-gray-50 last:border-0 pl-5"
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

                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {pitch.title || 'Untitled Pitch'}
                          </span>
                          {statusPill && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ color: statusPill.color, backgroundColor: statusPill.bg }}>
                              {statusPill.label}
                            </span>
                          )}
                          {folder && activeFolder === 'all' && (
                            <span className="text-[11px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full flex-shrink-0">
                              {folder.name}
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          {lastOpen ? (
                            <span className="text-xs text-gray-400">Seen {timeAgo(lastOpen)}</span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-gray-400">{utils.formatDate(pitch.created_at)}</span>
                        </div>

                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={e => copyPitchLink(e, pitch)}
                            title={pitch.shareId ? 'Copy link' : 'Open pitch to generate link'}
                            className={`opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md transition ${copiedLinkId === pitch.id ? 'text-teal-600 bg-teal-50' : 'text-gray-400 hover:text-teal-600 hover:bg-teal-50'}`}
                          >
                            {copiedLinkId === pitch.id ? (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                            )}
                          </button>
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
                  })}

                  {/* Inline new pitch row */}
                  <Link href="/create"
                    className="flex items-center gap-3 pl-5 pr-4 py-3.5 border-t border-gray-50 text-gray-400 hover:text-teal-600 hover:bg-gray-50 transition group"
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                    <span className="text-sm">New pitch</span>
                  </Link>
                </>
              )}
            </div>
          );
        })()}
      </div>
      </div>
    </div>
  );
}
