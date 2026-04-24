import { Groq } from 'groq-sdk';
import { getUser, getMonthlyPitchCount, incrementMonthlyPitchCount } from '@/lib/db';

function pitchLimit(user) {
  if (!user || user.plan === 'pro') return Infinity;
  if (user.plan === 'starter') return 50 + (user.bonusPitches ?? 0);
  return 10;
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

    // Score each content item by how many of its tags appear in the job description,
    // then take the top 10 most relevant pieces to send as context
    const jobDescLower = jobDescription.toLowerCase();
    const rankedContent = content
      .map(c => ({
        ...c,
        _score: (c.tags || []).filter(t => jobDescLower.includes(t.toLowerCase())).length,
      }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 10);

    const contentSummary = rankedContent
      .map((c, i) => {
        const desc = c.description ? ` — ${c.description}` : '';
        return `${i + 1}. ${c.title}${desc} (Tags: ${(c.tags || []).join(', ')}) [${c.type}]`;
      })
      .join('\n');

    const systemPrompt = `You are a UGC pitch generator. Your job is to help creators write targeted, effort-evident pitches to brands.

Creator Profile:
- Username: ${profile.username}
- Bio: ${profile.bio || 'Not set'}
- Niches: ${profile.niche_tags?.join(', ') || 'Not specified'}
- Positioning: ${profile.positioning_statement || 'Not set'}

Creator's Content (most relevant pieces shown):
${contentSummary || 'No content yet'}

Creator's full tag library: ${allTags.length > 0 ? allTags.join(', ') : 'none'}

Your task:
1. Extract the brand name from the job description (e.g. "Nike", "Notion", "SKIMS"). If no brand name is visible, infer the most likely company name from context. If truly unknown, use a short description like "Fitness Brand".
2. Analyze the job description to understand what the brand needs
3. Generate a compelling pitch introduction (2-3 sentences) that shows why this creator is perfect
4. If messageType is 'note': Create a short, snappy response (1-2 sentences) suitable for Reddit comments or Instagram DMs
5. If messageType is 'message': Create a professional, detailed email-style pitch (3-4 sentences) with clear value proposition

TONE EXAMPLES (match this voice — confident, brief, human):
- note: "Huge fan of what you're building — I've done a bunch of lifestyle/demo work that fits this brief perfectly. Happy to send samples."
- message: "I came across your listing and this one's right in my wheelhouse — I've been creating fitness content for the past two years and have a solid library of demo-style videos that match the energy you're going for. My engagement skews 25–34F which I think lines up well with your target. Would love to put together a few concepts if you're open to it."

IMPORTANT:
- Match the tone of the examples above — direct, warm, no filler phrases like "I am writing to express my interest"
- Reference specific content or skills where relevant
- Be confident but not arrogant
- For selectedTags: choose ONLY from the creator's full tag library listed above. Do not invent new tags.

Return ONLY valid JSON (no markdown, no preamble) in this exact format:
{
  "brandName": "Extracted brand name",
  "intro": "2-3 sentence pitch introduction",
  "outreach": "The ${messageType} version of the outreach message",
  "selectedTags": ["choose only from the creator's tag library"]
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 800,
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
