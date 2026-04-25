'use client';

import { useState } from 'react';

const DEMO_VIDEO_URL = ''; // paste a YouTube or Loom embed URL here

const FAQ = [
  {
    q: 'Why does my pitch sound generic?',
    a: 'Fill out your Bio and Positioning Statement fully — the AI uses these as its primary signal. The more specific you are about your niche and style, the more targeted the pitch.',
  },
  {
    q: "Why isn't my content showing up in pitches?",
    a: "Make sure your content items have tags that match the brand's niche. The AI selects content by matching job description keywords to your content tags — no tags means no match.",
  },
  {
    q: "What's the difference between Short Note and Full Message?",
    a: 'Short Note is for Reddit threads, Instagram DMs, or quick replies — concise and direct. Full Message is for email pitches or longer applications where you have more room to sell yourself.',
  },
  {
    q: 'Can I edit a pitch after generating it?',
    a: 'Yes. Open any pitch and click Edit to update the brand name, intro, outreach message, and which content pieces are shown.',
  },
  {
    q: 'How do I track if a brand opened my pitch?',
    a: 'Every shareable pitch link is tracked. Open your pitch and click the analytics icon in the top bar to see open counts and timestamps.',
  },
  {
    q: 'Can brands see my analytics?',
    a: 'No. Analytics are only visible to you when logged in. The public pitch page shows only your pitch content.',
  },
  {
    q: 'What should I put in the Content Library?',
    a: 'Your best past UGC work — video links, portfolio pieces, sample ads. Add a title, tags matching the niche, and a short description so the AI knows what each piece is best suited for.',
  },
  {
    q: 'How do I get the branding removed from my pitch pages?',
    a: 'The "Made with UGC Edge" badge is removed on the Pro plan. Upgrade and it disappears automatically.',
  },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-1 font-display">Help & Tips</h1>
        <p className="text-gray-500 text-sm">Everything you need to get the most out of UGC Edge.</p>
      </div>

      <div className="space-y-4">

        {/* Demo video */}
        <div className="card">
          <h2 className="text-base font-bold text-gray-900 mb-1">Product Demo</h2>
          <p className="text-sm text-gray-500 mb-4">Watch this to get the most out of UGC Edge.</p>
          {DEMO_VIDEO_URL ? (
            <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingTop: '56.25%' }}>
              <iframe
                src={DEMO_VIDEO_URL}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="w-full rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center py-14 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-500">Demo video coming soon</p>
              <p className="text-xs text-gray-400 mt-1">Check back here for a full walkthrough</p>
            </div>
          )}
        </div>

        {/* Getting started */}
        <div className="card space-y-4">
          <h2 className="text-base font-bold text-gray-900">Get better pitches in 3 steps</h2>
          {[
            {
              n: '1',
              title: 'Fill out your profile completely',
              body: 'Your Bio, Positioning Statement, and "Why Work With Me" are the core of every pitch. Vague profiles produce vague pitches — be specific about your niche, style, and results.',
            },
            {
              n: '2',
              title: 'Tag your content library items',
              body: "The AI matches your content to each job posting using tags. If a brand is looking for \"skincare UGC\" and none of your content is tagged \"beauty\" or \"skincare\", nothing gets selected.",
            },
            {
              n: '3',
              title: 'Paste the full job description',
              body: "The more of the brand's post you include, the better the AI can tailor the pitch. Don't just paste the title — paste the whole thing including requirements and tone notes.",
            },
          ].map(step => (
            <div key={step.n} className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-teal-600 text-xs font-black">{step.n}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Content library tips */}
        <div className="card space-y-3">
          <h2 className="text-base font-bold text-gray-900">Content Library tips</h2>
          <ul className="space-y-2.5">
            {[
              'Add a description to each item — the AI reads it to understand what the content is best suited for.',
              'Use specific tags: "skincare", "unboxing", "B2B SaaS" — not just broad ones like "lifestyle".',
              'Mark your strongest pieces as Featured so they get priority in every pitch.',
              'Add video links (YouTube, Loom, TikTok) — brands can play them directly on your pitch page.',
              'Keep your library updated. Old content from niches you no longer work in can dilute your pitches.',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-teal-500 mt-0.5 flex-shrink-0">✓</span>
                <p className="text-sm text-gray-600 leading-relaxed">{tip}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* FAQ */}
        <div className="card">
          <h2 className="text-base font-bold text-gray-900 mb-4">FAQ</h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition"
                >
                  <span className="text-sm font-semibold text-gray-900">{item.q}</span>
                  <svg
                    className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform"
                    style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none' }}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
}
