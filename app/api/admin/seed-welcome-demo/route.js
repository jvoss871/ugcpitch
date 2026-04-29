import { getPitch, savePitch } from '@/lib/db';

function checkAuth(req) {
  return !!process.env.ADMIN_PASSWORD && req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export const WELCOME_DEMO_ID = 'welcome-demo';

const DEMO_PITCH = {
  profile: {
    name: 'Sofia Reyes',
    username: 'demo',
    bio: 'Lifestyle and beauty UGC creator based in Miami. I make content that feels real — no heavy filters, just authentic reactions that actually convert.',
    positioning_statement: 'I specialize in beauty and lifestyle UGC that drives purchase intent. Authentic over aspirational, every time.',
    why_work_with_me: "I only create content I genuinely believe in. That trust transfers directly to your product.",
    niche_tags: ['beauty', 'lifestyle'],
    location: 'Miami, FL',
    languages: ['English'],
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=face',
    socials: { instagram: '@sofia.reyes.ugc', tiktok: '@sofiareyes', youtube: '', canva: '', email: 'sofia@sofiareyes.co' },
    stats: { followers: '86K', engagement_rate: '5.8%', avg_views: '32K' },
    brand: { colors: ['#0d9488', '#0f1117', '#f5f4f0', '#111111'], font: 'Inter', templateId: 'modern', configured: true },
    templateId: 'modern',
  },
  pitch: {
    title: 'Glossier',
    intro: "Glossier's whole ethos is skin that looks like skin — that's exactly the kind of content I create. My audience doesn't want a filter, they want to see the product actually work on a real face.",
    selectedContent: [
      { id: 'demo-c1', type: 'image', url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=750&fit=crop', title: 'Morning Skincare Routine', tags: ['beauty', 'skincare'] },
      { id: 'demo-c2', type: 'image', url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=750&fit=crop', title: 'Everyday Glam Look', tags: ['beauty', 'makeup'] },
      { id: 'demo-c3', type: 'image', url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=750&fit=crop', title: 'Skincare Flat Lay', tags: ['beauty', 'skincare'] },
    ],
    removeBranding: true,
  },
};

export async function GET(req) {
  if (!checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const existing = await getPitch(WELCOME_DEMO_ID);
  return Response.json({ exists: !!existing });
}

export async function POST(req) {
  if (!checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  await savePitch(WELCOME_DEMO_ID, DEMO_PITCH);
  return Response.json({ ok: true, id: WELCOME_DEMO_ID });
}
