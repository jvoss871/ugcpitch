import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req) {
  try {
    const { bio, niches, positioning_statement } = await req.json();

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You write punchy, confident "Why Work With Me" statements for UGC creators pitching to brands.
Write 2 sentences max. No fluff, no "I'm passionate about". Lead with the outcome for the brand, not the creator's feelings.
Sound like a pro who knows their value. Return only the statement — no quotes, no label, no explanation.`,
        },
        {
          role: 'user',
          content: `Bio: ${bio || 'Not provided'}
Niches: ${niches?.join(', ') || 'Not provided'}
Positioning: ${positioning_statement || 'Not provided'}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 120,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? '';
    return Response.json({ text });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to generate' }, { status: 500 });
  }
}
