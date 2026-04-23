import { getAllUsers } from '@/lib/db';

const RESERVED = [
  'dashboard', 'profile', 'brand', 'content', 'create', 'pitch',
  'admin', 'login', 'help', 'api', 'pitch', 'view', 'p', 'u',
];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get('handle')?.toLowerCase().trim();
  const currentUsername = searchParams.get('username');

  if (!handle) return Response.json({ available: false, error: 'Handle required' });
  if (!/^[a-z0-9-]+$/.test(handle)) return Response.json({ available: false, error: 'Letters, numbers, and hyphens only' });
  if (handle.length < 2 || handle.length > 30) return Response.json({ available: false, error: 'Must be 2–30 characters' });
  if (RESERVED.includes(handle)) return Response.json({ available: false, error: 'This handle is reserved' });

  const users = await getAllUsers();
  const taken = users.some(u => u.handle === handle && u.username !== currentUsername);
  return Response.json({ available: !taken });
}
