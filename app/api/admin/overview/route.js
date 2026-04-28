import { getAllUsers } from '@/lib/db';

function checkAuth(req) {
  return !!process.env.ADMIN_PASSWORD && req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export async function GET(req) {
  if (!checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const allUsers = await getAllUsers();
    const users = allUsers.filter(u => !u.isAdmin);
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 86400000;

    let free = 0, starter = 0, pro = 0, expired = 0;

    for (const u of users) {
      if (u.plan === 'pro') { pro++; continue; }
      if (u.plan === 'starter') { starter++; continue; }
      if (u.plan === 'free') { free++; continue; }
      // Legacy trial users
      const trialEnd = u.trialEndsAt
        ? new Date(u.trialEndsAt).getTime()
        : u.trialStartedAt
          ? new Date(u.trialStartedAt).getTime() + 3 * 86400000
          : 0;
      if (trialEnd < now) expired++;
      else free++;
    }

    const mrr = starter * 9 + pro * 19;
    const totalPitches = users.reduce((sum, u) => sum + (u.pitchCount ?? 0), 0);
    const recentFreeUsers = users.filter(u => new Date(u.createdAt).getTime() > thirtyDaysAgo && (u.plan === 'free' || u.plan === 'trial'));
    const converted = users.filter(u => new Date(u.createdAt).getTime() > thirtyDaysAgo && (u.plan === 'starter' || u.plan === 'pro')).length;
    const conversionRate = (recentFreeUsers.length + converted) > 0
      ? Math.round(converted / (recentFreeUsers.length + converted) * 100)
      : 0;

    return Response.json({ total: users.length, free, starter, pro, expired, mrr, totalPitches, conversionRate, recentTrialUsers: recentFreeUsers.length, converted });
  } catch {
    return Response.json({ total: 0, trial: 0, starter: 0, pro: 0, expired: 0, mrr: 0, conversionRate: 0, recentTrialUsers: 0, converted: 0 });
  }
}
