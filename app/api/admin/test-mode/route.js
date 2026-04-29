import { getUser, upsertUser, getPitchesByUser, deletePitchesByIds, savePitch } from '@/lib/db';

function checkAuth(req) {
  return !!process.env.ADMIN_PASSWORD && req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

const FILLED_PROFILE = {
  name: 'Jordan Lee',
  bio: 'Lifestyle and beauty UGC creator based in Austin. I make content that feels real — no heavy filters, no scripts, just authentic reactions that convert.',
  positioning_statement: 'I specialize in beauty and lifestyle UGC that drives purchase intent. Authentic over aspirational, every time.',
  why_work_with_me: "I only create content I believe in. My audience knows it — and that trust transfers directly to your product.",
  niche_tags: ['beauty', 'lifestyle'],
  location: 'Austin, TX',
  languages: ['English'],
  avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=face',
  socials: { instagram: '@jordanlee.ugc', tiktok: '@jordanlee', youtube: '', canva: '', email: 'jordan@jordanlee.co' },
  stats: { followers: '42K', engagement_rate: '5.1%', avg_views: '18K' },
};

const FILLED_BRAND = {
  colors: ['#0d9488', '#0f1117', '#f5f4f0', '#111111'],
  font: 'Inter',
  templateId: 'modern',
  configured: true,
};

const FILLED_CONTENT = [
  { id: 'seed-1', type: 'image', url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=750&fit=crop', title: 'Morning Skincare Routine', tags: ['beauty', 'skincare'], created_at: new Date().toISOString() },
  { id: 'seed-2', type: 'image', url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=750&fit=crop', title: 'Everyday Glam Look', tags: ['beauty', 'makeup'], created_at: new Date().toISOString() },
  { id: 'seed-3', type: 'image', url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=750&fit=crop', title: 'Skincare Flat Lay', tags: ['beauty', 'skincare'], created_at: new Date().toISOString() },
  { id: 'seed-4', type: 'image', url: 'https://images.unsplash.com/photo-1524758631624-e2822132ecd7?w=600&h=750&fit=crop', title: 'Lifestyle Product Shot', tags: ['lifestyle'], created_at: new Date().toISOString() },
];

const SAMPLE_PITCH_ID = 'test-pitch-glossier';
const SAMPLE_SHARE_ID = 'test-share-glossier';

const SAMPLE_PITCH = (username) => ({
  id: SAMPLE_PITCH_ID,
  username,
  title: 'Glossier',
  intro: "Glossier's whole ethos is skin that looks like skin — that's exactly the kind of content I create. My audience doesn't want a filter, they want to see the product actually work on a real face.",
  outreach: "Hi Glossier team — I've been using your products for two years and the results speak for themselves. I'd love to create a UGC series for your next launch. Here's my full pitch page with examples of my skincare content.",
  selectedContent: FILLED_CONTENT.slice(0, 3),
  shareId: SAMPLE_SHARE_ID,
  opens: [{ timestamp: new Date(Date.now() - 3600000).toISOString() }],
  folderId: null,
  created_at: new Date(Date.now() - 86400000).toISOString(),
});

const SAMPLE_SHARE = (profile, brand) => ({
  profile: {
    ...FILLED_PROFILE,
    username: 'demo',
    brand: { ...FILLED_BRAND },
    templateId: 'modern',
  },
  pitch: {
    title: 'Glossier',
    intro: "Glossier's whole ethos is skin that looks like skin — that's exactly the kind of content I create. My audience doesn't want a filter, they want to see the product actually work on a real face.",
    selectedContent: FILLED_CONTENT.slice(0, 3),
    removeBranding: false,
  },
});

export async function POST(req) {
  if (!checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { username, mode } = await req.json();
  if (!username || !['new-user', 'filled'].includes(mode)) {
    return Response.json({ error: 'username and mode (new-user|filled) required' }, { status: 400 });
  }

  const user = await getUser(username) ?? { username };

  if (mode === 'new-user') {
    // Clear all user data
    const pitches = await getPitchesByUser(username);
    if (pitches.length > 0) {
      await deletePitchesByIds(pitches.map(p => p.id));
    }
    // Also delete the seeded share pitch if present
    try { await deletePitchesByIds([SAMPLE_SHARE_ID]); } catch {}

    await upsertUser(username, {
      ...user,
      profile: { username, name: '', bio: '', niche_tags: [], positioning_statement: '', avatar: null, location: '', languages: [], socials: { instagram: '', tiktok: '', youtube: '', canva: '', email: '' }, why_work_with_me: '' },
      brand: { colors: ['#0d9488', '#0f1117', '#f5f4f0', '#111111'], font: 'Inter', templateId: 'modern' },
      content: [],
    });

    return Response.json({ ok: true, mode: 'new-user' });
  }

  if (mode === 'filled') {
    // Seed complete profile, brand, content
    await upsertUser(username, {
      ...user,
      profile: { ...FILLED_PROFILE, username },
      brand: FILLED_BRAND,
      content: FILLED_CONTENT,
    });

    // Clear any existing pitches first
    const existing = await getPitchesByUser(username);
    if (existing.length > 0) {
      await deletePitchesByIds(existing.map(p => p.id));
    }

    // Create sample user pitch
    await savePitch(SAMPLE_PITCH_ID, SAMPLE_PITCH(username));

    // Create sample share pitch (for /pitch/view)
    await savePitch(SAMPLE_SHARE_ID, SAMPLE_SHARE());

    return Response.json({ ok: true, mode: 'filled' });
  }
}
