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
    setProfile(storage.getProfile(authUser.username));
    setContent(storage.getContent(authUser.username));
    fetch(`/api/plan?username=${encodeURIComponent(authUser.username)}`)
      .then(r => r.json())
      .then(setPlanStatus)
      .catch(() => {});
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

      if (!response.ok) {
        throw new Error('Failed to generate pitch');
      }

      const generatedPitch = await response.json();

      // Save pitch
      const pitch = storage.addPitch(authUser.username, {
        title: generatedPitch.brandName || 'Untitled Brand',
        jobDescription,
        messageType,
        intro: generatedPitch.intro,
        outreach: generatedPitch.outreach,
        selectedTags: generatedPitch.selectedTags || [],
        selectedContent: (() => {
          const byTag = content
            .filter((c) => (generatedPitch.selectedTags || []).some((t) => (c.tags || []).includes(t)))
            .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
          const pinnedUrl = customEnabled && customUrl.trim() ? customUrl.trim() : null;
          const pinned = pinnedUrl
            ? content.filter(c => c.url && c.url.trim() === pinnedUrl && !byTag.find(b => b.id === c.id))
            : [];
          return [...byTag, ...pinned];
        })(),
        customContent: customEnabled && customUrl.trim()
          ? { url: customUrl.trim(), label: customLabel.trim() }
          : null,
      });

      if (usingOneTime) {
        fetch(`/api/plan?username=${encodeURIComponent(authUser.username)}`, { method: 'PATCH' })
          .then(r => r.json())
          .then(d => { if (d.ok) setPlanStatus(s => ({ ...s, oneTimePitches: d.oneTimePitches })); })
          .catch(() => {});
      }

      router.push(`/pitch/${pitch.id}`);
    } catch (err) {
      console.error(err);
      setError('Failed to generate pitch. Make sure you have a GROQ_API_KEY set.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!authUser) return null;

  const isExpired = planStatus?.status === 'expired';
  const pitchLimit = planStatus?.pitchLimit ?? 50;
  const isStarterLimited = planStatus?.status === 'starter' && storage.getMonthlyPitchCount(authUser.username) >= pitchLimit;
  const oneTimePitches = planStatus?.oneTimePitches ?? 0;
  const usingOneTime = (isExpired || isStarterLimited) && oneTimePitches > 0;
  const blocked = (isExpired || isStarterLimited) && !usingOneTime;

  if (blocked) {
    return (
      <div className="max-w-lg mx-auto text-center py-24">
        <p className="text-2xl font-black text-gray-900 mb-3">
          {isExpired ? 'Your trial has ended' : 'Monthly limit reached'}
        </p>
        <p className="text-gray-500 mb-8">
          {isExpired
            ? 'Upgrade to keep generating pitches and closing brand deals.'
            : `You've used all ${pitchLimit} pitches this month. Upgrade to Pro for unlimited pitches.`}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <div className="rounded-2xl border border-gray-200 p-6 text-left flex-1">
            <p className="font-black text-gray-900 text-lg mb-1">Starter</p>
            <p className="text-3xl font-black text-gray-900 mb-3">$9<span className="text-sm font-normal text-gray-500">/mo</span></p>
            <p className="text-sm text-gray-500">50 pitches/month, all templates, open tracking.</p>
          </div>
          <div className="rounded-2xl bg-teal-600 p-6 text-left flex-1">
            <p className="font-black text-white text-lg mb-1">Pro</p>
            <p className="text-3xl font-black text-white mb-3">$19<span className="text-sm font-normal text-teal-200">/mo</span></p>
            <p className="text-sm text-teal-100">Unlimited pitches, advanced analytics, custom URL.</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-6">Contact us to upgrade your account.</p>
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
