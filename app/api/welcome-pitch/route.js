import { Groq } from 'groq-sdk';
import { savePitch } from '@/lib/db';
import { STARTER_PROFILES } from '@/lib/starter-profiles';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export async function POST(req) {
  try {
    const { brandName, niche } = await req.json();
    if (!brandName || !niche) {
      return Response.json({ error: 'Missing brandName or niche' }, { status: 400 });
    }

    const profile = STARTER_PROFILES[niche] ?? STARTER_PROFILES.lifestyle;

    const systemPrompt = `You are a UGC pitch generator. Write a targeted, human-sounding pitch from a ${niche} creator to a brand.

Creator: ${profile.name}
Bio: ${profile.bio}
Positioning: ${profile.positioning_statement}
Niches: ${profile.niche_tags.join(', ')}
Location: ${profile.location}

Rules:
- Confident and direct, no corporate filler
- Reference the brand naturally
- Outreach feels like a real person wrote it, not an AI

Return ONLY valid JSON:
{
  "intro": "2-3 sentences shown on the pitch page explaining why this creator is the right fit for this specific brand",
  "outreach": "3-4 sentence outreach message the creator would send to this brand via email or DM"
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 600,
      temperature: 0.72,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Brand: ${brandName}` },
      ],
    });

    const text = completion.choices[0]?.message?.content || '';
    let result;
    try {
      const match = text.match(/\{[\s\S]*\}/);
      result = JSON.parse(match ? match[0] : text);
    } catch {
      return Response.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const shareId = generateId();
    await savePitch(shareId, {
      profile: {
        ...profile,
        username: 'demo',
        brand: {
          colors: ['#0d9488', '#0f1117', '#f5f4f0', '#111111'],
          font: 'Inter',
          templateId: 'modern',
          configured: true,
        },
        templateId: 'modern',
      },
      pitch: {
        title: brandName,
        intro: result.intro,
        selectedContent: profile.content,
        removeBranding: true,
      },
    });

    return Response.json({ shareId, outreach: result.outreach });
  } catch (error) {
    console.error('Welcome pitch error:', error);
    return Response.json({ error: 'Failed to generate pitch' }, { status: 500 });
  }
}
