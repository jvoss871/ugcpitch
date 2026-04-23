import { getUser, getAllUsers, upsertUser } from '@/lib/db';

function checkAuth(req) {
  return !!process.env.ADMIN_PASSWORD && req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export async function GET(req) {
  if (!checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const users = await getAllUsers();
  return Response.json(users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
}

export async function PATCH(req) {
  if (!checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { username, ...updates } = await req.json();
  if (!username) return Response.json({ error: 'username required' }, { status: 400 });

  const user = await getUser(username);
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

  const updated = { ...user, ...updates };
  await upsertUser(username, updated);
  return Response.json({ ok: true, user: updated });
}
