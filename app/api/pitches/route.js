import { getPitchesByUser, getPitch, savePitch, deletePitchesByIds } from '@/lib/db';

// GET /api/pitches?username=X  — list user's pitches
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  if (!username) return Response.json({ error: 'username required' }, { status: 400 });
  const pitches = await getPitchesByUser(username);
  return Response.json(pitches);
}

// POST /api/pitches  — create (or migrate) a pitch
export async function POST(req) {
  const body = await req.json();
  const { username, ...rest } = body;
  if (!username) return Response.json({ error: 'username required' }, { status: 400 });

  const id = rest.id || crypto.randomUUID();
  const pitch = {
    customContent: null,
    opens: [],
    folderId: null,
    shareId: null,
    ...rest,
    id,
    username,
    created_at: rest.created_at || new Date().toISOString(),
  };
  await savePitch(id, pitch);
  return Response.json(pitch);
}

// PATCH /api/pitches  — bulk move to folder
export async function PATCH(req) {
  const { ids, folderId } = await req.json();
  if (!ids?.length) return Response.json({ error: 'ids required' }, { status: 400 });
  await Promise.all(ids.map(async id => {
    const pitch = await getPitch(id);
    if (pitch) await savePitch(id, { ...pitch, folderId: folderId ?? null });
  }));
  return Response.json({ ok: true });
}

// DELETE /api/pitches  — bulk delete
export async function DELETE(req) {
  const { ids } = await req.json();
  if (!ids?.length) return Response.json({ error: 'ids required' }, { status: 400 });
  await deletePitchesByIds(ids);
  return Response.json({ ok: true });
}
