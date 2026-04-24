import { getUser, upsertUser } from '@/lib/db';

export async function GET(req) {
  const username = new URL(req.url).searchParams.get('username');
  if (!username) return Response.json([], { status: 400 });
  const user = await getUser(username);
  return Response.json(user?.content ?? []);
}

export async function POST(req) {
  const { username, ...item } = await req.json();
  if (!username) return Response.json({ error: 'username required' }, { status: 400 });
  const user = await getUser(username) ?? {};
  const newItem = { ...item, id: item.id || crypto.randomUUID(), created_at: item.created_at || new Date().toISOString() };
  const content = [...(user.content ?? []), newItem];
  await upsertUser(username, { ...user, content });
  return Response.json(newItem);
}
