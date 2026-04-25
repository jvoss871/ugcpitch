import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = {
  starter: {
    name: 'UGC Edge Starter',
    amount: 900,
    description: '50 pitches/month, open tracking, all templates.',
  },
  pro: {
    name: 'UGC Edge Pro',
    amount: 1900,
    description: 'Unlimited pitches, advanced analytics, custom URL.',
  },
};

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ugc-edge.com';

export async function POST(req) {
  try {
    const { username, plan } = await req.json();
    if (!username || !PLANS[plan]) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const p = PLANS[plan];

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: p.name, description: p.description },
          unit_amount: p.amount,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      metadata: { username, plan },
      success_url: `${BASE_URL}/dashboard?upgraded=${plan}`,
      cancel_url: `${BASE_URL}/upgrade`,
      allow_promotion_codes: true,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
