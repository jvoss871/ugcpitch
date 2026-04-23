import { getPitch, savePitch } from '@/lib/db';

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export async function POST(req) {
  try {
    const data = await req.json();
    const id = generateId();
    await savePitch(id, data);
    return Response.json({ id });
  } catch {
    return Response.json({ error: 'Failed to save pitch' }, { status: 500 });
  }
}

export async function GET(req) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return Response.json({ error: 'Not found' }, { status: 404 });

  const pitch = await getPitch(id);
  if (!pitch) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(pitch);
}
