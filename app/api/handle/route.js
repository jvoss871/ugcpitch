import { getUser, upsertUser } from '@/lib/db';

const RESERVED = [
  'dashboard', 'profile', 'brand', 'content', 'create', 'pitch',
  'admin', 'login', 'help', 'api', 'view', 'p', 'u',
];

export async function POST(req) {
  const { username, handle } = await req.json();
  if (!username || !handle) return Response.json({ error: 'Missing fields' }, { status: 400 });

  const clean = handle.toLowerCase().trim();
  if (!/^[a-z0-9-]+$/.test(clean)) return Response.json({ error: 'Invalid handle' }, { status: 400 });
  if (clean.length < 2 || clean.length > 30) return Response.json({ error: 'Invalid length' }, { status: 400 });
  if (RESERVED.includes(clean)) return Response.json({ error: 'Reserved handle' }, { status: 400 });

  const user = await getUser(username);
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
  if (user.plan !== 'pro') return Response.json({ error: 'Pro plan required' }, { status: 403 });

  await upsertUser(username, { ...user, handle: clean });
  return Response.json({ ok: true, handle: clean });
}
