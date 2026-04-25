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

  const currentPlan = planStatus?.status ?? 'free';
  const isPaying = currentPlan === 'starter' || currentPlan === 'pro';

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
              className="rounded-2xl p-6 relative"
              style={{
                backgroundColor: plan.dark ? '#0f1117' : '#fff',
                border: isCurrentPlan
                  ? '2px solid #0d9488'
                  : plan.dark ? 'none' : '1px solid #e5e7eb',
              }}
            >
              {isCurrentPlan && (
                <span className="absolute top-4 right-4 text-xs font-bold bg-teal-500 text-white px-2.5 py-1 rounded-full">
                  Current plan
                </span>
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
                  style={{ backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}
                >
                  {managingBilling ? 'Redirecting…' : 'Manage subscription'}
                </button>
              ) : (
                <button
                  onClick={() => startCheckout(plan.id)}
                  disabled={!!upgrading || currentPlan === 'pro'}
                  className="w-full py-3 rounded-xl font-bold text-sm transition disabled:opacity-60"
                  style={plan.dark
                    ? { backgroundColor: '#0d9488', color: '#fff' }
                    : { backgroundColor: '#f9fafb', color: '#111', border: '1px solid #e5e7eb' }}
                >
                  {upgrading === plan.id
                    ? 'Redirecting…'
                    : currentPlan === 'pro'
                    ? 'Downgrade via Manage subscription'
                    : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {portalError && (
        <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {portalError === 'No billing account found'
            ? 'No billing account linked. If you subscribed recently, wait a moment and try again — or email support@ugcedge.com.'
            : `Billing portal error: ${portalError}. Email support@ugcedge.com and we'll sort it.`}
        </div>
      )}

      {isPaying && (
        <p className="text-center text-xs text-gray-400 mt-6">
          To cancel or change plans, use{' '}
          <button onClick={openBillingPortal} disabled={managingBilling}
            className="underline hover:text-gray-600 disabled:opacity-50 transition">
            Manage subscription
          </button>
          .
        </p>
      )}

      <p className="text-center text-xs text-gray-400 mt-3">
        Questions?{' '}
        <a href="mailto:support@ugcedge.com" className="underline hover:text-gray-600">
          support@ugcedge.com
        </a>
      </p>
    </div>
  );
}
