import { getPitch, updatePitch, deletePitchById } from '@/lib/db';

// GET /api/pitches/[id]
export async function GET(req, { params }) {
  const pitch = await getPitch(params.id);
  if (!pitch) return Response.json({ error: 'not found' }, { status: 404 });
  return Response.json(pitch);
}

// PATCH /api/pitches/[id]
export async function PATCH(req, { params }) {
  const updates = await req.json();
  const updated = await updatePitch(params.id, updates);
  if (!updated) return Response.json({ error: 'not found' }, { status: 404 });
  return Response.json(updated);
}

// DELETE /api/pitches/[id]
export async function DELETE(req, { params }) {
  await deletePitchById(params.id);
  return Response.json({ ok: true });
}
