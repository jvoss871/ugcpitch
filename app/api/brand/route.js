import { getUser, upsertUser } from '@/lib/db';

const defaults = { colors: ['#0d9488', '#0f1117', '#f5f4f0', '#111111'], font: 'Inter', templateId: 'modern' };

export async function GET(req) {
  const username = new URL(req.url).searchParams.get('username');
  if (!username) return Response.json(defaults, { status: 400 });
  const user = await getUser(username);
  const brand = user?.brand ?? {};
  if (brand.colors && brand.colors.length < 4) brand.colors[3] = '#111111';
  return Response.json({ ...defaults, ...brand });
}

export async function PATCH(req) {
  const { username, ...brand } = await req.json();
  if (!username) return Response.json({ error: 'username required' }, { status: 400 });
  const user = await getUser(username) ?? {};
  await upsertUser(username, { ...user, brand });
  return Response.json(brand);
}
