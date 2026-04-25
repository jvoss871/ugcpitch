'use client';

import { useState, useEffect } from 'react';

function planBadge(plan, trialStartedAt, trialEndsAt) {
  let status = plan;
  if (plan === 'trial') {
    const end = trialEndsAt
      ? new Date(trialEndsAt).getTime()
      : new Date(trialStartedAt).getTime() + 3 * 86400000;
    if (end < Date.now()) status = 'expired';
  }
  const color = { free: '#6b7280', trial: '#d97706', starter: '#2563eb', pro: '#0d9488', expired: '#dc2626' };
  const bg    = { free: '#f3f4f6', trial: '#fef3c7', starter: '#dbeafe', pro: '#f0fdfa',  expired: '#fee2e2' };
  return (
    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full capitalize"
      style={{ color: color[status], backgroundColor: bg[status] }}>
      {status}
    </span>
  );
}

export default function AdminPage() {
  const [password, setPassword]       = useState('');
  const [authed, setAuthed]           = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_pw');
    if (stored) { setPassword(stored); setAuthed(true); }
  }, []);
  const [authError, setAuthError]     = useState('');
  const [tab, setTab]                 = useState('overview');
  const [overview, setOverview]       = useState(null);
  const [users, setUsers]             = useState([]);
  const [expandedUser, setExpandedUser] = useState(null);
  const [editState, setEditState]     = useState({});
  const [saving, setSaving]           = useState(false);
  const [search, setSearch]           = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting]       = useState(false);

  const authHeaders = { 'Content-Type': 'application/json', 'x-admin-password': password };

  const login = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const { ok } = await res.json();
    if (ok) { sessionStorage.setItem('admin_pw', password); setAuthed(true); }
    else setAuthError('Wrong password');
  };

  useEffect(() => {
    if (!authed) return;
    fetchOverview();
    fetchUsers();
  }, [authed]);

  const fetchOverview = async () => {
    const res = await fetch('/api/admin/overview', { headers: authHeaders });
    if (res.ok) setOverview(await res.json());
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users', { headers: authHeaders });
    if (res.ok) {
      const data = await res.json();
      setUsers(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }
  };

  const expandUser = (u) => {
    if (expandedUser === u.username) { setExpandedUser(null); return; }
    setExpandedUser(u.username);
    setEditState({
      plan: u.plan,
      trialEndsAt: u.trialEndsAt ? u.trialEndsAt.split('T')[0] : '',
      features: { ...u.features },
      bonusPitches: u.bonusPitches ?? 0,
      oneTimePitches: u.oneTimePitches ?? 0,
      isAdmin: u.isAdmin ?? false,
    });
  };

  const handleDeleteUser = async (username) => {
    setDeleting(true);
    await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: authHeaders,
      body: JSON.stringify({ username }),
    });
    setUsers(us => us.filter(u => u.username !== username));
    setExpandedUser(null);
    setConfirmDelete(null);
    setDeleting(false);
    fetchOverview();
  };

  const saveUser = async (username) => {
    setSaving(true);
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        username,
        plan: editState.plan,
        trialEndsAt: editState.trialEndsAt ? new Date(editState.trialEndsAt).toISOString() : null,
        features: editState.features,
        bonusPitches: editState.plan === 'starter' ? (parseInt(editState.bonusPitches, 10) || 0) : 0,
        oneTimePitches: parseInt(editState.oneTimePitches, 10) || 0,
        isAdmin: editState.isAdmin ?? false,
      }),
    });
    await fetchUsers();
    await fetchOverview();
    setExpandedUser(null);
    setSaving(false);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <p className="text-gray-500 text-xs uppercase tracking-widest text-center mb-2">UGC Edge</p>
          <h1 className="text-white text-3xl font-black mb-8 text-center">Admin</h1>
          <form onSubmit={login} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setAuthError(''); }}
              placeholder="Password"
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {authError && <p className="text-red-400 text-sm">{authError}</p>}
            <button type="submit"
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return u.username.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <h1 className="font-black text-lg tracking-tight">Admin</h1>
        <div className="flex items-center gap-3">
        <button onClick={() => { fetchOverview(); fetchUsers(); }}
          className="text-xs font-semibold text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500">
          ↻ Refresh
        </button>
        <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
          {['overview', 'users'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition"
              style={{
                backgroundColor: tab === t ? '#0d9488' : 'transparent',
                color: tab === t ? '#fff' : '#6b7280',
              }}>
              {t}
            </button>
          ))}
        </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">

        {/* ── OVERVIEW ────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {!overview ? (
              <div className="text-gray-600 text-sm">Loading…</div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Total Users', value: overview.total },
                    { label: 'Free',        value: overview.free },
                    { label: 'Starter',     value: overview.starter },
                    { label: 'Pro',         value: overview.pro },
                    { label: 'Expired',     value: overview.expired },
                    { label: 'MRR',         value: `$${overview.mrr}` },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">{s.label}</p>
                      <p className="text-3xl font-black">{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">30-day Free → Paid Conversion</p>
                  <p className="text-5xl font-black mb-2">{overview.conversionRate}%</p>
                  <p className="text-sm text-gray-600">
                    {overview.converted} of {overview.recentTrialUsers + overview.converted} users who signed up free in the last 30 days converted to a paid plan.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── USERS ───────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <div className="space-y-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users…"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            {filteredUsers.length === 0 && (
              <p className="text-gray-600 text-sm py-8 text-center">No users found.</p>
            )}

            {filteredUsers.map(u => (
              <div key={u.username} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">

                {/* Row */}
                <button
                  onClick={() => expandUser(u)}
                  className="w-full grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 text-left hover:bg-gray-800/60 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">{u.email ?? u.username}</p>
                      {u.isAdmin && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-950 text-violet-400 uppercase tracking-widest">
                          admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {u.username !== (u.email ?? u.username) && (
                        <span className="text-gray-500 mr-2 font-mono">{u.username}</span>
                      )}
                      Joined {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {u.lastSeen && ` · Last seen ${new Date(u.lastSeen).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </p>
                  </div>
                  {planBadge(u.plan, u.trialStartedAt, u.trialEndsAt)}
                  <span className="text-xs text-gray-500">{u.pitchCount ?? 0} pitches</span>
                  <svg
                    className="w-4 h-4 text-gray-600 transition-transform flex-shrink-0"
                    style={{ transform: expandedUser === u.username ? 'rotate(180deg)' : 'none' }}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Expanded */}
                {expandedUser === u.username && (
                  <div className="border-t border-gray-800 px-5 py-5 space-y-6">

                    {/* Plan */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Plan</label>
                      <div className="flex gap-2 flex-wrap">
                        {['free', 'starter', 'pro'].map(p => (
                          <button key={p} onClick={() => setEditState(s => ({
                            ...s,
                            plan: p,
                            features: p === 'pro'
                              ? { advanced_analytics: true, custom_url: true, remove_branding: true }
                              : p === 'free'
                                ? { advanced_analytics: false, custom_url: false, remove_branding: false }
                                : s.features,
                          }))}
                            className="px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition"
                            style={{
                              backgroundColor: editState.plan === p ? '#0d9488' : '#1f2937',
                              color: editState.plan === p ? '#fff' : '#9ca3af',
                            }}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Feature flags */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Feature Flags</label>
                      <div className="space-y-2.5">
                        {[
                          { key: 'advanced_analytics', label: 'Advanced Analytics' },
                          { key: 'custom_url',         label: 'Custom URL' },
                          { key: 'remove_branding',    label: 'Remove Branding' },
                        ].map(f => (
                          <label key={f.key} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editState.features?.[f.key] ?? false}
                              onChange={e => setEditState(s => ({
                                ...s,
                                features: { ...s.features, [f.key]: e.target.checked },
                              }))}
                              className="w-4 h-4 rounded border-gray-600 text-teal-600 focus:ring-teal-500 focus:ring-offset-gray-900"
                            />
                            <span className="text-sm text-gray-300">{f.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Bonus pitches — Starter only */}
                    {editState.plan === 'starter' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                          Bonus Pitches
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            value={editState.bonusPitches}
                            onChange={e => setEditState(s => ({ ...s, bonusPitches: e.target.value }))}
                            className="w-24 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          <span className="text-sm text-gray-400">
                            = {50 + (parseInt(editState.bonusPitches, 10) || 0)} pitches/month total
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Added on top of the 50-pitch Starter base.</p>
                      </div>
                    )}

                    {/* One-time allotment — any plan */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                        One-Time Allotment
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          value={editState.oneTimePitches}
                          onChange={e => setEditState(s => ({ ...s, oneTimePitches: e.target.value }))}
                          className="w-24 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <span className="text-sm text-gray-400">pitches remaining</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Used first when the user hits their limit. Depletes permanently — does not reset monthly.</p>
                    </div>

                    {/* Admin flag */}
                    <div className="border-t border-gray-800 pt-5">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editState.isAdmin ?? false}
                          onChange={e => setEditState(s => ({ ...s, isAdmin: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-600 text-violet-600 focus:ring-violet-500 focus:ring-offset-gray-900"
                        />
                        <div>
                          <span className="text-sm text-gray-300 font-semibold">Mark as Admin</span>
                          <p className="text-xs text-gray-600 mt-0.5">Excludes this account from all stats and MRR.</p>
                        </div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => saveUser(u.username)}
                        disabled={saving}
                        className="px-5 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition"
                      >
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>

                      {confirmDelete === u.username ? (
                        <div className="flex items-center gap-3">
                          <p className="text-sm text-red-400">Delete this user?</p>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white bg-gray-800 rounded-lg transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.username)}
                            disabled={deleting}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg transition"
                          >
                            {deleting ? 'Deleting…' : 'Confirm Delete'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(u.username)}
                          className="px-4 py-2 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-950 rounded-xl transition"
                        >
                          Delete User
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
