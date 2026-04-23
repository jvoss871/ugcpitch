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
  const newFolderInputRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const p = storage.getPitches(user.username);
      setPitches(p.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      setFolders(storage.getFolders(user.username));
      setPlanStatus(storage.getPlanStatus(user.username));
    }
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
    storage.movePitchesToFolder(user.username, selected, folderId === 'all' ? null : folderId);
    setPitches(storage.getPitches(user.username).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    setSelected([]);
    setMoveMenuOpen(false);
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const deleteSelected = () => {
    if (!window.confirm(`Delete ${selected.length} pitch${selected.length !== 1 ? 'es' : ''}?`)) return;
    storage.deletePitches(user.username, selected);
    setPitches(storage.getPitches(user.username).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    setSelected([]);
  };

  const deleteSingle = (e, pitchId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this pitch?')) return;
    storage.deletePitch(user.username, pitchId);
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
    setPitches(storage.getPitches(user.username).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  };

  // ── Drag & drop ───────────────────────────────────────────────────────
  const handleDragStart = (e, pitchId) => {
    const ids = selected.includes(pitchId) ? selected : [pitchId];
    e.dataTransfer.setData('pitchIds', JSON.stringify(ids));
  };

  const handleDrop = (e, folderId) => {
    e.preventDefault();
    const ids = JSON.parse(e.dataTransfer.getData('pitchIds'));
    storage.movePitchesToFolder(user.username, ids, folderId === 'all' ? null : folderId);
    setPitches(storage.getPitches(user.username).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
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

  return (
    <div className="flex gap-0 -mx-6 -my-12 min-h-[calc(100vh-80px)]">

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
        <div className="flex items-center justify-between mb-6">
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

        {/* Trial / plan banner */}
        {planStatus?.status === 'trial' && (
          <div className="mb-4 flex items-center justify-between gap-4 px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: '#f0fdfa', border: '1px solid #99f6e4' }}>
            <p className="text-teal-800 font-medium">
              {planStatus.daysLeft === 1
                ? 'Your free trial ends tomorrow.'
                : `${planStatus.daysLeft} days left in your free trial.`}
            </p>
            <span className="text-teal-600 text-xs font-semibold flex-shrink-0">Upgrade to keep pitching →</span>
          </div>
        )}
        {planStatus?.status === 'expired' && (
          <div className="mb-4 flex items-center justify-between gap-4 px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
            <p className="text-red-800 font-medium">Your trial has ended. Upgrade to create new pitches.</p>
            <span className="text-red-600 text-xs font-semibold flex-shrink-0">View plans →</span>
          </div>
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
        {visiblePitches.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3 opacity-20">—</p>
            <p className="text-sm">No pitches here yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Column headers */}
            <div className="grid grid-cols-[24px_1fr_80px_96px_24px] gap-4 items-center px-4 py-2 border-b border-gray-100 bg-gray-50">
              <input type="checkbox"
                checked={selected.length === visiblePitches.length && visiblePitches.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 cursor-pointer" />
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Title</span>
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 text-right">Analytics</span>
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 text-right">Created</span>
              <span />
            </div>

            {visiblePitches.map((pitch, i) => {
              const isSelected = selected.includes(pitch.id);
              const folder = allFolders.find(f => f.id === pitch.folderId);

              return (
                <div
                  key={pitch.id}
                  draggable
                  onDragStart={e => handleDragStart(e, pitch.id)}
                  onClick={() => router.push(`/pitch/${pitch.id}`)}
                  className="group grid grid-cols-[24px_1fr_80px_96px_24px] gap-4 items-center px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  style={{ backgroundColor: isSelected ? '#f0fdfa' : undefined }}
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

                  {/* Analytics cell */}
                  <button
                    onClick={e => { e.stopPropagation(); router.push(`/pitch/${pitch.id}`); }}
                    title={pitch.opens?.length > 0 ? `${pitch.opens.length} view${pitch.opens.length !== 1 ? 's' : ''}` : 'No views yet'}
                    className="flex items-center justify-end gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                      style={{ color: pitch.opens?.length > 0 ? '#22c55e' : '#d1d5db' }}>
                      <path d="M3 18h2v-6H3v6zm4 0h2V9H7v9zm4 0h2V5h-2v13zm4 0h2v-3h-2v3zm4 0h2v-9h-2v9z" strokeLinejoin="round"/>
                    </svg>
                    {pitch.opens?.length > 0 && (
                      <span className="text-xs text-gray-500">{pitch.opens.length}</span>
                    )}
                  </button>

                  <span className="text-xs text-gray-400 w-24 text-right">
                    {utils.formatDate(pitch.created_at)}
                  </span>

                  <span className="flex items-center gap-2">
                    <button
                      onClick={e => deleteSingle(e, pitch.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition text-base leading-none"
                      title="Delete pitch"
                    >×</button>
                    <span className="text-gray-300 hover:text-teal-500 transition text-sm">→</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
