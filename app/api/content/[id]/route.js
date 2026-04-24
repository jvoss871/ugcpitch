import { getUser, upsertUser } from '@/lib/db';

export async function PATCH(req, { params }) {
  const { username, ...updates } = await req.json();
  if (!username) return Response.json({ error: 'username required' }, { status: 400 });
  const user = await getUser(username) ?? {};
  const content = (user.content ?? []).map(c => c.id === params.id ? { ...c, ...updates } : c);
  await upsertUser(username, { ...user, content });
  return Response.json(content.find(c => c.id === params.id) ?? {});
}

export async function DELETE(req, { params }) {
  const { username } = await req.json();
  if (!username) return Response.json({ error: 'username required' }, { status: 400 });
  const user = await getUser(username) ?? {};
  const content = (user.content ?? []).filter(c => c.id !== params.id);
  await upsertUser(username, { ...user, content });
  return Response.json({ ok: true });
}
