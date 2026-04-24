import { appendAnalytic, getAnalytics, getPitchByShareId, updatePitch } from '@/lib/db';

export async function POST(req) {
  try {
    const { shareId, type, ...data } = await req.json();
    if (!shareId || !type) return Response.json({ error: 'Missing fields' }, { status: 400 });
    await appendAnalytic(shareId, type, { ...data, recordedAt: new Date().toISOString() });

    // Sync opens to the owning pitch so the dashboard badge stays current
    if (type === 'view') {
      getPitchByShareId(shareId).then(pitch => {
        if (!pitch?.id) return;
        const opens = [...(pitch.opens ?? []), { timestamp: new Date().toISOString() }];
        updatePitch(pitch.id, { opens });
      }).catch(() => {});
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function GET(req) {
  const shareId = new URL(req.url).searchParams.get('shareId');
  if (!shareId) return Response.json({ error: 'Missing shareId' }, { status: 400 });

  const rows = await getAnalytics(shareId);

  const viewEvents     = rows.filter(r => r.type === 'view');
  const durationEvents = rows.filter(r => r.type === 'duration');
  const clickEvents    = rows.filter(r => r.type === 'content_click');

  const views = new Set(viewEvents.map(r => r.payload.sessionId)).size;
  const lastViewed = viewEvents.length > 0
    ? [...viewEvents].sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))[0].recorded_at
    : null;

  const durations = durationEvents.filter(r => r.payload.seconds > 2 && r.payload.seconds < 3600);
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((sum, r) => sum + r.payload.seconds, 0) / durations.length)
    : null;

  const clickMap = {};
  clickEvents.forEach(r => {
    const key = r.payload.contentTitle || 'Unknown';
    clickMap[key] = (clickMap[key] || 0) + 1;
  });
  const contentClicks = Object.entries(clickMap)
    .map(([title, clicks]) => ({ title, clicks }))
    .sort((a, b) => b.clicks - a.clicks);

  return Response.json({ views, lastViewed, avgDuration, contentClicks });
}
