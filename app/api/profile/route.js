import { getUser, upsertUser } from '@/lib/db';

const defaultProfile = (username) => ({
  username, name: '', bio: '', niche_tags: [], positioning_statement: '',
  avatar: null, location: '', languages: [],
  socials: { instagram: '', tiktok: '', youtube: '', canva: '', email: '' },
  why_work_with_me: '',
});

export async function GET(req) {
  const username = new URL(req.url).searchParams.get('username');
  if (!username) return Response.json({}, { status: 400 });
  const user = await getUser(username);
  return Response.json(user?.profile ?? defaultProfile(username));
}

export async function PATCH(req) {
  const { username, ...profile } = await req.json();
  if (!username) return Response.json({ error: 'username required' }, { status: 400 });
  const user = await getUser(username) ?? {};
  await upsertUser(username, { ...user, profile });
  return Response.json(profile);
}
