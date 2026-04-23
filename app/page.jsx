'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';

const PROBLEMS = [
  {
    problem: 'You copy-paste the same pitch to every brand',
    solve: 'Every pitch is generated from the job description — tailored language, relevant examples, right tone.',
  },
  {
    problem: 'Brands can\'t tell you apart from 200 other creators',
    solve: 'Your shareable pitch page is designed, branded, and built specifically for that opportunity.',
  },
  {
    problem: 'You\'re guessing which content to include',
    solve: 'AI picks your most relevant work based on the brand\'s niche and what they\'re asking for.',
  },
  {
    problem: 'Your pitch lives in a DM and disappears',
    solve: 'Every pitch gets a permanent link. Brands can revisit it, share it with their team, and track opens.',
  },
  {
    problem: 'You have no idea if anyone even looked at it',
    solve: 'See every time your pitch is opened so you know when to follow up.',
  },
];

const FEATURES = [
  { title: 'AI-Generated Pitches', desc: 'Paste any job listing and get a targeted pitch in seconds.' },
  { title: 'Branded Pitch Pages', desc: 'Custom colors, fonts, and templates. Looks like you hired a designer.' },
  { title: 'Content Library', desc: 'Upload your best work once. AI pulls the right pieces for each pitch.' },
  { title: 'Open Tracking', desc: 'Know exactly when a brand views your pitch and how many times.' },
  { title: 'Shareable Links', desc: 'One link to your full pitch. Works everywhere — DMs, email, Reddit.' },
  { title: 'Pitch Organization', desc: 'Folders, filters, drag and drop. Keep your pipeline clean.' },
];

const PLANS = [
  {
    name: 'Starter',
    price: '$9',
    period: 'per month',
    description: 'For creators who pitch regularly and want to look more professional.',
    cta: 'Start free trial',
    highlight: false,
    features: [
      '50 pitches per month',
      'AI pitch generation',
      'Branded pitch pages',
      'Full content library',
      'All templates',
      'Open tracking',
      'Folder organization',
    ],
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    description: 'For creators building a serious pitch pipeline and closing brand deals.',
    cta: 'Start free trial',
    highlight: true,
    features: [
      'Unlimited pitches',
      'Everything in Starter',
      'Advanced analytics — time on page, content clicks',
      'Custom pitch URL',
      'Remove "Made with UGC Pitch" branding',
    ],
  },
];

export default function Home() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const { user, setUser } = useAuth();
  const router = useRouter();
  const loginRef = useRef(null);

  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username.trim()) { setError('Username is required'); return; }
    if (username.length < 2) { setError('At least 2 characters'); return; }
    localStorage.setItem('ugcpitch_user', username);
    setUser({ username });
    fetch('/api/user-registry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    }).catch(() => {});
    router.push('/dashboard');
  };

  if (user) return null;

  return (
    <div className="-mt-12 -mx-6">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-teal-950 text-white pt-28 pb-32 px-6">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #0d9488, transparent)' }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
            ✦ Built for UGC Creators
          </div>
          <h1 className="text-6xl sm:text-7xl font-black tracking-tight leading-none mb-6">
            Stop sending<br />
            <span className="text-teal-400">generic pitches.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            UGC Pitch generates a custom pitch for every brand opportunity — with your best content, your voice, and a shareable page that looks like you hired a designer.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => loginRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg rounded-2xl transition-all hover:scale-105 shadow-lg shadow-teal-500/20"
            >
              Start for free →
            </button>
            <span className="text-gray-500 text-sm">No credit card required</span>
          </div>
        </div>
      </section>

      {/* ── PROBLEMS ─────────────────────────────────────────────────────── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-3">Sound familiar?</p>
            <h2 className="text-4xl font-black text-gray-900">The UGC pitch struggle is real.</h2>
          </div>

          <div className="space-y-4">
            {PROBLEMS.map((item, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="bg-gray-50 px-8 py-6 flex items-start gap-4">
                  <span className="text-red-400 text-xl mt-0.5 flex-shrink-0">✕</span>
                  <p className="text-gray-700 font-medium leading-snug">{item.problem}</p>
                </div>
                <div className="bg-teal-50 px-8 py-6 flex items-start gap-4" style={{ borderLeft: '3px solid #0d9488' }}>
                  <span className="text-teal-500 text-xl mt-0.5 flex-shrink-0">✓</span>
                  <p className="text-gray-800 font-medium leading-snug">{item.solve}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-3">What you get</p>
            <h2 className="text-4xl font-black text-gray-900">Everything in one place.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-3">How it works</p>
            <h2 className="text-4xl font-black text-gray-900">Four steps, done in minutes.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Build your profile', desc: 'Add your bio, niche, and brand colors once.' },
              { step: '02', title: 'Upload your content', desc: 'Add links or photos of your best UGC work.' },
              { step: '03', title: 'Paste the listing', desc: 'Drop in the brand\'s job post or brief.' },
              { step: '04', title: 'Send the link', desc: 'Copy your shareable pitch page and send it.' },
            ].map((s, i) => (
              <div key={i} className="relative">
                {i < 3 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-teal-200 to-transparent z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 border-2 border-teal-100 flex items-center justify-center mb-4">
                    <span className="text-teal-600 font-black text-lg">{s.step}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section className="bg-gray-950 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-3">Pricing</p>
            <h2 className="text-4xl font-black text-white">Simple, honest pricing.</h2>
            <p className="text-gray-400 mt-3">3-day free trial on all plans. No credit card required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {PLANS.map((plan) => (
              <div key={plan.name}
                className="rounded-3xl p-8 flex flex-col"
                style={{
                  backgroundColor: plan.highlight ? '#0d9488' : '#111827',
                  border: plan.highlight ? 'none' : '1px solid #1f2937',
                  boxShadow: plan.highlight ? '0 20px 60px rgba(13,148,136,0.3)' : 'none',
                }}>
                <div className="mb-6">
                  {plan.highlight && (
                    <span className="inline-block bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-2xl font-black text-white mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-5xl font-black text-white">{plan.price}</span>
                    <span className={plan.highlight ? 'text-teal-100/70 text-sm' : 'text-gray-500 text-sm'}>{plan.period}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${plan.highlight ? 'text-teal-100/80' : 'text-gray-400'}`}>
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className={`mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-white' : 'text-teal-500'}`}>✓</span>
                      <span className={`text-sm ${plan.highlight ? 'text-white/90' : 'text-gray-300'}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => loginRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                  style={{
                    backgroundColor: plan.highlight ? '#fff' : '#0d9488',
                    color: plan.highlight ? '#0d9488' : '#fff',
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA / LOGIN ──────────────────────────────────────────────────── */}
      <section ref={loginRef} className="bg-gradient-to-br from-teal-600 to-teal-800 py-24 px-6">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-3">Ready to pitch smarter?</h2>
          <p className="text-teal-100/80 mb-10">Start your 3-day free trial. No credit card required.</p>

          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-left">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Creator Handle</label>
                <input
                  type="text"
                  placeholder="e.g., sarah_creates"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900"
                />
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>
              <button type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-all hover:scale-105">
                Get Started Free →
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-4">No credit card. No email required to start.</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <div className="bg-gray-950 py-8 px-6 text-center">
        <p className="text-gray-600 text-sm">© 2025 UGC Pitch. Stop blending in.</p>
      </div>

    </div>
  );
}
