import { Groq } from 'groq-sdk';
import { getUser, getMonthlyPitchCount, incrementMonthlyPitchCount } from '@/lib/db';

function pitchLimit(user) {
  if (!user || user.plan === 'pro') return Infinity;
  if (user.plan === 'starter') return 50 + (user.bonusPitches ?? 0);
  return 20;
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req) {
  try {
    const {
      profile,
      content,
      jobDescription,
      messageType,
    } = await req.json();

    if (!profile || !jobDescription || !messageType) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Server-side limit enforcement
    const username = profile.username;
    if (username) {
      const user = await getUser(username);
      const limit = pitchLimit(user);
      if (isFinite(limit)) {
        const count = await getMonthlyPitchCount(username);
        if (count >= limit) {
          return Response.json({ error: 'Monthly pitch limit reached', limitReached: true }, { status: 429 });
        }
      }
    }

    // Collect all unique tags across the full content library
    const allTags = [...new Set(content.flatMap(c => c.tags || []))];

    // Score each content item by tag overlap with the job description, send top 20
    const jobDescLower = jobDescription.toLowerCase();
    const rankedContent = content
      .map(c => ({
        ...c,
        _score: (c.tags || []).filter(t => jobDescLower.includes(t.toLowerCase())).length
          + (c.featured ? 0.5 : 0),
      }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 20);

    const contentSummary = rankedContent
      .map((c, i) => {
        const desc = c.description ? ` — ${c.description}` : '';
        const featured = c.featured ? ' ★featured' : '';
        return `${i + 1}. [${c.type.toUpperCase()}]${featured} ${c.title}${desc} (Tags: ${(c.tags || []).join(', ')})`;
      })
      .join('\n');

    const systemPrompt = `You are a UGC pitch generator. Your job is to help creators write targeted, effort-evident pitches to brands.

Creator Profile:
- Name: ${profile.name || profile.username}
- Bio: ${profile.bio || 'Not set'}
- Niches: ${profile.niche_tags?.join(', ') || 'Not specified'}
- Positioning: ${profile.positioning_statement || 'Not set'}
- Why work with me: ${profile.why_work_with_me || 'Not set'}
- Location: ${profile.location || 'Not specified'}
- Languages: ${profile.languages?.join(', ') || 'Not specified'}
- Socials: ${Object.entries(profile.socials || {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ') || 'None listed'}

Creator's Content Library (top matches shown, ★ = featured):
${contentSummary || 'No content yet'}

Creator's full tag library: ${allTags.length > 0 ? allTags.join(', ') : 'none'}

Your task:
1. Extract the brand name from the job description (e.g. "Nike", "Notion", "SKIMS"). If no brand name is visible, infer it from context. If truly unknown, use a short descriptor like "Fitness Brand".
2. Analyze what the brand specifically needs — tone, format, demographic, content type.
3. Write a compelling pitch intro (2-3 sentences) that shows direct relevance — reference specific content or skills from the library where possible.
4. If messageType is 'note': Write a short punchy reply (1-2 sentences) for Reddit/DM. Get to the point immediately.
5. If messageType is 'message': Write a confident, specific email pitch (3-5 sentences) that connects the creator's work directly to the brand's brief.

TONE EXAMPLES (match this voice exactly — confident, brief, human, no corporate speak):
- note: "Huge fan of what you're building — I've done a bunch of lifestyle/demo work that fits this brief perfectly. Happy to send samples."
- message: "I came across your listing and this one's right in my wheelhouse — I've been creating fitness content for the past two years and have a solid library of demo-style videos that match the energy you're going for. My engagement skews 25–34F which lines up well with your target. Would love to put together a few concepts if you're open to it."

RULES:
- Direct, warm, zero filler ("I am writing to express my interest" is banned)
- Reference specific content pieces or niches from the library where they fit
- For selectedTags: ONLY use tags from the creator's full tag library. Never invent new ones.
- Outreach must feel written by a human, not an AI

Return ONLY valid JSON (no markdown, no preamble):
{
  "brandName": "Extracted brand name",
  "intro": "2-3 sentence pitch introduction shown on the pitch page",
  "outreach": "The ${messageType} outreach message the creator sends to the brand",
  "selectedTags": ["tags from the creator's tag library that match this brand"]
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2000,
      temperature: 0.72,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Job Description:\n${jobDescription}\n\nGenerate the pitch.` },
      ],
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Parse JSON response
    let generatedData;
    try {
      // Try to extract JSON if it's wrapped in markdown
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      generatedData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch (e) {
      console.error('Failed to parse Groq response:', responseText);
      return Response.json(
        { error: 'Failed to generate pitch. Try again.' },
        { status: 500 }
      );
    }

    await incrementMonthlyPitchCount(profile.username);
    return Response.json(generatedData);
  } catch (error) {
    console.error('Pitch generation error:', error);
    return Response.json(
      { error: 'Failed to generate pitch' },
      { status: 500 }
    );
  }
}
