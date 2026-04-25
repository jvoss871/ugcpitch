import Stripe from 'stripe';
import { getUser } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { username } = await req.json();
    if (!username) return Response.json({ error: 'username required' }, { status: 400 });

    const user = await getUser(username);
    if (!user?.stripeSubscriptionId) {
      return Response.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    const periodEnd = new Date(subscription.current_period_end * 1000).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });

    return Response.json({ ok: true, periodEnd });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
