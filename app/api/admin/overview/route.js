import { getAllUsers } from '@/lib/db';

function checkAuth(req) {
  return !!process.env.ADMIN_PASSWORD && req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export async function GET(req) {
  if (!checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const users = await getAllUsers();
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 86400000;

    let trial = 0, starter = 0, pro = 0, expired = 0;

    for (const u of users) {
      if (u.plan === 'pro') { pro++; continue; }
      if (u.plan === 'starter') { starter++; continue; }
      const trialEnd = u.trialEndsAt
        ? new Date(u.trialEndsAt).getTime()
        : new Date(u.trialStartedAt).getTime() + 3 * 86400000;
      if (trialEnd < now) expired++;
      else trial++;
    }

    const mrr = starter * 9 + pro * 19;
    const recentTrialUsers = users.filter(u => new Date(u.trialStartedAt).getTime() > thirtyDaysAgo);
    const converted = recentTrialUsers.filter(u => u.plan === 'starter' || u.plan === 'pro').length;
    const conversionRate = recentTrialUsers.length > 0
      ? Math.round(converted / recentTrialUsers.length * 100)
      : 0;

    return Response.json({ total: users.length, trial, starter, pro, expired, mrr, conversionRate, recentTrialUsers: recentTrialUsers.length, converted });
  } catch {
    return Response.json({ total: 0, trial: 0, starter: 0, pro: 0, expired: 0, mrr: 0, conversionRate: 0, recentTrialUsers: 0, converted: 0 });
  }
}
