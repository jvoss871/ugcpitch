'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';



const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Start pitching today. No card required.',
    cta: 'Get started free',
    highlight: false,
    features: [
      '10 pitches per month',
      'Full AI pitch generation',
      'Branded pitch pages',
      'Content library',
      'Response generation',
      '"Made with UGC Edge" badge',
    ],
  },
  {
    name: 'Starter',
    price: '$9',
    period: 'per month',
    description: 'For creators who pitch regularly and want to look more professional.',
    cta: 'Get started',
    highlight: false,
    features: [
      '50 pitches per month',
      'Everything in Free',
      'Open tracking',
      'Folder organization',
      'All templates',
    ],
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    description: 'For creators building a serious pitch pipeline and closing brand deals.',
    cta: 'Get started',
    highlight: true,
    features: [
      'Unlimited pitches',
      'Everything in Starter',
      'Advanced analytics — time on page, content clicks',
      'Custom pitch URL',
      'Remove "Made with UGC Edge" branding',
    ],
  },
];

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  if (user) return null;

  return (
    <div className="-mt-12 -mx-6">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-gray-950 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center pt-20 pb-16 lg:pt-28 lg:pb-0">

          {/* Left — copy */}
          <div className="py-4 lg:py-16">

            <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-8">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
              Built for UGC creators
            </div>

            <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-6">
              The pitch page<br />
              that gets you<br />
              <span className="text-teal-400">picked.</span>
            </h1>

            <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-md">
              Paste any brand listing. Get a custom pitch page with tailored copy, your best content, and your brand — ready to send in 30 seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 mb-12">
              <Link
                href="/login"
                className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white font-bold text-base rounded-2xl transition-all hover:scale-105 shadow-lg shadow-teal-500/20 whitespace-nowrap"
              >
                Get started free →
              </Link>
              <span className="text-gray-500 text-sm self-center">Free forever · no credit card needed</span>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[
                  'bg-gradient-to-br from-pink-400 to-rose-500',
                  'bg-gradient-to-br from-violet-400 to-purple-600',
                  'bg-gradient-to-br from-blue-400 to-cyan-500',
                  'bg-gradient-to-br from-amber-400 to-orange-500',
                  'bg-gradient-to-br from-teal-400 to-emerald-500',
                ].map((g, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${g} border-2 border-gray-950 flex-shrink-0`} />
                ))}
              </div>
              <p className="text-gray-400 text-sm">
                <span className="text-white font-semibold">50+ creators</span> landing brand deals
              </p>
            </div>
          </div>

          {/* Right — pitch page mockup */}
          <div className="hidden lg:flex flex-col items-center justify-end lg:pt-12 pb-12 relative">

            {/* Glow behind card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-500/8 rounded-full blur-3xl pointer-events-none" />

            {/* Browser chrome */}
            <div className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">
              <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-3 bg-white rounded-md h-6 flex items-center px-3 border border-gray-200">
                  <span className="text-gray-400 text-[11px] font-mono truncate">ugcedge.com/p/jessica-kim-nike</span>
                </div>
              </div>

              {/* Pitch page body */}
              <div className="p-5 bg-white">
                {/* Creator header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex-shrink-0" />
                  <div>
                    <p className="font-black text-gray-900 text-sm">Jessica Kim</p>
                    <p className="text-[11px] text-gray-500">Lifestyle · Beauty · Fitness</p>
                  </div>
                  <div className="ml-auto bg-teal-50 border border-teal-100 text-teal-700 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                    Tailored for Nike
                  </div>
                </div>

                {/* Pitch excerpt */}
                <p className="text-[12px] text-gray-600 leading-relaxed mb-4 border-l-2 border-teal-400 pl-3">
                  I've been creating authentic fitness content for 3 years — the kind that actually gets people to lace up. My audience skews 18–34, highly engaged with real over polished...
                </p>

                {/* Content grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl h-20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" /></svg>
                  </div>
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl h-20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" /></svg>
                  </div>
                  <div className="bg-gradient-to-br from-violet-100 to-violet-200 rounded-xl h-20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" /></svg>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex gap-0 mb-4 bg-gray-50 rounded-xl overflow-hidden divide-x divide-gray-100">
                  {[{ v: '124K', l: 'Avg reach' }, { v: '6.2%', l: 'Engagement' }, { v: '48', l: 'UGC pieces' }].map(({ v, l }) => (
                    <div key={l} className="flex-1 py-2.5 text-center">
                      <p className="text-sm font-black text-gray-900">{v}</p>
                      <p className="text-[10px] text-gray-400">{l}</p>
                    </div>
                  ))}
                </div>

                <button className="w-full py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl">
                  View full pitch
                </button>
              </div>
            </div>

            {/* Floating open-tracking toast */}
            <div className="absolute -bottom-2 -left-6 bg-white rounded-2xl shadow-xl ring-1 ring-gray-100 p-3 flex items-center gap-3 max-w-[230px]">
              <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 leading-tight">Nike opened your pitch</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Just now · 2 min on page</p>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom fade into next section */}
        <div className="h-16 bg-gradient-to-b from-gray-950 to-white" />
      </section>

      {/* ── PROBLEMS ─────────────────────────────────────────────────────── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-3">Sound familiar?</p>
            <h2 className="text-4xl font-black text-gray-900">Most creators never get a reply. Here's why.</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Brands and agencies see hundreds of applications. Most get ignored instantly.</p>
          </div>

          {/* 3 problem cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">

            {/* Card 1 — Generic pitches */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 flex flex-col">
              <p className="text-red-500 font-black text-lg mb-1">❌</p>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Generic pitches</p>
              <p className="text-xl font-black text-gray-900 mb-5">You sound like everyone else</p>

              {/* Visual: ad thread competition image */}
              <div className="mb-5 rounded-xl overflow-hidden">
                <img
                  src="/images/ad-thread-competition.png"
                  alt="Creators competing in an ad thread"
                  className="w-full h-auto block scale-[1.75] origin-top -translate-y-6 translate-x-6"
                />
              </div>

              <p className="text-xs text-gray-400 border-t border-gray-200 pt-4">Generic replies get ignored instantly</p>
            </div>

            {/* Card 2 — No pricing */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 flex flex-col">
              <p className="text-red-500 font-black text-lg mb-1">❌</p>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">No concept</p>
              <p className="text-xl font-black text-gray-900 mb-5">You make brands do the thinking</p>

              {/* Visual: brand questions + blank creator reply */}
              <div className="flex-1 flex flex-col justify-center gap-3 mb-5">
                {["What's your vision for this?", "Do you have any hook ideas?", "What would the script look like?"].map((q, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-800 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">B</div>
                    <div className="bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-2xl rounded-bl-sm max-w-[210px]">
                      "{q}"
                    </div>
                  </div>
                ))}
                <div className="flex items-end gap-2 justify-end">
                  <div className="bg-white border border-gray-200 text-sm px-4 py-3 rounded-2xl rounded-br-sm max-w-[160px] shadow-sm">
                    <div className="flex gap-1 items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" />
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse [animation-delay:150ms]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse [animation-delay:300ms]" />
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" />
                </div>
              </div>

              <p className="text-xs text-gray-400 border-t border-gray-200 pt-4">No concept, no deal. Simple as that.</p>
            </div>

            {/* Card 3 — Irrelevant portfolios */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 flex flex-col">
              <p className="text-red-500 font-black text-lg mb-1">❌</p>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Irrelevant portfolios</p>
              <p className="text-xl font-black text-gray-900 mb-5">You drop links with no context</p>

              {/* Visual: messy links */}
              <div className="flex-1 flex flex-col justify-center gap-2 mb-5">
                {[
                  { label: 'drive.google.com/folder/...', muted: true },
                  { label: 'linktr.ee/mycontent123',      muted: true },
                  { label: 'canva.com/design/DAFx9k2...',  muted: true },
                  { label: 'instagram.com/p/xK9mZ...',   muted: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white border border-dashed border-gray-300 rounded-lg px-3 py-2">
                    <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                    <span className="text-xs font-mono text-gray-900 truncate">{item.label}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 border-t border-gray-200 pt-4">Brands want relevant work + actual ideas</p>
            </div>

          </div>

          {/* Credibility line */}
          <div className="text-center">
            <p className="text-sm text-gray-900 italic">
              — A DTC brand manager, after reviewing hundreds of pitches
            </p>
          </div>

        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-3">What you get</p>
            <h2 className="text-4xl font-black text-gray-900 max-w-xl">Built for creators who are serious about landing deals.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Hero card — spans 2 cols */}
            <div className="md:col-span-2 bg-gray-900 rounded-3xl p-8 flex flex-col justify-between min-h-[280px]">
              <div>
                <span className="inline-flex items-center bg-teal-500/20 text-teal-400 text-xs font-bold px-3 py-1 rounded-full mb-4">AI-powered</span>
                <h3 className="text-2xl font-black text-white mb-2">A pitch that actually sounds like you</h3>
                <p className="text-gray-400 leading-relaxed max-w-md text-sm">Paste any brand listing. Get a tailored pitch — your voice, your content, your angle — in under 30 seconds. Not a template. Not a fill-in-the-blank.</p>
              </div>
              <div className="mt-6 bg-gray-800 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  <span className="text-xs text-gray-400 font-mono">Generating your pitch…</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-700 rounded-full w-3/4" />
                  <div className="h-2 bg-gray-700 rounded-full w-full" />
                  <div className="h-2 bg-gray-700 rounded-full w-5/6" />
                  <div className="h-2 bg-teal-500/40 rounded-full w-2/3" />
                </div>
              </div>
            </div>

            {/* Open tracking */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 bg-teal-50 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">Know exactly when to follow up</h3>
                <p className="text-gray-500 text-sm leading-relaxed">See every open, every revisit. Stop guessing and reach out at the perfect moment.</p>
              </div>
              <div className="mt-5 bg-gray-950 rounded-xl p-3 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-teal-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs text-white font-semibold">Lululemon opened your pitch</p>
                  <p className="text-xs text-gray-500 mt-0.5">Just now · 3rd view this week</p>
                </div>
              </div>
            </div>

            {/* Branded pages */}
            <div className="bg-teal-600 rounded-3xl p-8 flex flex-col gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-white">Looks like you hired a designer</h3>
              <p className="text-teal-100/80 text-sm leading-relaxed">Custom colors, your branding, four templates. Your pitch page is a portfolio — not a Google Doc.</p>
            </div>

            {/* Content library */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-teal-50 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">Right content, right brand, every time</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Upload your work once. AI picks the most relevant pieces for each brand's niche — no more guessing what to include.</p>
            </div>

            {/* Shareable links */}
            <div className="bg-gray-900 rounded-3xl p-8 flex flex-col gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-white">One link. Works everywhere.</h3>
              <p className="text-gray-400 text-sm leading-relaxed">DMs, email, Reddit, Instagram — one link to your full pitch. Brands can share it with their team. You'll know when they do.</p>
            </div>

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
            <p className="text-gray-400 mt-3">Start free. Upgrade when you're ready. No credit card required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-stretch">
            {PLANS.map((plan) => (
              <div key={plan.name}
                className="relative rounded-3xl p-8 flex flex-col"
                style={{
                  backgroundColor: plan.highlight ? '#0d9488' : '#111827',
                  border: plan.highlight ? 'none' : '1px solid #1f2937',
                  boxShadow: plan.highlight ? '0 20px 60px rgba(13,148,136,0.3)' : 'none',
                }}>
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-block bg-white text-teal-700 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
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

                <Link
                  href="/login"
                  className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105 text-center block"
                  style={{
                    backgroundColor: plan.highlight ? '#fff' : '#0d9488',
                    color: plan.highlight ? '#0d9488' : '#fff',
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-teal-600 to-teal-800 py-24 px-6">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-3">Ready to pitch smarter?</h2>
          <p className="text-teal-100/80 mb-10">Start pitching for free. No credit card required.</p>
          <Link
            href="/login"
            className="inline-block px-10 py-4 bg-white text-teal-700 font-bold text-lg rounded-2xl transition-all hover:scale-105 shadow-lg"
          >
            Start pitching free →
          </Link>
          <p className="text-teal-100/60 text-sm mt-4">Free forever. Upgrade when you're ready.</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <div className="bg-gray-950 py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-6 mb-3">
          <a href="/terms" className="text-gray-600 hover:text-gray-400 text-sm transition">Terms</a>
          <a href="/privacy" className="text-gray-600 hover:text-gray-400 text-sm transition">Privacy</a>
        </div>
        <p className="text-gray-700 text-sm">© 2025 UGC Edge. Stop blending in.</p>
      </div>

    </div>
  );
}
