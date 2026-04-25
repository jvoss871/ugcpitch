'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$9',
    period: '/mo',
    tagline: 'Great for active creators',
    features: [
      '50 pitches per month',
      'Open tracking',
      'All 4 templates',
      'Content library',
    ],
    dark: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    period: '/mo',
    tagline: 'For serious creators',
    features: [
      'Unlimited pitches',
      'Advanced analytics',
      'Custom URL',
      'Remove UGC Edge branding',
    ],
    dark: true,
  },
];

export default function UpgradePage() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const [planStatus, setPlanStatus] = useState(null);
  const [upgrading, setUpgrading] = useState(null);
  const [managingBilling, setManagingBilling] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelledUntil, setCancelledUntil] = useState('');
  const [portalError, setPortalError] = useState('');

  useEffect(() => {
    if (!authUser) return;
    fetch(`/api/plan?username=${encodeURIComponent(authUser.username)}`)
      .then(r => r.json())
      .then(setPlanStatus)
      .catch(() => {});
  }, [authUser]);

  const startCheckout = async (plan) => {
    if (!authUser) { router.push('/'); return; }
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

  const openBillingPortal = async () => {
    setManagingBilling(true);
    setPortalError('');
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUser.username }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Portal unavailable');
      window.location.href = data.url;
    } catch (err) {
      setPortalError(err.message || 'Could not open billing portal');
      setManagingBilling(false);
    }
  };

  const confirmCancel = async () => {
    setCancelling(true);
    setPortalError('');
    try {
      const res = await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUser.username }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Cancellation failed');
      setCancelledUntil(data.periodEnd);
      setCancelConfirm(false);
    } catch (err) {
      setPortalError(err.message || 'Could not cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const currentPlan = planStatus?.status ?? 'free';
  const isPaying = currentPlan === 'starter' || currentPlan === 'pro';

  if (cancelledUntil) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in-up text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Subscription cancelled</h1>
        <p className="text-gray-500 mb-6">
          You'll keep full access until <span className="font-semibold text-gray-700">{cancelledUntil}</span>, then drop to the free plan automatically.
        </p>
        <button onClick={() => router.push('/dashboard')}
          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl transition">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-gray-900 mb-2 font-display">
          {isPaying ? 'Your plan' : 'Upgrade your plan'}
        </h1>
        <p className="text-gray-500">
          {isPaying
            ? `You're on the ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan.`
            : 'More pitches, more data, more deals.'}
        </p>
      </div>

      <div className="space-y-4">
        {PLANS.map(plan => {
          const isCurrentPlan = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className="rounded-2xl p-6"
              style={{
                backgroundColor: plan.dark ? '#0f1117' : '#fff',
                border: isCurrentPlan
                  ? '2px solid #0d9488'
                  : plan.dark ? 'none' : '1px solid #e5e7eb',
              }}
            >
              {isCurrentPlan && (
                <div className="flex justify-center mb-4">
                  <span className="text-xs font-bold bg-teal-500 text-white px-3 py-1 rounded-full">
                    Current plan
                  </span>
                </div>
              )}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-black text-xl leading-none" style={{ color: plan.dark ? '#fff' : '#111' }}>
                    {plan.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: plan.dark ? '#34d399' : '#6b7280' }}>
                    {plan.tagline}
                  </p>
                </div>
                <p className="text-3xl font-black" style={{ color: plan.dark ? '#fff' : '#111' }}>
                  {plan.price}
                  <span className="text-sm font-normal" style={{ color: plan.dark ? '#6b7280' : '#9ca3af' }}>
                    {plan.period}
                  </span>
                </p>
              </div>
              <ul className="space-y-2 mb-5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: plan.dark ? '#d1d5db' : '#374151' }}>
                    <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#0d9488' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrentPlan ? (
                <button
                  onClick={openBillingPortal}
                  disabled={managingBilling}
                  className="w-full py-3 rounded-xl font-bold text-sm transition disabled:opacity-60"
                  style={{ backgroundColor: plan.dark ? 'rgba(255,255,255,0.08)' : '#f3f4f6', color: plan.dark ? '#fff' : '#374151', border: plan.dark ? 'none' : '1px solid #e5e7eb' }}
                >
                  {managingBilling ? 'Redirecting…' : 'Manage subscription'}
                </button>
              ) : (
                <button
                  onClick={() => startCheckout(plan.id)}
                  disabled={!!upgrading || (currentPlan === 'pro' && plan.id === 'starter')}
                  className="w-full py-3 rounded-xl font-bold text-sm transition disabled:opacity-60"
                  style={plan.dark
                    ? { backgroundColor: '#0d9488', color: '#fff' }
                    : { backgroundColor: '#f9fafb', color: '#111', border: '1px solid #e5e7eb' }}
                >
                  {upgrading === plan.id
                    ? 'Redirecting…'
                    : currentPlan === 'pro' && plan.id === 'starter'
                    ? 'Downgrade via Manage subscription'
                    : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}

        {/* Downgrade to free */}
        {isPaying && (
          <div className="rounded-2xl p-6 border border-dashed border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-black text-xl leading-none text-gray-900">Free</p>
                <p className="text-xs mt-0.5 text-gray-400">10 pitches/month, core features</p>
              </div>
              <p className="text-3xl font-black text-gray-900">$0</p>
            </div>

            {!cancelConfirm ? (
              <button
                onClick={() => setCancelConfirm(true)}
                className="w-full py-3 rounded-xl font-bold text-sm text-gray-500 hover:text-red-500 transition border border-gray-200 hover:border-red-200 hover:bg-red-50"
              >
                Downgrade to Free
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center">
                  You'll keep access until your billing period ends, then drop to 10 pitches/month.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCancelConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                  >
                    Keep my plan
                  </button>
                  <button
                    onClick={confirmCancel}
                    disabled={cancelling}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition disabled:opacity-60"
                  >
                    {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {portalError && (
        <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {portalError === 'No active subscription found'
            ? 'No active subscription found. Your plan may have already been cancelled.'
            : `Error: ${portalError}. Please try again.`}
        </div>
      )}
    </div>
  );
}
