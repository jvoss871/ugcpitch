'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { storage } from '@/lib/storage';

export default function CreatePitch() {
  const { user: authUser, loading } = useAuth();
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState('');
  const [messageType, setMessageType] = useState('note');
  const [generating, setGenerating] = useState(false);
  const [upgrading, setUpgrading] = useState(null);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [content, setContent] = useState([]);
  const [customEnabled, setCustomEnabled] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [planStatus, setPlanStatus] = useState(null);

  useEffect(() => {
    if (!loading && !authUser) {
      router.push('/');
    }
  }, [authUser, loading, router]);

  useEffect(() => {
    if (!authUser) return;
    fetch(`/api/plan?username=${encodeURIComponent(authUser.username)}`)
      .then(r => r.json())
      .then(setPlanStatus)
      .catch(() => {});
    fetch(`/api/profile?username=${encodeURIComponent(authUser.username)}`)
      .then(r => r.json())
      .then(p => setProfile(p?.name ? p : storage.getProfile(authUser.username)))
      .catch(() => setProfile(storage.getProfile(authUser.username)));
    fetch(`/api/content?username=${encodeURIComponent(authUser.username)}`)
      .then(r => r.json())
      .then(c => setContent(c.length > 0 ? c : storage.getContent(authUser.username)))
      .catch(() => setContent(storage.getContent(authUser.username)));
  }, [authUser]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please paste a job description');
      return;
    }

    if (content.length === 0) {
      const proceed = window.confirm(
        'You have no content in your library. Pitches work better with content. Continue anyway?'
      );
      if (!proceed) return;
    }

    setGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          content,
          jobDescription,
          messageType,
        }),
      });

      if (response.status === 429) {
        setPlanStatus(s => ({ ...s, monthlyPitchCount: pitchLimit }));
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to generate pitch');
      }

      const generatedPitch = await response.json();

      // Save pitch server-side
      const selectedContent = (() => {
        const byTag = content
          .filter((c) => (generatedPitch.selectedTags || []).some((t) => (c.tags || []).includes(t)))
          .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        const pinnedUrl = customEnabled && customUrl.trim() ? customUrl.trim() : null;
        const pinned = pinnedUrl
          ? content.filter(c => c.url && c.url.trim() === pinnedUrl && !byTag.find(b => b.id === c.id))
          : [];
        return [...byTag, ...pinned];
      })();

      const pitchRes = await fetch('/api/pitches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUser.username,
          title: generatedPitch.brandName || 'Untitled Brand',
          jobDescription,
          messageType,
          intro: generatedPitch.intro,
          outreach: generatedPitch.outreach,
          selectedTags: generatedPitch.selectedTags || [],
          selectedContent,
          customContent: customEnabled && customUrl.trim()
            ? { url: customUrl.trim(), label: customLabel.trim() }
            : null,
        }),
      });
      const pitch = await pitchRes.json();

      if (usingOneTime) {
        fetch(`/api/plan?username=${encodeURIComponent(authUser.username)}`, { method: 'PATCH' })
          .then(r => r.json())
          .then(d => { if (d.ok) setPlanStatus(s => ({ ...s, oneTimePitches: d.oneTimePitches })); })
          .catch(() => {});
      }

      router.push(`/pitch/${pitch.id}`);
    } catch {
      setError('Failed to generate pitch. Make sure you have a GROQ_API_KEY set.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!authUser) return null;

  const status = planStatus?.status;
  const pitchLimit = planStatus?.pitchLimit ?? (status === 'free' ? 10 : 50);
  const monthlyCount = planStatus?.monthlyPitchCount ?? 0;
  const isAtLimit = status !== 'pro' && monthlyCount >= pitchLimit;
  const oneTimePitches = planStatus?.oneTimePitches ?? 0;
  const usingOneTime = isAtLimit && oneTimePitches > 0;
  const blocked = isAtLimit && !usingOneTime;

  const startCheckout = async (plan) => {
    setUpgrading(plan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUser.username, plan }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch {
      setUpgrading(null);
    }
  };

  if (blocked) {
    return (
      <div className="max-w-md mx-auto py-20 animate-fade-in-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 mb-5">
            <svg className="w-7 h-7 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">You've hit your limit</h1>
          <p className="text-gray-500">
            You've used all <span className="font-semibold text-gray-700">{pitchLimit} pitches</span> this month.
            Upgrade to keep landing brand deals.
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {status === 'free' && (
            <div className="rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-black text-gray-900 text-lg leading-none">Starter</p>
                  <p className="text-xs text-gray-400 mt-0.5">Great for active creators</p>
                </div>
                <p className="text-2xl font-black text-gray-900">$9<span className="text-sm font-normal text-gray-400">/mo</span></p>
              </div>
              <ul className="space-y-1.5 mb-4">
                {['50 pitches per month', 'Open tracking', 'All 4 templates', 'Content library'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-teal-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => startCheckout('starter')}
                disabled={!!upgrading}
                className="block w-full text-center py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-700 hover:border-gray-400 disabled:opacity-60 transition">
                {upgrading === 'starter' ? 'Redirecting…' : 'Upgrade to Starter'}
              </button>
            </div>
          )}

          <div className="rounded-2xl bg-gray-900 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-black text-white text-lg leading-none">Pro</p>
                <p className="text-xs text-teal-400 mt-0.5">For serious creators</p>
              </div>
              <p className="text-2xl font-black text-white">$19<span className="text-sm font-normal text-gray-400">/mo</span></p>
            </div>
            <ul className="space-y-1.5 mb-4">
              {['Unlimited pitches', 'Advanced analytics', 'Custom URL', 'Remove UGC Edge branding'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-teal-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => startCheckout('pro')}
              disabled={!!upgrading}
              className="block w-full text-center py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-sm font-bold text-white transition">
              {upgrading === 'pro' ? 'Redirecting…' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 font-display">
          Create a Pitch
        </h1>
        <p className="text-gray-600">
          Paste the job description, and we'll generate a targeted pitch.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Job Description / Opportunity
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => {
              setJobDescription(e.target.value);
              setError('');
            }}
            placeholder="Paste the full job description, brand request, or opportunity here. More detail = better pitch."
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-sm"
          />
        </div>

        <div className="card">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Response Type
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 border-teal-600 bg-teal-50"
              style={messageType === 'note' ? {} : { borderColor: '#e5e7eb', background: '#f9fafb' }}
            >
              <input
                type="radio"
                name="type"
                value="note"
                checked={messageType === 'note'}
                onChange={(e) => setMessageType(e.target.value)}
                className="w-4 h-4"
              />
              <div>
                <div className="font-semibold text-gray-900">Short Note</div>
                <div className="text-sm text-gray-600">For Reddit replies, Instagram DMs, quick comments</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 border-teal-600 bg-teal-50"
              style={messageType === 'message' ? {} : { borderColor: '#e5e7eb', background: '#f9fafb' }}
            >
              <input
                type="radio"
                name="type"
                value="message"
                checked={messageType === 'message'}
                onChange={(e) => setMessageType(e.target.value)}
                className="w-4 h-4"
              />
              <div>
                <div className="font-semibold text-gray-900">Full Message</div>
                <div className="text-sm text-gray-600">For email pitches, longer form responses</div>
              </div>
            </label>
          </div>
        </div>

        {/* Custom content */}
        <div className="card space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={customEnabled}
              onChange={e => setCustomEnabled(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Add something made for this brand</p>
              <p className="text-xs text-gray-500 mt-0.5">A custom video, hook example, or demo created specifically for this opportunity.</p>
            </div>
          </label>

          {customEnabled && (
            <div className="space-y-3 pt-1">
              <input type="text" value={customUrl} onChange={e => setCustomUrl(e.target.value)}
                placeholder="YouTube, Loom, Google Drive, Instagram link…"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <input type="text" value={customLabel} onChange={e => setCustomLabel(e.target.value)}
                placeholder="Label (optional) — e.g. Hook concept, Full demo, Intro video"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          )}
        </div>

        {error && (
          <div className="card bg-red-50 border border-red-200">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={generating}
          className="w-full btn-primary"
        >
          {generating ? 'Generating pitch...' : 'Generate Pitch'}
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-8 text-center">
        We'll analyze the opportunity and create a targeted pitch based on your profile and content.
      </p>
    </div>
  );
}
