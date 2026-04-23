import { getUser, upsertUser } from '@/lib/db';

export async function POST(req) {
  const { username } = await req.json();
  if (!username) return Response.json({ error: 'username required' }, { status: 400 });

  let user = await getUser(username);

  if (!user) {
    user = {
      username,
      createdAt: new Date().toISOString(),
      plan: 'free',
      pitchCount: 0,
      features: {
        advanced_analytics: false,
        custom_url: false,
        remove_branding: false,
      },
    };
  }

  user.lastSeen = new Date().toISOString();
  await upsertUser(username, user);
  return Response.json({ ok: true });
}
