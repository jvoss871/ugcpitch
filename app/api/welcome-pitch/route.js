import { Groq } from 'groq-sdk';
import { savePitch, getUser, upsertUser } from '@/lib/db';
import { STARTER_PROFILES } from '@/lib/starter-profiles';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export async function POST(req) {
  try {
    const { brandName, niche, name, username } = await req.json();
    if (!brandName || !niche) {
      return Response.json({ error: 'Missing brandName or niche' }, { status: 400 });
    }

    const profile = STARTER_PROFILES[niche] ?? STARTER_PROFILES.lifestyle;
    const creatorName = name?.trim() || profile.name;

    const systemPrompt = `You are a UGC pitch generator. Write targeted, human-sounding copy from a ${niche} creator pitching a specific brand.

Creator: ${creatorName}
Bio: ${profile.bio}
Positioning: ${profile.positioning_statement}
Niches: ${profile.niche_tags.join(', ')}
Location: ${profile.location}

Rules:
- Confident and specific — sounds like the creator genuinely knows this brand
- No corporate filler, no generic phrases like "I'd love to collaborate"
- Reference the brand's actual identity, audience, or aesthetic naturally
- Write like a creator who wins brand deals, not one who begs for them

Return ONLY valid JSON:
{
  "intro": "2-3 sentences on the pitch page. Why this creator is a natural fit for this specific brand. Lead with insight about the brand, not about the creator.",
  "why_work_with_me": "2-3 sentences. What this creator uniquely brings to this brand — audience overlap, content style, or values alignment. Specific to this brand, not generic.",
  "outreach": "3-4 sentence DM or email. Strong opener that shows brand knowledge, one clear value prop, one soft ask. No filler."
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 900,
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

    // Save name to user's profile if provided
    if (username && name?.trim()) {
      const user = await getUser(username) ?? {};
      const existingProfile = user.profile ?? {};
      if (!existingProfile.name) {
        await upsertUser(username, { ...user, profile: { ...existingProfile, name: name.trim() } });
      }
    }

    const shareId = generateId();
    await savePitch(shareId, {
      profile: {
        ...profile,
        name: creatorName,
        why_work_with_me: result.why_work_with_me ?? profile.why_work_with_me,
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
