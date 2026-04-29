import { getPitchesByUser, deletePitchesByIds } from '@/lib/db';

function checkAuth(req) {
  return !!process.env.ADMIN_PASSWORD && req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export async function GET(req) {
  if (!checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const pitches = await getPitchesByUser('demo');
  return Response.json({ count: pitches.length });
}

export async function DELETE(req) {
  if (!checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const pitches = await getPitchesByUser('demo');
  if (pitches.length > 0) {
    await deletePitchesByIds(pitches.map(p => p.id ?? p.shareId).filter(Boolean));
  }
  return Response.json({ ok: true, deleted: pitches.length });
}
