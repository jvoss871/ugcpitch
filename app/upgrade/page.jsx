'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

const PLAN_META = {
  free:    { name: 'Free',    price: '$0',  period: '/mo', tagline: 'Core features',           features: ['10 pitches/month', 'All templates', 'Content library'] },
  starter: { name: 'Starter', price: '$9',  period: '/mo', tagline: 'Great for active creators', features: ['50 pitches/month', 'Open tracking', 'All 4 templates', 'Content library'] },
  pro:     { name: 'Pro',     price: '$19', period: '/mo', tagline: 'For serious creators',      features: ['Unlimited pitches', 'Advanced analytics', 'Custom URL', 'Remove UGC Edge branding'] },
};

const OTHER_PLAN_META = {
  free:    { name: 'Free',    price: '$0',  tagline: '10 pitches/month',    dark: false },
  starter: { name: 'Starter', price: '$9',  tagline: '50 pitches/month',    dark: false },
  pro:     { name: 'Pro',     price: '$19', tagline: 'Unlimited pitches',   dark: true  },
};

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
  const current = PLAN_META[currentPlan] ?? PLAN_META.free;

  // Other plans to show condensed
  const otherPlanIds = currentPlan === 'free'
    ? ['starter', 'pro']
    : currentPlan === 'starter'
    ? ['pro', 'free']
    : ['starter', 'free']; // pro

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
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-gray-900 mb-2 font-display">
          {isPaying ? 'Your plan' : 'Upgrade your plan'}
        </h1>
        <p className="text-gray-500">
          {isPaying
            ? `You're on the ${current.name} plan.`
            : 'More pitches, more data, more deals.'}
        </p>
      </div>

      {/* Current plan — full width */}
      <div
        className="rounded-2xl p-6 mb-4"
        style={{
          backgroundColor: currentPlan === 'pro' ? '#0f1117' : '#fff',
          border: currentPlan === 'pro' ? '2px solid #0d9488' : '2px solid #0d9488',
        }}
      >
        <div className="flex justify-center mb-4">
          <span className="text-xs font-bold bg-teal-500 text-white px-3 py-1 rounded-full">
            Current plan
          </span>
        </div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-black text-2xl leading-none" style={{ color: currentPlan === 'pro' ? '#fff' : '#111' }}>
              {current.name}
            </p>
            <p className="text-xs mt-1" style={{ color: currentPlan === 'pro' ? '#34d399' : '#6b7280' }}>
              {current.tagline}
            </p>
          </div>
          <p className="text-4xl font-black" style={{ color: currentPlan === 'pro' ? '#fff' : '#111' }}>
            {current.price}
            <span className="text-sm font-normal" style={{ color: currentPlan === 'pro' ? '#6b7280' : '#9ca3af' }}>
              {current.period}
            </span>
          </p>
        </div>
        <ul className="space-y-2 mb-5">
          {current.features.map(f => (
            <li key={f} className="flex items-center gap-2 text-sm" style={{ color: currentPlan === 'pro' ? '#d1d5db' : '#374151' }}>
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#0d9488' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {f}
            </li>
          ))}
        </ul>
        {isPaying && (
          <button
            onClick={openBillingPortal}
            disabled={managingBilling}
            className="w-full py-3 rounded-xl font-bold text-sm transition disabled:opacity-60"
            style={{
              backgroundColor: currentPlan === 'pro' ? 'rgba(255,255,255,0.08)' : '#f3f4f6',
              color: currentPlan === 'pro' ? '#fff' : '#374151',
              border: currentPlan === 'pro' ? 'none' : '1px solid #e5e7eb',
            }}
          >
            {managingBilling ? 'Redirecting…' : 'Manage subscription'}
          </button>
        )}
      </div>

      {/* Other options — condensed side by side */}
      <div className="grid grid-cols-2 gap-3">
        {otherPlanIds.map(planId => {
          const meta = OTHER_PLAN_META[planId];
          const isDowngradeToFree = planId === 'free';
          const isUpgrade = planId === 'pro' || (planId === 'starter' && currentPlan === 'free');
          const isProDowngrade = planId === 'starter' && currentPlan === 'pro';

          return (
            <div
              key={planId}
              className="rounded-2xl p-4 flex flex-col"
              style={{
                backgroundColor: meta.dark ? '#0f1117' : '#f9fafb',
                border: meta.dark ? 'none' : '1px solid #e5e7eb',
              }}
            >
              <div className="flex items-baseline justify-between mb-1">
                <p className="font-black text-base" style={{ color: meta.dark ? '#fff' : '#111' }}>
                  {meta.name}
                </p>
                <p className="font-black text-lg" style={{ color: meta.dark ? '#fff' : '#111' }}>
                  {meta.price}
                  <span className="text-xs font-normal" style={{ color: meta.dark ? '#6b7280' : '#9ca3af' }}>/mo</span>
                </p>
              </div>
              <p className="text-xs mb-4" style={{ color: meta.dark ? '#6b7280' : '#9ca3af' }}>
                {meta.tagline}
              </p>

              {isDowngradeToFree ? (
                !cancelConfirm ? (
                  <button
                    onClick={() => setCancelConfirm(true)}
                    className="mt-auto w-full py-2 rounded-xl text-xs font-bold transition border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50"
                  >
                    Downgrade to Free
                  </button>
                ) : (
                  <div className="mt-auto space-y-2">
                    <p className="text-xs text-gray-500 text-center">Keep access until billing ends.</p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setCancelConfirm(false)}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-100 transition"
                      >
                        Keep
                      </button>
                      <button
                        onClick={confirmCancel}
                        disabled={cancelling}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition disabled:opacity-60"
                      >
                        {cancelling ? '…' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <button
                  onClick={() => isProDowngrade ? openBillingPortal() : startCheckout(planId)}
                  disabled={!!upgrading || managingBilling}
                  className="mt-auto w-full py-2 rounded-xl text-xs font-bold transition disabled:opacity-60"
                  style={meta.dark
                    ? { backgroundColor: '#0d9488', color: '#fff' }
                    : { backgroundColor: '#fff', color: '#111', border: '1px solid #e5e7eb' }}
                >
                  {upgrading === planId || (managingBilling && isProDowngrade)
                    ? '…'
                    : isUpgrade
                    ? `Upgrade to ${meta.name}`
                    : `Downgrade to ${meta.name}`}
                </button>
              )}
            </div>
          );
        })}
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
