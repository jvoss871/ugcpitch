import { promises as fs } from 'fs';
import path from 'path';

// ── Adapter selection ─────────────────────────────────────────────────────────
// Locally (no real SUPABASE_URL): file adapter (.share-store/)
// Vercel  (SUPABASE_URL is set):  Supabase adapter

const USE_SUPABASE = process.env.SUPABASE_URL?.startsWith('http') ?? false;

// ── File adapter (local dev) ──────────────────────────────────────────────────
const STORE         = path.join(process.cwd(), '.share-store');
const USERS_FILE    = path.join(STORE, 'users.json');
const PITCHES_FILE  = path.join(STORE, 'pitches.json');
const ANALYTICS_FILE = path.join(STORE, 'analytics.json');

async function readJSON(file) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return {}; }
}

async function writeJSON(file, data) {
  await fs.mkdir(STORE, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// ── Supabase adapter (prod) ───────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';
const supabase = USE_SUPABASE
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getUser(username) {
  if (USE_SUPABASE) {
    const { data } = await supabase.from('users').select('data').eq('username', username).maybeSingle();
    return data?.data ?? null;
  }
  const users = await readJSON(USERS_FILE);
  return users[username] ?? null;
}

export async function getAllUsers() {
  if (USE_SUPABASE) {
    const { data } = await supabase.from('users').select('data');
    return (data ?? []).map(r => r.data);
  }
  const users = await readJSON(USERS_FILE);
  return Object.values(users);
}

export async function getUserByHandle(handle) {
  if (USE_SUPABASE) {
    const { data } = await supabase.from('users').select('data').eq('data->>handle', handle).maybeSingle();
    return data?.data ?? null;
  }
  const users = await readJSON(USERS_FILE);
  return Object.values(users).find(u => u.handle === handle) ?? null;
}

export async function upsertUser(username, userData) {
  if (USE_SUPABASE) {
    const { error } = await supabase
      .from('users')
      .upsert({ username, data: userData }, { onConflict: 'username' });
    if (error) throw error;
    return;
  }
  const users = await readJSON(USERS_FILE);
  users[username] = userData;
  await writeJSON(USERS_FILE, users);
}

export async function deleteUser(username) {
  if (USE_SUPABASE) {
    const { error } = await supabase.from('users').delete().eq('username', username);
    if (error) throw error;
    return;
  }
  const users = await readJSON(USERS_FILE);
  delete users[username];
  await writeJSON(USERS_FILE, users);
}

// ── Pitches ───────────────────────────────────────────────────────────────────

export async function getPitch(id) {
  if (USE_SUPABASE) {
    const { data } = await supabase.from('pitches').select('data').eq('id', id).maybeSingle();
    return data?.data ?? null;
  }
  const pitches = await readJSON(PITCHES_FILE);
  return pitches[id] ?? null;
}

export async function savePitch(id, pitchData) {
  if (USE_SUPABASE) {
    const { error } = await supabase
      .from('pitches')
      .upsert({ id, data: pitchData }, { onConflict: 'id' });
    if (error) throw error;
    return;
  }
  const pitches = await readJSON(PITCHES_FILE);
  pitches[id] = pitchData;
  await writeJSON(PITCHES_FILE, pitches);
}

// ── Pitches (user-owned) ──────────────────────────────────────────────────────

export async function getPitchByShareId(shareId) {
  if (USE_SUPABASE) {
    const { data } = await supabase
      .from('pitches')
      .select('id, data')
      .filter('data->>shareId', 'eq', shareId)
      .maybeSingle();
    return data ? { id: data.id, ...data.data } : null;
  }
  const pitches = await readJSON(PITCHES_FILE);
  return Object.values(pitches).find(p => p.shareId === shareId) ?? null;
}

export async function getPitchesByUser(username) {
  if (USE_SUPABASE) {
    const { data } = await supabase
      .from('pitches')
      .select('data')
      .filter('data->>username', 'eq', username);
    return (data ?? [])
      .map(r => r.data)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  const pitches = await readJSON(PITCHES_FILE);
  return Object.values(pitches)
    .filter(p => p.username === username)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function updatePitch(id, updates) {
  const pitch = await getPitch(id);
  if (!pitch) return null;
  const updated = { ...pitch, ...updates };
  await savePitch(id, updated);
  return updated;
}

export async function deletePitchById(id) {
  if (USE_SUPABASE) {
    await supabase.from('pitches').delete().eq('id', id);
    return;
  }
  const pitches = await readJSON(PITCHES_FILE);
  delete pitches[id];
  await writeJSON(PITCHES_FILE, pitches);
}

export async function deletePitchesByIds(ids) {
  if (USE_SUPABASE) {
    await supabase.from('pitches').delete().in('id', ids);
    return;
  }
  const pitches = await readJSON(PITCHES_FILE);
  ids.forEach(id => delete pitches[id]);
  await writeJSON(PITCHES_FILE, pitches);
}

// ── Monthly pitch counts ──────────────────────────────────────────────────────

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}`;
}

export async function getMonthlyPitchCount(username) {
  const user = await getUser(username);
  if (!user) return 0;
  if (user.monthlyPitchMonth !== currentMonth()) return 0;
  return user.monthlyPitchCount ?? 0;
}

export async function incrementMonthlyPitchCount(username) {
  if (!username) return;
  const user = await getUser(username);
  if (!user) return;
  const month = currentMonth();
  const sameMonth = user.monthlyPitchMonth === month;
  await upsertUser(username, {
    ...user,
    monthlyPitchMonth: month,
    monthlyPitchCount: sameMonth ? (user.monthlyPitchCount ?? 0) + 1 : 1,
    pitchCount: (user.pitchCount ?? 0) + 1,
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function appendAnalytic(shareId, type, payload) {
  if (USE_SUPABASE) {
    const { error } = await supabase.from('analytics').insert({ share_id: shareId, type, payload });
    if (error) throw error;
    return;
  }
  const store = await readJSON(ANALYTICS_FILE);
  if (!store[shareId]) store[shareId] = [];
  store[shareId].push({ type, ...payload });
  await writeJSON(ANALYTICS_FILE, store);
}

export async function getAnalytics(shareId) {
  if (USE_SUPABASE) {
    const { data } = await supabase
      .from('analytics')
      .select('type, payload, recorded_at')
      .eq('share_id', shareId);
    return data ?? [];
  }
  const store = await readJSON(ANALYTICS_FILE);
  const events = store[shareId] ?? [];
  // Normalize file events to the same shape the route expects from Supabase rows
  return events.map(e => ({ type: e.type, payload: e, recorded_at: e.recordedAt }));
}
