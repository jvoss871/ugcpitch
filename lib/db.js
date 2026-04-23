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
    const { data } = await supabase.from('users').select('data').eq("data->>'handle'", handle).maybeSingle();
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
