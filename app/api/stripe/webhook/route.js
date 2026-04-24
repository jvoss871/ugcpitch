import Stripe from 'stripe';
import { getUser, upsertUser } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function planFeatures(plan) {
  if (plan === 'pro') {
    return { advanced_analytics: true, custom_url: true, remove_branding: true };
  }
  if (plan === 'starter') {
    return { advanced_analytics: false, custom_url: false, remove_branding: false };
  }
  return { advanced_analytics: false, custom_url: false, remove_branding: false };
}

async function upgradePlan(username, plan, customerId, subscriptionId) {
  let user = await getUser(username);
  if (!user) {
    user = { username, createdAt: new Date().toISOString() };
  }
  await upsertUser(username, {
    ...user,
    plan,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    features: planFeatures(plan),
    trialEndsAt: null,
  });
}

async function cancelPlan(subscriptionId) {
  // Find user by subscription ID
  const { getAllUsers } = await import('@/lib/db');
  const users = await getAllUsers();
  const user = users.find(u => u.stripeSubscriptionId === subscriptionId);
  if (!user) return;
  await upsertUser(user.username, {
    ...user,
    plan: 'free',
    stripeSubscriptionId: null,
    features: planFeatures('free'),
  });
}

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return Response.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { username, plan } = session.metadata ?? {};
        if (username && plan) {
          await upgradePlan(username, plan, session.customer, session.subscription);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        await cancelPlan(event.data.object.id);
        break;
      }

      case 'customer.subscription.updated': {
        // Handle plan changes (e.g. starter → pro via Stripe portal)
        const sub = event.data.object;
        const users = await (await import('@/lib/db')).getAllUsers();
        const user = users.find(u => u.stripeSubscriptionId === sub.id);
        if (user && sub.items?.data?.[0]?.price?.unit_amount) {
          const amount = sub.items.data[0].price.unit_amount;
          const plan = amount >= 1900 ? 'pro' : 'starter';
          await upsertUser(user.username, {
            ...user,
            plan,
            features: planFeatures(plan),
          });
        }
        break;
      }
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }

  return Response.json({ received: true });
}
