'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { STARTER_NICHES } from '@/lib/starter-profiles';

export default function WelcomePage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [step, setStep] = useState(null); // null = loading, then 'demo' | 'form' | 'generating' | 'result'
  const [hasDemoStep, setHasDemoStep] = useState(false);
  const [name, setName] = useState('');
  const [niche, setNiche] = useState('');
  const [brandName, setBrandName] = useState('');
  const [shareId, setShareId] = useState(null);
  const [outreach, setOutreach] = useState('');
  const [copiedOutreach, setCopiedOutreach] = useState(false);

  useEffect(() => {
    fetch('/api/share-pitch?id=welcome-demo')
      .then(r => {
        if (r.ok) { setHasDemoStep(true); setStep('demo'); }
        else setStep('form');
      })
      .catch(() => setStep('form'));
  }, []);

  const selectedNiche = STARTER_NICHES.find(n => n.key === niche);

  const handleGenerate = async () => {
    if (!niche || !brandName.trim()) return;
    setStep('generating');
    try {
      const res = await fetch('/api/welcome-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandName.trim(),
          niche,
          name: name.trim() || null,
          username: authUser?.username ?? null,
        }),
      });
      const data = await res.json();
      if (data.shareId) {
        setShareId(data.shareId);
        setOutreach(data.outreach ?? '');
        setStep('result');
      } else {
        setStep('form');
      }
    } catch {
      setStep('form');
    }
  };

  const handleCopyOutreach = () => {
    navigator.clipboard.writeText(outreach);
    setCopiedOutreach(true);
    setTimeout(() => setCopiedOutreach(false), 2000);
  };

  const skipToDashboard = () => {
    sessionStorage.setItem('welcomeSeen', 'true');
    router.push('/dashboard');
  };

  return (
    <div className="-mx-6 -my-12 min-h-screen relative" style={{ background: 'linear-gradient(160deg, #f0fdfa 0%, #ffffff 60%)' }}>

      {/* Skip link */}
      {step && step !== 'generating' && (
        <div className="absolute top-5 right-6 z-10">
          <button onClick={skipToDashboard} className="text-xs text-gray-400 hover:text-gray-600 transition">
            Skip for now →
          </button>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* ── LOADING ───────────────────────────────────────────────────────── */}
        {step === null && (
          <div className="flex items-center justify-center py-40">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── DEMO ──────────────────────────────────────────────────────────── */}
        {step === 'demo' && (
          <div className="animate-fade-in-up">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-3">Welcome to UGC Edge</p>
              <h1 className="text-4xl font-black text-gray-900 leading-tight mb-3">
                This is how you stand out in a brand's inbox.
              </h1>
              <p className="text-gray-500 text-base">
                Other creators send a cold DM. You send this. Scroll through — then we'll build one for you in 30 seconds.
              </p>
            </div>

            <div
              className="rounded-2xl border border-gray-200 shadow-xl mb-4"
              style={{ height: 680, overflow: 'hidden', position: 'relative' }}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0,
                width: 1280, height: 1388,
                transform: 'scale(0.49)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }}>
                <iframe
                  src="/pitch/view?id=welcome-demo"
                  style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                  title="Sample pitch page"
                />
              </div>
            </div>

            <div className="text-center mb-6">
              <a
                href="/pitch/view?id=welcome-demo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-gray-600 transition underline underline-offset-2"
              >
                Open full pitch in new tab ↗
              </a>
            </div>

            <button
              onClick={() => setStep('form')}
              className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-base rounded-xl transition"
            >
              Build mine in 30 seconds →
            </button>
          </div>
        )}

        {/* ── FORM ──────────────────────────────────────────────────────────── */}
        {step === 'form' && (
          <div className="animate-fade-in-up">
            {hasDemoStep && (
              <button
                onClick={() => setStep('demo')}
                className="text-sm text-gray-500 hover:text-gray-700 transition flex items-center gap-1 mb-8"
              >
                ← Back
              </button>
            )}

            <div className="mb-10">
              {!hasDemoStep && (
                <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-3">Welcome to UGC Edge</p>
              )}
              <h1 className="text-4xl font-black text-gray-900 leading-tight mb-3">
                {hasDemoStep ? 'Now let\'s build yours.' : 'See your pitch before you set anything up.'}
              </h1>
              <p className="text-lg text-gray-500">
                Pick your niche and a brand you'd love to work with. Your pitch page goes live in 30 seconds.
              </p>
            </div>

            <div className="space-y-7">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Jessica, Marcus, Taylor…"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 text-base transition"
                />
                <p className="text-xs text-gray-400 mt-1.5">Goes on your pitch page — optional but makes it feel real.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Your niche</label>
                <div className="flex flex-wrap gap-2">
                  {STARTER_NICHES.map(n => (
                    <button
                      key={n.key}
                      onClick={() => setNiche(n.key)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-150"
                      style={niche === n.key
                        ? { backgroundColor: n.color, borderColor: n.color, color: '#fff' }
                        : { backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#374151' }}
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Brand you want to pitch
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                  placeholder="e.g. Nike, Glossier, Notion, Lululemon…"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 text-base transition"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={!niche || !brandName.trim()}
                className="w-full py-4 bg-teal-600 text-white font-bold text-base rounded-xl hover:bg-teal-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Build my pitch in 30 seconds →
              </button>

              <p className="text-xs text-center text-gray-400">
                Uses a demo creator profile — you'll add your real info after.
              </p>
            </div>
          </div>
        )}

        {/* ── GENERATING ────────────────────────────────────────────────────── */}
        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center py-36 animate-fade-in-up">
            <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-6" />
            <p className="text-lg font-semibold text-gray-900 mb-1">
              Crafting {name.trim() ? `${name.trim()}'s` : 'your'} {brandName} pitch…
            </p>
            <p className="text-sm text-gray-400">Usually done in about 30 seconds</p>
          </div>
        )}

        {/* ── RESULT ────────────────────────────────────────────────────────── */}
        {step === 'result' && shareId && (
          <div className="animate-fade-in-up">

            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => { setStep('form'); setShareId(null); }}
                className="text-sm text-gray-500 hover:text-gray-700 transition flex items-center gap-1"
              >
                ← Try another
              </button>
            </div>

            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-2">Your sample pitch</p>
              <h2 className="text-2xl font-black text-gray-900 leading-snug">
                Your{' '}
                <span style={{ color: selectedNiche?.color ?? '#0d9488' }}>{brandName}</span>{' '}
                pitch — ready to send.
              </h2>
              <p className="text-gray-500 mt-2 text-sm">
                This is what lands in a brand manager's inbox. No cold DM, no PDF, no guessing — just a page that does the talking.
              </p>
            </div>

            <div
              className="rounded-2xl border border-gray-200 shadow-xl mb-5"
              style={{ height: 720, overflow: 'hidden', position: 'relative' }}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0,
                width: 1280, height: 1469,
                transform: 'scale(0.49)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }}>
                <iframe
                  src={`/pitch/view?id=${shareId}`}
                  style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                  title="Sample pitch page"
                />
              </div>
            </div>

            <div className="text-center mb-6">
              <a
                href={`/pitch/view?id=${shareId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-gray-600 transition underline underline-offset-2"
              >
                Open full pitch in new tab ↗
              </a>
            </div>

            {outreach && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Sample outreach message</p>
                  <button
                    onClick={handleCopyOutreach}
                    className={`text-xs font-semibold px-3 py-1 rounded-lg transition ${copiedOutreach ? 'bg-green-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
                  >
                    {copiedOutreach ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{outreach}</p>
              </div>
            )}

            <div className="rounded-2xl p-7 text-center" style={{ backgroundColor: '#0d9488' }}>
              <p className="text-xl font-black text-white mb-1">Now put your face on it.</p>
              <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Add your real stats, content, and photo — takes under 5 minutes. Then send it to every brand on your list.
              </p>
              <button
                onClick={skipToDashboard}
                className="bg-white font-bold px-8 py-3 rounded-xl hover:bg-teal-50 transition text-sm"
                style={{ color: '#0d9488' }}
              >
                Set up my profile →
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
