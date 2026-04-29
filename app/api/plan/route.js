import { getUser, upsertUser, getMonthlyPitchCount } from '@/lib/db';

function defaultFeatures(overrides = {}) {
  return { advanced_analytics: false, custom_url: false, remove_branding: false, ...overrides };
}

function proFeatures(overrides = {}) {
  return { advanced_analytics: true, custom_url: true, remove_branding: true, ...overrides };
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  if (!username) return Response.json({ error: 'username required' }, { status: 400 });

  const user = await getUser(username);
  const monthlyPitchCount = await getMonthlyPitchCount(username);

  if (!user) {
    return Response.json({ status: 'free', pitchLimit: 20, features: defaultFeatures(), oneTimePitches: 0, monthlyPitchCount });
  }

  const oneTimePitches = user.oneTimePitches ?? 0;

  if (user.plan === 'pro') {
    return Response.json({ status: 'pro', daysLeft: null, features: proFeatures(user.features), oneTimePitches, handle: user.handle ?? null, monthlyPitchCount });
  }
  if (user.plan === 'starter') {
    const pitchLimit = 50 + (user.bonusPitches ?? 0);
    return Response.json({ status: 'starter', features: defaultFeatures(user.features), pitchLimit, oneTimePitches, monthlyPitchCount });
  }
  if (user.plan === 'free') {
    return Response.json({ status: 'free', pitchLimit: 20, features: defaultFeatures(), oneTimePitches, monthlyPitchCount });
  }

  // Legacy trial/expired users → treat as free
  return Response.json({ status: 'free', pitchLimit: 20, features: defaultFeatures(), oneTimePitches, monthlyPitchCount });
}

export async function PATCH(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  if (!username) return Response.json({ error: 'username required' }, { status: 400 });

  const user = await getUser(username);
  if (!user) return Response.json({ error: 'not found' }, { status: 404 });

  const remaining = user.oneTimePitches ?? 0;
  if (remaining <= 0) return Response.json({ error: 'no one-time pitches remaining' }, { status: 400 });

  const updated = { ...user, oneTimePitches: remaining - 1 };
  await upsertUser(username, updated);
  return Response.json({ ok: true, oneTimePitches: updated.oneTimePitches });
}
